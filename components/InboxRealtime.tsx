// components/InboxRealtime.tsx
'use client';
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Browser-side client — uses the publishable key only
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Thread = {
    id: string;
    subject: string;
    last_message_at: string;
    email_messages: Array<{
        direction: string;
        body_text: string | null;
        from_address: string;
        sent_at: string;
    }>;
};

export default function InboxRealtime({ initialThreads }: { initialThreads: Thread[] }) {
    const router = useRouter();

    useEffect(() => {
        const channel = supabase
            .channel('inbox-updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'email_messages' },
                () => router.refresh()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [router]);

    if (initialThreads.length === 0) {
        return (
            <p className="text-center py-12 text-gray-400">
                No threads yet. Import a raw email to get started.
            </p>
        );
    }

    return (
        <div className="divide-y border rounded-lg bg-white shadow-sm">
            {initialThreads.map((t) => {
                const latest = t.email_messages?.at(-1);
                const isInbound = latest?.direction === 'inbound';

                return (
                    <Link
                        key={t.id}
                        href={`/email/${t.id}`}
                        className="flex flex-col p-4 hover:bg-gray-50 transition"
                    >
                        <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-gray-900 truncate">{t.subject}</span>
                            <span className="text-xs text-gray-400 shrink-0">
                {new Date(t.last_message_at).toLocaleDateString()}
              </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {isInbound && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded shrink-0">
                  New
                </span>
                            )}
                            <span className="text-sm text-gray-400 truncate">
                {latest?.body_text?.slice(0, 80) ?? ''}
              </span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}