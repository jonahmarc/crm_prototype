// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function SignUpPage() {
    // const router = useRouter();
    // const [email, setEmail] = useState('');
    // const [password, setPassword] = useState('');
    // const [error, setError] = useState<string | null>(null);
    // const [loading, setLoading] = useState(false);
    //
    // const supabase = createBrowserSupabaseClient();
    //
    // async function handleSignUp() {
    //     setLoading(true);
    //     setError(null);
    //
    //     const { error } = await supabase.auth.signUp({
    //         email,
    //         password,
    //         // EMAIL CONFIRMATION IS DISABLED.
    //         // emailRedirectTo and the "check your email" message are intentionally omitted.
    //         // Supabase creates the user and returns an active session immediately.
    //         // To enable confirmation later, see the section at the bottom of this guide.
    //     });
    //
    //     if (error) {
    //         setError(error.message);
    //         setLoading(false);
    //     } else {
    //         // Session is active immediately — go straight to inbox
    //         router.push('/email');
    //         router.refresh();
    //     }
    // }

    return (
        <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 1rem' }}>
            <h1 className='text-red-600'>User registration is disabled.</h1>
            <h2 className='text-red-600'>Contact your administrator.</h2>
            {/*<h1>Create Account</h1>*/}
            {/*{error && <p style={{ color: 'red' }}>{error}</p>}*/}
            {/*<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>*/}
            {/*    <input*/}
            {/*        type="email"*/}
            {/*        placeholder="Email"*/}
            {/*        value={email}*/}
            {/*        onChange={e => setEmail(e.target.value)}*/}
            {/*    />*/}
            {/*    <input*/}
            {/*        type="password"*/}
            {/*        placeholder="Password (min 6 chars)"*/}
            {/*        value={password}*/}
            {/*        onChange={e => setPassword(e.target.value)}*/}
            {/*    />*/}
            {/*    <button onClick={handleSignUp} disabled={loading}>*/}
            {/*        {loading ? 'Creating account...' : 'Sign Up'}*/}
            {/*    </button>*/}
            {/*    <a href="/login">Already have an account? Sign In</a>*/}
            {/*</div>*/}
        </div>
    );
}