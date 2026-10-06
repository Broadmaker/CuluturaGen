import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { designs } from "@/lib/db/schema";
import { NavIcons } from "@/components/layout/icons";

// Async server island: fetches the review count in parallel with the rest of
// the page. Rendered inside <Suspense> so the shell paints without waiting.
export default async function ReviewBell() {
  const rows = await db
    .select({ value: count() })
    .from(designs)
    .where(eq(designs.status, "REVIEW_REQUIRED"));
  const reviewCount = rows[0]?.value ?? 0;

  return (
    <Link
      href="/evaluations"
      aria-label={`${reviewCount} designs awaiting review`}
      title="Review queue"
      className="relative hidden rounded-lg border border-stone-200 bg-white p-2 text-stone-500 shadow-sm transition-colors hover:text-ink-900 sm:block"
    >
      {NavIcons.bell}
      {reviewCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass-500 px-1 text-[11px] font-bold text-ink-950">
          {reviewCount}
        </span>
      )}
    </Link>
  );
}

// Placeholder while the count loads — same footprint, no layout shift.
export function ReviewBellFallback() {
  return (
    <span
      aria-hidden="true"
      className="hidden h-9 w-9 rounded-lg border border-stone-200 bg-white shadow-sm sm:block"
    />
  );
}
