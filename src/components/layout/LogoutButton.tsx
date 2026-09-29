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
      className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800 disabled:opacity-50"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
