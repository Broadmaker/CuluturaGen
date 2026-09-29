"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// md/08 §64–65 deliberate final approval with confirmation summary.
export default function FinalizeButton({
  designId,
  designStatus,
}: {
  designId: string;
  designStatus: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (designStatus === "FINAL") {
    return (
      <span className="rounded border border-green-700 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
        ✓ FINAL
      </span>
    );
  }

  async function finalize() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/designs/${designId}/finalize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Final approval failed.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="rounded bg-black px-3 py-1 text-sm text-white">
        Finalize design
      </button>
    );
  }

  return (
    <div className="mt-2 rounded border bg-neutral-50 p-3 text-sm">
      <p className="font-medium">APPROVE FINAL DESIGN?</p>
      <p className="mt-1 text-neutral-600">
        This marks the current version as the approved project design. Requires
        a prior evaluation with no unresolved CRITICAL findings. This is a
        deliberate human decision — it cannot be undone except by generating a
        new version.
      </p>
      {error && <p className="mt-1 text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={finalize} disabled={pending} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50">
          {pending ? "…" : "Confirm approval"}
        </button>
        <button onClick={() => setConfirming(false)} className="rounded border px-3 py-1">
          Cancel
        </button>
      </div>
    </div>
  );
}
