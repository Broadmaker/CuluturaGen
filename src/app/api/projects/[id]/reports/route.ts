import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { projects, reports } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { REPORT_TYPES, type ReportType } from "@/lib/reports/constants";
import { ReportService } from "@/server/services/reports/ReportService";

const schema = z.object({
  reportType: z.enum(REPORT_TYPES),
  designId: z.string().uuid().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const rows = await db.query.reports.findMany({
    where: eq(reports.projectId, params.id),
    orderBy: desc(reports.generatedAt),
  });
  return NextResponse.json({ ok: true, data: rows });
}

// Assembles the dossier from preserved snapshots and renders a PDF file.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), isNull(projects.deletedAt)));
  if (!project) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Valid reportType is required." }, { status: 400 });
  }
  try {
    const result = await ReportService.generate({
      projectId: params.id,
      userId: user.id,
      reportType: parsed.data.reportType as ReportType,
      designId: parsed.data.designId,
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (e) {
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Report failed." },
      { status },
    );
  }
}
