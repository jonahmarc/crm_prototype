// app/email/[threadId]/page.tsx
import { createServerClient } from '@/lib/supabase-server';
import ReplyForm from '@/components/ReplyForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ThreadPage({
                                             params,
                                         }: {
    params: Promise<{ threadId: string }>;
}) {
    // Await params — required in Next.js 16+
    const { threadId } = await params;

    const supabase = createServerClient();

    const { data: thread } = await supabase
        .from('email_threads')
        .select('id, subject')
        .eq('id', threadId)
        .single();

    if (!thread) notFound();

    const { data: messages } = await supabase
        .from('email_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('sent_at', { ascending: true });

    const firstInbound = messages?.find((m) => m.direction === 'inbound');

    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <Link href="/email" className="text-blue-600 text-sm hover:underline mb-4 inline-block">
                ← Back to Inbox
            </Link>

            <h1 className="text-xl font-bold text-gray-900 mb-6">{thread.subject}</h1>

            <div className="space-y-4 mb-8">
                {messages?.map((msg) => (
                    <div
                        key={msg.id}
                        className={`rounded-lg p-4 border ${
                            msg.direction === 'inbound'
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-white border-gray-200 ml-8'
                        }`}
                    >
                        <div className="text-xs text-gray-400 mb-2">
                            {msg.direction === 'inbound' ? msg.from_address : 'You'} &bull;{' '}
                            {new Date(msg.raw_date ?? msg.sent_at).toLocaleString()}
                        </div>
                        {msg.body_html ? (
                            // In production, sanitize with DOMPurify to prevent XSS
                            <div className="text-black" dangerouslySetInnerHTML={{ __html: msg.body_html }} />
                        ) : (
                            <pre className="whitespace-pre-wrap text-sm text-black font-sans">
                {msg.body_text}
              </pre>
                        )}
                    </div>
                ))}
            </div>

            <ReplyForm
                threadId={threadId}
                replyTo={firstInbound?.from_address ?? ''}
                subject={`Re: ${thread.subject}`}
            />
        </main>
    );
}