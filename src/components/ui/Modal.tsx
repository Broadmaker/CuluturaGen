"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

// Accessible, dependency-free modal dialog (Escape to close, scroll lock,
// click-outside). Used for creation forms such as Add Material.
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div className={`relative z-10 my-8 w-full ${width} rounded-2xl border border-stone-200/80 bg-white p-6 shadow-pop`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink-950">{title}</h2>
              {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
