"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRICE_SOURCES } from "@/lib/cost/constants";

// Appends a history row — never edits. Old snapshots keep old values (md/06 §20).
export default function AddPriceForm({ materialId, unit }: { materialId: string; unit: string | null }) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [source, setSource] = useState<string>("SUPPLIER_QUOTE");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/materials/${materialId}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(price),
          unit: unit ?? undefined,
          supplier: supplier || undefined,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not add price.");
        return;
      }
      setPrice("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
      <div>
        <label htmlFor="p-price" className="font-medium">New price *</label>
        <input id="p-price" type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block rounded border px-2 py-1" />
      </div>
      <div>
        <label htmlFor="p-supplier" className="font-medium">Supplier</label>
        <input id="p-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 block rounded border px-2 py-1" />
      </div>
      <div>
        <label htmlFor="p-source" className="font-medium">Source</label>
        <select id="p-source" value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 block rounded border px-2 py-1">
          {PRICE_SOURCES.filter((s) => s !== "MISSING").map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50">
        {pending ? "…" : "Append price"}
      </button>
      {error && <p className="text-red-700">{error}</p>}
    </form>
  );
}
