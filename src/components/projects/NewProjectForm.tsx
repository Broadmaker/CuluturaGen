"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// md/08 §14 create wizard (condensed to one screen for MVP 1:
// info + cultural context + budget).
export default function NewProjectForm({
  cultures,
}: {
  cultures: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cultureId, setCultureId] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          cultureId: cultureId || undefined,
          occasion: occasion || undefined,
          budget: budget ? Number(budget) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not create project.");
        return;
      }
      router.push(`/projects/${data.data.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-ink-700">
          Project name *
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Festival Attire 2026"
          className="input mt-1"
        />
      </div>
      <div>
        <label htmlFor="description" className="text-sm font-medium text-ink-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="culture" className="text-sm font-medium text-ink-700">
            Culture
          </label>
          <select
            id="culture"
            value={cultureId}
            onChange={(e) => setCultureId(e.target.value)}
            className="input mt-1"
          >
            <option value="">Select…</option>
            {cultures.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {cultures.length === 0 && (
            <p className="mt-1 text-xs text-ink-500">
              No cultures yet — add them in MVP 2.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="occasion" className="text-sm font-medium text-ink-700">
            Occasion
          </label>
          <input
            id="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="Festival"
            className="input mt-1"
          />
        </div>
      </div>
      <div>
        <label htmlFor="budget" className="text-sm font-medium text-ink-700">
          Target budget (PHP)
        </label>
        <input
          id="budget"
          type="number"
          min="0"
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="30000"
          className="input mt-1"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create Project"}
      </Button>
    </form>
  );
}
