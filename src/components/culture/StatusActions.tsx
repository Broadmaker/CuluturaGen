"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// md/04 §38 validation workflow actions. Buttons render by role; the API
// enforces transitions a second time.
export default function StatusActions({
  elementId,
  current,
  roles,
}: {
  elementId: string;
  current: string | null;
  roles: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expert = roles.includes("ADMIN") || roles.includes("CULTURAL_EXPERT");
  const admin = roles.includes("ADMIN");

  const actions: { to: string; label: string; show: boolean; primary?: boolean }[] = [
    { to: "UNDER_REVIEW", label: "Submit for review", show: current === "UNVERIFIED" },
    { to: "VERIFIED", label: "Approve", show: current === "UNDER_REVIEW" && expert, primary: true },
    { to: "UNVERIFIED", label: "Request revision", show: current === "UNDER_REVIEW" && expert },
    { to: "RESTRICTED", label: "Mark restricted", show: current !== "RESTRICTED" && current !== "DEPRECATED" && expert },
    { to: "UNDER_REVIEW", label: "Re-open review", show: (current === "RESTRICTED" || current === "DEPRECATED") && expert },
    { to: "DEPRECATED", label: "Deprecate", show: current !== "DEPRECATED" && admin },
  ];

  async function change(to: string) {
    setError(null);
    setPending(to);
    try {
      const res = await fetch(`/api/cultural-elements/${elementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Transition failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(null);
    }
  }

  const visible = actions.filter((a) => a.show);
  if (visible.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-sm font-medium">Validation</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {visible.map((a) => (
          <button
            key={a.label}
            onClick={() => change(a.to)}
            disabled={pending !== null}
            className={`rounded px-3 py-1 text-sm disabled:opacity-50 ${
              a.primary ? "bg-black text-white" : "border hover:bg-white"
            }`}
          >
            {pending === a.to ? "…" : a.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
