"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BODY_FIELDS, type BodyFieldKey } from "@/lib/brief/constants";

export interface BodySnapshot {
  id: string;
  clientId: string | null;
  measurementSource: string | null;
  designerVerified: boolean | null;
  notes: string | null;
  createdAt: string;
  [key: string]: string | boolean | null;
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
        <span className="rounded border px-2 py-0.5 text-xs">MANUAL</span>
        {latest?.designerVerified ? (
          <span className="rounded border border-green-700 bg-green-50 px-2 py-0.5 text-xs text-green-800">
            ✓ DESIGNER VERIFIED
          </span>
        ) : (
          <span className="rounded border px-2 py-0.5 text-xs">UNVERIFIED</span>
        )}
        {historyCount > 0 && (
          <span className="text-xs text-neutral-500">{historyCount} snapshot(s) kept</span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
        {BODY_FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={f.key} className="text-sm font-medium">
              {f.label} <span className="text-neutral-400">({f.unit})</span>
            </label>
            <input
              id={f.key}
              inputMode="decimal"
              value={values[f.key]}
              onChange={(e) => set(f.key as BodyFieldKey, e.target.value)}
              placeholder="—"
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        ))}
      </div>
      <div className="mt-3">
        <label htmlFor="notes" className="text-sm font-medium">Notes</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={verified} onChange={(e) => { setVerified(e.target.checked); setSaved(false); }} />
        Designer verified — I checked these measurements
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => save(false)} disabled={pending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          {pending ? "Saving…" : latest ? "Save corrections" : "Save measurements"}
        </button>
        {latest && (
          <button onClick={() => save(true)} disabled={pending} className="rounded border px-4 py-2 text-sm hover:bg-white disabled:opacity-50">
            New session snapshot
          </button>
        )}
        {saved && <p className="text-sm text-green-700">Saved.</p>}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-3 text-xs text-neutral-500">
        Manual entry only in MVP 3. Computer-vision estimates arrive later and will
        be labeled ESTIMATED, never silently treated as measured (md/01 §15).
      </p>
    </div>
  );
}
