// Demo cultural data for MVP 2 walkthroughs and the thesis demo.
// Run: pnpm exec tsx scripts/seed-sample-culture.ts
//
// THESIS INTEGRITY: this is FICTIONAL demonstration data — the "Amihan" and
// "Sinag" cultures below do not exist. Every record is DEMO-coded and each
// description says so. Nothing here is verified cultural knowledge; replace it
// with real, sourced records before any actual design work.
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
  return `${prefix}-DEMO-${String(n).padStart(3, "0")}`;
}

const DEMO_CULTURE_A = "Amihan Highland Weavers";
const DEMO_CULTURE_B = "Sinag Coastal Weavers";

async function main() {
  const existing = await db.query.cultures.findFirst({
    where: eq(cultures.name, DEMO_CULTURE_A),
    columns: { id: true },
  });
  if (existing) {
    console.log("Demo cultural data already present — skipping.");
    process.exit(0);
  }

  const [cultureA] = await db
    .insert(cultures)
    .values({
      name: DEMO_CULTURE_A,
      description:
        "Fictional highland weaving culture used to demonstrate the knowledge pipeline. Demonstration data only — not verified cultural knowledge.",
      historicalContext:
        "Stand-in history for the demo: a valley weaving tradition passed through guild apprenticeships.",
      geographicScope: "Amihan Valley (fictional)",
      validationStatus: "VERIFIED",
    })
    .returning();
  const [cultureB] = await db
    .insert(cultures)
    .values({
      name: DEMO_CULTURE_B,
      description:
        "Fictional coastal weaving culture used to demonstrate the knowledge pipeline. Demonstration data only — not verified cultural knowledge.",
      geographicScope: "Sinag Coast (fictional)",
      validationStatus: "VERIFIED",
    })
    .returning();

  const [commA1] = await db
    .insert(communities)
    .values({
      cultureId: cultureA.id,
      name: "Amihan North Weavers Guild",
      description: "Fictional guild of north-valley weavers (demo).",
      geographicArea: "North Valley (fictional)",
      validationStatus: "VERIFIED",
    })
    .returning();
  const [commA2] = await db
    .insert(communities)
    .values({
      cultureId: cultureA.id,
      name: "Amihan South Weavers Guild",
      description: "Fictional guild of south-valley weavers (demo).",
      geographicArea: "South Valley (fictional)",
      validationStatus: "VERIFIED",
    })
    .returning();
  const [commB1] = await db
    .insert(communities)
    .values({
      cultureId: cultureB.id,
      name: "Sinag Coastal Weavers Guild",
      description: "Fictional guild of coastal weavers (demo).",
      geographicArea: "Sinag Coast (fictional)",
      validationStatus: "VERIFIED",
    })
    .returning();

  const [ref1] = await db
    .insert(culturalReferences)
    .values({
      referenceCode: code("REF", 1),
      title: "Amihan Valley Textile Archive, Vol. I",
      author: "Demo Curator",
      sourceType: "MUSEUM",
      citation: "Fictional archive entry prepared for demonstration only.",
      description: "Stand-in museum catalogue for the demo dataset.",
    })
    .returning();
  const [ref2] = await db
    .insert(culturalReferences)
    .values({
      referenceCode: code("REF", 2),
      title: "Amihan Guild Oral History Notes",
      author: "Demo Field Researcher",
      sourceType: "COMMUNITY_SOURCE",
      citation: "Fictional community field notes prepared for demonstration only.",
    })
    .returning();
  const [ref3] = await db
    .insert(culturalReferences)
    .values({
      referenceCode: code("REF", 3),
      title: "Journal of Island Textiles (demo issue)",
      author: "Demo Editorial Board",
      sourceType: "JOURNAL",
      citation: "Fictional journal entry prepared for demonstration only.",
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
    name: "Ikat Ceremonial Wrap",
    alternativeNames: ["Amihan warp-ikat panel"],
    category: "TEXTILE",
    description:
      "Handwoven warp-ikat panel worn over the shoulders during festivals and ceremonies. Demonstration record.",
    traditionalUsage: "Worn as a shoulder wrap at community festivals and weddings.",
    historicalContext: "Stand-in history for the demo weaving tradition.",
    validationStatus: "VERIFIED",
  });
  const motif = await element(2, {
    name: "Fern-Spine Motif",
    alternativeNames: ["Amihan fern border"],
    category: "MOTIF",
    description:
      "Repeating fern-frond shape woven along bordered panel edges. Demonstration record.",
    symbolism:
      "Fictional symbolism: steadiness and growth. Demonstration data only — attach a sourced meaning before real use.",
    validationStatus: "VERIFIED",
  });
  const garment = await element(3, {
    name: "Festival Barong",
    category: "GARMENT",
    description:
      "Embroidered semi-formal garment for festival wear. Deliberately sourceless to demonstrate the missing-source flag.",
    validationStatus: "UNDER_REVIEW",
  });
  const ornament = await element(4, {
    name: "Ancestral Headdress Ornament",
    category: "ORNAMENT",
    description:
      "Beaded headpiece reserved for ceremonial contexts. Demonstration record with a context restriction.",
    restrictedContext: "Intended for ceremonial use only (fictional demo restriction).",
    validationStatus: "RESTRICTED",
  });
  const color = await element(5, {
    name: "Earth Ochre Palette",
    category: "COLOR",
    description: "Natural pigment palette of ochre, clay, and charcoal tones. Demonstration record.",
    validationStatus: "VERIFIED",
  });
  const technique = await element(6, {
    name: "Backstrap Weave Technique",
    category: "TECHNIQUE",
    description:
      "Body-tensioned loom technique for narrow woven bands. Unreviewed demonstration record.",
    validationStatus: "UNVERIFIED",
  });
  await element(7, {
    name: "Legacy Loom Term",
    category: "SYMBOL",
    description:
      "Superseded wording for a loom part; kept to demonstrate the DEPRECATED badge.",
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
    description: "Ceremonial context only (fictional demo restriction).",
    severity: "HIGH",
    sourceReferenceId: ref2.id,
    validationStatus: "VERIFIED",
  });

  console.log(
    "Seeded demo cultures (Amihan/Sinag), 3 communities, 3 references, 7 elements, links, 1 restriction.",
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
