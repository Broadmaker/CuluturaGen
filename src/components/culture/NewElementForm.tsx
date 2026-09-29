"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ELEMENT_CATEGORIES } from "@/lib/culture/constants";

export default function NewElementForm({
  cultures,
  communities,
}: {
  cultures: { id: string; name: string }[];
  communities: { id: string; name: string; cultureId: string | null }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    category: "TEXTILE",
    description: "",
    symbolism: "",
    traditionalUsage: "",
    cultureId: "",
    communityId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const visibleCommunities = communities.filter(
    (c) => !form.cultureId || c.cultureId === form.cultureId,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/cultural-elements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description || undefined,
          symbolism: form.symbolism || undefined,
          traditionalUsage: form.traditionalUsage || undefined,
          cultureId: form.cultureId || undefined,
          communityId: form.communityId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not create element.");
        return;
      }
      router.push(`/culture/${data.data.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  const input = "mt-1 w-full rounded border px-3 py-2";

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Name *</label>
          <input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="category" className="text-sm font-medium">Category *</label>
          <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className={input}>
            {ELEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea id="description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="symbolism" className="text-sm font-medium">Symbolism (only if documented)</label>
        <textarea id="symbolism" rows={2} value={form.symbolism} onChange={(e) => set("symbolism", e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor="traditionalUsage" className="text-sm font-medium">Traditional usage</label>
        <textarea id="traditionalUsage" rows={2} value={form.traditionalUsage} onChange={(e) => set("traditionalUsage", e.target.value)} className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="culture" className="text-sm font-medium">Culture link</label>
          <select id="culture" value={form.cultureId} onChange={(e) => set("cultureId", e.target.value)} className={input}>
            <option value="">None</option>
            {cultures.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="community" className="text-sm font-medium">Community link</label>
          <select id="community" value={form.communityId} onChange={(e) => set("communityId", e.target.value)} className={input}>
            <option value="">None</option>
            {visibleCommunities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        New records start UNVERIFIED and need expert review before the AI may use them.
      </p>
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
        {pending ? "Creating…" : "Propose Element"}
      </button>
    </form>
  );
}
