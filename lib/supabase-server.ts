// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client.
 * Uses the secret key — never call this in client components or expose to the browser.
 */
export function createServerClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );
}