// Removes demo/seed rows (SAMPLE and DEMO coded) plus everything the smoke
// scripts create, in FK-safe order, so the demo seeds can be re-run cleanly.
// Run: pnpm run db:reset:demo
//
// Scoped: only rows created by the demo seeds and the smoke scripts are
// touched (DEMO/SAMPLE codes, "Smoke ..." names, designer*@test.local users).
// Real user data is left alone.
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/client";

const P = "(SELECT id FROM projects WHERE project_code LIKE 'DEMO-%' OR name LIKE 'Smoke %')";
const D = `(SELECT id FROM designs WHERE project_id IN ${P})`;
const V = `(SELECT id FROM design_versions WHERE design_id IN ${D})`;
const EL =
  "(SELECT id FROM cultural_elements WHERE element_code LIKE 'CE-SAMPLE-%' OR element_code LIKE 'CE-DEMO-%' OR name LIKE 'Smoke %')";
const MAT =
  "(SELECT id FROM materials WHERE material_code LIKE 'MAT-SAMPLE-%' OR material_code LIKE 'MAT-DEMO-%' OR name LIKE 'Smoke %')";
const CUL =
  "(SELECT id FROM cultures WHERE name IN ('SAMPLE Culture A','SAMPLE Culture B','Amihan Highland Weavers','Sinag Coastal Weavers'))";
const COM = `(SELECT id FROM communities WHERE culture_id IN ${CUL})`;
const REF =
  "(SELECT id FROM cultural_references WHERE reference_code LIKE 'REF-SAMPLE-%' OR reference_code LIKE 'REF-DEMO-%' OR title LIKE 'Smoke %')";

const STATEMENTS = [
  // 0. Break the design_versions self-reference (V2→V1 parent link) so the
  //    project cascade can drop the versions.
  `UPDATE design_versions SET parent_version_id = NULL WHERE id IN ${V}`,
  // 1. Tables hanging off demo projects' design versions (none cascade).
  `DELETE FROM reports WHERE project_id IN ${P}`,
  `DELETE FROM explanations WHERE design_version_id IN ${V}`,
  `DELETE FROM human_reviews WHERE design_version_id IN ${V}`,
  `DELETE FROM design_feedback WHERE design_version_id IN ${V}`,
  `DELETE FROM evaluation_findings WHERE evaluation_id IN (SELECT id FROM evaluations WHERE design_version_id IN ${V}) OR related_cultural_element IN ${EL}`,
  `DELETE FROM evaluations WHERE design_version_id IN ${V}`,
  `DELETE FROM cost_items WHERE cost_estimate_id IN (SELECT id FROM cost_estimates WHERE design_version_id IN ${V}) OR material_id IN ${MAT}`,
  `DELETE FROM cost_estimates WHERE design_version_id IN ${V}`,
  `DELETE FROM ai_contexts WHERE design_version_id IN ${V}`,
  `DELETE FROM ai_jobs WHERE project_id IN ${P} OR design_id IN ${D} OR design_version_id IN ${V}`,
  `DELETE FROM design_cultural_elements WHERE design_version_id IN ${V} OR cultural_element_id IN ${EL}`,
  `DELETE FROM design_materials WHERE design_version_id IN ${V} OR material_id IN ${MAT}`,
  // 2. Projects (cascades designs → versions/links/jobs/usage/assets).
  `DELETE FROM projects WHERE id IN ${P}`,
  // 3. Elements/materials/refs not tied to a demo project.
  `DELETE FROM project_cultural_elements WHERE cultural_element_id IN ${EL}`,
  `DELETE FROM cultural_restrictions WHERE cultural_element_id IN ${EL} OR culture_id IN ${CUL} OR community_id IN ${COM}`,
  `DELETE FROM cultural_element_references WHERE cultural_element_id IN ${EL} OR reference_id IN ${REF}`,
  `DELETE FROM materials WHERE id IN ${MAT}`,
  `DELETE FROM cultural_elements WHERE id IN ${EL}`,
  `DELETE FROM communities WHERE id IN ${COM}`,
  `DELETE FROM cultures WHERE id IN ${CUL}`,
  `DELETE FROM cultural_references WHERE id IN ${REF}`,
  // 4. Throwaway accounts registered by the smoke scripts (sessions cascade).
  `DELETE FROM users WHERE email LIKE 'designer%@test.local'`,
];

async function main() {
  let total = 0;
  for (const statement of STATEMENTS) {
    try {
      const result = await db.execute(sql.raw(statement));
      total += (result as { rowCount?: number }).rowCount ?? 0;
    } catch (e) {
      console.warn(`  skipped: ${(e as Error).message.slice(0, 140)}`);
    }
  }
  console.log(`Reset demo data — ${total} row(s) removed.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
