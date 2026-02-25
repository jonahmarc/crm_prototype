// components/EmailImportForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailImportForm() {
    const router = useRouter();
    const [raw, setRaw]         = useState('');
    const [open, setOpen]       = useState(false);
    const [status, setStatus]   = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function handleImport() {
        if (!raw.trim()) return;
        setStatus('loading');
        setMessage('');

        const res  = await fetch('/api/emails/import', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ raw }),
        });
        const data = await res.json();

        if (!res.ok) {
            setStatus('error');
            setMessage(data.error ?? 'Import failed');
        } else {
            setStatus('ok');
            setMessage('Email imported successfully');
            setRaw('');
            setOpen(false);
            router.refresh();
        }
    }

    return (
        <div className="mb-4">
            <button
                onClick={() => setOpen((o) => !o)}
                className="text-sm text-blue-600 hover:underline"
            >
                {open ? 'Cancel' : '+ Import raw email'}
            </button>

            {open && (
                <div className="mt-3 border rounded-lg p-4 space-y-3 bg-gray-50">
                    <p className="text-xs text-gray-500">
                        Gmail: open email → ⋮ → <strong>Show original</strong> → copy all text.
                    </p>
                    <textarea
                        className="w-full border rounded p-2 text-xs font-mono h-40 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Paste raw RFC 2822 email here..."
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                    />
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleImport}
                            disabled={status === 'loading' || !raw.trim()}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Importing...' : 'Import'}
                        </button>
                        {message && (
                            <span className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}