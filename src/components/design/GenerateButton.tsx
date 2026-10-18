"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

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
      <Button
        type="button"
        onClick={() => setConfirming(true)}
      >
        Generate design
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-stone-200 bg-ink-50 p-3 text-sm">
      <p className="font-medium">GENERATE DESIGN?</p>
      <p className="mt-1 text-ink-500">
        This will create 1 design specification + 1 visual concept from the
        project brief, cultural basket, and body profile.
      </p>
      <input
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Optional instruction (e.g. more traditional)"
        className="input mt-2 text-sm py-1.5"
      />
      {error && <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          onClick={generate}
          disabled={pending}
        >
          {pending ? "Generating…" : "Generate"}
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
