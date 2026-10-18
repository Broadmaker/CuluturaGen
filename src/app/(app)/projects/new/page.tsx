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
    <main className="w-full p-6">
      <p className="text-sm font-medium text-ink-500">
        <a href="/projects" className="text-ink-700 transition hover:text-brand-600">
          Projects
        </a>
        <span className="mx-1.5 text-ink-300">/</span> New
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-950">Create Project</h1>
      <NewProjectForm cultures={cultureList} />
    </main>
  );
}
