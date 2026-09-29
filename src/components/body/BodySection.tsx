"use client";

import { useState } from "react";
import ClientManager, { type Client } from "./ClientManager";
import BodyProfileForm, { type BodySnapshot } from "./BodyProfileForm";

// Owns the selected client so the profile form attaches to the right person.
export default function BodySection({
  projectId,
  clients,
  profiles,
}: {
  projectId: string;
  clients: Client[];
  profiles: BodySnapshot[];
}) {
  const [clientId, setClientId] = useState<string | null>(profiles[0]?.clientId ?? null);
  const latest = profiles.find((p) => (clientId ? p.clientId === clientId : p.clientId === null))
    ?? profiles[0]
    ?? null;

  return (
    <div className="rounded border bg-white p-4">
      <ClientManager
        projectId={projectId}
        initial={clients}
        selectedId={clientId}
        onSelect={setClientId}
      />
      <hr className="my-4" />
      <h2 className="font-semibold">Measurements</h2>
      <BodyProfileForm
        projectId={projectId}
        latest={latest}
        historyCount={profiles.length}
        clientId={clientId}
      />
    </div>
  );
}
