"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BODY_FIELDS, type BodyFieldKey } from "@/lib/brief/constants";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";

export interface BodySnapshot {
  id: string;
  clientId: string | null;
  measurementSource: string | null;
  designerVerified: boolean | null;
  confidenceLevel?: string | null;
  imageUrl?: string | null;
  notes: string | null;
  createdAt: string;
  [key: string]: string | boolean | null | undefined;
}

// Every save inserts a new snapshot row (history preserved); the form edits
// the latest via PATCH, “new session” POSTs a fresh row.
export default function BodyProfileForm({
  projectId,
  latest,
  historyCount,
  clientId,
}: {
  projectId: string;
  latest: BodySnapshot | null;
  historyCount: number;
  clientId: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of BODY_FIELDS) init[f.key] = (latest?.[f.key] as string) ?? "";
    return init;
  });
  const [verified, setVerified] = useState(latest?.designerVerified ?? false);
  const [notes, setNotes] = useState(latest?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  // Client selection is owned by the parent section component.

  function set(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    setSaved(false);
  }

  async function save(newSession: boolean) {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const payload: Record<string, unknown> = { designerVerified: verified, notes: notes || undefined };
      if (clientId) payload.clientId = clientId;
      for (const f of BODY_FIELDS) {
        const raw = values[f.key].trim();
        if (raw) {
          const n = Number(raw);
          if (!Number.isFinite(n) || n <= 0) {
            setError(`${f.label} must be a positive number.`);
            setPending(false);
            return;
          }
          payload[f.key] = n;
        }
      }
      const url =
        latest && !newSession
          ? `/api/projects/${projectId}/body/${latest.id}`
          : `/api/projects/${projectId}/body`;
      const res = await fetch(url, {
        method: latest && !newSession ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save measurements.");
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

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge value={latest?.measurementSource ?? "MANUAL"} />
        {(latest?.measurementSource === "COMPUTER_VISION" || latest?.measurementSource === "ESTIMATED") && !latest?.designerVerified && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
            ⚠ ESTIMATED — review required{latest?.confidenceLevel ? ` (confidence ${latest.confidenceLevel})` : ""}
          </span>
        )}
        {latest?.designerVerified ? (
          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
            ✓ DESIGNER VERIFIED
          </span>
        ) : (
          <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100">UNVERIFIED</span>
        )}
        {historyCount > 0 && (
          <span className="text-xs text-ink-500">{historyCount} snapshot(s) kept</span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
        {BODY_FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={f.key} className="text-sm font-medium text-ink-700">
              {f.label} <span className="text-ink-400">({f.unit})</span>
            </label>
            <input
              id={f.key}
              inputMode="decimal"
              value={values[f.key]}
              onChange={(e) => set(f.key as BodyFieldKey, e.target.value)}
              placeholder="—"
              className="input mt-1"
            />
          </div>
        ))}
      </div>
      <div className="mt-3">
        <label htmlFor="notes" className="text-sm font-medium text-ink-700">Notes</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} className="input mt-1" />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={verified} onChange={(e) => { setVerified(e.target.checked); setSaved(false); }} />
        Designer verified — I checked these measurements
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => save(false)} disabled={pending}>
          {pending ? "Saving…" : latest ? "Save corrections" : "Save measurements"}
        </Button>
        {latest && (
          <Button variant="secondary" size="sm" type="button" onClick={() => save(true)} disabled={pending}>
            New session snapshot
          </Button>
        )}
        {saved && <p className="text-sm text-green-700">Saved.</p>}
      </div>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <p className="mt-3 text-xs text-ink-500">
        Snapshots preserve history: POST starts a session, PATCH corrects the latest.
        Vision estimates are labeled by source above and must be designer-verified
        before construction (md/01 §15).
      </p>
    </div>
  );
}
