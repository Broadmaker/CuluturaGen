"use client";

import { useState } from "react";
import { REPORT_TYPES } from "@/lib/reports/constants";

// NOTE: imports the type list from lib (pure constants) to keep pdfkit
// server-side only.
export default function GenerateReportButton({
  projectId,
  designId,
}: {
  projectId: string;
  designId?: string;
}) {
  const [reportType, setReportType] = useState<string>("FINAL_REPORT");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setUrl(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, designId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Report generation failed.");
        return;
      }
      setUrl(data.data.url);
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="text-sm">
      <div className="flex flex-wrap gap-2">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="rounded border px-2 py-1"
          aria-label="Report type"
        >
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
        <button onClick={generate} disabled={pending} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50">
          {pending ? "Generating…" : "Generate report"}
        </button>
      </div>
      {error && <p className="mt-1 text-red-700">{error}</p>}
      {url && (
        <p className="mt-1">
          <a href={url} className="underline" download>
            Download PDF
          </a>
        </p>
      )}
    </div>
  );
}
