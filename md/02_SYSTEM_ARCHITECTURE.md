# `SYSTEM_ARCHITECTURE.md`

## Human-AI Collaborative Cultural Attire Design System

**Document Version:** 1.0
**Project:** Master's Thesis Application
**Document Type:** System Architecture & Technical Specification
**Status:** Development Blueprint

---

# 1. Purpose

This document defines the technical architecture, application layers, services, data flow, AI integration, knowledge management, evaluation pipeline, security model, and development structure of the proposed system.

It translates the conceptual project into a technically implementable software architecture.

---

# 2. Architectural Goal

The system must provide a controlled pipeline:

```text
USER
 ↓
DESIGN REQUIREMENTS
 ↓
CULTURAL KNOWLEDGE
 ↓
CONSTRAINT ENGINE
 ↓
AI ORCHESTRATION
 ↓
DESIGN GENERATION
 ↓
EVALUATION
 ↓
EXPLANATION
 ↓
HUMAN REVIEW
 ↓
FINAL DESIGN
```

The architecture must ensure that the AI does **not operate as an isolated image generator**.

---

# 3. Architecture Principles

The application follows these principles.

### 3.1 Human-in-the-Loop

The designer remains the final decision-maker.

### 3.2 Knowledge-Grounded AI

AI generation should be supported by structured cultural information.

### 3.3 Modular Architecture

Each major capability should be independently replaceable.

### 3.4 Traceability

Important AI and design decisions should be recorded.

### 3.5 Explainability

The system should be able to explain important recommendations.

### 3.6 Separation of Concerns

UI, business logic, AI, knowledge management, and data storage should remain separate.

### 3.7 Progressive Complexity

The first implementation should work without requiring advanced computer vision or 3D technologies.

---

# 4. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                       │
│                  Next.js / React / TS                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Dashboard │ Projects │ Culture │ Design Studio │ Reports│
│                                                         │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION API                       │
│                                                         │
│ Auth │ Projects │ Culture │ Design │ Cost │ Evaluation  │
└──────────────────────────┬──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌────────────────┐ ┌───────────────┐ ┌───────────────┐
│ CULTURAL       │ │ AI            │ │ COST          │
│ KNOWLEDGE      │ │ ORCHESTRATOR  │ │ ENGINE        │
│ SERVICE        │ │               │ │               │
└───────┬────────┘ └───────┬───────┘ └───────┬───────┘
        │                  │                 │
        ▼                  ▼                 ▼
 Knowledge Graph       LLM / AI API      Cost Database
 Cultural Rules        Image AI          Labor Rules
 References            Context Builder   Materials
        │                  │                 │
        └──────────────────┼─────────────────┘
                           ▼
                  ┌──────────────────┐
                  │ EVALUATION ENGINE│
                  └────────┬─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
     CULTURE              BODY              COST
     CHECK                CHECK             CHECK
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                  ┌──────────────────┐
                  │ EXPLANATION      │
                  │ ENGINE           │
                  └────────┬─────────┘
                           ▼
                  HUMAN DESIGNER
```

---

# 5. Application Layers

The application should use six primary layers.

```text
Layer 1 — Presentation
Layer 2 — Application
Layer 3 — Intelligence
Layer 4 — Knowledge
Layer 5 — Data
Layer 6 — Infrastructure
```

---

# 6. Layer 1 — Presentation

Responsible for the user interface.

### Technology

```text
Next.js
React
TypeScript
Tailwind CSS
```

### Responsibilities

- Forms
- Dashboards
- Tables
- Design studio
- Image display
- Search
- Filters
- Evaluation visualization
- Reports
- Notifications

The frontend should **not contain business rules**.

---

# 7. Layer 2 — Application

Responsible for application workflows.

Examples:

```text
CreateProject()
CreateDesignBrief()
GenerateDesign()
EvaluateDesign()
CalculateCost()
SaveRevision()
GenerateReport()
```

This layer coordinates services.

---

# 8. Layer 3 — Intelligence

This is the AI-related layer.

Components:

```text
AI Orchestrator
Context Builder
Prompt Builder
Constraint Engine
Generation Service
Evaluation Engine
Explanation Engine
```

---

# 9. AI Orchestrator

The AI Orchestrator controls communication between the application and AI services.

```text
Application
     ↓
AI Orchestrator
     ↓
Context Builder
     ↓
Constraint Builder
     ↓
LLM
     ↓
Image Generator
```

The application should never scatter direct AI API calls throughout the frontend.

---

# 10. Context Builder

The Context Builder collects relevant information.

Input:

```text
Design Brief
+
Culture
+
Cultural Elements
+
Restrictions
+
Body Profile
+
Budget
+
Materials
+
Previous Design
```

Output:

```text
Structured AI Context
```

---

# 11. Constraint Engine

This is one of the most important components.

It converts requirements into machine-readable constraints.

Example:

```json
{
  "culture": "selected culture",
  "occasion": "pageant",
  "mandatory_elements": ["approved textile"],
  "restricted_elements": ["restricted ceremonial motif"],
  "budget": 30000,
  "style": "contemporary",
  "body_profile": "profile_001"
}
```

---

# 12. Constraint Categories

The engine should support:

```text
CULTURAL
BODY
BUDGET
MATERIAL
OCCASION
STYLE
GARMENT
DESIGN
USER
```

---

# 13. Knowledge Layer

The knowledge layer contains:

```text
Cultural Knowledge Graph
Cultural Database
Cultural Rules
References
Expert Validation
Semantic Relationships
```

The system should separate:

### Facts

Information supported by references.

### Rules

System-defined constraints.

### Recommendations

AI-generated suggestions.

This distinction is essential.

---

# 14. Knowledge Graph Architecture

Conceptually:

```text
                    CULTURE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      COMMUNITY     REGION       OCCASION
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
TEXTILE MOTIF GARMENT
    │     │
    │     └──────► SYMBOLISM
    │
    └────────────► TECHNIQUE
```

---

# 15. Knowledge Graph Node Types

Initial nodes:

```text
Culture
Community
Region
Garment
Textile
Motif
Pattern
Color
Symbol
Technique
Material
Occasion
Tradition
Restriction
Reference
```

---

# 16. Knowledge Graph Relationship Types

Examples:

```text
BELONGS_TO
ASSOCIATED_WITH
USED_BY
USED_IN
CONTAINS
SYMBOLIZES
DERIVED_FROM
RELATED_TO
RESTRICTED_IN
APPROPRIATE_FOR
DOCUMENTED_BY
VALIDATED_BY
```

---

# 17. Example Knowledge Graph

```text
[Motif A]
    │
    ├── BELONGS_TO → [Community A]
    │
    ├── USED_ON → [Garment A]
    │
    ├── SYMBOLIZES → [Concept A]
    │
    ├── APPROPRIATE_FOR → [Occasion A]
    │
    └── DOCUMENTED_BY → [Reference A]
```

This structure allows the system to retrieve connected information rather than isolated records.

---

# 18. Data Storage Architecture

The recommended architecture uses:

### PostgreSQL

For:

- Users
- Projects
- Clients
- Designs
- Materials
- Costs
- Evaluations
- References
- Audit logs

### Graph Database / Graph Layer

For:

- Cultural relationships
- Semantic connections
- Cultural associations

### Object Storage

For:

- Generated images
- Uploaded images
- Cultural reference images
- Reports

### Vector Storage

For:

- Semantic cultural search
- Document retrieval
- AI context retrieval

---

# 19. Recommended Initial Stack

```text
Frontend:
Next.js + TypeScript

UI:
Tailwind CSS

Backend:
Next.js API / FastAPI

Database:
PostgreSQL

Vector:
pgvector

Knowledge Graph:
Neo4j or graph layer

Authentication:
Auth system

Storage:
S3-compatible object storage

AI:
LLM API

Image Generation:
Image-generation API

Computer Vision:
Vision model/API
```

We can change individual providers later.

---

# 20. Data Flow — Creating a Design

```text
USER
 │
 ▼
CREATE PROJECT
 │
 ▼
DESIGN BRIEF
 │
 ▼
CULTURAL RETRIEVAL
 │
 ▼
BODY PROFILE
 │
 ▼
BUDGET
 │
 ▼
MATERIALS
 │
 ▼
CONSTRAINT ENGINE
 │
 ▼
AI CONTEXT
 │
 ▼
AI GENERATION
 │
 ▼
DESIGN
 │
 ▼
EVALUATION
 │
 ▼
EXPLANATION
 │
 ▼
HUMAN REVIEW
```

---

# 21. AI Generation Pipeline

The AI system should use two stages.

## Stage 1 — Semantic Design Generation

The LLM creates:

```text
Design specification
Garment components
Materials
Colors
Cultural elements
Construction suggestions
Design rationale
```

## Stage 2 — Visual Generation

The structured specification becomes input to an image-generation model.

This is better than sending raw user text directly to an image generator.

---

# 22. Why Two-Stage Generation?

Because the system needs to know:

> **What was actually requested and generated.**

An image alone cannot reliably tell the application:

- Which textile was intended
- Which cultural motif was used
- Why a color was selected
- How much material is required
- Which design requirement was satisfied

Therefore:

```text
STRUCTURED DESIGN
        +
VISUAL DESIGN
```

must coexist.

---

# 23. Design Object

Each design should contain:

```json
{
  "id": "DES-001",
  "projectId": "PROJ-001",
  "version": 1,
  "designSpecification": {},
  "imageUrl": "...",
  "culturalElements": [],
  "materials": [],
  "estimatedCost": 0,
  "evaluation": {},
  "explanation": {},
  "status": "draft"
}
```

---

# 24. Evaluation Architecture

The evaluation engine receives:

```text
Design
+
Requirements
+
Cultural Knowledge
+
Body Profile
+
Budget
+
Materials
```

Then executes:

```text
Cultural Evaluation
        +
Body Evaluation
        +
Cost Evaluation
        +
Requirement Evaluation
        +
Material Evaluation
```

---

# 25. Evaluation Result Structure

```json
{
  "cultural": {
    "status": "review_required",
    "findings": []
  },
  "body": {
    "status": "review_required",
    "findings": []
  },
  "cost": {
    "status": "within_budget",
    "estimated": 23625
  },
  "requirements": {
    "mandatorySatisfied": 8,
    "mandatoryTotal": 8
  }
}
```

---

# 26. Explainability Architecture

The Explanation Engine receives evaluation results and generates understandable explanations.

```text
RULE
 ↓
EVIDENCE
 ↓
RESULT
 ↓
EXPLANATION
```

Example:

```text
Rule:
Selected cultural element must have a verified source.

Evidence:
Element T-024 has verified reference R-014.

Result:
Requirement satisfied.

Explanation:
The selected textile was included because it is documented
for the selected cultural context and has a verified reference.
```

---

# 27. Cost Architecture

Cost calculation should remain deterministic.

**AI should not calculate final costs.**

Instead:

```text
Database
   ↓
Quantity
   ↓
Unit Price
   ↓
Calculation Engine
   ↓
Cost
```

AI may **suggest** materials, but the costing engine calculates the actual estimate.

This separation improves reliability.

---

# 28. Body Analysis Architecture

Initial version:

```text
Manual Measurements
        ↓
Body Profile
        ↓
Design Constraints
```

Advanced version:

```text
Image
 ↓
Computer Vision
 ↓
Landmarks
 ↓
Estimated Measurements
 ↓
Designer Correction
 ↓
Body Profile
```

---

# 29. MCP Architecture

If MCP is included in the implementation, it should serve as a controlled interface between the AI and application resources.

Conceptually:

```text
                   AI
                    │
                    ▼
              MCP CONTEXT
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
 Cultural Tool   Cost Tool   Design Tool
       │            │            │
       ▼            ▼            ▼
 Knowledge       Pricing       Projects
 Graph           Database      Database
```

Potential tools:

```text
search_cultural_knowledge
get_cultural_element
get_cultural_rules
get_body_profile
get_material_prices
calculate_cost
get_design_requirements
get_previous_design
create_design_record
```

The exact MCP implementation can evolve as development progresses.

---

# 30. API Architecture

All external requests should go through the application API.

Example:

```text
POST /api/projects

GET /api/cultures

GET /api/cultures/:id

POST /api/designs

POST /api/designs/:id/generate

POST /api/designs/:id/evaluate

POST /api/designs/:id/regenerate

GET /api/designs/:id/versions

POST /api/cost/calculate

GET /api/reports/:id
```

---

# 31. Authentication

Roles:

```text
ADMIN
DESIGNER
CULTURAL_EXPERT
RESEARCHER
VIEWER
```

Permissions must be role-based.

---

# 32. Security

The application should implement:

- Secure authentication
- Password hashing
- Role-based access
- API authorization
- Input validation
- File validation
- Rate limiting
- Audit logging
- Secure AI API keys
- Environment variables
- Data access restrictions

AI API keys must **never** be exposed to the frontend.

---

# 33. Privacy

Body information and client images may be sensitive.

Therefore:

- collect only necessary information,
- provide clear consent,
- restrict access,
- avoid unnecessary identifying information,
- allow deletion where appropriate,
- separate research data from identifying information where possible.

---

# 34. Error Handling

Every service should return structured errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "CULTURAL_CONTEXT_NOT_FOUND",
    "message": "No verified cultural information was found."
  }
}
```

---

# 35. AI Failure Handling

If AI generation fails:

```text
Generation Request
       ↓
AI Failure
       ↓
Retry
       ↓
If failure persists
       ↓
Show user-friendly error
```

The system should not silently fabricate a result.

---

# 36. Missing Knowledge Handling

If cultural information cannot be verified:

```text
SEARCH
 ↓
NO VERIFIED DATA
 ↓
FLAG
 ↓
DESIGNER REVIEW
```

The AI should not simply invent the missing information.

---

# 37. Unsupported Claim Handling

The application should distinguish:

```text
VERIFIED
SUPPORTED
INFERRED
AI-GENERATED
UNKNOWN
```

This is particularly important for cultural information.

---

# 38. Audit Architecture

Important actions must be logged:

```text
LOGIN
PROJECT_CREATED
CULTURAL_RECORD_VIEWED
DESIGN_GENERATED
AI_CONTEXT_CREATED
EVALUATION_RUN
DESIGN_MODIFIED
DESIGN_ACCEPTED
DESIGN_REJECTED
REPORT_GENERATED
```

---

# 39. File Architecture

Suggested:

```text
/storage
   /users
   /projects
      /project-id
         /references
         /uploads
         /generated
         /reports
```

---

# 40. Frontend Component Architecture

```text
src/
├── app/
├── components/
│   ├── dashboard/
│   ├── projects/
│   ├── culture/
│   ├── body/
│   ├── materials/
│   ├── design/
│   ├── evaluation/
│   └── reports/
│
├── features/
│   ├── projects/
│   ├── culture/
│   ├── design-generation/
│   ├── costing/
│   └── evaluation/
│
├── lib/
│   ├── api/
│   ├── validation/
│   ├── ai/
│   └── utils/
│
└── types/
```

---

# 41. Backend Architecture

If using a separate backend:

```text
backend/
├── api/
├── services/
│   ├── culture/
│   ├── design/
│   ├── ai/
│   ├── costing/
│   ├── evaluation/
│   └── reports/
│
├── models/
├── repositories/
├── validators/
├── middleware/
└── config/
```

---

# 42. Service Separation

The following services should be logically independent:

```text
CultureService
ProjectService
BodyService
MaterialService
CostService
AIService
DesignService
EvaluationService
ExplanationService
ReportService
```

This allows us to replace individual components later.

---

# 43. Design State Machine

A design should move through controlled states:

```text
DRAFT
  ↓
GENERATING
  ↓
GENERATED
  ↓
EVALUATING
  ↓
REVIEW_REQUIRED
  ↓
REVISION
  ↓
REVIEWED
  ↓
APPROVED
  ↓
FINAL
```

A design can also return to:

```text
REVISION
```

at any point before finalization.

---

# 44. Project State Machine

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

# 45. Performance Requirements

Initial targets:

- Dashboard load: < 3 seconds under normal conditions
- Database queries: preferably < 1 second
- Cultural search: < 2 seconds
- Cost calculation: near instantaneous
- Evaluation: < 10 seconds where possible
- AI generation: asynchronous
- Image generation: asynchronous

AI generation should use a job/status mechanism rather than blocking the entire application.

---

# 46. Asynchronous AI Jobs

```text
User
 ↓
Generate
 ↓
Create Job
 ↓
PROCESSING
 ↓
AI Service
 ↓
COMPLETED
 ↓
Notification
 ↓
Display Result
```

Possible statuses:

```text
QUEUED
PROCESSING
COMPLETED
FAILED
CANCELLED
```

---

# 47. Version Control

Every meaningful design modification creates:

```text
Design Version
```

Example:

```text
D-001
 ├── V1
 ├── V2
 ├── V3
 └── V4 FINAL
```

The designer can compare versions.

---

# 48. Testing Strategy

Testing should occur at multiple levels.

### Unit Tests

Test:

- Cost calculations
- Validation
- Cultural rules
- Evaluation rules

### Integration Tests

Test:

- API → database
- API → AI
- Design → evaluation
- Design → cost

### UI Tests

Test:

- Forms
- Navigation
- Design workflow

### AI Tests

Test:

- Context generation
- Structured output
- Constraint adherence
- Failure handling

---

# 49. Evaluation Engine Testing

Create predefined test cases.

Example:

```text
TEST-001
Correct culture
Correct textile
Correct occasion
Within budget

Expected:
No cultural conflict
Within budget
Requirements satisfied
```

Then:

```text
TEST-002
Correct culture
Incorrect/restricted element

Expected:
Cultural review flag
```

---

# 50. Development Environments

Use:

```text
Development
Testing
Production
```

Environment variables:

```text
DATABASE_URL
AI_API_KEY
IMAGE_API_KEY
STORAGE_BACKEND
STORAGE_URL
STORAGE_BUCKET
STORAGE_REGION
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
AUTH_SECRET
```

Production storage is Supabase Storage via its S3 protocol endpoint
(`STORAGE_URL=https://<ref>.storage.supabase.co/storage/v1/s3`, bucket
PRIVATE, server-side S3 keys only). Dev stays `STORAGE_BACKEND=local`.

Never commit secrets into Git.

---

# 51. Git Structure

Suggested:

```text
main
develop
feature/cultural-knowledge
feature/design-generation
feature/cost-engine
feature/evaluation
feature/body-analysis
```

---

# 52. Development Milestones

### Milestone 1

Application shell

### Milestone 2

Database

### Milestone 3

Cultural knowledge

### Milestone 4

Design brief

### Milestone 5

Cost engine

### Milestone 6

AI integration

### Milestone 7

Evaluation

### Milestone 8

Design studio

### Milestone 9

Computer vision

### Milestone 10

Reports and thesis prototype completion

---

# 53. Architecture Decision: What We Build vs. Integrate

| Component                    | Strategy                |
| ---------------------------- | ----------------------- |
| Web application              | **Build**               |
| Database                     | **Build/configure**     |
| Cultural knowledge structure | **Build**               |
| Cultural rules               | **Build**               |
| Knowledge graph              | **Build/configure**     |
| Cost engine                  | **Build**               |
| Evaluation engine            | **Build**               |
| Explanation engine           | **Build**               |
| AI orchestration             | **Build**               |
| LLM                          | **Integrate**           |
| Image generation             | **Integrate**           |
| Computer vision              | **Integrate initially** |
| Storage                      | **Integrate/configure** |
| Authentication               | **Integrate/configure** |

This is the most realistic approach for the thesis.

---

# 54. Critical Architectural Rule

The system should **never allow the image-generation model to become the source of truth for cultural information.**

Instead:

```text
CULTURAL KNOWLEDGE BASE
          │
          ▼
     VERIFIED DATA
          │
          ▼
    DESIGN CONSTRAINT
          │
          ▼
      AI GENERATION
          │
          ▼
       AI OUTPUT
          │
          ▼
      EVALUATION
          │
          ▼
    HUMAN REVIEW
```

The image generator is a **creative component**, not the authoritative cultural database.

---

# 55. Final System Concept

The completed system should essentially behave like:

> **A digital design laboratory combining cultural research, structured knowledge, human measurements, material economics, generative AI, automated evaluation, and human expertise in a single workflow.**

The key technical innovation is not simply the use of AI.

It is the **orchestration of different sources of knowledge and constraints around the AI generation process.**

---

# 56. NEXT DEVELOPMENT DOCUMENTS

With this architecture defined, the next MDs should be created in this order:

### `03_DATABASE_SCHEMA.md`

Complete relational database design:

- Tables
- Fields
- Data types
- Primary keys
- Foreign keys
- Relationships
- Indexes
- Audit fields

### `04_CULTURAL_KNOWLEDGE_MODEL.md`

Detailed knowledge graph:

- Entities
- Relationships
- Ontology
- Cultural rules
- Verification
- References
- Graph queries

### `05_AI_ORCHESTRATION.md`

Detailed AI architecture:

- Prompt/context construction
- MCP tools
- LLM interaction
- Image generation
- Structured outputs
- Guardrails
- AI failure handling

### `06_COST_ENGINE.md`

Detailed costing algorithms and database structure.

### `07_EVALUATION_ENGINE.md`

Detailed cultural/body/cost/design evaluation rules.

### `08_UI_UX_SPECIFICATION.md`

Every screen, component, form, button, workflow, and user interaction.

### `09_API_SPECIFICATION.md`

Complete endpoint specification.

### `10_MVP_IMPLEMENTATION_PLAN.md`

Exact coding sequence and milestones.

---
