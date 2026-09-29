import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { cultures } from "@/lib/db/schema";
import NewProjectForm from "@/components/projects/NewProjectForm";

export default async function NewProjectPage() {
  const cultureList = await db.query.cultures.findMany({
    columns: { id: true, name: true },
    orderBy: asc(cultures.name),
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <p className="text-sm text-neutral-500">
        <a href="/projects" className="underline">
          Projects
        </a>{" "}
        / New
      </p>
      <h1 className="mt-1 text-2xl font-bold">Create Project</h1>
      <NewProjectForm cultures={cultureList} />
    </main>
  );
}
