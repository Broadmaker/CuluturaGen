// md/05 §32 + §39: unknown IDs resolve to no record (caller drops them);
// verified+sourced elements assess OK. Self-cleaning; skips without DB.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  culturalElementReferences,
  culturalElements,
  culturalReferences,
} from "@/lib/db/schema";
import { validateSpecElements } from "@/lib/ai/output-validator";

let sourcedId = "";
let bareId = "";
let refId = "";

async function dbOk(): Promise<boolean> {
  try {
    await db.execute("select 1");
    return true;
  } catch {
    return false;
  }
}

const ready = () => !!sourcedId && !!bareId;

beforeAll(async () => {
  if (!(await dbOk())) return;
  const tag = Math.random().toString(36).slice(2, 8).toUpperCase();
  const [ref] = await db
    .insert(culturalReferences)
    .values({ referenceCode: `TST-${tag}`, title: "Probe reference" })
    .returning({ id: culturalReferences.id });
  refId = ref.id;

  const [s] = await db
    .insert(culturalElements)
    .values({
      elementCode: `TST-${tag}-S`,
      name: "Probe Sourced",
      category: "TEXTILE",
      validationStatus: "VERIFIED",
    })
    .returning({ id: culturalElements.id });
  sourcedId = s.id;
  await db.insert(culturalElementReferences).values({ culturalElementId: s.id, referenceId: ref.id });

  const [b] = await db
    .insert(culturalElements)
    .values({
      elementCode: `TST-${tag}-B`,
      name: "Probe Bare",
      category: "MOTIF",
      validationStatus: "VERIFIED",
    })
    .returning({ id: culturalElements.id });
  bareId = b.id;
});

afterAll(async () => {
  if (!ready()) return;
  await db.delete(culturalElementReferences).where(eq(culturalElementReferences.referenceId, refId));
  await db.delete(culturalElements).where(eq(culturalElements.id, sourcedId));
  await db.delete(culturalElements).where(eq(culturalElements.id, bareId));
  await db.delete(culturalReferences).where(eq(culturalReferences.id, refId));
});

describe("validateSpecElements", () => {
  it("assesses OK / UNSOURCED / UNKNOWN", async () => {
    if (!ready()) return;
    const unknown = "99999999-9999-4999-8999-999999999999";
    const out = await validateSpecElements([sourcedId, bareId, unknown, sourcedId]);
    const byId = new Map(out.map((a) => [a.elementId, a.verdict]));
    expect(byId.get(sourcedId)).toBe("OK");
    expect(byId.get(bareId)).toBe("UNSOURCED");
    expect(byId.get(unknown)).toBe("UNKNOWN");
    expect(out.length).toBe(3); // duplicate collapsed
    const ok = out.find((a) => a.elementId === sourcedId)!;
    expect(ok.record?.sources.length).toBeGreaterThan(0);
  });
});
