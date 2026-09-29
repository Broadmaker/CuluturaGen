import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { designs } from "@/lib/db/schema";

// MVP 1: design index backing the Design Studio nav entry.
// Full 3-panel workspace arrives in MVP 7 (md/08 §36).
export default async function DesignStudioIndexPage() {
  const designList = await db.query.designs.findMany({
    orderBy: desc(designs.updatedAt),
    limit: 50,
    with: { project: { columns: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">Design Studio</h1>
      {designList.length === 0 ? (
        <div className="mt-8 rounded border bg-white p-8 text-center">
          <p className="font-medium">NO DESIGNS YET</p>
          <p className="mt-2 text-sm text-neutral-600">
            Designs are generated from a project in MVP 4.
          </p>
          <Link
            href="/projects"
            className="mt-4 inline-block rounded bg-black px-4 py-2 text-sm text-white"
          >
            Go to Projects
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2 text-sm">
          {designList.map((d) => (
            <li key={d.id} className="rounded border bg-white px-4 py-3">
              <Link href={`/design-studio/${d.id}`} className="font-medium underline">
                {d.name ?? d.designCode}
              </Link>
              <span className="text-neutral-500">
                {" "}
                · {d.project.name} · {d.status} · v{d.currentVersion}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
