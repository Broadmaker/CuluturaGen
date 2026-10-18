"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

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
    <Button
      variant="secondary"
      size="sm"
      type="button"
      onClick={remove}
      disabled={pending}
      aria-label="Remove from basket"
    >
      {pending ? "…" : "Remove"}
    </Button>
  );
}
