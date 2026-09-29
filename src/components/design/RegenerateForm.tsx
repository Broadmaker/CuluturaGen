"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <label htmlFor="regen" className="font-medium">Regenerate / refine</label>
      <textarea
        id="regen"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="What should change? (e.g. simpler silhouette, lower decoration)"
        rows={2}
        className="mt-1 w-full rounded border px-2 py-1"
      />
      {error && <p className="mt-1 text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="mt-2 rounded bg-black px-3 py-1 text-white disabled:opacity-50">
        {pending ? "Generating…" : "Generate revision"}
      </button>
    </form>
  );
}
