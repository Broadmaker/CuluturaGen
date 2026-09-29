"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// md/08 §123 — confirm before the (potentially paid) AI call.
export default function GenerateButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generate() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/designs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, instruction: instruction || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Generation failed.");
        return;
      }
      router.push(`/design-studio/${data.data.design.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded bg-black px-3 py-1.5 text-sm text-white"
      >
        Generate design
      </button>
    );
  }

  return (
    <div className="mt-2 rounded border bg-neutral-50 p-3 text-sm">
      <p className="font-medium">GENERATE DESIGN?</p>
      <p className="mt-1 text-neutral-600">
        This will create 1 design specification + 1 visual concept from the
        project brief, cultural basket, and body profile.
      </p>
      <input
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Optional instruction (e.g. more traditional)"
        className="mt-2 w-full rounded border px-2 py-1"
      />
      {error && <p className="mt-1 text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={generate}
          disabled={pending}
          className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
        >
          {pending ? "Generating…" : "Generate"}
        </button>
        <button onClick={() => setConfirming(false)} className="rounded border px-3 py-1">
          Cancel
        </button>
      </div>
    </div>
  );
}
