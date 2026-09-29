"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface BriefValues {
  id?: string;
  cultureId?: string | null;
  communityId?: string | null;
  occasion?: string | null;
  garmentType?: string | null;
  genderPresentation?: string | null;
  style?: string | null;
  silhouette?: string | null;
  modernTraditionalBalance?: string | null;
  desiredComplexity?: string | null;
  budget?: string | null;
  currency?: string | null;
  description?: string | null;
}

// md/08 §24 structured requirements form. Creates the brief on first save,
// patches it afterwards.
export default function BriefForm({
  projectId,
  brief,
  cultures,
  communities,
}: {
  projectId: string;
  brief: BriefValues | null;
  cultures: { id: string; name: string }[];
  communities: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    cultureId: brief?.cultureId ?? "",
    communityId: brief?.communityId ?? "",
    occasion: brief?.occasion ?? "",
    garmentType: brief?.garmentType ?? "",
    genderPresentation: brief?.genderPresentation ?? "",
    style: brief?.style ?? "",
    silhouette: brief?.silhouette ?? "",
    modernTraditionalBalance: brief?.modernTraditionalBalance ?? "",
    desiredComplexity: brief?.desiredComplexity ?? "",
    budget: brief?.budget ?? "",
    currency: brief?.currency ?? "PHP",
    description: brief?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const payload = {
        cultureId: form.cultureId || null,
        communityId: form.communityId || null,
        occasion: form.occasion || null,
        garmentType: form.garmentType || null,
        genderPresentation: form.genderPresentation || null,
        style: form.style || null,
        silhouette: form.silhouette || null,
        modernTraditionalBalance: form.modernTraditionalBalance || null,
        desiredComplexity: form.desiredComplexity || null,
        budget: form.budget ? Number(form.budget) : null,
        currency: form.currency || "PHP",
        description: form.description || null,
      };
      const url = brief?.id
        ? `/api/projects/${projectId}/briefs/${brief.id}`
        : `/api/projects/${projectId}/briefs`;
      const res = await fetch(url, {
        method: brief?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save brief.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  const input = "mt-1 w-full rounded border px-3 py-2";
  const field = (id: string, label: string, node: React.ReactNode) => (
    <div key={id}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {node}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
      {field("culture", "Culture", (
        <select id="culture" value={form.cultureId} onChange={(e) => set("cultureId", e.target.value)} className={input}>
          <option value="">Select…</option>
          {cultures.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      ))}
      {field("community", "Community", (
        <select id="community" value={form.communityId} onChange={(e) => set("communityId", e.target.value)} className={input}>
          <option value="">Select…</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      ))}
      {field("occasion", "Occasion", (
        <input id="occasion" value={form.occasion} onChange={(e) => set("occasion", e.target.value)} placeholder="Festival" className={input} />
      ))}
      {field("garment", "Garment type", (
        <input id="garment" value={form.garmentType} onChange={(e) => set("garmentType", e.target.value)} placeholder="Full attire" className={input} />
      ))}
      {field("silhouette", "Silhouette", (
        <input id="silhouette" value={form.silhouette} onChange={(e) => set("silhouette", e.target.value)} placeholder="Fitted" className={input} />
      ))}
      {field("style", "Style", (
        <input id="style" value={form.style} onChange={(e) => set("style", e.target.value)} placeholder="Contemporary" className={input} />
      ))}
      {field("balance", "Traditional ↔ contemporary", (
        <input id="balance" value={form.modernTraditionalBalance} onChange={(e) => set("modernTraditionalBalance", e.target.value)} placeholder="70% traditional" className={input} />
      ))}
      {field("complexity", "Desired complexity", (
        <input id="complexity" value={form.desiredComplexity} onChange={(e) => set("desiredComplexity", e.target.value)} placeholder="Moderate" className={input} />
      ))}
      {field("budget", "Budget", (
        <div className="mt-1 flex gap-2">
          <input id="budget" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="30000" className="w-full rounded border px-3 py-2" />
          <input value={form.currency} onChange={(e) => set("currency", e.target.value)} aria-label="Currency" className="w-20 rounded border px-2 py-2" />
        </div>
      ))}
      {field("gender", "Gender presentation", (
        <input id="gender" value={form.genderPresentation} onChange={(e) => set("genderPresentation", e.target.value)} className={input} />
      ))}
      <div className="md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea id="description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className={input} />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          {pending ? "Saving…" : brief?.id ? "Save Brief" : "Create Brief"}
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {saved && <p className="text-sm text-green-700">Saved.</p>}
      </div>
    </form>
  );
}
