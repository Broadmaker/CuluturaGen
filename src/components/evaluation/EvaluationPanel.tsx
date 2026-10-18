"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/status/StatusBadge";
import Button from "@/components/ui/Button";

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
        <Button type="button" onClick={run} disabled={pending}>
          {pending ? "Evaluating…" : evaluation ? "Re-evaluate V" + versionNumber : "Run evaluation"}
        </Button>
        {evaluation && (
          <StatusBadge value={evaluation.overallStatus} />
        )}
      </div>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!loaded ? (
        <p className="mt-2 text-ink-500">Loading…</p>
      ) : !evaluation ? (
        <p className="mt-2 text-ink-500">
          No evaluation yet for this design — run one to get evidence-based findings.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            {DOMAIN_LABELS.map(([key, label]) => (
              <div key={key} className="rounded-xl border border-stone-200/80 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-widest text-ink-500">{label}</p>
                <p className="font-medium">{((evaluation as unknown as Record<string, string | null>)[key] ?? "—").replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {findings.length === 0 && (
              <p className="text-ink-500">No findings — all domains passed.</p>
            )}
            {findings.map((f) => (
              <div key={f.id} className={`rounded-xl border p-3 ${SEV_STYLES[f.severity] ?? ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100">{f.severity}</span>
                  <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100">{f.category}</span>
                  {f.resolved && <span className="text-xs text-green-700">✓ resolved</span>}
                  <span className="ml-auto">
                    {!f.resolved && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => resolve(f.id)}>
                        Resolve
                      </Button>
                    )}
                  </span>
                </div>
                <p className="mt-1">{f.finding}</p>
                {f.recommendation && (
                  <p className="mt-1 text-ink-500">→ {f.recommendation}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-950">HUMAN REVIEW</h3>
            <p className="mt-1 text-ink-500">
              System: {evaluation.overallStatus?.replace(/_/g, " ")} · {open.length} open finding(s)
              {critical > 0 && ` · approval blocked by ${critical} CRITICAL`}
            </p>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Review comment / revision instructions"
              rows={2}
              className="input mt-2 text-sm py-1.5"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" onClick={approve} disabled={critical > 0} title={critical > 0 ? `${critical} CRITICAL findings unresolved` : "Approve design"}>
                Approve design
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={requestRevision}>
                Request revision
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
