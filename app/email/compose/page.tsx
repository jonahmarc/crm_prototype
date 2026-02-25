// app/email/compose/page.tsx
import ReplyForm from '@/components/ReplyForm';
import Link from 'next/link';

export default function ComposePage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <Link href="/email" className="text-blue-600 text-sm hover:underline mb-4 inline-block">
                ← Back to Inbox
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mb-6">New Email</h1>
            <ReplyForm />
        </main>
    );
}