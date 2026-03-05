// lib/supabase-middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Always call getUser() — this refreshes the session token if it has expired.
    // Do NOT use getSession() here; it does not re-validate the token server-side.
    const { data: { user } } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const isAuthPage =
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/auth');

    const isPublicPage = pathname === '/'; // home page stays accessible without login

    // Not logged in, trying to access a protected route → redirect to login
    if (!user && !isAuthPage && !isPublicPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Already logged in, visiting login or signup → redirect to inbox
    if (user && isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/email';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}