"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RELATIONSHIP_TYPES } from "@/lib/culture/constants";

// Link to a culture, community, or another element (md/03 §20).
export default function AddRelationship({
  elementId,
  cultures,
  communities,
}: {
  elementId: string;
  cultures: { id: string; name: string }[];
  communities: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<"culture" | "community" | "element">("culture");
  const [targetId, setTargetId] = useState("");
  const [relationshipType, setRelationshipType] = useState<string>("ASSOCIATED_WITH");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function search(q: string) {
    setQuery(q);
    setTargetId("");
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    try {
      const res = await fetch(`/api/cultural-elements?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.ok) setHits(data.data.slice(0, 8));
    } catch {
      /* ignore */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body: Record<string, string> = { relationshipType };
      if (description) body.description = description;
      if (kind === "culture") body.cultureId = targetId;
      if (kind === "community") body.communityId = targetId;
      if (kind === "element") body.targetElementId = targetId;
      const res = await fetch(`/api/cultural-elements/${elementId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not create link.");
        return;
      }
      setTargetId("");
      setDescription("");
      setHits([]);
      setQuery("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 max-w-lg space-y-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <select value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setTargetId(""); }} className="rounded border px-2 py-1" aria-label="Link kind">
          <option value="culture">Culture</option>
          <option value="community">Community</option>
          <option value="element">Element</option>
        </select>
        <select value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} className="rounded border px-2 py-1" aria-label="Relationship">
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      {kind === "culture" && (
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full rounded border px-2 py-1" aria-label="Culture">
          <option value="">Select culture…</option>
          {cultures.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      {kind === "community" && (
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full rounded border px-2 py-1" aria-label="Community">
          <option value="">Select community…</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      {kind === "element" && (
        <div className="relative">
          <input
            value={targetId ? hits.find((h) => h.id === targetId)?.name ?? query : query}
            onChange={(e) => search(e.target.value)}
            placeholder="Type to search elements…"
            className="w-full rounded border px-2 py-1"
          />
          {hits.length > 0 && !targetId && (
            <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded border bg-white">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => { setTargetId(h.id); setQuery(h.name); setHits([]); }}
                    className="block w-full px-2 py-1 text-left hover:bg-neutral-100"
                  >
                    {h.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Note (optional)" className="w-full rounded border px-2 py-1" />
      {error && <p className="text-red-700">{error}</p>}
      <button type="submit" disabled={!targetId || pending} className="rounded border px-3 py-1 hover:bg-white disabled:opacity-50">
        {pending ? "…" : "Create link"}
      </button>
    </form>
  );
}
