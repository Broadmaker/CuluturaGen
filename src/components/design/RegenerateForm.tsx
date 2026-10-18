"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// md/08 §49 regeneration with designer feedback → new version.
export default function RegenerateForm({ designId }: { designId: string }) {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/designs/${designId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Regeneration failed.");
        return;
      }
      setInstruction("");
      router.push(`/design-studio/${designId}?v=${data.data.version.versionNumber}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 border-t pt-3 text-sm">
      <label htmlFor="regen" className="font-medium text-ink-700">Regenerate / refine</label>
      <textarea
        id="regen"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="What should change? (e.g. simpler silhouette, lower decoration)"
        rows={2}
        className="input mt-1 text-sm py-1.5"
      />
      {error && <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Generating…" : "Generate revision"}
      </Button>
    </form>
  );
}
