"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/status/StatusBadge";

interface Finding {
  id: string;
  category: string;
  severity: string;
  finding: string;
  evidence: string | null;
  recommendation: string | null;
  resolved: boolean | null;
}

interface Evaluation {
  id: string;
  overallStatus: string | null;
  culturalStatus: string | null;
  bodyStatus: string | null;
  costStatus: string | null;
  requirementStatus: string | null;
  materialStatus: string | null;
  createdAt: string | null;
}

const SEV_STYLES: Record<string, string> = {
  CRITICAL: "border-red-700 bg-red-50",
  HIGH: "border-red-400 bg-red-50/50",
  MEDIUM: "border-amber-500 bg-amber-50/50",
  LOW: "border-neutral-300 bg-white",
  INFO: "border-neutral-200 bg-neutral-50",
};

const DOMAIN_LABELS: [string, string][] = [
  ["culturalStatus", "Cultural"],
  ["requirementStatus", "Requirements"],
  ["bodyStatus", "Body"],
  ["costStatus", "Cost"],
  ["materialStatus", "Materials"],
];

// md/08 §56 evaluation workspace + md/08 §59 human review panel.
export default function EvaluationPanel({
  designId,
  versionId,
  versionNumber,
}: {
  designId: string;
  versionId: string;
  versionNumber: number;
}) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/designs/${designId}/evaluation`);
    const data = await res.json();
    if (data.ok && data.data) {
      setEvaluation(data.data.evaluation);
      setFindings(data.data.findings);
    } else {
      setEvaluation(null);
      setFindings([]);
    }
    setLoaded(true);
  }, [designId]);

  useEffect(() => {
    load();
  }, [load, versionId]);

  async function run() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/designs/${designId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Evaluation failed.");
        return;
      }
      load();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function resolve(id: string) {
    const res = await fetch(`/api/evaluation/findings/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) load();
  }

  async function approve() {
    if (!evaluation) return;
    setError(null);
    const res = await fetch(`/api/evaluation/${evaluation.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: reviewComment || undefined }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Approval failed.");
      return;
    }
    setReviewComment("");
    load();
  }

  async function requestRevision() {
    if (!evaluation || !reviewComment.trim()) {
      setError("Revision instructions are required.");
      return;
    }
    setError(null);
    const res = await fetch(`/api/evaluation/${evaluation.id}/request-revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: reviewComment }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Request failed.");
      return;
    }
    setReviewComment("");
    load();
  }

  const open = findings.filter((f) => !f.resolved);
  const critical = open.filter((f) => f.severity === "CRITICAL").length;

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={run} disabled={pending} className="rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">
          {pending ? "Evaluating…" : evaluation ? "Re-evaluate V" + versionNumber : "Run evaluation"}
        </button>
        {evaluation && (
          <StatusBadge value={evaluation.overallStatus} />
        )}
      </div>
      {error && <p className="mt-2 text-red-700">{error}</p>}
      {!loaded ? (
        <p className="mt-2 text-neutral-500">Loading…</p>
      ) : !evaluation ? (
        <p className="mt-2 text-neutral-500">
          No evaluation yet for this design — run one to get evidence-based findings.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            {DOMAIN_LABELS.map(([key, label]) => (
              <div key={key} className="rounded border bg-white px-2 py-1.5">
                <p className="text-xs uppercase tracking-widest text-neutral-500">{label}</p>
                <p className="font-medium">{((evaluation as unknown as Record<string, string | null>)[key] ?? "—").replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {findings.length === 0 && (
              <p className="text-neutral-500">No findings — all domains passed.</p>
            )}
            {findings.map((f) => (
              <div key={f.id} className={`rounded border p-3 ${SEV_STYLES[f.severity] ?? ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border bg-white px-1.5 py-0.5 text-xs font-medium">{f.severity}</span>
                  <span className="rounded bg-white px-1.5 py-0.5 text-xs text-neutral-500">{f.category}</span>
                  {f.resolved && <span className="text-xs text-green-700">✓ resolved</span>}
                  <span className="ml-auto">
                    {!f.resolved && (
                      <button onClick={() => resolve(f.id)} className="rounded border bg-white px-2 py-0.5 text-xs">
                        Resolve
                      </button>
                    )}
                  </span>
                </div>
                <p className="mt-1">{f.finding}</p>
                {f.recommendation && (
                  <p className="mt-1 text-neutral-600">→ {f.recommendation}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded border bg-white p-3">
            <h3 className="font-semibold">HUMAN REVIEW</h3>
            <p className="mt-1 text-neutral-600">
              System: {evaluation.overallStatus?.replace(/_/g, " ")} · {open.length} open finding(s)
              {critical > 0 && ` · approval blocked by ${critical} CRITICAL`}
            </p>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Review comment / revision instructions"
              rows={2}
              className="mt-2 w-full rounded border px-2 py-1"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={approve} disabled={critical > 0} title={critical > 0 ? `${critical} CRITICAL findings unresolved` : "Approve design"} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50">
                Approve design
              </button>
              <button onClick={requestRevision} className="rounded border px-3 py-1">
                Request revision
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
