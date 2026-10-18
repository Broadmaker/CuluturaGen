"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRICE_SOURCES } from "@/lib/cost/constants";
import Button from "@/components/ui/Button";

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
        <label htmlFor="p-price" className="font-medium text-ink-700">New price *</label>
        <input id="p-price" type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="input mt-1 block text-sm py-1.5" />
      </div>
      <div>
        <label htmlFor="p-supplier" className="font-medium text-ink-700">Supplier</label>
        <input id="p-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="input mt-1 block text-sm py-1.5" />
      </div>
      <div>
        <label htmlFor="p-source" className="font-medium text-ink-700">Source</label>
        <select id="p-source" value={source} onChange={(e) => setSource(e.target.value)} className="input mt-1 block text-sm py-1.5">
          {PRICE_SOURCES.filter((s) => s !== "MISSING").map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Append price"}
      </Button>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </form>
  );
}
