"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVAILABILITY_STATUSES, MATERIAL_CATEGORIES } from "@/lib/cost/constants";

export default function NewMaterialForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", category: "FABRIC", unit: "meter", price: "", supplier: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          unit: form.unit || undefined,
          supplier: form.supplier || undefined,
          availabilityStatus: "AVAILABLE",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not create material.");
        return;
      }
      const id = data.data.id;
      // Optional initial price becomes the first history row.
      if (form.price) {
        await fetch(`/api/materials/${id}/prices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: Number(form.price),
            unit: form.unit || undefined,
            supplier: form.supplier || undefined,
            source: "USER_ENTERED",
          }),
        });
      }
      router.push(`/materials/${id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  const input = "mt-1 w-full rounded border px-3 py-2 text-sm";

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-3 md:grid-cols-3">
      <div>
        <label htmlFor="m-name" className="text-sm font-medium">Name *</label>
        <input id="m-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="m-cat" className="text-sm font-medium">Category</label>
        <select id="m-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
          {MATERIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="m-unit" className="text-sm font-medium">Unit</label>
        <input id="m-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="m-price" className="text-sm font-medium">Initial price (optional)</label>
        <input id="m-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
      </div>
      <div>
        <label htmlFor="m-supplier" className="text-sm font-medium">Supplier</label>
        <input id="m-supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={input} />
      </div>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          {pending ? "…" : "Add material"}
        </button>
      </div>
      {error && <p className="text-sm text-red-700 md:col-span-3">{error}</p>}
    </form>
  );
}
