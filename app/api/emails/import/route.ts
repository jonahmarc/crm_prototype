// app/api/emails/import/route.ts
import { createServerClient } from '@/lib/supabase-server';
import { simpleParser } from 'mailparser';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    let rawEmail: string;

    try {
        const body = await req.json();
        rawEmail = body.raw as string;
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!rawEmail?.trim()) {
        return Response.json({ error: 'raw field is required' }, { status: 400 });
    }

    // Parse RFC 2822 raw email
    let parsed;
    try {
        parsed = await simpleParser(rawEmail);
    } catch (err) {
        return Response.json({ error: 'Failed to parse email', detail: String(err) }, { status: 422 });
    }

    const supabase = createServerClient();

    // Extract fields
    const fromAddress = parsed.from?.text ?? '(unknown sender)';
    const toAddress   = parsed.to
        ? (Array.isArray(parsed.to) ? parsed.to.map(a => a.text).join(', ') : parsed.to.text)
        : '(unknown recipient)';
    const subject   = parsed.subject ?? '(no subject)';
    const bodyHtml  = parsed.html     || null;
    const bodyText  = parsed.text     || null;
    const rawDate   = parsed.date     ? parsed.date.toISOString() : null;
    const messageId = parsed.messageId ?? null;
    const inReplyTo = parsed.inReplyTo
        ? (Array.isArray(parsed.inReplyTo) ? parsed.inReplyTo[0] : parsed.inReplyTo)
        : null;

    // Thread matching — check In-Reply-To first
    let threadId: string | null = null;

    if (inReplyTo) {
        const { data: existing } = await supabase
            .from('email_messages')
            .select('thread_id')
            .eq('message_id', inReplyTo.trim())
            .maybeSingle();
        threadId = existing?.thread_id ?? null;
    }

    // Also check if this exact Message-ID was already imported
    if (!threadId && messageId) {
        const { data: duplicate } = await supabase
            .from('email_messages')
            .select('thread_id')
            .eq('message_id', messageId)
            .maybeSingle();
        if (duplicate) {
            return Response.json(
                { error: 'This email has already been imported', threadId: duplicate.thread_id },
                { status: 409 }
            );
        }
    }

    // Create a new thread if none matched
    if (!threadId) {
        const { data: thread, error: threadErr } = await supabase
            .from('email_threads')
            .insert({ subject })
            .select('id')
            .single();

        if (threadErr || !thread) {
            return Response.json({ error: threadErr?.message ?? 'Thread creation failed' }, { status: 500 });
        }
        threadId = thread.id;
    }

    // Insert message
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
        return Response.json({ error: msgErr?.message ?? 'Message insert failed' }, { status: 500 });
    }

    // Update thread timestamp
    await supabase
        .from('email_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

    return Response.json({ ok: true, id: msg.id, threadId }, { status: 201 });
}