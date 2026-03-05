"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function LogoutButton() {
    const router = useRouter();
    const supabase = createBrowserSupabaseClient();

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <button
            onClick={handleLogout}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-900 transition-colors"
        >
            Sign Out
        </button>
    );
}