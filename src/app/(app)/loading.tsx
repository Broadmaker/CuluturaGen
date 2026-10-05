import PageSkeleton from "@/components/layout/PageSkeleton";

// Route loading fallback for the protected workspace (md/08 §76).
// Server pages stream this instantly while data loads — no blank screens.
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl p-6" aria-busy="true" aria-label="Loading">
      <PageSkeleton />
    </main>
  );
}
