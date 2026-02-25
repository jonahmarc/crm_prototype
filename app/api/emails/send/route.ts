// app/api/emails/send/route.ts
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { createServerClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    const { to, subject, body, threadId } = await req.json();

    if (!to || !subject || !body) {
        return Response.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    const mg = new Mailgun(FormData).client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY!,
        url: "https://api.eu.mailgun.net",
    });

    // Send via Mailgun
    let result;
    try {
        result = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
            from:    `CRM User <${process.env.PROTO_USER_EMAIL}>`,
            to:      [to],
            subject,
            html:    body,
            text:    body.replace(/<[^>]+>/g, ''),
        });
    } catch (err) {
        console.log('Error: ', String(err));
        return Response.json({ error: 'Mailgun send failed', detail: String(err) }, { status: 502 });
    }

    const supabase = createServerClient();

    // Create or reuse thread
    let finalThreadId = threadId ?? null;
    if (!finalThreadId) {
        const { data: thread, error: threadErr } = await supabase
            .from('email_threads')
            .insert({ subject })
            .select('id')
            .single();

        if (threadErr || !thread) {
            return Response.json({ error: threadErr?.message ?? 'Thread creation failed' }, { status: 500 });
        }
        finalThreadId = thread.id;
    }

    // Store outbound message
    await supabase.from('email_messages').insert({
        thread_id:    finalThreadId,
        direction:    'outbound',
        from_address: process.env.PROTO_USER_EMAIL,
        to_address:   to,
        subject,
        body_html:    body,
        message_id:   result.id ?? null,
    });

    await supabase
        .from('email_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', finalThreadId);

    return Response.json({ ok: true, threadId: finalThreadId });
}