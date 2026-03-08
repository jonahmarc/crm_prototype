// components/ReplyForm.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Toolbar button helper
function ToolbarButton({
                           onMouseDown,
                           title,
                           children,
                       }: {
    onMouseDown: (e: React.MouseEvent) => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={onMouseDown}
            className="px-2 py-1 rounded text-sm text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition select-none"
        >
            {children}
        </button>
    );
}

export default function ReplyForm({
                                      threadId,
                                      replyTo,
                                      subject,
                                      fromEmail,
                                  }: {
    threadId?: string;
    replyTo?: string;
    subject?: string;
    fromEmail?: string;
}) {
    const router = useRouter();
    const editorRef = useRef<HTMLDivElement>(null);

    const [to, setTo]           = useState(replyTo ?? '');
    const [subj, setSubj]       = useState(subject ?? '');
    const [isEmpty, setIsEmpty] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError]     = useState('');

    // Track empty state so the Send button can be disabled when there's no content
    function handleInput() {
        const text = editorRef.current?.innerText ?? '';
        setIsEmpty(text.trim().length === 0);
    }

    // Ensure the editor always starts focused with a cursor
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML === '') {
            editorRef.current.innerHTML = '';
        }
    }, []);

    // Apply a formatting command without stealing focus from the editor
    function execFormat(command: string, value?: string) {
        return (e: React.MouseEvent) => {
            e.preventDefault(); // prevents blur before execCommand fires
            document.execCommand(command, false, value);
            editorRef.current?.focus();
        };
    }

    async function handleSend() {
        const html = editorRef.current?.innerHTML ?? '';
        if (!html.trim() || isEmpty) return;

        setSending(true);
        setError('');

        const res = await fetch('/api/emails/send', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to,
                subject: subj,
                body: html,          // real HTML — newlines/formatting preserved
                threadId,
                fromEmail,           // per-user routing (Per-User Email Routing Guide §4)
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error ?? 'Send failed');
        } else {
            // Clear the editor and reset state
            if (editorRef.current) editorRef.current.innerHTML = '';
            setIsEmpty(true);
            router.refresh();
        }
        setSending(false);
    }

    return (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="p-4 space-y-3">
                <h2 className="font-semibold text-gray-800">
                    {threadId ? 'Reply' : 'New Email'}
                </h2>

                {/* To field — hidden when replying (replyTo is pre-filled) */}
                {!replyTo && (
                    <input
                        className="w-full border rounded p-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="To"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                )}

                {/* Subject field — hidden when replying (subject is pre-filled) */}
                {!subject && (
                    <input
                        className="w-full border rounded p-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Subject"
                        value={subj}
                        onChange={(e) => setSubj(e.target.value)}
                    />
                )}
            </div>

            {/* ── Rich Text Editor ─────────────────────────────────────── */}
            <div className="border-t border-b border-gray-200">

                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                    <ToolbarButton onMouseDown={execFormat('bold')} title="Bold (Ctrl+B)">
                        <strong>B</strong>
                    </ToolbarButton>
                    <ToolbarButton onMouseDown={execFormat('italic')} title="Italic (Ctrl+I)">
                        <em>I</em>
                    </ToolbarButton>
                    <ToolbarButton onMouseDown={execFormat('underline')} title="Underline (Ctrl+U)">
                        <span className="underline">U</span>
                    </ToolbarButton>

                    {/* Divider */}
                    <span className="mx-1 h-4 w-px bg-gray-300 inline-block" />

                    <ToolbarButton onMouseDown={execFormat('insertUnorderedList')} title="Bullet list">
                        &#8226; List
                    </ToolbarButton>
                    <ToolbarButton onMouseDown={execFormat('insertOrderedList')} title="Numbered list">
                        1. List
                    </ToolbarButton>

                    {/* Divider */}
                    <span className="mx-1 h-4 w-px bg-gray-300 inline-block" />

                    <ToolbarButton onMouseDown={execFormat('removeFormat')} title="Clear formatting">
                        Tx
                    </ToolbarButton>
                </div>

                {/* Editable area */}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    className={`
            min-h-[8rem] max-h-72 overflow-y-auto
            px-4 py-3 text-sm text-gray-800
            focus:outline-none
            leading-relaxed
          `}
                    // Placeholder via CSS — shown when editor is empty
                    data-placeholder="Write your message..."
                    style={{
                        // Inline style only for the placeholder trick; all other styles use Tailwind
                    }}
                />
            </div>
            {/* ── End Rich Text Editor ──────────────────────────────────── */}

            <div className="px-4 py-3 flex items-center gap-3">
                <button
                    onClick={handleSend}
                    disabled={sending || isEmpty || !to.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>

                {error && <p className="text-red-600 text-xs">{error}</p>}
            </div>

            {/*
        Placeholder CSS — contenteditable doesn't support the HTML `placeholder`
        attribute, so we use a pseudo-element via a <style> tag scoped to this
        component. This is the standard approach for contenteditable placeholders.
      */}
            <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
        </div>
    );
}