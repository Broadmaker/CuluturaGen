# 10_MVP_IMPLEMENTATION_PLAN.md

# Human-AI Collaborative Cultural Attire Design Platform

## Master MVP Development & Implementation Plan

**Project:**
A Human-AI Collaborative Framework for Cultural-Aware, Body-Personalized, and Cost-Optimized Creative Attire Design Using Knowledge Graphs, Generative AI, Computer Vision, Predictive Costing Engines, and Explainable Design Evaluation

**Document:** `10_MVP_IMPLEMENTATION_PLAN.md`

**Status:** Implementation Roadmap

**Primary Goal:**
Convert the system architecture and technical specifications into a working web application prototype.

---

# 1. PURPOSE OF THIS DOCUMENT

This document defines the actual development roadmap for the application.

The previous documents defined:

```text
01 — Project/System Foundation
02 — System Architecture
03 — Database Schema
04 — Cultural Knowledge Model
05 — AI Orchestration
06 — Cost Engine
07 — Evaluation Engine
08 — UI/UX Specification
09 — API Specification
```

This document answers:

> **"Now that we know what the system should contain, what exactly do we build first?"**

The implementation must proceed incrementally.

The goal is NOT to build the entire intelligent system immediately.

Instead:

```text
FOUNDATION
    ↓
WORKING CRUD APPLICATION
    ↓
CULTURAL KNOWLEDGE
    ↓
DESIGN WORKFLOW
    ↓
DETERMINISTIC COSTING
    ↓
AI GENERATION
    ↓
EVALUATION
    ↓
HUMAN REVIEW
    ↓
REPORTING
    ↓
ADVANCED INTELLIGENCE
```

---

# 2. MVP DEFINITION

The MVP must demonstrate the complete core workflow.

A user should be able to:

```text
Create Project
      ↓
Select Culture
      ↓
Research Cultural Elements
      ↓
Define Design Requirements
      ↓
Enter Body Profile
      ↓
Select Materials
      ↓
Generate Design Concept
      ↓
View Generated Design
      ↓
Calculate Cost
      ↓
Evaluate Design
      ↓
Review Findings
      ↓
Modify / Regenerate
      ↓
Approve Design
      ↓
Generate Final Report
```

This is the minimum complete system story.

---

# 3. MVP SUCCESS CRITERION

The MVP is successful when a designer can complete:

```text
Project
   ↓
Cultural Research
   ↓
Design Brief
   ↓
Body Profile
   ↓
AI Design
   ↓
Cost
   ↓
Evaluation
   ↓
Human Review
   ↓
Final Design
   ↓
Report
```

without manually manipulating the database.

---

# 4. IMPORTANT IMPLEMENTATION STRATEGY

Do not build all advanced AI functionality first.

Instead use:

```text
REAL CORE
+
CONTROLLED MOCKS
+
PROGRESSIVE REPLACEMENT
```

Example:

### Phase 1

```text
Real UI
Real database
Real API
Mock AI
```

### Phase 2

```text
Real UI
Real database
Real API
Real cultural knowledge
Real costing
Mock image generation
```

### Phase 3

```text
Real UI
Real database
Real API
Real cultural knowledge
Real costing
Real AI generation
```

### Phase 4

```text
Real evaluation
Real explainability
Human review
Versioning
Reports
```

This allows the application to become usable early.

---

# 5. TECHNOLOGY BASELINE

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
```

Next.js currently supports the App Router as its newer routing architecture and provides TypeScript support as part of the standard development workflow.

---

# 6. BACKEND

Recommended initial architecture:

```text
Next.js Application
        ↓
API Routes / Route Handlers
        ↓
Application Services
```

For the first prototype, the backend can live inside the Next.js project.

Later, if needed:

```text
Next.js
   ↓
FastAPI / Node API
```

The application should therefore avoid tightly coupling business logic to UI components.

---

# 7. DATABASE

Primary database:

```text
PostgreSQL
```

Recommended:

```text
PostgreSQL
+
pgvector
```

Future:

```text
PostgreSQL
+
pgvector
+
Neo4j
```

Do not introduce Neo4j immediately unless the initial graph requirements justify it.

The first implementation can represent relationships using PostgreSQL tables and relationship tables.

---

# 8. OBJECT STORAGE

Use object storage for:

```text
Design images
Body images
Cultural reference images
Uploaded documents
Generated reports
```

Do not store large binary images directly inside ordinary relational records.

---

# 9. DEVELOPMENT ENVIRONMENT

Recommended:

```text
Node.js
pnpm
Git
VS Code
PostgreSQL
Docker
```

Example project startup:

```bash
pnpm install
pnpm dev
```

Next.js's current learning documentation uses `create-next-app`, TypeScript, and a development server workflow around port 3000.

---

# 10. PROJECT CREATION

Create the application:

```bash
pnpm create next-app@latest cultural-attire-platform
```

Recommended options:

```text
TypeScript        YES
ESLint            YES
Tailwind CSS      YES
src/ directory    YES
App Router        YES
Import alias      YES
```

Initial structure:

```text
cultural-attire-platform/
├── src/
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

# 11. INITIAL DEPENDENCIES

Recommended baseline:

```bash
pnpm add zod
pnpm add @tanstack/react-query
pnpm add lucide-react
pnpm add date-fns
```

Database layer can use:

```text
Prisma
```

or:

```text
Drizzle ORM
```

Choose one and remain consistent.

For this project, Prisma or Drizzle are both viable. The important requirement is type-safe database access.

---

# 12. INITIAL DIRECTORY STRUCTURE

Build the project toward:

```text
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── projects/
│   ├── culture/
│   ├── design/
│   ├── materials/
│   ├── reports/
│   ├── settings/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── projects/
│   ├── culture/
│   ├── body/
│   ├── requirements/
│   ├── materials/
│   ├── design/
│   ├── evaluation/
│   └── reports/
│
├── features/
│   ├── projects/
│   ├── culture/
│   ├── body/
│   ├── requirements/
│   ├── materials/
│   ├── design/
│   ├── ai/
│   ├── costing/
│   ├── evaluation/
│   └── reports/
│
├── lib/
│   ├── api/
│   ├── db/
│   ├── auth/
│   ├── validation/
│   ├── storage/
│   ├── ai/
│   ├── costing/
│   └── utils/
│
├── types/
│
└── config/
```

Next.js App Router uses filesystem-based routing, where folders and special `page.tsx`/`layout.tsx` files define route structure.

---

# 13. PHASE 0 — DEVELOPMENT FOUNDATION

## Objective

Make sure the project can start, build, lint, and connect to the database.

---

## Tasks

### 13.1 Create Git repository

```bash
git init
```

Initial commit:

```text
chore: initialize project
```

---

### 13.2 Configure environment variables

Create:

```text
.env.local
```

Example:

```env
DATABASE_URL=
AUTH_SECRET=

AI_PROVIDER=
AI_API_KEY=

STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

Never commit `.env.local`.

---

### 13.3 Create environment validation

```text
src/lib/config/env.ts
```

Validate required variables on server startup.

---

### 13.4 Create database connection

```text
src/lib/db/
├── client.ts
└── index.ts
```

---

### 13.5 Create basic health endpoint

```http
GET /api/v1/health
```

Expected:

```json
{
  "data": {
    "status": "healthy"
  }
}
```

---

# 14. PHASE 0 ACCEPTANCE

Complete when:

- [ ] Application starts
- [ ] Database connects
- [ ] `/api/v1/health` works
- [ ] Environment validation works
- [ ] Git repository works
- [ ] Production build succeeds
- [ ] No secrets are committed

---

# 15. PHASE 1 — DATABASE FOUNDATION

## Objective

Create the initial relational data model.

Start with only the tables required for the MVP.

---

# 16. MVP DATABASE TABLES

Create:

```text
users
roles
projects
cultures
communities
regions

cultural_elements
cultural_sources
cultural_element_sources

body_profiles
body_measurements

design_requirements
requirement_items

materials
material_prices
suppliers

designs
design_versions
design_images

cost_calculations
cost_items

evaluations
evaluation_findings

design_reviews
design_approvals

ai_jobs
audit_logs

reports
files
```

---

# 17. DATABASE RELATIONSHIP

Core:

```text
USER
 │
 ├── PROJECT
 │      │
 │      ├── REQUIREMENTS
 │      ├── BODY PROFILE
 │      ├── CULTURAL ELEMENTS
 │      └── DESIGNS
 │              │
 │              ├── VERSIONS
 │              │      ├── IMAGES
 │              │      ├── COST
 │              │      └── EVALUATION
 │              │
 │              └── REVIEWS
 │
 └── AUDIT LOGS
```

---

# 18. DATABASE MIGRATION ORDER

Do not create everything randomly.

Use:

```text
001_auth
002_culture
003_projects
004_body
005_requirements
006_materials
007_designs
008_costing
009_evaluation
010_ai
011_reviews
012_reports
013_audit
```

---

# 19. SEED DATA

Create seed data for development.

Minimum:

```text
3 cultures
5–10 cultural elements
5 textiles/materials
3 suppliers
3 sample projects
2 body profiles
```

The seed data must clearly indicate that it is development/demo data.

Do not present demo records as verified cultural scholarship.

---

# 20. PHASE 1 ACCEPTANCE

- [ ] Database migrations work.
- [ ] Seed command works.
- [ ] Foreign keys work.
- [ ] Basic CRUD can be tested.
- [ ] Database can be recreated from zero.

Example:

```bash
pnpm db:migrate
pnpm db:seed
```

---

# 21. PHASE 2 — APPLICATION SHELL

## Objective

Build the navigation and visual shell before implementing complex functionality.

---

# 22. MAIN ROUTES

Create:

```text
/
 /login

/dashboard

/projects
/projects/new
/projects/[projectId]

/culture
/culture/[cultureId]

/materials

/design/[designId]

/reports

/settings
```

---

# 23. MAIN APPLICATION LAYOUT

```text
┌─────────────────────────────────────────────┐
│ LOGO          Search       User             │
├───────────────┬─────────────────────────────┤
│ Dashboard     │                             │
│ Projects      │        MAIN CONTENT         │
│ Culture       │                             │
│ Materials     │                             │
│ Reports       │                             │
│               │                             │
│ Settings      │                             │
└───────────────┴─────────────────────────────┘
```

---

# 24. DASHBOARD MVP

Display:

```text
Projects
Active Designs
Pending Reviews
Recent Projects
Recent Designs
Budget Summary
AI Jobs
```

Example cards:

```text
12 Projects
4 Active Designs
3 Pending Reviews
2 AI Jobs
```

---

# 25. PHASE 2 ACCEPTANCE

- [ ] Navigation works.
- [ ] All major routes exist.
- [ ] Responsive layout exists.
- [ ] Dashboard renders.
- [ ] Empty states exist.
- [ ] Loading states exist.
- [ ] Error states exist.

---

# 26. PHASE 3 — PROJECT MANAGEMENT

## Objective

Build the first complete working feature.

---

# 27. CREATE PROJECT SCREEN

Fields:

```text
Project Name
Description
Culture
Community
Occasion
Budget
Currency
Designer
```

---

# 28. PROJECT LIST

Display:

```text
Project
Culture
Designer
Budget
Status
Updated
Actions
```

Actions:

```text
Open
Edit
Archive
```

---

# 29. PROJECT OVERVIEW

Sections:

```text
Project Information
Culture
Requirements
Body Profile
Research
Designs
Cost
Evaluation
Reports
```

---

# 30. PROJECT WORKFLOW

Project states:

```text
DRAFT
 ↓
RESEARCH
 ↓
DESIGNING
 ↓
EVALUATION
 ↓
REVISION
 ↓
FINALIZATION
 ↓
COMPLETED
```

---

# 31. PHASE 3 ACCEPTANCE

A user must be able to:

- [ ] Create project
- [ ] View project
- [ ] Edit project
- [ ] Archive project
- [ ] Open project workspace

At this point the application is already a functioning CRUD application.

---

# 32. PHASE 4 — CULTURAL KNOWLEDGE

## Objective

Implement the knowledge-grounding layer before connecting real AI.

---

# 33. CULTURAL SEARCH PAGE

UI:

```text
┌──────────────────────────────────────┐
│ Search cultural knowledge            │
├──────────────────────────────────────┤
│ [ Search...                         ]│
├──────────────┬───────────────────────┤
│ Filters      │ Results               │
│              │                       │
│ Culture      │ Textile A             │
│ Category     │ Motif B               │
│ Status       │ Garment C             │
│ Occasion     │                       │
└──────────────┴───────────────────────┘
```

---

# 34. CULTURAL DETAIL PAGE

Display:

```text
Name
Culture
Community
Region
Category
Description
Historical Context
Symbolism
Traditional Usage
Modern Usage
Allowed Context
Restricted Context
Related Elements
Sources
Validation Status
```

---

# 35. CULTURAL RESEARCH BASKET

Designer can add:

```text
Textile
Motif
Pattern
Color
Garment
Technique
Symbol
```

to:

```text
Project Research
```

---

# 36. CULTURAL SOURCE DISPLAY

Every important cultural claim should have accessible evidence where available.

Example:

```text
Textile A

Associated with:
Community X

Usage:
Traditional ceremonial attire

Source:
Cultural Reference #024

Status:
VERIFIED
```

---

# 37. CULTURAL EXPERT WORKFLOW

Later:

```text
UNVERIFIED
     ↓
UNDER REVIEW
     ↓
VERIFIED
```

or:

```text
UNDER REVIEW
     ↓
RESTRICTED
```

---

# 38. PHASE 4 ACCEPTANCE

- [ ] Culture search works.
- [ ] Cultural records work.
- [ ] Sources are displayed.
- [ ] Verification status is displayed.
- [ ] Research basket works.
- [ ] Project can store selected cultural elements.

---

# 39. PHASE 5 — DESIGN REQUIREMENTS

## Objective

Create a structured design brief.

---

# 40. REQUIREMENT FORM

Sections:

### Cultural

```text
Culture
Community
Occasion
Traditional/Modern balance
```

### Design

```text
Garment Type
Silhouette
Style
Color
Textile
Motif
Accessories
```

### Body

```text
Body Profile
Fit Preference
Special Considerations
```

### Cost

```text
Budget
Currency
Complexity
```

---

# 41. REQUIREMENT PRIORITY

Every item:

```text
MANDATORY
PREFERRED
OPTIONAL
RESTRICTED
```

Example:

```text
Traditional textile
[MUST]

Gold embroidery
[PREFERRED]

Head accessory
[OPTIONAL]

Restricted symbol
[RESTRICTED]
```

---

# 42. REQUIREMENT SUMMARY

Before generation show:

```text
DESIGN BRIEF

Culture:
Example Culture

Occasion:
Festival

Budget:
₱25,000

Mandatory:
8

Preferred:
4

Optional:
3

Restricted:
2
```

---

# 43. PHASE 5 ACCEPTANCE

- [ ] Requirements can be created.
- [ ] Priorities work.
- [ ] Requirements can be edited.
- [ ] Requirements appear in design context.
- [ ] Mandatory/restricted items are clearly visible.

---

# 44. PHASE 6 — BODY PROFILE

## Objective

Create body personalization without requiring computer vision initially.

---

# 45. MANUAL BODY PROFILE

Start with:

```text
Height
Weight
Shoulder Width
Chest/Bust
Waist
Hip
Arm Length
Neck
Torso
Inseam
Leg Length
```

---

# 46. MEASUREMENT SOURCE

Each value:

```text
MANUAL
ESTIMATED
IMPORTED
CORRECTED
```

---

# 47. BODY PROFILE UI

```text
BODY PROFILE

Height          165 cm
Weight           60 kg
Shoulder         40 cm
Chest            90 cm
Waist            75 cm
Hip              95 cm
Arm              58 cm
Inseam           76 cm

Source:
Manual

[Edit Measurements]
```

---

# 48. COMPUTER VISION

Do NOT make this a blocker for the initial MVP.

Initially:

```text
Manual Body Profile
```

Later:

```text
Upload Image
 ↓
Vision Analysis
 ↓
Estimated Measurements
 ↓
User Correction
 ↓
Accepted Profile
```

---

# 49. PHASE 6 ACCEPTANCE

- [ ] Body profile can be created.
- [ ] Measurements can be edited.
- [ ] Measurement units work.
- [ ] Source is recorded.
- [ ] Body profile can be attached to project/design.

---

# 50. PHASE 7 — MATERIAL DATABASE

## Objective

Create the deterministic costing foundation.

---

# 51. MATERIAL RECORD

```text
Material
Category
Unit
Description
Cultural Association
Availability
Supplier
```

---

# 52. PRICE RECORD

```text
Material
Supplier
Unit Price
Currency
Effective Date
Status
Source
```

---

# 53. PRICE STATUS

```text
VERIFIED
USER_ENTERED
SUPPLIER_QUOTE
ESTIMATED
EXPIRED
MISSING
```

---

# 54. MATERIAL SELECTOR

Design Studio should allow:

```text
Search Material
 ↓
View Price
 ↓
View Supplier
 ↓
View Cultural Association
 ↓
Add to Design
```

---

# 55. PHASE 7 ACCEPTANCE

- [ ] Material records work.
- [ ] Suppliers work.
- [ ] Prices work.
- [ ] Price status is visible.
- [ ] Historical prices can be retained.
- [ ] Materials can be attached to design.

---

# 56. PHASE 8 — DETERMINISTIC COST ENGINE

## Objective

Build costing before relying on AI for material suggestions.

---

# 57. COST FORMULA

```text
Material Cost
+
Labor Cost
+
Decoration Cost
+
Other Cost
=
Direct Cost
```

Then:

```text
Direct Cost × Contingency %
=
Contingency
```

Finally:

```text
Direct Cost + Contingency
=
Estimated Total
```

---

# 58. EXAMPLE

Material:

```text
10 meters × ₱500
= ₱5,000
```

Labor:

```text
10 hours × ₱300
= ₱3,000
```

Decoration:

```text
₱2,000
```

Other:

```text
₱500
```

Direct:

```text
₱10,500
```

10% contingency:

```text
₱1,050
```

Estimated:

```text
₱11,550
```

---

# 59. COST UI

```text
COST ESTIMATE

Materials          ₱5,000
Labor              ₱3,000
Decoration         ₱2,000
Other                ₱500
──────────────────────────
Direct Cost        ₱10,500

Contingency 10%    ₱1,050
──────────────────────────
Estimated Total   ₱11,550

Budget            ₱25,000

Variance            ₱13,450
```

---

# 60. COST STATUS

```text
UNDER_BUDGET
NEAR_BUDGET
AT_BUDGET
OVER_BUDGET
INCOMPLETE
REVIEW_REQUIRED
```

---

# 61. COST SNAPSHOT

Every significant design version should have a reproducible cost snapshot.

Example:

```text
Design V2
Cost Snapshot C002

Fabric:
10m × ₱500

Labor:
10h × ₱300

Decoration:
₱2,000

Contingency:
10%

Total:
₱11,550
```

If the price later becomes ₱600/m, V2's historical calculation remains ₱11,550.

---

# 62. PHASE 8 ACCEPTANCE

- [ ] Cost engine calculates correctly.
- [ ] No AI calculation is used for final cost.
- [ ] Materials are calculated from quantity × price.
- [ ] Labor works.
- [ ] Decoration works.
- [ ] Contingency works.
- [ ] Budget status works.
- [ ] Cost snapshot works.

---

# 63. PHASE 9 — DESIGN STUDIO WITHOUT AI

## Objective

Build the complete design workspace before integrating AI.

This is extremely important.

The interface should already work even if the AI provider is offline.

---

# 64. DESIGN STUDIO LAYOUT

```text
┌──────────────────────────────────────────────────────┐
│ Design Name                         V2     Status    │
├───────────────┬──────────────────────┬───────────────┤
│               │                      │               │
│ DESIGN IMAGE  │   DESIGN DETAILS    │ EVALUATION    │
│               │                      │               │
│               │ Culture              │ Cultural      │
│               │ Requirements         │ Body          │
│               │ Materials            │ Cost          │
│               │ Body Profile         │ Requirements  │
│               │ Cost                 │               │
│               │                      │               │
├───────────────┴──────────────────────┴───────────────┤
│ Generate | Refine | Compare | Save | Review | Approve│
└──────────────────────────────────────────────────────┘
```

---

# 65. DESIGN STUDIO TABS

```text
Overview
Specification
Cultural Elements
Materials
Body
Cost
Evaluation
Explanation
Versions
Review
```

---

# 66. DESIGN ACTIONS

```text
Generate
Regenerate
Refine
Duplicate
Compare
Save
Export
Request Revision
Accept
Reject
Approve
```

---

# 67. PHASE 9 ACCEPTANCE

- [ ] Design can be created.
- [ ] Design workspace works.
- [ ] Design specification displays.
- [ ] Materials display.
- [ ] Cost displays.
- [ ] Evaluation panel exists.
- [ ] Version panel exists.
- [ ] Review controls exist.

---

# 68. PHASE 10 — AI MOCK GENERATOR

## Objective

Connect the complete workflow to a simulated AI service before connecting an expensive real model.

---

# 69. MOCK AI FLOW

User clicks:

```text
Generate Design
```

API:

```text
POST /generation-jobs
```

Mock worker:

```text
QUEUED
 ↓
PROCESSING
 ↓
GENERATING_SPECIFICATION
 ↓
GENERATING_IMAGE
 ↓
EVALUATING
 ↓
COMPLETED
```

---

# 70. MOCK DESIGN RESULT

The mock system returns:

```json
{
  "designName": "Heritage Evening Concept",
  "silhouette": "Structured formal silhouette",
  "culturalElements": ["CE-001", "CE-003"],
  "materials": ["MAT-001"],
  "colors": ["Color A", "Color B"]
}
```

Image can initially be:

```text
placeholder image
```

or an existing development image.

---

# 71. WHY MOCK AI FIRST?

It allows testing:

```text
UI
API
Jobs
Versioning
Cost
Evaluation
Review
Reports
```

without depending on:

```text
AI provider
API quota
generation speed
provider outages
```

---

# 72. PHASE 10 ACCEPTANCE

- [ ] Generate button works.
- [ ] Job appears.
- [ ] Progress appears.
- [ ] Result appears.
- [ ] Design version is created.
- [ ] Mock output reaches evaluation.
- [ ] Human review works.

---

# 73. PHASE 11 — REAL AI ORCHESTRATOR

## Objective

Replace the mock generator with the real AI orchestration layer.

---

# 74. AI PIPELINE

```text
USER REQUEST
     ↓
LOAD PROJECT
     ↓
LOAD REQUIREMENTS
     ↓
LOAD BODY PROFILE
     ↓
LOAD CULTURAL KNOWLEDGE
     ↓
LOAD RESTRICTIONS
     ↓
LOAD MATERIALS
     ↓
BUILD CONTEXT
     ↓
LLM STRUCTURED DESIGN
     ↓
VALIDATE JSON
     ↓
BUILD IMAGE PROMPT
     ↓
IMAGE GENERATION
     ↓
STORE IMAGE
     ↓
CREATE DESIGN VERSION
```

---

# 75. AI CONTEXT OBJECT

The orchestrator should construct:

```typescript
interface DesignAIContext {
  project: ProjectContext;
  culture: CultureContext;
  culturalElements: CulturalElementContext[];
  requirements: RequirementContext[];
  bodyProfile: BodyProfileContext;
  materials: MaterialContext[];
  budget: BudgetContext;
  previousDesign?: DesignContext;
}
```

---

# 76. AI OUTPUT

The LLM should produce structured data first.

Example:

```json
{
  "designName": "...",
  "silhouette": "...",
  "garmentComponents": [],
  "culturalElements": [],
  "textiles": [],
  "colors": [],
  "materials": [],
  "constructionNotes": [],
  "accessories": [],
  "bodyConsiderations": [],
  "culturalReferences": []
}
```

Only after validation should the image-generation prompt be created.

---

# 77. AI VALIDATION

Before accepting AI output:

```text
JSON valid?
      ↓
YES
      ↓
Cultural IDs valid?
      ↓
YES
      ↓
Requirements checked?
      ↓
YES
      ↓
Restricted elements?
      ↓
NO
      ↓
Continue
```

---

# 78. UNKNOWN CULTURAL ELEMENT

If AI produces:

```text
UNKNOWN_TEXTILE_X
```

the system must NOT silently create a cultural fact.

Instead:

```text
UNKNOWN
REVIEW_REQUIRED
```

The designer can then decide whether to:

```text
Replace
Research
Reject
```

---

# 79. AI MODEL METADATA

Record:

```text
Provider
Model
Model Version
Prompt Version
Generation Time
Job ID
Context Version
```

---

# 80. PHASE 11 ACCEPTANCE

- [ ] Real LLM integration works.
- [ ] Structured output works.
- [ ] Output validation works.
- [ ] Cultural references map to real IDs.
- [ ] AI context is stored.
- [ ] Model metadata is stored.
- [ ] AI generation is asynchronous.
- [ ] Failed generation is recoverable.

---

# 81. PHASE 12 — IMAGE GENERATION

## Objective

Connect the structured design specification to the visual generation model.

---

# 82. IMAGE PROMPT BUILDER

Do not let the user prompt directly control everything.

Construct:

```text
SYSTEM DESIGN CONTEXT
+
CULTURAL CONSTRAINTS
+
BODY CONSTRAINTS
+
DESIGN REQUIREMENTS
+
MATERIALS
+
USER REFINEMENT
```

Result:

```text
IMAGE GENERATION PROMPT
```

---

# 83. IMAGE GENERATION BOUNDARY

```text
Structured Design
       ↓
Prompt Builder
       ↓
Image Model
       ↓
Generated Image
```

The image model does not determine:

```text
Cultural truth
Final cost
Final approval
```

---

# 84. IMAGE METADATA

Store:

```text
Image ID
Design Version
Provider
Model
Prompt
Negative Prompt
Resolution
Created At
Storage Key
```

---

# 85. PHASE 12 ACCEPTANCE

- [ ] Image generation works.
- [ ] Images are stored.
- [ ] Image metadata is stored.
- [ ] Image belongs to design version.
- [ ] Multiple images can belong to one version.
- [ ] Failed image generation does not corrupt design version.

---

# 86. PHASE 13 — EVALUATION ENGINE

## Objective

Build the validation system.

---

# 87. EVALUATION PIPELINE

```text
DESIGN
  │
  ├── Cultural Check
  │
  ├── Requirement Check
  │
  ├── Body Check
  │
  ├── Cost Check
  │
  └── Material Check
         │
         ▼
     FINDINGS
         │
         ▼
     EXPLANATIONS
```

---

# 88. CULTURAL CHECKS

Evaluate:

```text
Element exists?
Element verified?
Correct culture?
Correct community?
Appropriate context?
Restricted?
Source available?
```

---

# 89. REQUIREMENT CHECKS

Evaluate:

```text
Mandatory requirements
Preferred requirements
Optional requirements
Restricted requirements
```

---

# 90. BODY CHECKS

Evaluate:

```text
Measurements available?
Body profile attached?
Potential fit concerns?
Silhouette compatibility?
Manual review required?
```

Do not claim exact fit from insufficient measurements.

---

# 91. COST CHECKS

Evaluate:

```text
Budget available?
Materials priced?
Labor calculated?
Decoration calculated?
Total calculated?
Within budget?
```

---

# 92. MATERIAL CHECKS

Evaluate:

```text
Material exists?
Price available?
Supplier available?
Availability known?
Price expired?
Quantity valid?
```

---

# 93. EVALUATION RESULT

Example:

```text
CULTURAL
PASS

BODY
REVIEW REQUIRED

COST
PASS

REQUIREMENTS
PASS

MATERIALS
PASS
```

---

# 94. PHASE 13 ACCEPTANCE

- [ ] Evaluation runs.
- [ ] Findings are created.
- [ ] Findings have severity.
- [ ] Findings have evidence.
- [ ] Findings can be resolved.
- [ ] Evaluation is attached to design version.

---

# 95. PHASE 14 — EXPLAINABILITY

## Objective

Explain why recommendations or findings exist.

---

# 96. EXPLANATION FORMAT

Every significant result should answer:

```text
WHAT?
WHY?
EVIDENCE?
CONSTRAINT?
```

Example:

```text
TEXTILE SELECTION

What:
Textile A

Why:
Associated with the selected cultural community
and appropriate for the selected occasion.

Evidence:
Cultural Record CE-024

Constraint:
Traditional textile = MANDATORY
```

---

# 97. EXPLANATION UI

Use:

```text
ⓘ Why was this selected?
```

Clicking opens:

```text
┌──────────────────────────────────────┐
│ Why was this textile selected?       │
├──────────────────────────────────────┤
│ Reason                               │
│ Associated with selected culture.    │
│                                      │
│ Evidence                             │
│ Cultural Record CE-024               │
│                                      │
│ Constraint                           │
│ Traditional textile — Mandatory      │
└──────────────────────────────────────┘
```

---

# 98. PHASE 14 ACCEPTANCE

- [ ] Recommendations can be explained.
- [ ] Evidence is linked.
- [ ] Requirements are linked.
- [ ] Cultural sources are accessible.
- [ ] Explanations are stored.

---

# 99. PHASE 15 — HUMAN REVIEW

## Objective

Make human review an actual application state.

---

# 100. REVIEW SCREEN

Display:

```text
DESIGN REVIEW

Design Image
Design Specification
Cultural Elements
Cost
Evaluation
Findings
Sources
AI Explanation

[ Accept ]
[ Request Revision ]
[ Reject ]
```

---

# 101. REQUEST REVISION

Designer enters:

```text
Reason
Requested Changes
Priority
```

Example:

```text
Reduce decorative elements.
Preserve selected textile.
Maintain budget.
```

---

# 102. REVISION WORKFLOW

```text
AI DESIGN
   ↓
REVIEW
   ↓
REQUEST REVISION
   ↓
AI REFINEMENT
   ↓
NEW VERSION
   ↓
RE-EVALUATION
   ↓
REVIEW
```

---

# 103. APPROVAL

Approval requires:

```text
Evaluation completed
+
No blocking unresolved findings
+
Designer approval
```

Then:

```text
APPROVED
```

---

# 104. PHASE 15 ACCEPTANCE

- [ ] Designer can accept.
- [ ] Designer can reject.
- [ ] Designer can request revision.
- [ ] Revision creates new version.
- [ ] Review history is retained.
- [ ] Approval is explicit.
- [ ] Approved version becomes immutable.

---

# 105. PHASE 16 — VERSION CONTROL

## Objective

Make every meaningful design change traceable.

---

# 106. VERSION MODEL

```text
DESIGN
 │
 ├── V1
 │    ├── Image 1
 │    ├── Image 2
 │    └── Evaluation
 │
 ├── V2
 │    ├── Image 1
 │    └── Evaluation
 │
 └── V3
      ├── Image 1
      └── Evaluation
```

---

# 107. VERSION METADATA

Store:

```text
Version Number
Parent Version
Prompt
AI Context
Requirements
Body Profile
Cultural Elements
Materials
Generated Images
Evaluation
Cost
Designer Feedback
Created By
Created At
```

---

# 108. VERSION COMPARISON

Display:

```text
V1
vs
V2
```

Compare:

```text
Silhouette
Materials
Colors
Cultural Elements
Cost
Requirements
Evaluation
Designer Notes
```

---

# 109. PHASE 16 ACCEPTANCE

- [ ] Versions are immutable.
- [ ] New changes create versions.
- [ ] Version history works.
- [ ] Images belong to versions.
- [ ] Cost snapshots belong to versions.
- [ ] Evaluation belongs to versions.
- [ ] Versions can be compared.

---

# 110. PHASE 17 — REPORT GENERATION

## Objective

Create the final professional project report.

---

# 111. REPORT STRUCTURE

```text
Cover
Project Information
Designer
Client
Design Requirements
Cultural Research
Cultural Sources
Body Profile
Design Concept
Generated Image
Design Specification
Materials
Cost Estimate
Evaluation
Explainability
Designer Review
Revision History
Final Approval
```

---

# 112. REPORT GENERATION FLOW

```text
Project
 ↓
Collect Data
 ↓
Render Template
 ↓
Generate PDF
 ↓
Store File
 ↓
Create Report Record
```

---

# 113. PHASE 17 ACCEPTANCE

- [ ] PDF generation works.
- [ ] Design image appears.
- [ ] Cultural sources appear.
- [ ] Cost appears.
- [ ] Evaluation appears.
- [ ] Revision history appears.
- [ ] Approval information appears.

---

# 114. PHASE 18 — AUDIT & TRACEABILITY

## Objective

Make the system auditable.

---

# 115. AUDIT EVENTS

Track:

```text
LOGIN
PROJECT_CREATED
PROJECT_UPDATED

CULTURAL_RECORD_VIEWED
CULTURAL_RECORD_CREATED
CULTURAL_RECORD_VERIFIED

DESIGN_CREATED
DESIGN_GENERATED
DESIGN_MODIFIED

AI_CONTEXT_CREATED
AI_JOB_STARTED
AI_JOB_COMPLETED

COST_CALCULATED
EVALUATION_RUN

DESIGN_ACCEPTED
DESIGN_REJECTED
REVISION_REQUESTED

DESIGN_APPROVED
REPORT_GENERATED
```

---

# 116. TRACEABILITY CHAIN

For every final design:

```text
Final Design
     ↓
Design Version
     ↓
AI Job
     ↓
AI Context
     ↓
Requirements
     ↓
Cultural Elements
     ↓
Sources
     ↓
Body Profile
     ↓
Materials
     ↓
Cost Snapshot
     ↓
Evaluation
     ↓
Human Review
     ↓
Approval
```

---

# 117. PHASE 18 ACCEPTANCE

- [ ] Important actions create audit records.
- [ ] AI generation is traceable.
- [ ] Cultural sources are traceable.
- [ ] Cost is reproducible.
- [ ] Human approval is recorded.

---

# 118. PHASE 19 — SECURITY

## Objective

Secure the prototype before deployment.

---

# 119. SECURITY CHECKLIST

### Authentication

- [ ] Passwords securely hashed.
- [ ] Sessions/tokens protected.
- [ ] Logout works.
- [ ] Expiration works.

### Authorization

- [ ] Role checks.
- [ ] Project access checks.
- [ ] Admin-only functions protected.

### Files

- [ ] File size limits.
- [ ] File type validation.
- [ ] Secure storage.
- [ ] Signed/private URLs.

### AI

- [ ] API keys server-side.
- [ ] Rate limits.
- [ ] Usage tracking.
- [ ] Prompt/context logging without exposing secrets.

### Database

- [ ] Parameterized queries/ORM.
- [ ] Least privilege.
- [ ] Backups.

---

# 120. PHASE 20 — TESTING

## Objective

Test the actual complete workflow.

---

# 121. UNIT TESTS

Test:

```text
Cost formulas
Budget status
Requirement validation
Cultural validation
Permission rules
Version creation
Status transitions
```

---

# 122. INTEGRATION TESTS

Test:

```text
API
 ↓
Service
 ↓
Database
```

Examples:

```text
Create project
Add culture
Add requirements
Create design
Calculate cost
Run evaluation
```

---

# 123. AI TESTS

AI tests should verify:

```text
Structured output
Required fields
Valid cultural IDs
Unknown element handling
Restricted element handling
Requirement preservation
Malformed JSON recovery
Provider failure
Retry behavior
```

---

# 124. END-TO-END TEST

The most important test:

```text
LOGIN
 ↓
CREATE PROJECT
 ↓
SELECT CULTURE
 ↓
SELECT CULTURAL ELEMENTS
 ↓
CREATE BODY PROFILE
 ↓
CREATE REQUIREMENTS
 ↓
SELECT MATERIAL
 ↓
CREATE DESIGN
 ↓
GENERATE
 ↓
VIEW RESULT
 ↓
CALCULATE COST
 ↓
EVALUATE
 ↓
REQUEST REVISION
 ↓
GENERATE V2
 ↓
RE-EVALUATE
 ↓
APPROVE
 ↓
GENERATE REPORT
```

---

# 125. MVP DEMO SCENARIO

The application should have one polished demonstration scenario.

Example:

```text
Project:
Cultural Festival Attire

Culture:
Selected Culture

Occasion:
Festival

Budget:
₱25,000

Body Profile:
Manual measurements

Mandatory:
Traditional textile

Preferred:
Modern silhouette

AI:
Generate 2 concepts

Cost:
Calculate

Evaluation:
Cultural + Body + Cost + Requirements

Designer:
Selects one concept

Revision:
Reduces decoration

Final:
Approve

Report:
Generate PDF
```

---

# 126. MVP DEMO SCREEN SEQUENCE

For presentation/demo:

```text
01 Login
02 Dashboard
03 Create Project
04 Cultural Research
05 Design Requirements
06 Body Profile
07 Materials
08 Design Studio
09 Generate
10 AI Result
11 Evaluation
12 Explainability
13 Revision
14 Version Comparison
15 Approval
16 Final Report
```

This sequence tells the entire system story.

---

# 127. WHAT MUST BE REAL IN THE MVP

The following should be real:

```text
Database
Authentication
Project CRUD
Cultural Knowledge
Requirements
Body Profile
Material Database
Cost Engine
Design Versioning
Evaluation
Human Review
Approval
Reports
Audit Trail
```

---

# 128. WHAT MAY BE MOCKED INITIALLY

The following may initially be mocked:

```text
Image Generation
Computer Vision
Knowledge Graph Engine
Real-time WebSocket
Advanced RAG
AI Provider Fallback
Advanced Analytics
```

The interfaces should still be real.

Example:

```text
ImageGenerationService
```

exists even if:

```text
MockImageGenerationProvider
```

is used initially.

Later:

```text
RealImageGenerationProvider
```

can replace it.

---

# 129. PROVIDER ABSTRACTION

Use interfaces.

Example:

```typescript
interface ImageGenerationProvider {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
```

Mock:

```typescript
class MockImageProvider implements ImageGenerationProvider {
  async generate(request) {
    return {
      imageUrl: "/demo/design-01.png",
    };
  }
}
```

Real provider:

```typescript
class ExternalImageProvider implements ImageGenerationProvider {
  async generate(request) {
    // external provider implementation
  }
}
```

This makes the system easier to replace and test.

---

# 130. AI SERVICE ABSTRACTION

Use:

```typescript
interface LLMProvider {
  generateStructured<T>(request: StructuredGenerationRequest): Promise<T>;
}
```

Image:

```typescript
interface ImageGenerationProvider {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
```

Vision:

```typescript
interface VisionProvider {
  analyze(request: VisionRequest): Promise<VisionResult>;
}
```

---

# 131. COST SERVICE ABSTRACTION

```typescript
interface CostService {
  calculate(request: CostCalculationRequest): Promise<CostCalculationResult>;
}
```

The implementation must remain deterministic.

---

# 132. EVALUATION SERVICE

```typescript
interface EvaluationService {
  evaluate(request: EvaluationRequest): Promise<EvaluationResult>;
}
```

---

# 133. DEVELOPMENT MILESTONES

## Milestone 1

```text
Application starts
Database works
Navigation works
```

---

## Milestone 2

```text
Projects work
Culture works
Requirements work
Body profiles work
```

---

## Milestone 3

```text
Materials work
Cost engine works
Design workspace works
```

---

## Milestone 4

```text
Mock AI works
Design versions work
Evaluation works
```

---

## Milestone 5

```text
Real AI works
Image generation works
Explainability works
```

---

## Milestone 6

```text
Human review works
Approval works
Reports work
Audit works
```

---

## Milestone 7

```text
Testing
Security
Deployment
```

---

# 134. RECOMMENDED DEVELOPMENT ORDER

The actual coding sequence should be:

```text
1. Project initialization
2. Database connection
3. Authentication
4. Application shell
5. Project CRUD
6. Cultural database
7. Cultural search
8. Requirements
9. Body profile
10. Materials
11. Cost engine
12. Design CRUD
13. Design Studio
14. Versioning
15. Mock AI
16. Evaluation
17. Human review
18. Reports
19. Real AI
20. Image generation
21. Explainability
22. Audit
23. Security hardening
24. Testing
25. Deployment
```

---

# 135. FILE CREATION ORDER

Create files roughly in this sequence.

## Foundation

```text
src/lib/config/env.ts
src/lib/db/client.ts
src/lib/utils/
```

---

## Types

```text
src/types/project.ts
src/types/culture.ts
src/types/body.ts
src/types/requirements.ts
src/types/material.ts
src/types/design.ts
src/types/cost.ts
src/types/evaluation.ts
src/types/ai.ts
```

---

## Services

```text
src/lib/services/project-service.ts
src/lib/services/culture-service.ts
src/lib/services/body-service.ts
src/lib/services/requirement-service.ts
src/lib/services/material-service.ts
src/lib/services/design-service.ts
src/lib/services/cost-service.ts
src/lib/services/evaluation-service.ts
src/lib/services/ai-service.ts
src/lib/services/report-service.ts
```

---

## API

```text
src/app/api/v1/projects/
src/app/api/v1/cultures/
src/app/api/v1/cultural-elements/
src/app/api/v1/body-profiles/
src/app/api/v1/requirements/
src/app/api/v1/materials/
src/app/api/v1/designs/
src/app/api/v1/ai/
src/app/api/v1/cost/
src/app/api/v1/evaluations/
src/app/api/v1/reviews/
src/app/api/v1/reports/
```

---

# 136. FRONTEND IMPLEMENTATION ORDER

Build:

```text
Dashboard
 ↓
Project List
 ↓
Project Creation
 ↓
Project Workspace
 ↓
Culture Search
 ↓
Culture Detail
 ↓
Requirements
 ↓
Body Profile
 ↓
Materials
 ↓
Design Studio
 ↓
Evaluation
 ↓
Review
 ↓
Reports
```

---

# 137. DO NOT BUILD THESE FIRST

Avoid starting with:

```text
❌ Complex Knowledge Graph UI
❌ Computer Vision
❌ Advanced RAG
❌ Multi-agent AI
❌ WebSockets
❌ Advanced analytics
❌ Complex 3D body modeling
❌ Full automatic garment fitting
❌ Multi-provider AI orchestration
```

These can consume significant development time without proving the core application workflow.

---

# 138. CORE MVP ARCHITECTURE

At the MVP stage:

```text
                 USER
                  │
                  ▼
            NEXT.JS APP
                  │
          ┌───────┴────────┐
          ▼                ▼
       FRONTEND          API
                           │
          ┌────────────────┼───────────────┐
          ▼                ▼               ▼
       CULTURE          DESIGN          COST
        SERVICE         SERVICE         ENGINE
          │                │               │
          └────────────────┼───────────────┘
                           ▼
                       POSTGRESQL
                           │
                           ▼
                     OBJECT STORAGE

                           │
                           ▼
                    AI ORCHESTRATOR
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                   LLM         IMAGE AI
```

---

# 139. MVP WITHOUT REAL AI

Even before real AI integration, the application should work:

```text
Project
 ↓
Culture
 ↓
Requirements
 ↓
Body
 ↓
Materials
 ↓
Design
 ↓
Cost
 ↓
Evaluation
 ↓
Review
 ↓
Report
```

This is important because it proves the application architecture independently of an external AI provider.

---

# 140. MVP WITH REAL AI

After the non-AI workflow works:

```text
Project
 ↓
Culture
 ↓
Requirements
 ↓
Body
 ↓
Materials
 ↓
AI Context
 ↓
LLM
 ↓
Design Specification
 ↓
Image AI
 ↓
Design
 ↓
Cost
 ↓
Evaluation
 ↓
Human Review
 ↓
Report
```

---

# 141. ADVANCED VERSION

After MVP:

```text
                    KNOWLEDGE GRAPH
                           │
                           ▼
                      RAG RETRIEVAL
                           │
                           ▼
USER → DESIGN BRIEF → AI ORCHESTRATOR
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           LLM           VISION       IMAGE AI
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                     DESIGN VERSION
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          CULTURE         BODY          COST
          CHECK           CHECK         CHECK
             └─────────────┼─────────────┘
                           ▼
                       EXPLANATION
                           │
                           ▼
                     HUMAN REVIEW
```

---

# 142. DEVELOPMENT PRIORITY MATRIX

| Module            |      MVP |                Advanced |
| ----------------- | -------: | ----------------------: |
| Authentication    |      YES |                       — |
| Projects          |      YES |                       — |
| Cultural Database |      YES |                   Graph |
| Cultural Search   |      YES |          Vector + Graph |
| Body Profile      |      YES |         Computer Vision |
| Requirements      |      YES |                       — |
| Materials         |      YES |    Supplier Integration |
| Cost Engine       |      YES |      Predictive Pricing |
| Design Studio     |      YES |         Advanced Editor |
| AI Specification  |      YES |  Advanced Orchestration |
| Image Generation  |    YES\* |             Multi-model |
| Evaluation        |      YES |  Advanced AI evaluation |
| Explainability    |      YES | Advanced evidence graph |
| Versioning        |      YES |               Branching |
| Human Review      |      YES |    Collaborative review |
| Reports           |      YES |      Advanced analytics |
| Audit             |      YES |     Advanced monitoring |
| Knowledge Graph   |    Basic |                Advanced |
| MCP               | Optional |                     YES |
| WebSockets        |       No |                     YES |
| Computer Vision   |       No |                     YES |

`*` Image generation may initially use a controlled provider or mock.

---

# 143. MVP SPRINT STRUCTURE

A practical sprint sequence:

## Sprint 1

```text
Project setup
Database
Authentication
Application shell
```

---

## Sprint 2

```text
Project CRUD
Culture CRUD
Cultural search
```

---

## Sprint 3

```text
Requirements
Body profile
Materials
```

---

## Sprint 4

```text
Cost engine
Design CRUD
Design Studio
```

---

## Sprint 5

```text
Design versions
Mock AI
AI jobs
```

---

## Sprint 6

```text
Evaluation
Findings
Human review
```

---

## Sprint 7

```text
Real AI
Image generation
Explainability
```

---

## Sprint 8

```text
Reports
Audit
Security
Testing
```

---

# 144. DAILY DEVELOPMENT LOOP

For each feature:

```text
1. Database
      ↓
2. Type
      ↓
3. Service
      ↓
4. API
      ↓
5. UI
      ↓
6. Validation
      ↓
7. Test
```

Do not build large amounts of UI that has no backend contract.

---

# 145. FEATURE IMPLEMENTATION TEMPLATE

Every feature should answer:

```text
What data does it need?
What database tables?
What service?
What API?
What UI?
What validation?
What permissions?
What audit event?
What tests?
```

Example:

```text
FEATURE:
Cultural Element

DATABASE:
cultural_elements

SERVICE:
CultureService

API:
GET /cultural-elements/{id}

UI:
CulturalDetailPanel

VALIDATION:
Source + status

PERMISSION:
Authenticated users

AUDIT:
CULTURAL_RECORD_VIEWED

TEST:
Get verified element
```

---

# 146. DEFINITION OF DONE

A feature is not complete merely because the UI works.

It is complete when:

```text
Database
   +
Service
   +
API
   +
UI
   +
Validation
   +
Authorization
   +
Error Handling
   +
Audit
   +
Tests
```

are implemented as required.

---

# 147. DEVELOPMENT ENVIRONMENTS

Use three environments.

```text
LOCAL
 ↓
STAGING
 ↓
PRODUCTION
```

---

# 148. LOCAL

Used for:

```text
Development
Mock AI
Seed data
Testing
```

---

# 149. STAGING

Used for:

```text
Integration testing
Real AI testing
Database migration testing
Demo testing
```

---

# 150. PRODUCTION

Used for:

```text
Actual users
Real data
Final deployment
```

---

# 151. GIT BRANCHING

Recommended:

```text
main
develop
feature/*
fix/*
```

Example:

```text
feature/project-management
feature/cultural-knowledge
feature/cost-engine
feature/ai-generation
feature/evaluation
```

---

# 152. COMMIT CONVENTION

Use:

```text
feat:
fix:
refactor:
docs:
test:
chore:
```

Examples:

```text
feat: add project creation API

feat: implement deterministic cost engine

feat: add cultural element search

fix: prevent duplicate AI generation jobs

test: add cost calculation tests
```

---

# 153. DEPLOYMENT PREPARATION

Before deployment:

```text
Environment variables
Database migration
Database backup
Object storage
Authentication
AI provider
Logging
Error monitoring
HTTPS
CORS
Rate limits
```

---

# 154. PRODUCTION CHECKLIST

```text
[ ] Build succeeds
[ ] Database migration succeeds
[ ] Authentication works
[ ] API health works
[ ] File storage works
[ ] AI provider works
[ ] Cost engine tested
[ ] Evaluation tested
[ ] Reports tested
[ ] Error monitoring enabled
[ ] Audit logs enabled
[ ] Secrets secured
[ ] Backup configured
```

---

# 155. PERFORMANCE TARGETS

Initial targets:

```text
Normal API request:
< 500 ms where practical

Database query:
< 200 ms where practical

Dashboard:
< 3 seconds initial load target

AI generation:
Asynchronous

PDF generation:
Asynchronous
```

AI generation should never be treated like an ordinary synchronous API request.

---

# 156. FAILURE RECOVERY

Every external operation should fail gracefully.

Example:

```text
AI generation fails
        ↓
Job = FAILED
        ↓
User sees:
"Generation failed"
        ↓
[Retry]
```

The application should not lose the project.

---

# 157. OFFLINE/PROVIDER OUTAGE BEHAVIOR

If AI provider unavailable:

```text
Project
   ↓
Requirements
   ↓
Culture
   ↓
Materials
   ↓
Cost
   ↓
Evaluation
```

should still function.

Only AI-dependent features become unavailable.

This demonstrates proper separation of concerns.

---

# 158. AI COST CONTROL

Track:

```text
User
Project
Job
Provider
Model
Tokens
Images
Estimated Provider Cost
```

This prevents uncontrolled AI usage.

---

# 159. AI QUOTA

For MVP:

```text
Generation quota
Refinement quota
Image quota
```

can be configured.

Example:

```text
Designer:
10 generations/day
20 refinements/day
```

The exact values should remain configurable.

---

# 160. DATA RETENTION

Define retention rules for:

```text
Body images
Generated images
AI prompts
AI context
Audit logs
Reports
```

Do not delete historical design records required for traceability.

---

# 161. CULTURAL DATA GOVERNANCE

The cultural knowledge base requires a separate governance process.

Records should have:

```text
Created By
Reviewed By
Verified By
Verification Date
Source
Status
Revision History
```

The application should distinguish:

```text
FACT
RULE
RECOMMENDATION
```

---

# 162. FACT

Example:

```text
A cultural record states that Textile A is documented
as being associated with Community X.
```

Source required.

---

# 163. RULE

Example:

```text
A record marked RESTRICTED must not be automatically
recommended for unrestricted design use.
```

System rule.

---

# 164. RECOMMENDATION

Example:

```text
The AI suggests Textile A because it matches
the selected requirements.
```

AI recommendation.

These three must never be represented as the same type of information.

---

# 165. DESIGN DATA FLOW

```text
PROJECT
   ↓
DESIGN BRIEF
   ↓
CULTURAL CONTEXT
   ↓
BODY CONTEXT
   ↓
MATERIAL CONTEXT
   ↓
AI CONTEXT
   ↓
DESIGN SPECIFICATION
   ↓
IMAGE
   ↓
COST
   ↓
EVALUATION
   ↓
EXPLANATION
   ↓
HUMAN REVIEW
   ↓
APPROVAL
```

---

# 166. FINAL MVP ARCHITECTURE

```text
┌──────────────────────────────────────────────┐
│                 NEXT.JS APP                  │
│                                              │
│ Dashboard                                    │
│ Projects                                     │
│ Culture                                      │
│ Materials                                    │
│ Design Studio                                │
│ Evaluation                                   │
│ Reports                                      │
└─────────────────────┬────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   REST API    │
              │    /v1        │
              └───────┬───────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
      PROJECT      CULTURE       DESIGN
      SERVICE      SERVICE       SERVICE
          │           │            │
          └───────────┼────────────┘
                      ▼
                 POSTGRESQL
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
   MATERIALS        COST         EVALUATION
       │              │              │
       └──────────────┼──────────────┘
                      ▼
                 AI ORCHESTRATOR
                      │
                 ┌────┴────┐
                 ▼         ▼
                LLM      IMAGE AI
                 │         │
                 └────┬────┘
                      ▼
                DESIGN VERSION
                      │
                      ▼
                 HUMAN REVIEW
                      │
                      ▼
                   APPROVAL
                      │
                      ▼
                    PDF
```

---

# 167. COMPLETE MVP FEATURE CHECKLIST

## Foundation

- [ ] Next.js project
- [ ] TypeScript
- [ ] Tailwind
- [ ] Database
- [ ] Environment configuration
- [ ] Git

## Authentication

- [ ] Login
- [ ] Session
- [ ] Roles
- [ ] Permissions

## Projects

- [ ] Create
- [ ] Edit
- [ ] View
- [ ] Archive
- [ ] Status

## Cultural Knowledge

- [ ] Culture
- [ ] Community
- [ ] Cultural Elements
- [ ] Sources
- [ ] Verification
- [ ] Search
- [ ] Research Basket

## Body

- [ ] Manual profile
- [ ] Measurements
- [ ] Measurement source
- [ ] Project association

## Requirements

- [ ] Design brief
- [ ] Mandatory
- [ ] Preferred
- [ ] Optional
- [ ] Restricted

## Materials

- [ ] Material records
- [ ] Suppliers
- [ ] Prices
- [ ] Availability

## Cost

- [ ] Material cost
- [ ] Labor
- [ ] Decoration
- [ ] Other
- [ ] Contingency
- [ ] Budget comparison
- [ ] Snapshot

## Design

- [ ] Design creation
- [ ] Design Studio
- [ ] Specification
- [ ] Images
- [ ] Versions
- [ ] Comparison

## AI

- [ ] AI context
- [ ] Structured generation
- [ ] Image generation
- [ ] Async jobs
- [ ] Retry
- [ ] Traceability

## Evaluation

- [ ] Cultural
- [ ] Body
- [ ] Cost
- [ ] Requirements
- [ ] Findings
- [ ] Resolution

## Human Review

- [ ] Accept
- [ ] Reject
- [ ] Request revision
- [ ] Approval
- [ ] Review history

## Explainability

- [ ] What
- [ ] Why
- [ ] Evidence
- [ ] Constraint

## Reports

- [ ] PDF
- [ ] Design image
- [ ] Cost
- [ ] Evaluation
- [ ] Sources
- [ ] Revision history
- [ ] Approval

## Security

- [ ] Authentication
- [ ] Authorization
- [ ] File validation
- [ ] API key protection
- [ ] Rate limiting
- [ ] Audit logging

---

# 168. WHAT THE USER SHOULD SEE IN THE FINAL MVP

The application should feel like one coherent workflow rather than a collection of disconnected modules.

The primary navigation should be:

```text
Dashboard
Projects
Culture
Materials
Reports
Settings
```

Inside a project:

```text
Overview
Research
Requirements
Body
Materials
Design Studio
Evaluation
Review
Reports
```

---

# 169. THE MAIN DESIGN STUDIO EXPERIENCE

The Design Studio is the heart of the application.

It should communicate:

```text
┌─────────────────────────────────────────────┐
│ DESIGN STUDIO                               │
├─────────────────────────────────────────────┤
│                                             │
│             GENERATED DESIGN                │
│                                             │
│                                             │
├───────────────────┬─────────────────────────┤
│ DESIGN CONTEXT    │ EVALUATION              │
│                   │                         │
│ Culture           │ Cultural     ✓          │
│ Requirements      │ Body         ⚠          │
│ Body Profile      │ Cost         ✓          │
│ Materials         │ Requirements ✓          │
│                   │                         │
├───────────────────┴─────────────────────────┤
│ Cost: ₱24,200     Budget: ₱25,000           │
│                                             │
│ [Refine] [Regenerate] [Compare] [Review]    │
└─────────────────────────────────────────────┘
```

This screen should demonstrate the project's central contribution:

```text
AI + Cultural Knowledge + Body Context + Cost + Evaluation + Human Review
```

---

# 170. THE COMPLETE HUMAN-AI LOOP

The final MVP should demonstrate this loop:

```text
                HUMAN
                  │
                  ▼
          DESIGN REQUIREMENTS
                  │
                  ▼
        CULTURAL KNOWLEDGE
                  │
                  ▼
              AI CONTEXT
                  │
                  ▼
          AI DESIGN CONCEPT
                  │
                  ▼
        DETERMINISTIC CHECKS
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
    CULTURE      BODY       COST
       │          │          │
       └──────────┼──────────┘
                  ▼
             EXPLANATION
                  │
                  ▼
             HUMAN REVIEW
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     REVISE               APPROVE
        │                   │
        ▼                   ▼
       AI                FINAL
        │                   │
        └───────┐   ┌───────┘
                ▼   ▼
              VERSION
                │
                ▼
              REPORT
```

---

# 171. CRITICAL SYSTEM BOUNDARIES

The MVP must preserve these boundaries.

### AI

```text
GENERATES
SUGGESTS
REFINES
EXPLAINS
```

### Cultural Knowledge Service

```text
PROVIDES CULTURAL EVIDENCE
```

### Cost Engine

```text
CALCULATES COST
```

### Evaluation Engine

```text
VALIDATES
```

### Human Designer

```text
REVIEWS
MODIFIES
APPROVES
```

---

# 172. WHAT MAKES THIS SYSTEM DIFFERENT FROM A SIMPLE AI IMAGE GENERATOR

The MVP must not become:

```text
Prompt
 ↓
Image
```

Instead:

```text
Cultural Knowledge
       +
Body Profile
       +
Design Requirements
       +
Budget
       +
Materials
       ↓
Structured Design Context
       ↓
AI Generation
       ↓
Cost Calculation
       ↓
Evaluation
       ↓
Explanation
       ↓
Human Review
       ↓
Versioned Final Design
```

That distinction is central to the application architecture.

---

# 173. FINAL IMPLEMENTATION TARGET

At the end of MVP development, one complete project should contain:

```text
PROJECT
│
├── CULTURAL RESEARCH
│   ├── Culture
│   ├── Community
│   ├── Cultural Elements
│   └── Sources
│
├── REQUIREMENTS
│   ├── Mandatory
│   ├── Preferred
│   ├── Optional
│   └── Restricted
│
├── BODY PROFILE
│   └── Measurements
│
├── MATERIALS
│   ├── Materials
│   ├── Suppliers
│   └── Prices
│
├── DESIGNS
│   ├── V1
│   │   ├── Specification
│   │   ├── Images
│   │   ├── Cost
│   │   └── Evaluation
│   │
│   └── V2
│       ├── Specification
│       ├── Images
│       ├── Cost
│       └── Evaluation
│
├── HUMAN REVIEW
│
├── APPROVAL
│
└── FINAL REPORT
```

---

# 174. FINAL MVP ACCEPTANCE TEST

The application is ready for the next stage when a tester can perform the following without developer intervention:

```text
1. Login
2. Create project
3. Select cultural context
4. Research cultural elements
5. Add cultural elements to project
6. Create design requirements
7. Enter body measurements
8. Select materials
9. Create design
10. Generate design concept
11. View generated image
12. Inspect cultural evidence
13. Calculate cost
14. Run evaluation
15. Review findings
16. Request revision
17. Generate new version
18. Compare versions
19. Approve final version
20. Generate PDF report
```

If all 20 steps work, the MVP demonstrates the complete intended system.

---

# 175. DEVELOPMENT PHILOSOPHY

Build the system in this order:

```text
MAKE IT WORK
      ↓
MAKE IT TRACEABLE
      ↓
MAKE IT VALIDATED
      ↓
MAKE IT INTELLIGENT
      ↓
MAKE IT EXPLAINABLE
      ↓
MAKE IT POLISHED
```

Do not reverse this order.

A beautiful AI interface with unreliable data and no traceability is not the target.

The target is a functioning collaborative design system where:

```text
Knowledge
   ↓
Constraints
   ↓
Generation
   ↓
Calculation
   ↓
Evaluation
   ↓
Explanation
   ↓
Human Decision
```

forms one continuous, auditable workflow.

---

# 176. NEXT DEVELOPMENT DOCUMENT

After this implementation plan, the next technical work should move from documentation into the actual project foundation.

Recommended sequence:

```text
10_MVP_IMPLEMENTATION_PLAN.md
             ↓
11_DATABASE_IMPLEMENTATION.md
             ↓
12_PROJECT_SCAFFOLD.md
             ↓
13_AUTHENTICATION_IMPLEMENTATION.md
             ↓
14_CULTURAL_KNOWLEDGE_IMPLEMENTATION.md
             ↓
15_PROJECT_WORKSPACE_IMPLEMENTATION.md
             ↓
16_COST_ENGINE_IMPLEMENTATION.md
             ↓
17_AI_INTEGRATION_IMPLEMENTATION.md
             ↓
18_EVALUATION_IMPLEMENTATION.md
             ↓
19_REPORT_IMPLEMENTATION.md
             ↓
20_TESTING_DEPLOYMENT.md
```

However, the **next immediate practical step** should not be another abstract document.

It should be:

```text
DATABASE SCHEMA
        ↓
PROJECT FOLDER STRUCTURE
        ↓
INITIAL MIGRATIONS
        ↓
SEED DATA
        ↓
FIRST API
        ↓
FIRST UI
```

At that point, the project transitions from **planning mode** into **actual application development**.

---

# 177. FINAL SYSTEM BUILD ORDER

```text
                    ┌──────────────────┐
                    │  SYSTEM DESIGN   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ DATABASE SCHEMA  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ PROJECT SCAFFOLD │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ AUTHENTICATION   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ PROJECT MODULE   │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
          CULTURE        BODY PROFILE    REQUIREMENTS
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                         MATERIALS
                             │
                             ▼
                        COST ENGINE
                             │
                             ▼
                       DESIGN STUDIO
                             │
                             ▼
                       AI ORCHESTRATOR
                             │
                             ▼
                       IMAGE GENERATION
                             │
                             ▼
                        EVALUATION
                             │
                             ▼
                       EXPLAINABILITY
                             │
                             ▼
                       HUMAN REVIEW
                             │
                             ▼
                          APPROVAL
                             │
                             ▼
                           REPORT
                             │
                             ▼
                      DEPLOYMENT / TEST
```

**This is the implementation roadmap for the MVP.**

The key principle is to **build the deterministic application foundation first and plug intelligence into it**, rather than building an AI generator and trying to retrofit culture, costing, evaluation, and traceability afterward.
