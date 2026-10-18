import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities, cultures } from "@/lib/db/schema";
import NewElementForm from "@/components/culture/NewElementForm";

export default async function NewElementPage() {
  const [cultureList, communityList] = await Promise.all([
    db.query.cultures.findMany({
      orderBy: asc(cultures.name),
      columns: { id: true, name: true },
    }),
    db.query.communities.findMany({
      orderBy: asc(communities.name),
      columns: { id: true, name: true, cultureId: true },
    }),
  ]);

  return (
    <main className="w-full p-6">
      <p className="text-sm font-medium text-ink-500">
        <a href="/culture" className="text-ink-700 transition hover:text-brand-600">Cultural Knowledge</a>
        <span className="mx-1.5 text-ink-300">/</span> New
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-950">Propose Cultural Element</h1>
      <NewElementForm cultures={cultureList} communities={communityList} />
    </main>
  );
}
