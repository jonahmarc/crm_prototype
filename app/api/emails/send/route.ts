// app/api/emails/send/route.ts
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { createServerClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

/**
 * Converts plain text to basic HTML if the body doesn't already contain
 * HTML tags. This is a safety net — ReplyForm now sends real HTML, but
 * any legacy plain-text body (e.g. from the manual import flow or curl
 * tests) will still render with correct line breaks in the recipient's
 * email client.
 */
function ensureHtml(body: string): string {
    // If it already looks like HTML (contains at least one tag), leave it alone
    if (/<[a-z][\s\S]*>/i.test(body)) return body;

    // Plain text → HTML: wrap paragraphs, convert single newlines to <br>
    return body
        .split(/\n{2,}/)                          // split on blank lines → paragraphs
        .map((para) =>
            `<p>${para.replace(/\n/g, '<br>')}</p>` // single newlines → <br> within paragraph
        )
        .join('\n');
}

export async function POST(req: NextRequest) {
    // fromEmail added by Per-User Email Routing Guide §4;
    // falls back to PROTO_USER_EMAIL to preserve existing single-user behaviour
    const { to, subject, body, threadId, fromEmail } = await req.json();

    if (!to || !subject || !body) {
        return Response.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    const senderEmail = fromEmail ?? process.env.PROTO_USER_EMAIL;
    console.log("senderEmail: ", senderEmail);

    // Convert body to proper HTML so newlines/formatting survive email delivery
    const htmlBody = ensureHtml(body);
    // Strip all tags for the plain-text fallback that some clients prefer
    const textBody = htmlBody.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

    const mg = new Mailgun(FormData).client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY!,
        url: 'https://api.eu.mailgun.net',
    });

    let result;
    try {
        result = await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
            from:    `CRM User <${senderEmail}>`,
            to:      [to],
            subject,
            html:    htmlBody,
            text:    textBody,
        });
    } catch (err) {
        console.error(err);
        return Response.json({ error: 'Mailgun send failed', detail: String(err) }, { status: 502 });
    }

    const supabase = createServerClient();

    // Create a new thread for compose, or reuse the existing one for replies
    let finalThreadId = threadId ?? null;
    if (!finalThreadId) {
        const { data: thread } = await supabase
            .from('email_threads')
            .insert({ subject })
            .select('id')
            .single();
        finalThreadId = thread!.id;
    }

    // Store the outbound message
    await supabase.from('email_messages').insert({
        thread_id:    finalThreadId,
        direction:    'outbound',
        from_address: senderEmail,
        to_address:   to,
        subject,
        body_html:    htmlBody,
        body_text:    textBody,
        message_id:   result.id ?? null,
    });

    await supabase
        .from('email_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', finalThreadId);

    return Response.json({ ok: true, threadId: finalThreadId });
}