"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={pending}
      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
