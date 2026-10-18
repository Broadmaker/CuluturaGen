"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";

interface LinkedMaterial {
  id: string;
  materialId: string;
  quantity: string | null;
  unit: string | null;
  purpose: string | null;
  material: { id: string; name: string; unit: string | null };
}

interface AdHoc {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

interface CalcResult {
  estimateId: string;
  materials: number;
  labor: number;
  decoration: number;
  other: number;
  directCost: number;
  contingencyPct: number;
  contingency: number;
  estimatedTotal: number;
  budget: number | null;
  variance: number | null;
  status: string;
  requiresReview: boolean;
  missingPrices: { materialId: string; name: string }[];
  expiredPrices: { materialId: string; name: string }[];
}

interface HistoryRow {
  id: string;
  versionNumber: number | null;
  totalCost: string;
  budgetStatus: string | null;
  calculatedAt: string | null;
}

const EMPTY_LINE: AdHoc = { description: "", quantity: "1", unit: "hour", unitPrice: "" };

// md/08 §54 cost panel + md/06 deterministic calculation display.
export default function CostPanel({
  versionId,
  designId,
}: {
  versionId: string;
  designId: string;
}) {
  const [linked, setLinked] = useState<LinkedMaterial[]>([]);
  const [library, setLibrary] = useState<{ id: string; name: string; unit: string | null }[]>([]);
  const [addId, setAddId] = useState("");
  const [addQty, setAddQty] = useState("");
  const [labor, setLabor] = useState<AdHoc[]>([]);
  const [decoration, setDecoration] = useState<AdHoc[]>([]);
  const [other, setOther] = useState<AdHoc[]>([]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const [m, h, lib] = await Promise.all([
      fetch(`/api/versions/${versionId}/materials`).then((r) => r.json()),
      fetch(`/api/designs/${designId}/cost-history`).then((r) => r.json()),
      fetch(`/api/materials`).then((r) => r.json()),
    ]);
    if (m.ok) setLinked(m.data);
    if (h.ok) setHistory(h.data);
    if (lib.ok) setLibrary(lib.data.map((x: { id: string; name: string; unit: string | null }) => x));
  }, [versionId, designId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addMaterial() {
    if (!addId || !addQty) return;
    const res = await fetch(`/api/versions/${versionId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId: addId, quantity: Number(addQty) }),
    });
    if (res.ok) {
      setAddId("");
      setAddQty("");
      load();
    }
  }

  async function removeMaterial(materialId: string) {
    await fetch(`/api/versions/${versionId}/materials?materialId=${materialId}`, { method: "DELETE" });
    load();
  }

  function lineEditor(
    title: string,
    rows: AdHoc[],
    setRows: (r: AdHoc[]) => void,
  ) {
    return (
      <div className="mt-2">
        <p className="text-xs uppercase tracking-widest text-ink-500">{title}</p>
        {rows.map((l, i) => (
          <div key={i} className="mt-1 flex flex-wrap gap-1 text-sm">
            <input value={l.description} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, description: e.target.value } : r)))} placeholder="Description" className="input min-w-40 flex-1 text-sm py-1.5" />
            <input value={l.quantity} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, quantity: e.target.value } : r)))} placeholder="Qty" className="input w-16 text-sm py-1.5" />
            <input value={l.unit} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))} placeholder="Unit" className="input w-20 text-sm py-1.5" />
            <input value={l.unitPrice} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, unitPrice: e.target.value } : r)))} placeholder="₱/unit" className="input w-24 text-sm py-1.5" />
            <Button type="button" variant="secondary" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={() => setRows([...rows, { ...EMPTY_LINE }])}>
          + Add {title.toLowerCase()} line
        </Button>
      </div>
    );
  }

  async function calculate() {
    setError(null);
    setPending(true);
    try {
      const num = (v: AdHoc) => ({
        description: v.description,
        quantity: v.quantity ? Number(v.quantity) : undefined,
        unit: v.unit || undefined,
        unitPrice: v.unitPrice ? Number(v.unitPrice) : undefined,
      });
      const res = await fetch(`/api/versions/${versionId}/cost/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labor: labor.filter((l) => l.description).map(num),
          decoration: decoration.filter((l) => l.description).map(num),
          other: other.filter((l) => l.description).map(num),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Calculation failed.");
        return;
      }
      setResult(data.data);
      load();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  const fmt = (n: number) => `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="text-sm">
      <div className="mt-2">
        <p className="text-xs uppercase tracking-widest text-ink-500">Linked materials</p>
        {linked.length === 0 ? (
          <p className="mt-1 text-ink-500">None linked — add from the library.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {linked.map((l) => (
              <li key={l.id} className="flex items-center gap-2">
                <Link href={`/materials/${l.materialId}`} className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline">{l.material.name}</Link>
                <span className="text-ink-500">{l.quantity} {l.unit ?? l.material.unit}</span>
                <Button type="button" variant="secondary" size="sm" onClick={() => removeMaterial(l.materialId)}>✕</Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          <select value={addId} onChange={(e) => setAddId(e.target.value)} className="input w-auto text-sm py-1.5" aria-label="Material">
            <option value="">Select material…</option>
            {library.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input value={addQty} onChange={(e) => setAddQty(e.target.value)} placeholder="Qty" className="input w-20 text-sm py-1.5" />
          <Button type="button" variant="secondary" size="sm" onClick={addMaterial} disabled={!addId || !addQty}>
            Link
          </Button>
        </div>
      </div>

      {lineEditor("Labor", labor, setLabor)}
      {lineEditor("Decoration", decoration, setDecoration)}
      {lineEditor("Other", other, setOther)}

      <Button type="button" onClick={calculate} disabled={pending} className="mt-3">
        {pending ? "Calculating…" : "Calculate cost"}
      </Button>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-3 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
          <div className="space-y-0.5">
            <div className="flex justify-between"><span>Materials</span><span>{fmt(result.materials)}</span></div>
            <div className="flex justify-between"><span>Labor</span><span>{fmt(result.labor)}</span></div>
            <div className="flex justify-between"><span>Decoration</span><span>{fmt(result.decoration)}</span></div>
            <div className="flex justify-between"><span>Other</span><span>{fmt(result.other)}</span></div>
            <div className="flex justify-between border-t pt-1"><span>Direct cost</span><span>{fmt(result.materials + result.labor + result.decoration + result.other)}</span></div>
            <div className="flex justify-between"><span>Contingency ({result.contingencyPct}%)</span><span>{fmt(result.contingency)}</span></div>
            <div className="flex justify-between border-t pt-1 font-bold"><span>ESTIMATED TOTAL</span><span>{fmt(result.estimatedTotal)}</span></div>
            {result.budget !== null && (
              <>
                <div className="flex justify-between"><span>Budget</span><span>{fmt(result.budget)}</span></div>
                <div className="flex justify-between"><span>Remaining</span><span>{fmt(result.variance ?? 0)}</span></div>
              </>
            )}
          </div>
          <p className="mt-2">
            <StatusBadge value={result.status} />
          </p>
          {result.missingPrices.length > 0 && (
            <p className="mt-1 text-amber-700">⚠ Missing prices: {result.missingPrices.map((m) => m.name).join(", ")} — add prices in the library, then recalculate.</p>
          )}
          {result.expiredPrices.length > 0 && (
            <p className="mt-1 text-amber-700">⚠ Expired prices used: {result.expiredPrices.map((m) => m.name).join(", ")}.</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-widest text-ink-500">Cost history</p>
          <ul className="mt-1 space-y-1 text-xs">
            {history.map((h) => (
              <li key={h.id}>
                V{h.versionNumber}: ₱{Number(h.totalCost).toLocaleString()} · {h.budgetStatus}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
