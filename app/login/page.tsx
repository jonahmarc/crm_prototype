// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const supabase = createBrowserSupabaseClient();

    async function handleLogin() {
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/email');
            router.refresh(); // forces Server Components to re-render with the new session
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 1rem' }}>
            <h1>Sign In</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button onClick={handleLogin} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <a href="/signup">Don&apos;t have an account? Sign Up</a>
            </div>
        </div>
    );
}