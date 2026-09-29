"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REQUIREMENT_CATEGORIES, REQUIREMENT_PRIORITIES } from "@/lib/brief/constants";
import PriorityBadge from "./PriorityBadge";

export interface Requirement {
  id: string;
  category: string;
  requirement: string;
  priority: string;
  source: string | null;
  isActive: boolean | null;
}

// md/08 §25–26 requirement list + builder. Deactivation preserves history.
export default function RequirementManager({
  briefId,
  initial,
}: {
  briefId: string | null;
  initial: Requirement[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("CULTURAL");
  const [priority, setPriority] = useState<string>("MANDATORY");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    router.refresh();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!briefId) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/briefs/${briefId}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, requirement: text, priority }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not add requirement.");
        return;
      }
      setItems((list) => [...list, data.data]);
      setText("");
      refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function setPriorityOf(id: string, p: string) {
    if (!briefId) return;
    const res = await fetch(`/api/briefs/${briefId}/requirements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: p }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setItems((list) => list.map((r) => (r.id === id ? data.data : r)));
      refresh();
    }
  }

  async function deactivate(id: string) {
    if (!briefId) return;
    const res = await fetch(`/api/briefs/${briefId}/requirements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((list) => list.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
      refresh();
    }
  }

  const active = items.filter((r) => r.isActive !== false);
  const inactive = items.filter((r) => r.isActive === false);

  return (
    <div className="mt-8">
      <h2 className="font-semibold">Requirements ({active.length} active)</h2>
      {!briefId && (
        <p className="mt-2 text-sm text-neutral-500">
          Save the brief above first, then add requirements.
        </p>
      )}
      <div className="mt-2 space-y-2">
        {active.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 rounded border bg-white px-3 py-2 text-sm">
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{r.category}</span>
            <span className="flex-1">{r.requirement}</span>
            <PriorityBadge priority={r.priority} />
            <select
              value={r.priority}
              onChange={(e) => setPriorityOf(r.id, e.target.value)}
              className="rounded border px-1 py-0.5 text-xs"
              aria-label="Change priority"
            >
              {REQUIREMENT_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button onClick={() => deactivate(r.id)} className="rounded border px-2 py-0.5 text-xs hover:bg-neutral-100">
              Deactivate
            </button>
          </div>
        ))}
        {active.length === 0 && briefId && (
          <p className="text-sm text-neutral-500">No requirements yet — add the first below.</p>
        )}
      </div>

      {briefId && (
        <form onSubmit={add} className="mt-3 flex flex-wrap gap-2 text-sm">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Use documented traditional textile"
            required
            className="min-w-60 flex-1 rounded border px-3 py-1.5"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border px-2 py-1.5" aria-label="Category">
            {REQUIREMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded border px-2 py-1.5" aria-label="Priority">
            {REQUIREMENT_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">
            {pending ? "…" : "Add"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {inactive.length > 0 && (
        <p className="mt-3 text-xs text-neutral-500">
          {inactive.length} deactivated (history preserved for evaluation).
        </p>
      )}
    </div>
  );
}
