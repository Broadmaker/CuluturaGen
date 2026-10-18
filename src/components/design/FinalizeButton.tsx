"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

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
      <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
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
      <Button type="button" onClick={() => setConfirming(true)}>
        Finalize design
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-stone-200 bg-ink-50 p-3 text-sm">
      <p className="font-medium">APPROVE FINAL DESIGN?</p>
      <p className="mt-1 text-ink-500">
        This marks the current version as the approved project design. Requires
        a prior evaluation with no unresolved CRITICAL findings. This is a
        deliberate human decision — it cannot be undone except by generating a
        new version.
      </p>
      {error && <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button type="button" onClick={finalize} disabled={pending}>
          {pending ? "…" : "Confirm approval"}
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
