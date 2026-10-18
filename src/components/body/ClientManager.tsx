"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export interface Client {
  id: string;
  name: string | null;
  genderPresentation: string | null;
  ageRange: string | null;
  notes: string | null;
}

// Minimal identifying info only — md/02 §33 privacy.
export default function ClientManager({
  projectId,
  initial,
  selectedId,
  onSelect,
}: {
  projectId: string;
  initial: Client[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not add client.");
        return;
      }
      setList((l) => [data.data, ...l]);
      setName("");
      onSelect(data.data.id);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink-950">Client</h2>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
          className="input w-auto text-sm py-1.5"
          aria-label="Client"
        >
          <option value="">No client (general profile)</option>
          {list.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || "Unnamed client"}
            </option>
          ))}
        </select>
      </div>
      <form onSubmit={add} className="mt-2 flex gap-2 text-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Client name / alias"
          className="input w-auto text-sm py-1.5"
        />
        <Button variant="secondary" size="sm" type="submit" disabled={pending}>
          {pending ? "…" : "Add client"}
        </Button>
      </form>
      {error && <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
