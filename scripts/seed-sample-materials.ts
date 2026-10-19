// Demo materials for MVP 5 costing walkthroughs.
// Run: pnpm exec tsx scripts/seed-sample-materials.ts
//
// THESIS INTEGRITY: fictional supplier prices for demonstration only. The
// suppliers do not exist and the prices are invented — replace with real
// supplier data before any actual costing.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { materialPrices, materials } from "../src/lib/db/schema";

async function main() {
  const existing = await db.query.materials.findFirst({
    where: eq(materials.materialCode, "MAT-DEMO-001"),
    columns: { id: true },
  });
  if (existing) {
    console.log("Demo materials already present — skipping.");
    process.exit(0);
  }

  async function material(
    code: string,
    values: Omit<typeof materials.$inferInsert, "materialCode">,
    priceHistory: { price: string; supplier?: string; source?: string; daysAgo: number }[],
  ) {
    const [m] = await db.insert(materials).values({ ...values, materialCode: code }).returning();
    for (const p of priceHistory) {
      const effective = new Date();
      effective.setDate(effective.getDate() - p.daysAgo);
      await db.insert(materialPrices).values({
        materialId: m.id,
        price: p.price,
        currency: "PHP",
        unit: values.unit ?? "unit",
        supplier: p.supplier,
        source: p.source ?? "SUPPLIER_QUOTE",
        verified: true,
        effectiveDate: effective,
      });
    }
    return m;
  }

  await material(
    "MAT-DEMO-001",
    {
      name: "Handwoven Ikat Panel",
      category: "TEXTILE",
      description: "Handwoven warp-ikat fabric panel for ceremonial garments (demo).",
      unit: "meter",
      availabilityStatus: "AVAILABLE",
      supplier: "Amihan Weaving Cooperative",
      culturalAssociation: "Produced by the fictional Amihan Highland Weavers (demo).",
    },
    [
      { price: "820", supplier: "Amihan Weaving Cooperative", daysAgo: 90 },
      { price: "850", supplier: "Amihan Weaving Cooperative", daysAgo: 5 },
    ],
  );

  await material(
    "MAT-DEMO-002",
    {
      name: "Bamboo Cotton Blend",
      category: "FABRIC",
      description: "Soft bamboo-cotton blend for linings and underlayers (demo).",
      unit: "meter",
      availabilityStatus: "AVAILABLE",
      supplier: "Sinag Textile Supply",
    },
    [{ price: "320", supplier: "Sinag Textile Supply", source: "USER_ENTERED", daysAgo: 10 }],
  );

  await material(
    "MAT-DEMO-003",
    {
      name: "Mother-of-Pearl Beads",
      category: "BEADS",
      description: "Polished shell beads for ceremonial ornament work (demo).",
      unit: "piece",
      availabilityStatus: "LIMITED",
      supplier: "Coastal Crafts Guild",
    },
    [{ price: "45", supplier: "Coastal Crafts Guild", daysAgo: 20 }],
  );

  // Deliberately priceless: exercises the INCOMPLETE path.
  await material(
    "MAT-DEMO-004",
    {
      name: "Heirloom Tapestry Cloth",
      category: "TEXTILE",
      description: "No price on purpose — costing must report INCOMPLETE, not invent one.",
      unit: "meter",
      availabilityStatus: "UNKNOWN",
    },
    [],
  );

  console.log("Seeded 4 demo materials (one with price history, one priceless).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
