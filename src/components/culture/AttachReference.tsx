"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Attach an existing reference as provenance (md/04 §27).
export default function AttachReference({
  elementId,
  references,
}: {
  elementId: string;
  references: { id: string; title: string; referenceCode: string }[];
}) {
  const router = useRouter();
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function attach() {
    if (!referenceId) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/cultural-elements/${elementId}/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not attach reference.");
        return;
      }
      setReferenceId("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 text-sm">
        <select
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
          className="rounded border px-2 py-1"
          aria-label="Reference"
        >
          <option value="">Select reference…</option>
          {references.map((r) => (
            <option key={r.id} value={r.id}>
              {r.referenceCode} — {r.title.slice(0, 60)}
            </option>
          ))}
        </select>
        <button
          onClick={attach}
          disabled={!referenceId || pending}
          className="rounded border px-3 py-1 hover:bg-white disabled:opacity-50"
        >
          {pending ? "…" : "Attach"}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      <p className="mt-1 text-xs text-neutral-500">
        New source? Create it via POST /api/references (library UI in a later pass).
      </p>
    </div>
  );
}
