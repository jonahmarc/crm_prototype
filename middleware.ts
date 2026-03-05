// middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Run on all paths EXCEPT:
         * - _next/static        static assets
         * - _next/image         image optimisation
         * - favicon.ico
         * - api/emails/inbound  CRITICAL: Mailgun's server cannot authenticate as a user.
         *                       This route is already secured by HMAC signature verification.
         */
        '/((?!_next/static|_next/image|favicon.ico|api/emails/inbound).*)',
    ],
};