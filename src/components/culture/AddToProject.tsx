"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BASKET_ROLES } from "@/lib/culture/constants";

// md/08 §22 Add to Project.
export default function AddToProject({
  elementId,
  projects,
}: {
  elementId: string;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [role, setRole] = useState<string>("REFERENCE");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function add() {
    if (!projectId) return;
    setError(null);
    setDone(false);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/basket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ culturalElementId: elementId, role, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not add to project.");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  if (projects.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500">Create a project first to collect references.</p>;
  }

  return (
    <div className="mt-2 space-y-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded border px-2 py-1"
          aria-label="Project"
        >
          <option value="">Select project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border px-2 py-1"
          aria-label="Role"
        >
          {BASKET_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={!projectId || pending}
          className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
        >
          {pending ? "…" : "Add to Project"}
        </button>
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full rounded border px-2 py-1"
      />
      {error && <p className="text-red-700">{error}</p>}
      {done && <p className="text-green-700">Added to project research basket.</p>}
    </div>
  );
}
