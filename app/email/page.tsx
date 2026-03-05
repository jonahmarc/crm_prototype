// app/email/page.tsx
import { createServerClient, createSessionClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import InboxRealtime from '@/components/InboxRealtime';
import EmailImportForm from '@/components/EmailImportForm';

export const dynamic = 'force-dynamic';

export default async function InboxPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ user?: string }>;
}) {
    const sessionSupabase = await createSessionClient();

    const { data: { user } } = await sessionSupabase.auth.getUser();

    if (!user) {
        redirect('/login'); // belt-and-suspenders alongside middleware
    }

    const userEmail = user.email!;

    // Use createServerClient() (SUPABASE_SECRET_KEY) for the DB query,
    // consistent with how all other routes in the project query Supabase.
    const db = createServerClient();

    const { data: threads } = await db
        .from('email_threads')
        .select(`
      id, subject, last_message_at,
      email_messages ( id, direction, from_address, body_text, raw_date, sent_at )
    `)
        .eq('user_email', userEmail) // same column from Per-User Routing Guide — now uses real auth email
        .order('last_message_at', { ascending: false });

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