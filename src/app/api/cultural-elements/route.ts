import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import {
  auditLogs,
  culturalElementRelationships,
  culturalElements,
} from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { ELEMENT_CATEGORIES } from "@/lib/culture/constants";
import { CultureService } from "@/server/services/culture/CultureService";
import { hybridSearch } from "@/lib/retrieval/hybrid";

const elementSchema = z.object({
  name: z.string().min(1).max(255),
  alternativeNames: z.string().max(1000).optional(),
  category: z.enum(ELEMENT_CATEGORIES),
  description: z.string().max(8000).optional(),
  historicalContext: z.string().max(8000).optional(),
  symbolism: z.string().max(4000).optional(),
  traditionalUsage: z.string().max(4000).optional(),
  modernUsage: z.string().max(4000).optional(),
  appropriateContext: z.string().max(4000).optional(),
  restrictedContext: z.string().max(4000).optional(),
  expertNotes: z.string().max(4000).optional(),
  cultureId: z.string().uuid().optional(),
  communityId: z.string().uuid().optional(),
});

// md/08 §18 search: name / category / status / culture + verified-only.
// With q: hybrid ranked retrieval (keyword + full-text + graph, md/04 §73);
// without q: recency order (unchanged legacy behavior).
export async function GET(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const category = sp.get("category");
  const status = sp.get("status");
  const cultureId = sp.get("cultureId");
  const verifiedOnly = sp.get("verifiedOnly") === "1";
  const filters = {
    category: category || undefined,
    status: status || undefined,
    verifiedOnly,
    cultureId: cultureId || undefined,
  };

  if (q) {
    const hits = await hybridSearch(q, filters, 100);
    const retrieval: Record<string, { score: number; via: string[] }> = {};
    for (const h of hits) {
      retrieval[h.element.id] = {
        score: Math.round(h.score * 1000) / 1000,
        via: h.via,
      };
    }
    return NextResponse.json({
      ok: true,
      data: hits.map((h) => h.element),
      retrieval,
    });
  }

  const cultureLinkedIds = cultureId
    ? CultureService.elementIdsForCulture(cultureId)
    : undefined;

  const rows = await db.query.culturalElements.findMany({
    where: and(
      category ? eq(culturalElements.category, category) : undefined,
      verifiedOnly
        ? eq(culturalElements.validationStatus, "VERIFIED")
        : status
          ? eq(culturalElements.validationStatus, status)
          : undefined,
      cultureLinkedIds ? inArray(culturalElements.id, cultureLinkedIds) : undefined,
    ),
    orderBy: desc(culturalElements.updatedAt),
    limit: 100,
  });
  return NextResponse.json({ ok: true, data: rows });
}

function makeCode(): string {
  return `CE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// New records always start UNVERIFIED — md/04 §38. Verification is a
// separate, role-gated PATCH transition.
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = elementSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Name and category are required." }, { status: 400 });
  }
  const { cultureId, communityId, alternativeNames, ...fields } = parsed.data;

  let row = null;
  for (let i = 0; i < 2 && !row; i++) {
    try {
      [row] = await db
        .insert(culturalElements)
        .values({
          ...fields,
          alternativeNames: alternativeNames
            ? alternativeNames.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          elementCode: makeCode(),
          createdBy: user.id,
        })
        .returning();
    } catch (e) {
      if (i === 1) throw e;
    }
  }

  // Optional initial associations (md/03 §20 extended).
  if (cultureId) {
    await db.insert(culturalElementRelationships).values({
      sourceElementId: row!.id,
      cultureId,
      relationshipType: "ASSOCIATED_WITH",
    });
  }
  if (communityId) {
    await db.insert(culturalElementRelationships).values({
      sourceElementId: row!.id,
      communityId,
      relationshipType: "BELONGS_TO",
    });
  }

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CULTURAL_RECORD_CREATED",
    entityType: "CulturalElement",
    entityId: row!.id,
    newValue: { name: row!.name, category: row!.category },
  });
  return NextResponse.json({ ok: true, data: row }, { status: 201 });
}
