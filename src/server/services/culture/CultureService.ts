import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  communities,
  culturalElementReferences,
  culturalElementRelationships,
  culturalElements,
} from "@/lib/db/schema";

// md/02 §42 service separation: CultureService owns cultural retrieval so
// API routes and pages share one implementation.
export class CultureService {
  // Element IDs in a culture's scope: direct ASSOCIATED_WITH links PLUS
  // elements linked to the culture's communities (one-hop traversal —
  // md/04 §57). Returns an unexecuted subquery for inArray().
  static elementIdsForCulture(cultureId: string) {
    return db
      .select({ id: culturalElementRelationships.sourceElementId })
      .from(culturalElementRelationships)
      .where(
        or(
          eq(culturalElementRelationships.cultureId, cultureId),
          inArray(
            culturalElementRelationships.communityId,
            db
              .select({ id: communities.id })
              .from(communities)
              .where(eq(communities.cultureId, cultureId)),
          ),
        ),
      );
  }
  // Full detail bundle for the element page + evaluation evidence later:
  // references with rows, restrictions, outgoing links with resolved targets,
  // and related elements via shared references.
  static async getElementDetail(id: string) {
    const row = await db.query.culturalElements.findFirst({
      where: eq(culturalElements.id, id),
      with: {
        references: { with: { reference: true } },
        restrictions: true,
        outgoingLinks: {
          with: { target: true, culture: true, community: true },
        },
      },
    });
    if (!row) return null;

    const refIds = row.references.map((r) => r.referenceId);
    let related: { id: string; name: string; category: string | null }[] = [];
    if (refIds.length > 0) {
      const shared = await db
        .selectDistinct({ id: culturalElementReferences.culturalElementId })
        .from(culturalElementReferences)
        .where(
          and(
            inArray(culturalElementReferences.referenceId, refIds),
            ne(culturalElementReferences.culturalElementId, id),
          ),
        )
        .limit(6);
      if (shared.length > 0) {
        related = await db.query.culturalElements.findMany({
          where: inArray(
            culturalElements.id,
            shared.map((s) => s.id),
          ),
          columns: { id: true, name: true, category: true },
        });
      }
    }
    return { ...row, related };
  }
}
