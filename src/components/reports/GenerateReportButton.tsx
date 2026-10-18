"use client";

import { useState } from "react";
import { REPORT_TYPES } from "@/lib/reports/constants";
import Button from "@/components/ui/Button";

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
          className="input w-auto text-sm py-1.5"
          aria-label="Report type"
        >
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
        <Button type="button" onClick={generate} disabled={pending}>
          {pending ? "Generating…" : "Generate report"}
        </Button>
      </div>
      {error && <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {url && (
        <p className="mt-1">
          <a href={url} className="font-medium text-ink-800 underline-offset-2 hover:text-brand-600 hover:underline" download>
            Download PDF
          </a>
        </p>
      )}
    </div>
  );
}
