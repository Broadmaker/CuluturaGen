"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVAILABILITY_STATUSES, MATERIAL_CATEGORIES } from "@/lib/cost/constants";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const EMPTY = {
  name: "",
  category: "FABRIC",
  unit: "meter",
  price: "",
  supplier: "",
  availabilityStatus: "AVAILABLE",
  description: "",
};

export default function AddMaterialModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
    setForm(EMPTY);
  }

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
          description: form.description || undefined,
          availabilityStatus: form.availabilityStatus,
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
      setOpen(false);
      setForm(EMPTY);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  const input = "input mt-1";

  return (
    <>
      <Button type="button" variant="accent" onClick={() => setOpen(true)}>
        <span aria-hidden="true">+</span> Add Material
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Add material"
        description="Add a supplier material. An optional price becomes the first entry in its history."
        size="lg"
      >
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="m-name" className="text-sm font-medium text-ink-700">
              Name <span className="text-brand-600">*</span>
            </label>
            <input
              id="m-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="m-cat" className="text-sm font-medium text-ink-700">
              Category
            </label>
            <select
              id="m-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={input}
            >
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="m-availability" className="text-sm font-medium text-ink-700">
              Availability
            </label>
            <select
              id="m-availability"
              value={form.availabilityStatus}
              onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })}
              className={input}
            >
              {AVAILABILITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="m-unit" className="text-sm font-medium text-ink-700">
              Unit
            </label>
            <input
              id="m-unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="m-supplier" className="text-sm font-medium text-ink-700">
              Supplier
            </label>
            <input
              id="m-supplier"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className={input}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="m-price" className="text-sm font-medium text-ink-700">
              Initial price (optional)
            </label>
            <input
              id="m-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={input}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="m-desc" className="text-sm font-medium text-ink-700">
              Description
            </label>
            <textarea
              id="m-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={input}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="secondary" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add material"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
