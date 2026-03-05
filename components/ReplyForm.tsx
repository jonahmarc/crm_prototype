// components/ReplyForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReplyForm({ threadId, replyTo, subject, fromEmail, }: {
    threadId?: string;
    replyTo?: string;
    subject?: string;
    fromEmail?: string;
}) {
    const router = useRouter();
    const [to, setTo]       = useState(replyTo ?? '');
    const [subj, setSubj]   = useState(subject ?? '');
    const [body, setBody]   = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    async function handleSend() {
        setSending(true);
        setError('');

        const res = await fetch('/api/emails/send', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ to, subject: subj, body, threadId }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error ?? 'Send failed');
        } else {
            setBody('');
            router.refresh();
        }
        setSending(false);
    }

    return (
        <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
            <h2 className="font-semibold text-gray-800">Reply</h2>

            {!replyTo && (
                <input
                    className="w-full text-black border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="To"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                />
            )}
            {!subject && (
                <input
                    className="w-full text-black border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Subject"
                    value={subj}
                    onChange={(e) => setSubj(e.target.value)}
                />
            )}

            <textarea
                className="w-full text-black border rounded p-2 text-sm h-28 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your reply..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
            />

            {error && <p className="text-red-600 text-xs">{error}</p>}

            <button
                onClick={handleSend}
                disabled={sending || !body.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
            >
                {sending ? 'Sending...' : 'Send Reply'}
            </button>
        </div>
    );
}