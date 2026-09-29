// Sample materials for MVP 5 demos. Run: pnpm tsx scripts/seed-sample-materials.ts
// SAMPLE-prefixed placeholders — replace with real supplier data before use.
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { materialPrices, materials } from "../src/lib/db/schema";

async function main() {
  const existing = await db.query.materials.findFirst({
    where: eq(materials.materialCode, "MAT-SAMPLE-001"),
    columns: { id: true },
  });
  if (existing) {
    console.log("Sample materials already present — skipping.");
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
    "MAT-SAMPLE-001",
    {
      name: "Sample Woven Textile",
      category: "TEXTILE",
      description: "Placeholder textile for costing demos.",
      unit: "meter",
      availabilityStatus: "AVAILABLE",
      supplier: "Sample Supplier A",
      culturalAssociation: "Placeholder association note.",
    },
    [
      { price: "820", supplier: "Sample Supplier A", daysAgo: 90 },
      { price: "850", supplier: "Sample Supplier A", daysAgo: 5 },
    ],
  );

  await material(
    "MAT-SAMPLE-002",
    {
      name: "Sample Cotton",
      category: "FABRIC",
      unit: "meter",
      availabilityStatus: "AVAILABLE",
      supplier: "Sample Supplier B",
    },
    [{ price: "320", supplier: "Sample Supplier B", source: "USER_ENTERED", daysAgo: 10 }],
  );

  await material(
    "MAT-SAMPLE-003",
    {
      name: "Sample Shell Beads",
      category: "BEADS",
      unit: "piece",
      availabilityStatus: "LIMITED",
      supplier: "Sample Supplier C",
    },
    [{ price: "45", supplier: "Sample Supplier C", daysAgo: 20 }],
  );

  // Deliberately priceless: exercises the INCOMPLETE path.
  await material(
    "MAT-SAMPLE-004",
    {
      name: "Sample Priceless Heirloom Cloth",
      category: "TEXTILE",
      description: "No price on purpose — costing must report INCOMPLETE, not invent one.",
      unit: "meter",
      availabilityStatus: "UNKNOWN",
    },
    [],
  );

  console.log("Seeded 4 SAMPLE materials (one with price history, one priceless).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
