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
    <main className="mx-auto max-w-6xl p-6">
      <p className="text-sm text-neutral-500">
        <a href="/culture" className="underline">Cultural Knowledge</a> / New
      </p>
      <h1 className="mt-1 text-2xl font-bold">Propose Cultural Element</h1>
      <NewElementForm cultures={cultureList} communities={communityList} />
    </main>
  );
}
