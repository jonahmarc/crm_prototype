import Link from "next/link";
import { createSessionClient } from "@/lib/supabase-server";
import { LogoutButton } from "@/components/LogoutButton";

export default async function Home() {
    const supabase = await createSessionClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4 bg-white border-b border-zinc-100 dark:bg-black dark:border-zinc-800">
        <span className="text-sm font-semibold tracking-tight text-black dark:text-zinc-50">
          CRM
        </span>
                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400 hidden sm:block">
                {user.email}
              </span>
                            <LogoutButton />
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-black hover:bg-zinc-800 dark:text-black dark:bg-white dark:hover:bg-zinc-200 transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </nav>

            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                        Get started with the inbound/outbound email prototype.
                    </h1>
                    <Link
                        href="/email"
                        className="max-w-md text-lg leading-8 rounded-md px-3 text-zinc-600 bg-zinc-400 dark:text-zinc-400 dark:bg-zinc-600"
                    >
                        Email
                    </Link>
                </div>
            </main>
        </div>
    );
}