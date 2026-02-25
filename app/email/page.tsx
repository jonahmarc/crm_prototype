// app/email/page.tsx
import { createServerClient } from '@/lib/supabase-server';
import Link from 'next/link';
import InboxRealtime from '@/components/InboxRealtime';
import EmailImportForm from '@/components/EmailImportForm';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
    const supabase = createServerClient();

    const { data: threads } = await supabase
        .from('email_threads')
        .select(`
      id,
      subject,
      last_message_at,
      email_messages (
        direction,
        body_text,
        from_address,
        sent_at
      )
    `)
        .order('last_message_at', { ascending: false })
        .limit(50);

    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                <Link
                    href="/email/compose"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm transition"
                >
                    Compose
                </Link>
            </div>

            <EmailImportForm />
            <InboxRealtime initialThreads={threads ?? []} />
        </main>
    );
}