// Sample cultural data for MVP 2 demos. Run: pnpm tsx scripts/seed-sample-culture.ts
//
// THESIS INTEGRITY: every record is prefixed SAMPLE and uses generic
// placeholder descriptions. Nothing here represents real cultural knowledge —
// replace with verified, sourced records before any real design work.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import {
  communities,
  culturalElementReferences,
  culturalElementRelationships,
  culturalElements,
  culturalReferences,
  culturalRestrictions,
  cultures,
} from "../src/lib/db/schema";

function code(prefix: string, n: number): string {
  return `${prefix}-SAMPLE-${String(n).padStart(3, "0")}`;
}

async function main() {
  const existing = await db.query.cultures.findFirst({
    where: eq(cultures.name, "SAMPLE Culture A"),
    columns: { id: true },
  });
  if (existing) {
    console.log("Sample data already present — skipping.");
    process.exit(0);
  }

  const [cultureA] = await db
    .insert(cultures)
    .values({
      name: "SAMPLE Culture A",
      description: "Demonstration record. Replace with a verified culture before real use.",
      geographicScope: "Sample Region A",
      validationStatus: "VERIFIED",
    })
    .returning();
  const [cultureB] = await db
    .insert(cultures)
    .values({
      name: "SAMPLE Culture B",
      description: "Demonstration record. Replace with a verified culture before real use.",
      geographicScope: "Sample Region B",
      validationStatus: "VERIFIED",
    })
    .returning();

  const [commA1] = await db
    .insert(communities)
    .values({ cultureId: cultureA.id, name: "SAMPLE Community A1", validationStatus: "VERIFIED" })
    .returning();
  const [commA2] = await db
    .insert(communities)
    .values({ cultureId: cultureA.id, name: "SAMPLE Community A2", validationStatus: "VERIFIED" })
    .returning();
  const [commB1] = await db
    .insert(communities)
    .values({ cultureId: cultureB.id, name: "SAMPLE Community B1", validationStatus: "VERIFIED" })
    .returning();

  const [ref1] = await db
    .insert(culturalReferences)
    .values({
      referenceCode: code("REF", 1),
      title: "Sample Museum Catalogue Vol. I",
      author: "Sample Author",
      sourceType: "MUSEUM",
      citation: "Sample citation for demonstration only.",
    })
    .returning();
  const [ref2] = await db
    .insert(culturalReferences)
    .values({
      referenceCode: code("REF", 2),
      title: "Sample Community Field Notes",
      sourceType: "COMMUNITY_SOURCE",
      citation: "Sample citation for demonstration only.",
    })
    .returning();
  const [ref3] = await db
    .insert(culturalReferences)
    .values({
      referenceCode: code("REF", 3),
      title: "Sample Textile Journal",
      sourceType: "JOURNAL",
      citation: "Sample citation for demonstration only.",
    })
    .returning();

  async function element(
    n: number,
    values: Omit<typeof culturalElements.$inferInsert, "elementCode">,
  ) {
    const [row] = await db
      .insert(culturalElements)
      .values({ ...values, elementCode: code("CE", n) })
      .returning();
    return row;
  }

  const textile = await element(1, {
    name: "Sample Textile A",
    category: "TEXTILE",
    description: "Placeholder textile for UI and workflow demonstration.",
    traditionalUsage: "Placeholder usage note.",
    validationStatus: "VERIFIED",
  });
  const motif = await element(2, {
    name: "Sample Motif A1",
    category: "MOTIF",
    description: "Placeholder motif for UI and workflow demonstration.",
    symbolism: "Placeholder — attach a sourced meaning before real use.",
    validationStatus: "VERIFIED",
  });
  const garment = await element(3, {
    name: "Sample Festival Garment",
    category: "GARMENT",
    description: "Deliberately sourceless to demonstrate the missing-source flag.",
    validationStatus: "UNDER_REVIEW",
  });
  const ornament = await element(4, {
    name: "Sample Ceremonial Ornament",
    category: "ORNAMENT",
    description: "Placeholder ornament with a context restriction for demo.",
    validationStatus: "RESTRICTED",
  });
  const color = await element(5, {
    name: "Sample Earth Palette",
    category: "COLOR",
    description: "Placeholder color record for demonstration.",
    validationStatus: "VERIFIED",
  });
  const technique = await element(6, {
    name: "Sample Weave Technique",
    category: "TECHNIQUE",
    description: "Unreviewed placeholder to demonstrate the UNVERIFIED badge.",
    validationStatus: "UNVERIFIED",
  });
  await element(7, {
    name: "Sample Legacy Term",
    category: "SYMBOL",
    description: "Superseded placeholder to demonstrate the DEPRECATED badge.",
    validationStatus: "DEPRECATED",
  });

  async function attach(elementId: string, referenceId: string) {
    await db
      .insert(culturalElementReferences)
      .values({ culturalElementId: elementId, referenceId })
      .onConflictDoNothing();
  }
  await attach(textile.id, ref1.id);
  await attach(textile.id, ref2.id);
  await attach(motif.id, ref1.id);
  await attach(ornament.id, ref2.id);
  await attach(color.id, ref3.id);

  async function link(values: typeof culturalElementRelationships.$inferInsert) {
    await db.insert(culturalElementRelationships).values(values);
  }
  await link({ sourceElementId: textile.id, cultureId: cultureA.id, relationshipType: "ASSOCIATED_WITH" });
  await link({ sourceElementId: textile.id, communityId: commA1.id, relationshipType: "BELONGS_TO" });
  await link({ sourceElementId: motif.id, communityId: commA1.id, relationshipType: "BELONGS_TO" });
  await link({ sourceElementId: motif.id, targetElementId: textile.id, relationshipType: "RELATED_TO" });
  await link({ sourceElementId: garment.id, cultureId: cultureA.id, relationshipType: "ASSOCIATED_WITH" });
  await link({ sourceElementId: ornament.id, communityId: commA2.id, relationshipType: "BELONGS_TO" });
  await link({ sourceElementId: color.id, cultureId: cultureB.id, relationshipType: "ASSOCIATED_WITH" });
  await link({ sourceElementId: color.id, communityId: commB1.id, relationshipType: "BELONGS_TO" });
  await link({ sourceElementId: technique.id, cultureId: cultureB.id, relationshipType: "ASSOCIATED_WITH" });

  await db.insert(culturalRestrictions).values({
    culturalElementId: ornament.id,
    communityId: commA2.id,
    restrictionType: "CEREMONIAL_ONLY",
    description: "Sample restriction: ceremonial context only (demonstration).",
    severity: "HIGH",
    sourceReferenceId: ref2.id,
    validationStatus: "VERIFIED",
  });

  console.log("Seeded SAMPLE cultures, communities, references, 7 elements, links, 1 restriction.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
