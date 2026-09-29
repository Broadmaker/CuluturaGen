"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveFromBasket({
  projectId,
  elementId,
}: {
  projectId: string;
  elementId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    await fetch(`/api/projects/${projectId}/basket/${elementId}`, {
      method: "DELETE",
    }).catch(() => null);
    router.refresh();
  }

  return (
    <button
      onClick={remove}
      disabled={pending}
      className="rounded border px-2 py-0.5 text-xs hover:bg-white disabled:opacity-50"
      aria-label="Remove from basket"
    >
      {pending ? "…" : "Remove"}
    </button>
  );
}
