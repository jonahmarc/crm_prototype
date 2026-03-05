// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Existing server client — uses SUPABASE_SECRET_KEY.
 * Bypasses RLS. Used by all API route handlers (inbound, send, import).
 * Do not use this to read the logged-in user — it has no session context.
 */
export function createServerClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );
}

/**
 * Session-aware client — uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY + cookies.
 * Use this in Server Components and Route Handlers when you need to read
 * the logged-in user via supabase.auth.getUser().
 * Must be awaited because cookies() is async in Next.js 16.
 */
export async function createSessionClient() {
    const cookieStore = await cookies();

    return createSSRClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Components can't set cookies — Middleware handles session refresh
                    }
                },
            },
        }
    );
}