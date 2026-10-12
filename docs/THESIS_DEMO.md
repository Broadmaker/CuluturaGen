# Thesis Defense Demo Guide (md/10 §125–126)

> One-command setup, ~10-minute walkthrough, guaranteed-good final state.
> Mock-first: $0 spend, works offline. SAMPLE placeholders throughout —
> say so on the record before showing cultural data.

## Setup (day before)

```bash
pnpm install
pnpm run db:migrate
pnpm run db:seed                    # roles + admin@attirelab.local / Admin123!
pnpm exec tsx scripts/seed-sample-culture.ts
pnpm exec tsx scripts/seed-sample-materials.ts
pnpm exec tsx scripts/seed-demo.ts  # full §125 loop, prints the project URL
pnpm run dev                        # login: admin@attirelab.local / Admin123!
```

`seed-demo.ts` is idempotent (re-run → skip). To rebuild from zero, delete
project `DEMO-FESTIVAL-01` and re-run. It builds the **final state**:
project COMPLETED, design FINAL, cost UNDER_BUDGET (₱11,770 of ₱25,000),
evaluation with findings reviewed, FINAL_REPORT dossier PDF.

## The 10-minute walkthrough (§126, 16 screens)

| # | Screen | Show / say | ~Time |
|---|--------|------------|-------|
| 01 | Login | Thesis one-liner: human-AI collaboration, AI never finalizes | 0:30 |
| 02 | Dashboard | Pipeline stages, review queue (empty — everything reviewed) | 0:30 |
| 03 | Create Project | Already done — open `DEMO-FESTIVAL-01` instead; note the code | 0:20 |
| 04 | Cultural Research | Search "textile": VERIFIED badge, sources, RESTRICTED ornament + ceremony-only rule | 1:00 |
| 05 | Design Requirements | MANDATORY textile/motif, PREFERRED silhouette, RESTRICTED ornament | 0:40 |
| 06 | Body Profile | MANUAL measurements, designer-verified flag; ESTIMATED vs MANUAL distinction | 0:40 |
| 07 | Materials | SAMPLE textile ₱850/m price history (append-only, never overwritten) | 0:30 |
| 08 | Design Studio | 3-panel workspace, V1 provenance (mock provider labeled) | 0:40 |
| 09 | Generate | **Live click**: regenerate-with-instruction → V2 (mock, instant) | 1:00 |
| 10 | AI Result | Spec: cultural element IDs validated (unknowns dropped, never laundered) | 0:40 |
| 11 | Evaluation | 6 domains, findings with severity + evidence; no single score | 1:00 |
| 12 | Explainability | WHAT/WHY/EVIDENCE/CONSTRAINT on one finding | 0:40 |
| 13 | Revision | Request-revision → REVISION state (or point at the seeded ACCEPT review) | 0:30 |
| 14 | Version Comparison | V1 vs V2 side-by-side, no "best" verdict — human decides | 0:40 |
| 15 | Approval | CRITICAL+HIGH gate; seeded FINAL with full audit chain | 0:40 |
| 16 | Final Report | Open the FINAL_REPORT PDF: brief, sources, cost snapshot, reviews | 1:00 |

## Anticipated questions (and where the answer lives)

- *"What if the AI invents a cultural fact?"* → 10: output validator drops
  unknown IDs (smoke-mvp4 asserts it); 04: sourceless element flagged.
- *"Who is accountable for approval?"* → 15: human-only ACCEPT rows +
  audit chain (`/projects/[id]` History section).
- *"Does it respect budget?"* → 07+11: deterministic engine, UNDER_BUDGET
  with variance; over-budget blocks FINAL (422 names both counts).
- *"Why not a single beauty score?"* → 11: md/07 §69, counts by severity.
- *"Real AI?"* → env flip only (`AI_PROVIDER=openai` + key, no code);
  mock keeps the defense offline-proof.

## Fallbacks (if the room's wifi/projector conspires)

1. **Live generate fails** → V1 + FINAL already seeded; narrate over them.
2. **DB empty on the day** → re-run the 6 setup commands (2 min); the
   seed prints every artifact ID it creates.
3. **Forgot the URL** → `seed-demo.ts` prints `/projects/<id>` on every run.
4. **"Is this real cultural data?"** → No — every record is SAMPLE-prefixed
   (md/10 §19); verified scholarship replaces it before real use.
