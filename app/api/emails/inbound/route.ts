// app/api/emails/inbound/route.ts
import { createServerClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

function verifyMailgunSignature(
    signingKey: string,
    timestamp: string,
    token: string,
    signature: string
): boolean {
    const value = timestamp + token;
    const hash = crypto
        .createHmac('sha256', signingKey)
        .update(value)
        .digest('hex');
    return hash === signature;
}

export async function POST(req: NextRequest) {
    let form: FormData;
    try {
        form = await req.formData();
    } catch {
        return Response.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const get = (key: string) => form.get(key)?.toString() ?? '';

    // --- Signature verification (unchanged) ---
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (signingKey) {
        const isValid = verifyMailgunSignature(
            signingKey,
            get('timestamp'),
            get('token'),
            get('signature')
        );
        if (!isValid) {
            return Response.json({ error: 'Invalid Mailgun signature' }, { status: 401 });
        }
    }

    // --- Extract email fields (unchanged) ---
    const fromAddress = get('sender') || get('From') || '(unknown sender)';
    const toAddress   = get('recipient') || get('To') || '(unknown recipient)';
    const subject     = get('subject') || get('Subject') || '(no subject)';
    const bodyHtml    = get('body-html') || null;
    const bodyText    = get('body-plain') || null;
    const messageId   = get('Message-Id').replace(/[<>]/g, '').trim() || null;
    const inReplyTo   = get('In-Reply-To').replace(/[<>]/g, '').trim() || null;
    const rawDateStr  = get('Date') || null;
    const rawDate     = rawDateStr ? new Date(rawDateStr).toISOString() : new Date().toISOString();

    // CHANGED: Normalize the recipient address to use as the thread owner.
    // Strips display names like "Alice <alice@mail.yourdomain.com>" → "alice@mail.yourdomain.com"
    const userEmail = toAddress.toLowerCase().replace(/.*<(.+)>/, '$1').trim();

    const supabase = createServerClient();

    // --- Thread matching: check In-Reply-To ---
    // CHANGED: Scope the lookup to threads owned by the same recipient address,
    // so a reply to alice never accidentally lands in bob's thread.
    let threadId: string | null = null;

    if (inReplyTo) {
        const { data: existing } = await supabase
            .from('email_messages')
            .select('thread_id, email_threads!inner(user_email)')
            .eq('message_id', inReplyTo)
            .eq('email_threads.user_email', userEmail)   // CHANGED
            .maybeSingle();
        threadId = existing?.thread_id ?? null;
    }

    // --- Duplicate detection (unchanged) ---
    if (!threadId && messageId) {
        const { data: duplicate } = await supabase
            .from('email_messages')
            .select('thread_id')
            .eq('message_id', messageId)
            .maybeSingle();
        if (duplicate) {
            return Response.json(
                { ok: true, duplicate: true, threadId: duplicate.thread_id },
                { status: 200 }
            );
        }
    }

    // --- Create a new thread if none matched ---
    if (!threadId) {
        const { data: thread, error: threadErr } = await supabase
            .from('email_threads')
            .insert({ subject, user_email: userEmail })  // CHANGED: store the recipient
            .select('id')
            .single();

        if (threadErr || !thread) {
            return Response.json(
                { error: threadErr?.message ?? 'Thread creation failed' },
                { status: 500 }
            );
        }
        threadId = thread.id;
    }

    // --- Insert the message (unchanged) ---
    const { data: msg, error: msgErr } = await supabase
        .from('email_messages')
        .insert({
            thread_id:    threadId,
            direction:    'inbound',
            from_address: fromAddress,
            to_address:   toAddress,
            subject,
            body_html:    bodyHtml,
            body_text:    bodyText,
            message_id:   messageId,
            in_reply_to:  inReplyTo,
            raw_date:     rawDate,
        })
        .select('id')
        .single();

    if (msgErr || !msg) {
        return Response.json(
            { error: msgErr?.message ?? 'Message insert failed' },
            { status: 500 }
        );
    }

    // --- Update thread timestamp (unchanged) ---
    await supabase
        .from('email_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

    return Response.json({ ok: true, id: msg.id, threadId }, { status: 200 });
}