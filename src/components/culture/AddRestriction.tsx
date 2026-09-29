"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESTRICTION_TYPES } from "@/lib/culture/constants";

// Expert-gated restriction composer (md/04 §23).
export default function AddRestriction({
  elementId,
  cultures,
  communities,
  references,
}: {
  elementId: string;
  cultures: { id: string; name: string }[];
  communities: { id: string; name: string }[];
  references: { id: string; referenceCode: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    restrictionType: "CONTEXT_RESTRICTED",
    cultureId: "",
    communityId: "",
    severity: "MEDIUM",
    sourceReferenceId: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/cultural-elements/${elementId}/restrictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restrictionType: form.restrictionType,
          cultureId: form.cultureId || undefined,
          communityId: form.communityId || undefined,
          severity: form.severity,
          sourceReferenceId: form.sourceReferenceId || undefined,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not add restriction.");
        return;
      }
      setOpen(false);
      setForm({ ...form, description: "" });
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-2 rounded border px-3 py-1 text-sm hover:bg-white">
        + Add restriction
      </button>
    );
  }

  const input = "mt-1 w-full rounded border px-2 py-1 text-sm";

  return (
    <form onSubmit={submit} className="mt-2 max-w-lg space-y-2 border-t pt-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={form.restrictionType} onChange={(e) => setForm({ ...form, restrictionType: e.target.value })} className={input} aria-label="Type">
          {RESTRICTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className={input} aria-label="Severity">
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.cultureId} onChange={(e) => setForm({ ...form, cultureId: e.target.value })} className={input} aria-label="Culture scope">
          <option value="">Any culture</option>
          {cultures.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={form.communityId} onChange={(e) => setForm({ ...form, communityId: e.target.value })} className={input} aria-label="Community scope">
          <option value="">Any community</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <select value={form.sourceReferenceId} onChange={(e) => setForm({ ...form, sourceReferenceId: e.target.value })} className={input} aria-label="Source">
        <option value="">No source</option>
        {references.map((r) => (
          <option key={r.id} value={r.id}>{r.referenceCode}</option>
        ))}
      </select>
      <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Restriction description *" rows={2} className={input} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50">
          {pending ? "…" : "Save restriction"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
