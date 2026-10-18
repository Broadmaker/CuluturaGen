"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// Computer-vision body analysis panel (md/01 §15, md/08 §30–31).
// Upload → consent → ESTIMATED snapshot → designer Accept / Correct / Reject.
// Estimates are never authoritative: correction happens in the measurement
// form above, acceptance only flips the designer-verified flag.
export default function BodyAnalysisPanel({
  projectId,
  clientId,
  latestId,
  latestSource,
  latestVerified,
  latestConfidence,
  latestImageUrl,
}: {
  projectId: string;
  clientId: string | null;
  latestId: string | null;
  latestSource: string | null;
  latestVerified: boolean | null;
  latestConfidence: string | null;
  latestImageUrl: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEstimate =
    (latestSource === "COMPUTER_VISION" || latestSource === "ESTIMATED") &&
    latestVerified !== true;

  async function upload() {
    setError(null);
    if (!file) {
      setError("Choose a reference photo first.");
      return;
    }
    if (!consent) {
      setError("Photo consent is required before analysis.");
      return;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("consent", "yes");
      if (clientId) form.append("clientId", clientId);
      const res = await fetch(`/api/projects/${projectId}/body/analysis`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Analysis failed.");
        return;
      }
      setFile(null);
      setConsent(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function accept() {
    if (!latestId) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/body/${latestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designerVerified: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Could not accept estimate.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function reject() {
    if (!latestId) return;
    if (!window.confirm("Delete this vision estimate and its reference photo?")) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/body/${latestId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Could not delete estimate.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-card">
      <h2 className="font-display text-lg font-bold text-ink-950">Vision estimate</h2>
      <p className="mt-1 text-xs text-ink-500">
        Upload a reference photo for landmark-based estimates. Results are labeled
        ESTIMATED and need your review — never treated as measured (md/01 §15).
      </p>

      {isEstimate && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            ⚠ ESTIMATED — designer review required
            {latestConfidence ? ` (confidence ${latestConfidence})` : ""}
          </p>
          {latestImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={latestImageUrl}
              alt="Body reference photo"
              className="mt-2 max-h-48 rounded-lg border border-stone-200"
            />
          )}
          <p className="mt-2 text-xs text-amber-800">
            Correct values in the measurement form above, then accept — or reject
            to delete the estimate and its photo.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={accept}
              disabled={pending}
            >
              {pending ? "Working…" : "Accept estimate"}
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={reject}
              disabled={pending}
            >
              Reject & delete
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-3">
        <div>
          <label htmlFor="body-photo" className="text-sm font-medium text-ink-700">Reference photo (JPEG/PNG/WebP, max 8 MB)</label>
          <input
            id="body-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            I have the depicted person&apos;s consent to upload and analyze this photo,
            and I understand it is stored with the project and visible to the project team.
          </span>
        </label>
        <div>
          <Button
            type="button"
            onClick={upload}
            disabled={pending}
          >
            {pending ? "Analyzing…" : "Analyze photo"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
