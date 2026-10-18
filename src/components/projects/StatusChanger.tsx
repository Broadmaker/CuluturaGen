"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_TRANSITIONS } from "@/server/services/design/ProjectService";
import Button from "@/components/ui/Button";

// NOTE: imports the transition map from the service for a single source of
// truth; it is a pure constant with no server-only dependencies.
export default function StatusChanger({
  projectId,
  current,
}: {
  projectId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed: string[] =
    PROJECT_TRANSITIONS[current as keyof typeof PROJECT_TRANSITIONS] ?? [];

  async function change(to: string) {
    setError(null);
    setPending(to);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Status change failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(null);
    }
  }

  if (allowed.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-ink-700">Move to:</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {allowed.map((s) => (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            key={s}
            onClick={() => change(s)}
            disabled={pending !== null}
          >
            {pending === s ? "…" : s}
          </Button>
        ))}
      </div>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
