# 09_API_SPECIFICATION.md

# Human-AI Collaborative Cultural Attire Design Platform

## Application Programming Interface Specification

**Project Title:**
**A Human-AI Collaborative Framework for Cultural-Aware, Body-Personalized, and Cost-Optimized Creative Attire Design Using Knowledge Graphs, Generative AI, Computer Vision, Predictive Costing Engines, and Explainable Design Evaluation**

**Document:** `09_API_SPECIFICATION.md`

**Document Type:** Backend/API Technical Specification

**Status:** Implementation Specification

**Primary Stack:** Next.js / React / TypeScript + Node.js or Python FastAPI + PostgreSQL + pgvector + Knowledge Graph

---

# 1. PURPOSE

This document defines the API contract for the Cultural Attire Design Platform.

The API provides a controlled interface between:

```text
Frontend
    ↓
REST API
    ↓
Application Services
    ↓
Business Rules
    ↓
Knowledge / AI / Cost / Evaluation Services
    ↓
Database / Storage / External AI Providers
```

The API must support:

- user authentication
- project management
- cultural knowledge retrieval
- cultural research
- body profiles
- design requirements
- materials
- suppliers
- pricing
- design creation
- AI generation
- AI refinement
- design versioning
- image versioning
- deterministic costing
- design evaluation
- explainability
- human review
- approval
- reports
- audit logs
- file/image management

---

# 2. CORE API PRINCIPLES

The API shall follow these principles.

## 2.1 Resource-Oriented

Use nouns for resources.

### Preferred

```text
GET /api/v1/projects
GET /api/v1/projects/{projectId}
GET /api/v1/designs/{designId}
```

### Avoid

```text
GET /api/v1/getProjects
POST /api/v1/createProject
POST /api/v1/generateDesign
```

Actions that represent domain operations may use action/sub-resource endpoints where appropriate.

Example:

```text
POST /api/v1/designs/{designId}/generation-jobs
```

---

# 3. API BASE URL

Development:

```text
http://localhost:3000/api/v1
```

Production:

```text
https://your-domain.com/api/v1
```

All API routes shall begin with:

```text
/api/v1
```

Example:

```text
GET /api/v1/projects
```

---

# 4. API VERSIONING

The first production API version is:

```text
v1
```

Example:

```text
/api/v1/projects
```

Future breaking changes should use:

```text
/api/v2/projects
```

Non-breaking additions should normally remain within the same version.

Examples of non-breaking changes:

- adding optional response fields
- adding new resources
- adding optional request fields
- adding new filter options

Potential breaking changes:

- removing fields
- changing field meanings
- changing required fields
- changing response structure
- changing resource semantics

---

# 5. CONTENT TYPE

Requests containing JSON:

```http
Content-Type: application/json
```

Responses:

```http
Content-Type: application/json
```

File uploads:

```http
Content-Type: multipart/form-data
```

Generated files may use:

```text
application/pdf
image/png
image/jpeg
```

---

# 6. RESPONSE ENVELOPE

Successful single-resource response:

```json
{
  "data": {
    "id": "DES-001",
    "name": "Heritage Evening Attire",
    "status": "draft"
  },
  "meta": {
    "requestId": "req_01JABC"
  }
}
```

Collection response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 125,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "requestId": "req_01JABC"
  }
}
```

---

# 7. REQUEST IDENTIFICATION

Every request should receive a correlation/request ID.

Request:

```http
X-Request-ID: req_01JABC123
```

If the client does not provide one, the server generates one.

Response:

```http
X-Request-ID: req_01JABC123
```

This identifier must appear in application logs.

---

# 8. AUTHENTICATION

The API requires authentication for protected resources.

Recommended architecture:

```text
Frontend
   ↓
Authentication Provider
   ↓
Session / Access Token
   ↓
API
```

Example:

```http
Authorization: Bearer <access-token>
```

The backend must validate:

- token validity
- expiration
- user identity
- role
- permissions
- resource ownership/access

---

# 9. USER ROLES

Supported roles:

```text
ADMIN
DESIGNER
CULTURAL_EXPERT
RESEARCHER
VIEWER
```

---

# 10. AUTHORIZATION MODEL

Authorization occurs at two levels.

## 10.1 Role Authorization

Example:

```text
ADMIN
 ├── manage users
 ├── manage cultural knowledge
 ├── manage materials
 └── configure system

DESIGNER
 ├── create projects
 ├── create designs
 ├── generate designs
 ├── evaluate
 └── approve designs

CULTURAL_EXPERT
 ├── review cultural records
 ├── verify sources
 └── review cultural findings

RESEARCHER
 ├── research culture
 └── create cultural records

VIEWER
 └── read permitted resources
```

## 10.2 Resource Authorization

A user must also have access to the specific project.

Example:

```text
Designer A
    ↓
Project P001
    ↓
Design D001
```

Designer A can access D001 only because they have access to P001.

---

# 11. PROJECT API

## 11.1 Create Project

```http
POST /api/v1/projects
```

Request:

```json
{
  "name": "Festival Attire Concept",
  "description": "Cultural festival attire design project",
  "cultureId": "CUL-001",
  "occasionId": "OCC-001",
  "budget": 25000,
  "currency": "PHP"
}
```

Response:

```http
201 Created
```

```json
{
  "data": {
    "id": "PROJ-001",
    "name": "Festival Attire Concept",
    "status": "DRAFT",
    "budget": 25000,
    "currency": "PHP"
  }
}
```

---

# 12. List Projects

```http
GET /api/v1/projects
```

Supported parameters:

```text
?page=1
&pageSize=20
&status=DRAFT
&cultureId=CUL-001
&search=festival
&sort=-createdAt
```

Example:

```http
GET /api/v1/projects?page=1&pageSize=20&status=DRAFT
```

---

# 13. Get Project

```http
GET /api/v1/projects/{projectId}
```

Example:

```http
GET /api/v1/projects/PROJ-001
```

---

# 14. Update Project

```http
PATCH /api/v1/projects/{projectId}
```

Request:

```json
{
  "name": "Updated Festival Attire",
  "budget": 30000
}
```

---

# 15. Delete / Archive Project

Prefer soft deletion/archive.

```http
POST /api/v1/projects/{projectId}/archive
```

Response:

```json
{
  "data": {
    "id": "PROJ-001",
    "status": "ARCHIVED"
  }
}
```

---

# 16. PROJECT STATUS

```text
DRAFT
RESEARCH
DESIGNING
EVALUATION
REVISION
FINALIZATION
COMPLETED
ARCHIVED
```

---

# 17. CULTURAL KNOWLEDGE API

The cultural knowledge service is one of the most important components of the platform.

The AI must not treat the generative model as the authoritative source of cultural facts.

Instead:

```text
AI
 ↓
Cultural API
 ↓
Verified Knowledge
 ↓
Evidence
```

---

# 18. LIST CULTURES

```http
GET /api/v1/cultures
```

Filters:

```text
?region=
&status=VERIFIED
&search=
&page=
&pageSize=
```

---

# 19. GET CULTURE

```http
GET /api/v1/cultures/{cultureId}
```

Example:

```http
GET /api/v1/cultures/CUL-001
```

---

# 20. CULTURAL ELEMENTS

```http
GET /api/v1/cultural-elements
```

Filters:

```text
?cultureId=
&communityId=
&category=
&status=
&occasion=
&search=
```

Categories:

```text
GARMENT
TEXTILE
MOTIF
PATTERN
COLOR
SYMBOL
ORNAMENT
TECHNIQUE
MATERIAL
ACCESSORY
```

---

# 21. GET CULTURAL ELEMENT

```http
GET /api/v1/cultural-elements/{elementId}
```

Response:

```json
{
  "data": {
    "id": "CE-024",
    "name": "Example Textile",
    "category": "TEXTILE",
    "culture": {
      "id": "CUL-001",
      "name": "Example Culture"
    },
    "description": "...",
    "symbolism": "...",
    "traditionalUsage": "...",
    "allowedContexts": [],
    "restrictedContexts": [],
    "validationStatus": "VERIFIED",
    "sources": [
      {
        "id": "SRC-001",
        "title": "Cultural Reference",
        "url": "...",
        "type": "REFERENCE"
      }
    ]
  }
}
```

---

# 22. CULTURAL SEARCH

```http
GET /api/v1/cultural-elements/search
```

Parameters:

```text
?q=
&cultureId=
&category=
&status=
```

The search service may combine:

```text
Keyword Search
+
Vector Search
+
Knowledge Graph Search
```

Conceptually:

```text
User Query
     ↓
Search Service
 ┌───┼────┐
 ↓   ↓    ↓
SQL Vector Graph
 └───┼────┘
     ↓
Ranked Results
```

---

# 23. CULTURAL RECORD CREATION

```http
POST /api/v1/cultural-elements
```

Only authorized roles:

```text
ADMIN
RESEARCHER
CULTURAL_EXPERT
```

Request:

```json
{
  "name": "Example Textile",
  "cultureId": "CUL-001",
  "category": "TEXTILE",
  "description": "...",
  "traditionalUsage": "...",
  "sources": [
    {
      "title": "Reference",
      "url": "..."
    }
  ]
}
```

Initial status:

```text
UNVERIFIED
```

A newly created record must not automatically become verified.

---

# 24. CULTURAL VERIFICATION

```http
POST /api/v1/cultural-elements/{elementId}/verify
```

Response:

```json
{
  "data": {
    "id": "CE-024",
    "validationStatus": "VERIFIED",
    "verifiedBy": "USR-002"
  }
}
```

---

# 25. CULTURAL RESTRICTIONS

```http
GET /api/v1/cultural-elements/{elementId}/restrictions
```

Example response:

```json
{
  "data": [
    {
      "type": "RESTRICTED_CONTEXT",
      "description": "...",
      "severity": "HIGH",
      "sourceIds": ["SRC-001"]
    }
  ]
}
```

---

# 26. RESEARCH BASKET

Users can collect cultural elements for a project.

```http
POST /api/v1/projects/{projectId}/cultural-elements
```

Request:

```json
{
  "elementId": "CE-024",
  "purpose": "TEXTILE_REFERENCE"
}
```

List:

```http
GET /api/v1/projects/{projectId}/cultural-elements
```

Remove:

```http
DELETE /api/v1/projects/{projectId}/cultural-elements/{elementId}
```

---

# 27. BODY PROFILE API

## Create Body Profile

```http
POST /api/v1/body-profiles
```

Request:

```json
{
  "height": 165,
  "weight": 60,
  "shoulderWidth": 40,
  "chest": 90,
  "waist": 75,
  "hip": 95,
  "armLength": 58,
  "inseam": 76,
  "unit": "CM"
}
```

---

# 28. GET BODY PROFILE

```http
GET /api/v1/body-profiles/{bodyProfileId}
```

---

# 29. UPDATE BODY PROFILE

```http
PATCH /api/v1/body-profiles/{bodyProfileId}
```

Every measurement should store its source:

```text
MANUAL
VISION_ESTIMATED
IMPORTED
CORRECTED_BY_USER
```

Example:

```json
{
  "waist": {
    "value": 75,
    "unit": "CM",
    "source": "MANUAL"
  }
}
```

---

# 30. BODY IMAGE ANALYSIS

```http
POST /api/v1/body-profiles/{bodyProfileId}/analysis-jobs
```

Response:

```http
202 Accepted
```

```json
{
  "data": {
    "jobId": "JOB-BODY-001",
    "status": "QUEUED"
  }
}
```

The computer-vision result must clearly distinguish:

```text
Measured
Estimated
Unknown
```

---

# 31. ACCEPT BODY ESTIMATE

```http
POST /api/v1/body-profiles/{bodyProfileId}/estimates/{estimateId}/accept
```

---

# 32. CORRECT BODY ESTIMATE

```http
POST /api/v1/body-profiles/{bodyProfileId}/estimates/{estimateId}/correct
```

Request:

```json
{
  "value": 76,
  "unit": "CM"
}
```

---

# 33. DESIGN REQUIREMENTS API

## Create Requirements

```http
POST /api/v1/projects/{projectId}/requirements
```

Example:

```json
{
  "cultureId": "CUL-001",
  "occasionId": "OCC-001",
  "garmentType": "FORMAL_ATTIRE",
  "style": "MODERN_TRADITIONAL",
  "budget": 25000,
  "modernTraditionalBalance": 60,
  "complexity": "MEDIUM"
}
```

---

# 34. REQUIREMENT PRIORITIES

Every requirement should have:

```text
MANDATORY
PREFERRED
OPTIONAL
RESTRICTED
```

Example:

```json
{
  "requirement": "Use traditional textile",
  "priority": "MANDATORY"
}
```

---

# 35. REQUIREMENT LIST

```http
GET /api/v1/projects/{projectId}/requirements
```

---

# 36. UPDATE REQUIREMENT

```http
PATCH /api/v1/requirements/{requirementId}
```

---

# 37. MATERIAL API

## List Materials

```http
GET /api/v1/materials
```

Filters:

```text
?category=
&cultureId=
&supplierId=
&available=true
&search=
```

---

# 38. CREATE MATERIAL

```http
POST /api/v1/materials
```

Request:

```json
{
  "name": "Example Fabric",
  "category": "TEXTILE",
  "unit": "METER",
  "description": "...",
  "culturalAssociation": "..."
}
```

---

# 39. MATERIAL PRICE

```http
GET /api/v1/materials/{materialId}/prices
```

Example:

```json
{
  "data": [
    {
      "id": "PRICE-001",
      "unitPrice": 450,
      "currency": "PHP",
      "unit": "METER",
      "supplierId": "SUP-001",
      "status": "VERIFIED",
      "effectiveDate": "2026-09-01"
    }
  ]
}
```

---

# 40. ADD MATERIAL PRICE

```http
POST /api/v1/materials/{materialId}/prices
```

---

# 41. SUPPLIERS

```http
GET /api/v1/suppliers
```

Create:

```http
POST /api/v1/suppliers
```

Get:

```http
GET /api/v1/suppliers/{supplierId}
```

---

# 42. DESIGN API

## Create Design

```http
POST /api/v1/projects/{projectId}/designs
```

Request:

```json
{
  "name": "Initial Cultural Attire Concept",
  "bodyProfileId": "BODY-001",
  "requirementId": "REQ-001"
}
```

Response:

```http
201 Created
```

Initial state:

```text
DRAFT
```

---

# 43. LIST DESIGNS

```http
GET /api/v1/projects/{projectId}/designs
```

Filters:

```text
?status=
&approved=
&sort=
&page=
&pageSize=
```

---

# 44. GET DESIGN

```http
GET /api/v1/designs/{designId}
```

---

# 45. UPDATE DESIGN

```http
PATCH /api/v1/designs/{designId}
```

Only editable fields should be changed.

---

# 46. DESIGN VERSION API

```http
GET /api/v1/designs/{designId}/versions
```

Example:

```json
{
  "data": [
    {
      "id": "DV-001",
      "version": 1,
      "status": "REVIEWED",
      "createdAt": "..."
    },
    {
      "id": "DV-002",
      "version": 2,
      "status": "DRAFT",
      "createdAt": "..."
    }
  ]
}
```

---

# 47. GET DESIGN VERSION

```http
GET /api/v1/design-versions/{versionId}
```

---

# 48. IMAGE VERSIONS

One design version may contain multiple generated images.

```text
Design V1
 ├── Image V1
 ├── Image V2
 └── Image V3
```

API:

```http
GET /api/v1/design-versions/{versionId}/images
```

---

# 49. UPLOAD DESIGN IMAGE

```http
POST /api/v1/designs/{designId}/images
```

Use:

```text
multipart/form-data
```

The backend stores the file in object storage and records metadata.

---

# 50. AI GENERATION API

AI generation must be asynchronous.

Do not make the frontend wait for a long-running image-generation request.

---

# 51. START DESIGN GENERATION

```http
POST /api/v1/designs/{designId}/generation-jobs
```

Request:

```json
{
  "generationType": "FULL_DESIGN",
  "instructions": "Create a modern interpretation while preserving the selected cultural elements.",
  "imageCount": 2
}
```

Response:

```http
202 Accepted
```

```json
{
  "data": {
    "jobId": "JOB-001",
    "status": "QUEUED"
  }
}
```

---

# 52. AI GENERATION PIPELINE

```text
POST generation job
        ↓
Validate request
        ↓
Load project
        ↓
Load requirements
        ↓
Load body profile
        ↓
Load cultural knowledge
        ↓
Load restrictions
        ↓
Load materials
        ↓
Build AI context
        ↓
Generate structured design specification
        ↓
Validate specification
        ↓
Build image prompt
        ↓
Generate image
        ↓
Store image
        ↓
Create design version
        ↓
Run evaluation
        ↓
Create explanation
        ↓
Human review
```

---

# 53. AI JOB API

Get job:

```http
GET /api/v1/ai/jobs/{jobId}
```

Response:

```json
{
  "data": {
    "id": "JOB-001",
    "type": "DESIGN_GENERATION",
    "status": "GENERATING_IMAGE",
    "progress": 70,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

# 54. AI JOB STATES

```text
QUEUED
PROCESSING
GENERATING_SPECIFICATION
VALIDATING_SPECIFICATION
GENERATING_IMAGE
STORING_RESULT
EVALUATING
COMPLETED
FAILED
CANCELLED
```

---

# 55. CANCEL AI JOB

```http
POST /api/v1/ai/jobs/{jobId}/cancel
```

---

# 56. AI REFINEMENT

```http
POST /api/v1/designs/{designId}/refinement-jobs
```

Request:

```json
{
  "instruction": "Reduce the decorative elements and make the silhouette simpler.",
  "preserve": ["selected cultural textile", "body profile", "budget"]
}
```

The refinement system must preserve mandatory constraints unless the designer explicitly changes them.

---

# 57. REFINEMENT IMPACT

The API should return affected constraints.

Example:

```json
{
  "data": {
    "changes": [
      {
        "area": "DECORATION",
        "impact": "REDUCED"
      },
      {
        "area": "COST",
        "impact": "EXPECTED_DECREASE"
      },
      {
        "area": "CULTURAL_ELEMENTS",
        "impact": "UNCHANGED"
      }
    ]
  }
}
```

---

# 58. AI COMPARISON

```http
POST /api/v1/designs/{designId}/comparisons
```

Request:

```json
{
  "versionIds": ["DV-001", "DV-002", "DV-003"]
}
```

Response:

```json
{
  "data": {
    "comparisonId": "CMP-001",
    "versions": [],
    "differences": [],
    "costComparison": [],
    "requirementComparison": [],
    "culturalComparison": []
  }
}
```

The API should provide factual differences rather than declaring one design universally "best."

---

# 59. COST CALCULATION API

The costing engine is deterministic.

AI must not calculate final costs.

Architecture:

```text
AI
 ↓
Material Suggestions
 ↓
Cost Engine
 ↓
Verified Prices
 ↓
Deterministic Calculation
 ↓
Cost Result
```

---

# 60. CALCULATE DESIGN COST

```http
POST /api/v1/designs/{designId}/cost-calculations
```

Request:

```json
{
  "versionId": "DV-001",
  "currency": "PHP",
  "contingencyRate": 0.1
}
```

Response:

```json
{
  "data": {
    "calculationId": "COST-001",
    "currency": "PHP",
    "materialSubtotal": 12000,
    "laborSubtotal": 7000,
    "decorationSubtotal": 2500,
    "otherSubtotal": 500,
    "directCost": 22000,
    "contingency": 2200,
    "estimatedTotal": 24200,
    "budget": 25000,
    "variance": 800,
    "status": "UNDER_BUDGET"
  }
}
```

---

# 61. COST SNAPSHOT

Every finalized calculation must create a snapshot.

```http
GET /api/v1/design-versions/{versionId}/cost-snapshots
```

The snapshot must preserve:

- material
- quantity
- unit
- unit price
- supplier
- labor rate
- decoration rate
- contingency
- currency
- calculation date

This ensures historical calculations remain reproducible even when prices later change.

---

# 62. COST STATUS

```text
UNDER_BUDGET
NEAR_BUDGET
AT_BUDGET
OVER_BUDGET
INCOMPLETE
REVIEW_REQUIRED
```

---

# 63. COST ITEM API

```http
GET /api/v1/cost-calculations/{calculationId}/items
```

Possible item types:

```text
MATERIAL
LABOR
DECORATION
OTHER
```

---

# 64. EVALUATION API

Evaluation must combine deterministic rules and evidence.

```text
Cultural Rules
Requirements
Body Data
Cost Data
Material Data
        ↓
Evaluation Engine
        ↓
Findings
        ↓
Explanation
```

---

# 65. RUN EVALUATION

```http
POST /api/v1/designs/{designId}/evaluations
```

Request:

```json
{
  "versionId": "DV-001",
  "runCultural": true,
  "runBody": true,
  "runCost": true,
  "runRequirements": true
}
```

Response:

```http
202 Accepted
```

```json
{
  "data": {
    "evaluationJobId": "EVAL-001",
    "status": "QUEUED"
  }
}
```

---

# 66. GET EVALUATION

```http
GET /api/v1/evaluations/{evaluationId}
```

Example:

```json
{
  "data": {
    "id": "EVAL-001",
    "cultural": {
      "status": "PASS",
      "findings": []
    },
    "body": {
      "status": "REVIEW_REQUIRED",
      "findings": []
    },
    "cost": {
      "status": "PASS",
      "estimated": 24200
    },
    "requirements": {
      "status": "PASS",
      "mandatorySatisfied": 8,
      "mandatoryTotal": 8
    }
  }
}
```

---

# 67. EVALUATION FINDINGS

```http
GET /api/v1/evaluations/{evaluationId}/findings
```

Finding structure:

```json
{
  "id": "FIND-001",
  "category": "BODY",
  "severity": "MEDIUM",
  "status": "OPEN",
  "message": "Manual fit review recommended.",
  "evidence": [],
  "recommendation": "Review sleeve length against manual measurements."
}
```

---

# 68. FINDING STATUS

```text
OPEN
ACKNOWLEDGED
RESOLVED
DISMISSED
REQUIRES_EXPERT_REVIEW
```

---

# 69. RESOLVE FINDING

```http
POST /api/v1/findings/{findingId}/resolve
```

Request:

```json
{
  "resolution": "Adjusted sleeve length based on manual measurement.",
  "note": "Designer reviewed body profile."
}
```

---

# 70. CULTURAL EVALUATION

Cultural checks may include:

```text
Cultural element exists
        ↓
Element verified
        ↓
Correct culture association
        ↓
Usage context supported
        ↓
Restrictions checked
        ↓
Sources available
```

Example:

```json
{
  "category": "CULTURAL",
  "status": "REVIEW_REQUIRED",
  "checks": [
    {
      "name": "Source Availability",
      "status": "PASS"
    },
    {
      "name": "Usage Context",
      "status": "REVIEW_REQUIRED"
    }
  ]
}
```

---

# 71. EXPLAINABILITY API

```http
GET /api/v1/designs/{designId}/explanations
```

Example:

```json
{
  "data": [
    {
      "decision": "TEXTILE_SELECTION",
      "what": "Selected Textile A",
      "why": "Associated with the selected cultural community and requested occasion.",
      "evidence": [
        {
          "type": "CULTURAL_RECORD",
          "id": "CE-024"
        }
      ],
      "constraint": {
        "type": "REQUIREMENT",
        "id": "REQ-004"
      }
    }
  ]
}
```

Architecture:

```text
Rule
 ↓
Evidence
 ↓
Result
 ↓
Explanation
```

---

# 72. HUMAN REVIEW API

## Submit Review

```http
POST /api/v1/designs/{designId}/reviews
```

Request:

```json
{
  "decision": "REQUEST_REVISION",
  "comments": "Reduce ornamentation and review sleeve construction."
}
```

Allowed decisions:

```text
ACCEPT
REJECT
REQUEST_REVISION
```

---

# 73. REVIEW HISTORY

```http
GET /api/v1/designs/{designId}/reviews
```

---

# 74. DESIGN APPROVAL

Approval must be explicit.

```http
POST /api/v1/designs/{designId}/approve
```

Request:

```json
{
  "versionId": "DV-003",
  "approvalNote": "Reviewed and approved for final presentation."
}
```

Response:

```json
{
  "data": {
    "designId": "DES-001",
    "status": "APPROVED",
    "approvedVersionId": "DV-003",
    "approvedBy": "USR-001"
  }
}
```

The system must never automatically convert:

```text
AI GENERATED
```

into:

```text
APPROVED
```

---

# 75. FINALIZATION

```http
POST /api/v1/designs/{designId}/finalize
```

Preconditions:

```text
Design exists
AND
Evaluation completed
AND
No unresolved blocking findings
AND
Human approval exists
```

---

# 76. REPORT API

## Generate Report

```http
POST /api/v1/projects/{projectId}/reports
```

Request:

```json
{
  "type": "DESIGN_REPORT",
  "format": "PDF",
  "includeResearch": true,
  "includeEvaluation": true,
  "includeRevisionHistory": true
}
```

Response:

```http
202 Accepted
```

```json
{
  "data": {
    "jobId": "REPORT-JOB-001",
    "status": "QUEUED"
  }
}
```

---

# 77. GET REPORT

```http
GET /api/v1/reports/{reportId}
```

Response:

```json
{
  "data": {
    "id": "REP-001",
    "status": "COMPLETED",
    "fileUrl": "...",
    "createdAt": "..."
  }
}
```

---

# 78. REPORT CONTENT

The report should contain:

```text
Project Information
Designer
Client Profile
Design Requirements
Cultural Research
Selected Cultural Elements
Cultural Sources
Body Profile
Design Concept
Generated Images
Design Specification
Materials
Cost Estimate
Evaluation
Explainability
Designer Notes
Revision History
Final Approval
```

---

# 79. FILE UPLOAD API

For general project files:

```http
POST /api/v1/projects/{projectId}/files
```

Use:

```text
multipart/form-data
```

Allowed categories:

```text
REFERENCE
CULTURAL_IMAGE
DESIGN_IMAGE
BODY_IMAGE
DOCUMENT
REPORT
```

---

# 80. FILE SECURITY

Every upload must validate:

```text
MIME type
File extension
File size
File signature
User permission
Storage location
```

Never trust the filename or MIME type supplied by the browser alone.

---

# 81. OBJECT STORAGE

Recommended architecture:

```text
API
 ↓
Object Storage
 ↓
Database metadata
```

Database stores:

```text
fileId
storageKey
fileName
mimeType
size
owner
projectId
createdAt
```

Do not store large images directly inside PostgreSQL unless there is a specific reason.

---

# 82. AUDIT API

Audit logs are generally read-only to normal users.

```http
GET /api/v1/audit-logs
```

Filters:

```text
?userId=
&projectId=
&action=
&from=
&to=
```

Actions:

```text
LOGIN
PROJECT_CREATED
CULTURAL_RECORD_VIEWED
CULTURAL_RECORD_CREATED
CULTURAL_RECORD_VERIFIED
DESIGN_CREATED
DESIGN_GENERATED
AI_CONTEXT_CREATED
EVALUATION_RUN
DESIGN_MODIFIED
DESIGN_ACCEPTED
DESIGN_REJECTED
DESIGN_APPROVED
REPORT_GENERATED
```

---

# 83. SEARCH

General project search:

```http
GET /api/v1/search
```

Example:

```text
GET /api/v1/search?q=festival
```

Search categories:

```text
PROJECT
CULTURAL_ELEMENT
MATERIAL
DESIGN
REPORT
```

---

# 84. PAGINATION

All potentially large collections must support pagination.

Example:

```text
?page=1&pageSize=20
```

Recommended limits:

```text
default pageSize = 20
maximum pageSize = 100
```

For very large collections, cursor pagination may be introduced.

Example:

```text
?cursor=eyJpZCI6...
&limit=20
```

Pagination, filtering, and stable sorting should be part of the API contract rather than added after the API grows.

---

# 85. SORTING

Example:

```text
?sort=createdAt
```

Descending:

```text
?sort=-createdAt
```

Multiple fields:

```text
?sort=-createdAt,name
```

Only supported sort fields may be accepted.

---

# 86. FILTERING

Example:

```text
?status=APPROVED
&cultureId=CUL-001
```

Unsupported filters should return an error rather than silently being ignored.

---

# 87. ERROR RESPONSE

The API should use a predictable machine-readable error structure.

Example:

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "One or more fields are invalid.",
  "instance": "/api/v1/projects",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "budget",
      "code": "INVALID_VALUE",
      "message": "Budget must be greater than zero."
    }
  ],
  "requestId": "req_01JABC"
}
```

A standardized problem-details style is preferable because clients can reliably distinguish HTTP outcome from application-specific error information.

---

# 88. HTTP STATUS CODES

Use standard HTTP semantics.

| Code | Meaning                           |
| ---- | --------------------------------- |
| 200  | Successful request                |
| 201  | Resource created                  |
| 202  | Async operation accepted          |
| 204  | Successful operation with no body |
| 400  | Malformed request                 |
| 401  | Authentication required/invalid   |
| 403  | Permission denied                 |
| 404  | Resource not found                |
| 409  | Resource/state conflict           |
| 412  | Preconditions failed              |
| 415  | Unsupported media type            |
| 422  | Semantic validation failure       |
| 429  | Rate limit exceeded               |
| 500  | Internal server error             |
| 503  | Service unavailable               |

Using the standard HTTP status semantics keeps clients, monitoring systems, and API documentation predictable.

---

# 89. VALIDATION

Every request must be validated before entering the service layer.

Recommended TypeScript stack:

```text
Zod
```

Example:

```typescript
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  cultureId: z.string().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().length(3),
});
```

---

# 90. DOMAIN VALIDATION

Schema validation is not enough.

Example:

```text
budget = -1000
```

Schema:

```text
INVALID
```

Another example:

```text
design has restricted cultural element
```

Schema:

```text
VALID
```

Domain rules:

```text
REVIEW_REQUIRED
```

Therefore:

```text
Request Validation
        ↓
Domain Validation
        ↓
Business Rules
```

---

# 91. IDEMPOTENCY

Expensive or duplicate-sensitive operations should support:

```http
Idempotency-Key: 01JABCXYZ
```

Especially:

```text
AI generation
AI refinement
Cost snapshot creation
Report generation
File processing
Payment-like external operations
```

Example:

```http
POST /api/v1/designs/DES-001/generation-jobs
Idempotency-Key: gen-DES-001-001
```

If the same request is repeated with the same key, the API should return the original operation/result rather than starting another generation.

---

# 92. ASYNCHRONOUS OPERATIONS

Long-running operations must not block normal HTTP requests.

Examples:

```text
AI image generation
Computer vision
Evaluation
PDF report generation
Large file processing
```

Pattern:

```text
POST
 ↓
202 Accepted
 ↓
jobId
 ↓
GET /ai/jobs/{jobId}
```

Example:

```json
{
  "data": {
    "jobId": "JOB-001",
    "status": "PROCESSING"
  }
}
```

---

# 93. JOB COMPLETION

Completed:

```json
{
  "data": {
    "jobId": "JOB-001",
    "status": "COMPLETED",
    "result": {
      "designVersionId": "DV-003"
    }
  }
}
```

Failed:

```json
{
  "data": {
    "jobId": "JOB-001",
    "status": "FAILED",
    "errorCode": "AI_PROVIDER_ERROR"
  }
}
```

---

# 94. POLLING

MVP should use polling.

```text
Frontend
 ↓
POST generation
 ↓
jobId
 ↓
GET job
 ↓
GET job
 ↓
GET job
 ↓
COMPLETED
```

Recommended polling interval:

```text
2–5 seconds
```

The frontend should stop polling when:

```text
COMPLETED
FAILED
CANCELLED
```

---

# 95. FUTURE REAL-TIME EVENTS

Later versions may use:

```text
WebSocket
Server-Sent Events
```

Example:

```text
generation.started
generation.progress
generation.completed
generation.failed
evaluation.completed
report.completed
```

This is optional for MVP.

---

# 96. OPTIMISTIC LOCKING

Designs are collaborative and version-sensitive.

Use:

```text
versionNumber
```

Example:

```json
{
  "id": "DES-001",
  "versionNumber": 4
}
```

Update:

```http
PATCH /api/v1/designs/DES-001
If-Match: "4"
```

If another user changed the design:

```http
409 Conflict
```

This prevents accidental overwriting.

---

# 97. DESIGN VERSION IMMUTABILITY

Once a design version becomes:

```text
APPROVED
```

it should become immutable.

If changes are required:

```text
Approved V3
     ↓
Create V4
     ↓
Modify
     ↓
Evaluate
     ↓
Review
     ↓
Approve
```

Never silently modify historical approved versions.

---

# 98. API SERVICE ARCHITECTURE

Recommended:

```text
API ROUTE
   ↓
CONTROLLER
   ↓
VALIDATOR
   ↓
APPLICATION SERVICE
   ↓
DOMAIN RULES
   ↓
REPOSITORY
   ↓
DATABASE
```

For example:

```text
POST /designs/{id}/generation-jobs
              ↓
GenerationController
              ↓
GenerationRequestValidator
              ↓
AIGenerationService
              ↓
ContextBuilder
              ↓
CultureService
              ↓
RequirementService
              ↓
BodyService
              ↓
AI Provider
```

---

# 99. SERVICE MODULES

Backend:

```text
services/
├── auth/
├── projects/
├── culture/
├── body/
├── requirements/
├── materials/
├── suppliers/
├── designs/
├── ai/
├── costing/
├── evaluation/
├── explanation/
├── reviews/
├── reports/
├── files/
└── audit/
```

---

# 100. TYPESCRIPT DTO EXAMPLES

## Project DTO

```typescript
export interface ProjectDTO {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  cultureId?: string;
  occasionId?: string;
  budget?: number;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

---

# 101. Design DTO

```typescript
export interface DesignDTO {
  id: string;
  projectId: string;
  name: string;
  status: DesignStatus;
  currentVersionId?: string;
  approvedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

# 102. Design Specification DTO

```typescript
export interface DesignSpecificationDTO {
  silhouette: string;
  garmentComponents: string[];
  culturalElements: string[];
  textiles: string[];
  colors: string[];
  materials: string[];
  constructionNotes: string[];
  accessories: string[];
  bodyConsiderations: string[];
  estimatedCost?: number;
  culturalReferences: string[];
}
```

---

# 103. Cultural Evidence DTO

```typescript
export interface CulturalEvidenceDTO {
  elementId: string;
  sourceId: string;
  claim: string;
  validationStatus:
    | "UNVERIFIED"
    | "UNDER_REVIEW"
    | "VERIFIED"
    | "RESTRICTED"
    | "DEPRECATED";
}
```

---

# 104. Evaluation DTO

```typescript
export interface EvaluationDTO {
  id: string;
  designVersionId: string;

  cultural: EvaluationCategory;
  body: EvaluationCategory;
  cost: EvaluationCategory;
  requirements: EvaluationCategory;

  overallStatus: "PASS" | "REVIEW_REQUIRED" | "FAIL";
}
```

---

# 105. Evaluation CATEGORY

```typescript
export interface EvaluationCategory {
  status: "PASS" | "REVIEW_REQUIRED" | "FAIL";
  findings: EvaluationFindingDTO[];
}
```

---

# 106. COST DTO

```typescript
export interface CostCalculationDTO {
  id: string;
  designVersionId: string;
  currency: string;

  materialSubtotal: number;
  laborSubtotal: number;
  decorationSubtotal: number;
  otherSubtotal: number;

  directCost: number;
  contingency: number;
  estimatedTotal: number;

  budget?: number;
  variance?: number;

  status:
    | "UNDER_BUDGET"
    | "NEAR_BUDGET"
    | "AT_BUDGET"
    | "OVER_BUDGET"
    | "INCOMPLETE"
    | "REVIEW_REQUIRED";
}
```

---

# 107. AI JOB DTO

```typescript
export interface AIJobDTO {
  id: string;

  type:
    | "DESIGN_GENERATION"
    | "DESIGN_REFINEMENT"
    | "BODY_ANALYSIS"
    | "EVALUATION"
    | "REPORT_GENERATION";

  status:
    | "QUEUED"
    | "PROCESSING"
    | "GENERATING_SPECIFICATION"
    | "GENERATING_IMAGE"
    | "EVALUATING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";

  progress?: number;

  createdAt: string;
  updatedAt: string;
}
```

---

# 108. AI BOUNDARY

The AI layer must not directly access the database.

Incorrect:

```text
LLM
 ↓
Database
```

Correct:

```text
LLM
 ↓
AI Orchestrator
 ↓
Controlled Services / MCP Tools
 ↓
Database
```

Example tools:

```text
search_cultural_knowledge
get_cultural_element
get_cultural_rules
get_body_profile
get_design_requirements
get_material_prices
calculate_cost
get_previous_design
create_design_record
```

---

# 109. MCP/API RELATIONSHIP

MCP is an AI-facing controlled interface.

The public frontend uses:

```text
REST API
```

AI uses:

```text
MCP / Internal Tool Interface
```

Architecture:

```text
                    ┌──────────────┐
                    │   Frontend   │
                    └──────┬───────┘
                           │
                         REST
                           │
                    ┌──────▼───────┐
                    │ Application   │
                    │     API       │
                    └──────┬────────┘
                           │
                    ┌──────▼───────┐
                    │   Services    │
                    └──────┬────────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
              Database             AI
                                     │
                                   MCP
                                     │
                              Controlled Tools
```

The AI should never receive unrestricted database credentials.

---

# 110. AI VS DETERMINISTIC RESULTS

This distinction is mandatory.

## AI may recommend

```text
material selection
silhouette
color combination
design variation
construction concept
accessory concept
design explanation
```

## Application must calculate/validate

```text
final material cost
labor cost
total cost
budget status
requirement satisfaction
cultural record status
restriction status
approval status
version status
```

Therefore:

```text
AI Recommendation ≠ System Fact
```

---

# 111. COSTING BOUNDARY

Never do:

```text
LLM → "The design costs ₱24,000."
```

Instead:

```text
LLM
 ↓
Suggested Materials
 ↓
Material IDs
 ↓
Verified Price Database
 ↓
Cost Engine
 ↓
₱24,000
```

The final cost must be generated by deterministic application logic.

---

# 112. CULTURAL KNOWLEDGE BOUNDARY

Never use:

```text
LLM knowledge
```

as the authoritative cultural source.

Instead:

```text
Cultural Knowledge Base
        ↓
Verified Cultural Elements
        ↓
Rules / Restrictions
        ↓
AI Context
        ↓
AI Recommendation
```

---

# 113. SECURITY REQUIREMENTS

The API must implement:

```text
Authentication
Authorization
Input Validation
Output Filtering
Rate Limiting
Audit Logging
Secure File Upload
CORS Policy
CSRF Protection where applicable
Secure Headers
Secret Management
Encryption in Transit
Encryption at Rest
```

---

# 114. AI API KEY SECURITY

Never place AI provider credentials in frontend code.

Incorrect:

```text
NEXT_PUBLIC_AI_API_KEY
```

Correct:

```text
AI_API_KEY
```

stored server-side.

The frontend communicates only with:

```text
/api/v1/...
```

---

# 115. BODY DATA PRIVACY

Body profiles and body images may contain sensitive personal information.

The API must support:

```text
Access restriction
Consent
Deletion
Controlled storage
Audit logging
Minimal data collection
```

Body image URLs should never be publicly exposed by default.

Use:

```text
signed URLs
```

or authenticated file endpoints.

---

# 116. RATE LIMITING

Rate limits should be different by operation.

Example:

```text
Normal GET:
100 requests/minute

Normal mutation:
30 requests/minute

AI generation:
10 requests/hour/user

AI refinement:
20 requests/hour/user
```

These values are configurable.

When exceeded:

```http
429 Too Many Requests
```

---

# 117. EXPENSIVE OPERATION PROTECTION

AI endpoints must have:

```text
Authentication
Rate limiting
Idempotency
Quota
Job tracking
Timeout
Retry policy
Cost tracking
```

---

# 118. EXTERNAL AI PROVIDER FAILURE

If an AI provider fails:

```text
AI Provider
     ↓
Failure
     ↓
Retry
     ↓
Fallback Provider
     ↓
Failure
     ↓
Job FAILED
```

The API must not pretend generation succeeded.

---

# 119. TRANSACTION BOUNDARIES

Operations involving multiple database writes should use transactions.

Example:

```text
Create Design Version
        +
Create Image Metadata
        +
Create Evaluation Record
        +
Create Audit Log
```

should be coordinated appropriately.

However, external AI calls should not remain inside a long database transaction.

Correct:

```text
Create Job
   ↓
Commit
   ↓
Call AI Provider
   ↓
Store Result
   ↓
Update Job
```

---

# 120. DATABASE/API SEPARATION

The API must not expose raw database schemas.

Incorrect:

```text
GET /api/v1/material_prices_table
```

Correct:

```text
GET /api/v1/materials/{materialId}/prices
```

The API represents domain resources, not database tables.

---

# 121. API ENDPOINT SUMMARY

| Domain            | Method | Endpoint                               |
| ----------------- | ------ | -------------------------------------- |
| Projects          | POST   | `/projects`                            |
| Projects          | GET    | `/projects`                            |
| Projects          | GET    | `/projects/{id}`                       |
| Projects          | PATCH  | `/projects/{id}`                       |
| Projects          | POST   | `/projects/{id}/archive`               |
| Cultures          | GET    | `/cultures`                            |
| Cultures          | GET    | `/cultures/{id}`                       |
| Cultural Elements | GET    | `/cultural-elements`                   |
| Cultural Elements | GET    | `/cultural-elements/{id}`              |
| Cultural Elements | POST   | `/cultural-elements`                   |
| Cultural Elements | POST   | `/cultural-elements/{id}/verify`       |
| Body              | POST   | `/body-profiles`                       |
| Body              | GET    | `/body-profiles/{id}`                  |
| Body              | PATCH  | `/body-profiles/{id}`                  |
| Body              | POST   | `/body-profiles/{id}/analysis-jobs`    |
| Requirements      | POST   | `/projects/{id}/requirements`          |
| Requirements      | GET    | `/projects/{id}/requirements`          |
| Materials         | GET    | `/materials`                           |
| Materials         | POST   | `/materials`                           |
| Prices            | GET    | `/materials/{id}/prices`               |
| Suppliers         | GET    | `/suppliers`                           |
| Designs           | POST   | `/projects/{id}/designs`               |
| Designs           | GET    | `/projects/{id}/designs`               |
| Designs           | GET    | `/designs/{id}`                        |
| Designs           | PATCH  | `/designs/{id}`                        |
| Versions          | GET    | `/designs/{id}/versions`               |
| Images            | POST   | `/designs/{id}/images`                 |
| AI                | POST   | `/designs/{id}/generation-jobs`        |
| AI                | POST   | `/designs/{id}/refinement-jobs`        |
| AI Jobs           | GET    | `/ai/jobs/{id}`                        |
| AI Jobs           | POST   | `/ai/jobs/{id}/cancel`                 |
| Cost              | POST   | `/designs/{id}/cost-calculations`      |
| Cost              | GET    | `/design-versions/{id}/cost-snapshots` |
| Evaluation        | POST   | `/designs/{id}/evaluations`            |
| Evaluation        | GET    | `/evaluations/{id}`                    |
| Findings          | GET    | `/evaluations/{id}/findings`           |
| Findings          | POST   | `/findings/{id}/resolve`               |
| Explanation       | GET    | `/designs/{id}/explanations`           |
| Reviews           | POST   | `/designs/{id}/reviews`                |
| Reviews           | GET    | `/designs/{id}/reviews`                |
| Approval          | POST   | `/designs/{id}/approve`                |
| Finalization      | POST   | `/designs/{id}/finalize`               |
| Reports           | POST   | `/projects/{id}/reports`               |
| Reports           | GET    | `/reports/{id}`                        |
| Files             | POST   | `/projects/{id}/files`                 |
| Audit             | GET    | `/audit-logs`                          |
| Search            | GET    | `/search`                              |

---

# 122. COMPLETE USER WORKFLOW

The following represents the primary API workflow.

## Step 1 — Create Project

```http
POST /api/v1/projects
```

Result:

```text
PROJ-001
```

---

## Step 2 — Select Culture

```http
GET /api/v1/cultures
```

Then:

```http
GET /api/v1/cultures/CUL-001
```

---

## Step 3 — Research Cultural Elements

```http
GET /api/v1/cultural-elements?cultureId=CUL-001&status=VERIFIED
```

---

## Step 4 — Add Research Elements

```http
POST /api/v1/projects/PROJ-001/cultural-elements
```

---

## Step 5 — Create Body Profile

```http
POST /api/v1/body-profiles
```

Result:

```text
BODY-001
```

---

## Step 6 — Create Requirements

```http
POST /api/v1/projects/PROJ-001/requirements
```

---

## Step 7 — Select Materials

```http
GET /api/v1/materials
```

---

## Step 8 — Create Design

```http
POST /api/v1/projects/PROJ-001/designs
```

Result:

```text
DES-001
```

---

## Step 9 — Start AI Generation

```http
POST /api/v1/designs/DES-001/generation-jobs
```

Result:

```text
JOB-001
```

---

## Step 10 — Monitor Job

```http
GET /api/v1/ai/jobs/JOB-001
```

---

## Step 11 — Receive Generated Design

```text
JOB-001
 ↓
COMPLETED
 ↓
Design Version V1
```

---

## Step 12 — Calculate Cost

```http
POST /api/v1/designs/DES-001/cost-calculations
```

---

## Step 13 — Evaluate

```http
POST /api/v1/designs/DES-001/evaluations
```

---

## Step 14 — View Findings

```http
GET /api/v1/evaluations/EVAL-001/findings
```

---

## Step 15 — Designer Reviews

```http
POST /api/v1/designs/DES-001/reviews
```

Possible result:

```text
REQUEST_REVISION
```

---

## Step 16 — AI Refinement

```http
POST /api/v1/designs/DES-001/refinement-jobs
```

---

## Step 17 — New Version

```text
V1
 ↓
V2
```

---

## Step 18 — Recalculate

```http
POST /api/v1/designs/DES-001/cost-calculations
```

---

## Step 19 — Re-evaluate

```http
POST /api/v1/designs/DES-001/evaluations
```

---

## Step 20 — Human Approval

```http
POST /api/v1/designs/DES-001/approve
```

---

## Step 21 — Finalize

```http
POST /api/v1/designs/DES-001/finalize
```

---

## Step 22 — Generate Report

```http
POST /api/v1/projects/PROJ-001/reports
```

---

# 123. API WORKFLOW DIAGRAM

```text
                USER
                 │
                 ▼
          ┌─────────────┐
          │   FRONTEND  │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐
          │  REST API   │
          └──────┬──────┘
                 │
       ┌─────────┼──────────┐
       ▼         ▼          ▼
   PROJECT     CULTURE     BODY
       │         │          │
       └─────────┼──────────┘
                 ▼
          REQUIREMENTS
                 │
                 ▼
              DESIGN
                 │
                 ▼
          AI GENERATION
                 │
                 ▼
          DESIGN VERSION
                 │
        ┌────────┼─────────┐
        ▼        ▼         ▼
      COST   EVALUATION  EXPLANATION
        │        │         │
        └────────┼─────────┘
                 ▼
          HUMAN REVIEW
                 │
          ┌──────┴──────┐
          ▼             ▼
       REVISION       APPROVE
          │             │
          └──────┬──────┘
                 ▼
             FINALIZE
                 │
                 ▼
              REPORT
```

---

# 124. OPENAPI SPECIFICATION

The API should have an OpenAPI specification.

Recommended location:

```text
/docs/openapi.yaml
```

or:

```text
/docs/openapi.json
```

Swagger UI:

```text
/api/docs
```

Alternative:

```text
/api/swagger
```

The OpenAPI document should describe:

```text
Endpoints
Parameters
Request Bodies
Response Bodies
Authentication
Status Codes
Errors
Schemas
Enums
Examples
```

OpenAPI is particularly useful here because the API becomes a shared contract between the Next.js frontend, backend services, testing tools, and future integrations.

---

# 125. API CLIENT GENERATION

The frontend should ideally consume generated types from the API contract.

Concept:

```text
OpenAPI
   ↓
Generated TypeScript Types
   ↓
API Client
   ↓
React Application
```

Example:

```text
src/lib/api/generated/
```

This reduces mismatches between frontend and backend types.

---

# 126. FRONTEND API STRUCTURE

```text
src/
└── lib/
    └── api/
        ├── client.ts
        ├── projects.ts
        ├── cultures.ts
        ├── body.ts
        ├── requirements.ts
        ├── materials.ts
        ├── designs.ts
        ├── ai.ts
        ├── costing.ts
        ├── evaluation.ts
        ├── reports.ts
        └── files.ts
```

---

# 127. EXAMPLE FRONTEND CLIENT

```typescript
export async function createProject(
  input: CreateProjectInput,
): Promise<ProjectDTO> {
  const response = await api.post("/projects", input);

  return response.data.data;
}
```

---

# 128. API STATE HANDLING

Frontend should distinguish:

```text
idle
loading
success
error
```

For AI jobs:

```text
queued
processing
generating
evaluating
completed
failed
cancelled
```

---

# 129. ERROR DISPLAY

The frontend should transform API errors into useful messages.

Example:

API:

```json
{
  "code": "BUDGET_TOO_LOW",
  "detail": "The requested design requirements cannot currently be satisfied within the specified budget."
}
```

UI:

```text
Budget Issue

The current requirements may exceed the specified budget.

Review:
• Material selection
• Decoration complexity
• Labor requirements
```

Do not display raw stack traces.

---

# 130. AUDITABILITY REQUIREMENT

Important operations must generate audit events.

Example:

```text
AI Generation
 ↓
Audit Log
```

Audit record:

```json
{
  "action": "DESIGN_GENERATED",
  "userId": "USR-001",
  "projectId": "PROJ-001",
  "designId": "DES-001",
  "versionId": "DV-001",
  "timestamp": "...",
  "requestId": "req-001"
}
```

---

# 131. AI TRACEABILITY

Every generated design should be traceable to:

```text
Project
Requirements
Body Profile
Cultural Elements
Material Inputs
AI Context
Prompt Version
AI Model
AI Job
Generated Image
Design Version
Evaluation
Designer Review
```

This creates the complete chain:

```text
INPUT
 ↓
AI CONTEXT
 ↓
GENERATION
 ↓
OUTPUT
 ↓
EVALUATION
 ↓
HUMAN REVIEW
 ↓
FINAL DESIGN
```

---

# 132. API LOGGING

Every request should record where appropriate:

```text
requestId
userId
endpoint
method
statusCode
duration
timestamp
```

AI operations additionally:

```text
model
provider
tokens/input usage where available
generation duration
estimated provider cost
jobId
```

Never log:

```text
password
access token
API key
private body images
sensitive personal data unnecessarily
```

---

# 133. OBSERVABILITY

Monitor:

```text
API latency
error rate
AI job duration
AI failure rate
database latency
file upload failures
evaluation duration
report generation duration
```

Suggested metrics:

```text
api_request_duration_ms
api_request_total
api_error_total
ai_job_duration_ms
ai_job_failure_total
cost_calculation_duration_ms
evaluation_duration_ms
report_generation_duration_ms
```

---

# 134. API TESTING

Each endpoint should have:

## Unit Tests

```text
Validation
Business rules
Cost calculations
Permission rules
```

## Integration Tests

```text
API → Service
Service → Database
API → Job Queue
```

## End-to-End Tests

```text
Create project
 ↓
Generate design
 ↓
Evaluate
 ↓
Review
 ↓
Approve
 ↓
Generate report
```

---

# 135. CRITICAL API TEST CASES

## Test 1 — Unauthorized

```text
GET /projects
```

without authentication.

Expected:

```http
401
```

---

## Test 2 — Forbidden

Viewer attempts to verify cultural record.

Expected:

```http
403
```

---

## Test 3 — Missing Project

```text
GET /projects/INVALID
```

Expected:

```http
404
```

---

## Test 4 — Invalid Budget

```json
{
  "budget": -5000
}
```

Expected:

```http
422
```

---

## Test 5 — Duplicate AI Request

Same:

```text
Idempotency-Key
```

Expected:

```text
same job/result
```

not two independent generation jobs.

---

# 136. COST TEST

Given:

```text
Material = 10 meters
Price = ₱500/m
```

Expected:

```text
₱5,000
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
5,000 + 3,000 + 2,000 + 500
= ₱10,500
```

10% contingency:

```text
₱1,050
```

Total:

```text
₱11,550
```

The API must produce the result through the deterministic cost engine.

---

# 137. CULTURAL VALIDATION TEST

Input:

```text
Cultural Element = CE-001
Status = VERIFIED
```

Expected:

```text
Cultural Source = AVAILABLE
```

If:

```text
Status = UNVERIFIED
```

Expected:

```text
REVIEW_REQUIRED
```

The AI must not override this result.

---

# 138. RESTRICTED ELEMENT TEST

Input:

```text
Cultural Element
Status = RESTRICTED
```

Expected:

```text
BLOCKED or REVIEW_REQUIRED
```

depending on the configured rule.

---

# 139. APPROVAL TEST

Attempt:

```text
POST /designs/DES-001/approve
```

while:

```text
Evaluation = incomplete
```

Expected:

```http
409 Conflict
```

or domain-specific validation response.

Approval must not proceed.

---

# 140. VERSION CONFLICT TEST

Designer A reads:

```text
Version = 4
```

Designer B modifies:

```text
Version = 5
```

Designer A attempts to update version 4.

Expected:

```http
409 Conflict
```

The frontend should inform the user that the design has changed and require refresh/reconciliation.

---

# 141. MVP API SCOPE

The first implementation should not attempt every endpoint simultaneously.

## MVP Required

```text
Authentication
Projects
Cultures
Cultural Elements
Body Profiles
Requirements
Materials
Designs
Design Versions
AI Generation Jobs
Cost Calculation
Evaluation
Human Review
Approval
Reports
Audit Logs
```

---

# 142. MVP ENDPOINTS

Minimum working API:

```text
POST   /projects
GET    /projects
GET    /projects/{id}

GET    /cultures
GET    /cultural-elements
GET    /cultural-elements/{id}

POST   /body-profiles
GET    /body-profiles/{id}

POST   /projects/{id}/requirements
GET    /projects/{id}/requirements

GET    /materials

POST   /projects/{id}/designs
GET    /projects/{id}/designs
GET    /designs/{id}

POST   /designs/{id}/generation-jobs
GET    /ai/jobs/{id}

GET    /designs/{id}/versions

POST   /designs/{id}/cost-calculations
POST   /designs/{id}/evaluations

GET    /evaluations/{id}

POST   /designs/{id}/reviews
POST   /designs/{id}/approve

POST   /projects/{id}/reports
GET    /reports/{id}
```

---

# 143. ADVANCED API SCOPE

Later:

```text
Knowledge Graph management
Vector search
Computer vision
Advanced body analysis
Real-time WebSockets
MCP
AI provider fallback
Advanced analytics
Design comparison
Advanced supplier management
Price history
Multi-currency
Multi-tenant support
Advanced reporting
External integrations
```

---

# 144. RECOMMENDED IMPLEMENTATION ORDER

Implement API in this order:

```text
PHASE 1
Authentication
Projects
Users
Roles
```

↓

```text
PHASE 2
Culture
Cultural Elements
Sources
Verification
```

↓

```text
PHASE 3
Body Profiles
Requirements
```

↓

```text
PHASE 4
Materials
Suppliers
Prices
```

↓

```text
PHASE 5
Designs
Versions
Images
```

↓

```text
PHASE 6
AI Jobs
Generation
Refinement
```

↓

```text
PHASE 7
Cost Engine
```

↓

```text
PHASE 8
Evaluation
Findings
Explanation
```

↓

```text
PHASE 9
Human Review
Approval
Finalization
```

↓

```text
PHASE 10
Reports
Audit
Analytics
```

---

# 145. API DIRECTORY

Recommended backend structure:

```text
backend/
├── api/
│   └── v1/
│       ├── auth/
│       ├── projects/
│       ├── cultures/
│       ├── cultural-elements/
│       ├── body-profiles/
│       ├── requirements/
│       ├── materials/
│       ├── suppliers/
│       ├── designs/
│       ├── design-versions/
│       ├── ai/
│       ├── cost/
│       ├── evaluations/
│       ├── findings/
│       ├── reviews/
│       ├── reports/
│       ├── files/
│       └── audit/
│
├── services/
│   ├── project/
│   ├── culture/
│   ├── body/
│   ├── requirements/
│   ├── materials/
│   ├── design/
│   ├── ai/
│   ├── costing/
│   ├── evaluation/
│   ├── explanation/
│   ├── review/
│   ├── report/
│   └── audit/
│
├── repositories/
├── models/
├── schemas/
├── middleware/
├── jobs/
├── integrations/
└── config/
```

---

# 146. FINAL API ARCHITECTURE

The completed API architecture should look like:

```text
                         FRONTEND
                            │
                            ▼
                    ┌───────────────┐
                    │ REST API v1   │
                    └───────┬───────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
              ▼             ▼              ▼
         PROJECT       CULTURAL        DESIGN
         SERVICE       SERVICE         SERVICE
              │             │              │
              │             ▼              │
              │       KNOWLEDGE GRAPH     │
              │             │              │
              └─────────────┼──────────────┘
                            │
                            ▼
                     AI ORCHESTRATOR
                            │
                    ┌───────┴────────┐
                    ▼                ▼
                  LLM          IMAGE MODEL
                    │                │
                    └───────┬────────┘
                            ▼
                       DESIGN OUTPUT
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          COST ENGINE   EVALUATION     EXPLANATION
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                      HUMAN REVIEW
                            │
                       APPROVAL
                            │
                            ▼
                         REPORT
```

---

# 147. MOST IMPORTANT ARCHITECTURAL RULES

The following rules are mandatory.

## Rule 1

**The frontend never communicates directly with the database.**

```text
Frontend → API → Services → Database
```

---

## Rule 2

**The AI never communicates directly with the database.**

```text
AI → Controlled Tools/Services → Database
```

---

## Rule 3

**The AI does not determine the final cost.**

```text
AI suggestion → Cost Engine → Final Calculation
```

---

## Rule 4

**The image-generation model is not the cultural source of truth.**

```text
Verified Knowledge → AI Context → Generation
```

---

## Rule 5

**AI output does not equal approval.**

```text
AI Output
    ↓
Evaluation
    ↓
Human Review
    ↓
Approval
```

---

## Rule 6

**Historical design versions must remain traceable.**

```text
V1
V2
V3
...
```

must remain available according to retention rules.

---

## Rule 7

**Approved versions must be immutable.**

Changes create a new version.

---

## Rule 8

**Important AI operations must be asynchronous.**

```text
Request
 ↓
Job
 ↓
Processing
 ↓
Result
```

---

## Rule 9

**Every important decision should have evidence where applicable.**

```text
Recommendation
 ↓
Evidence
 ↓
Explanation
```

---

## Rule 10

**Human designer remains the final decision-maker.**

The system assists, validates, explains, and records.

The system does not replace human approval.

---

# 148. API ACCEPTANCE CRITERIA

The API specification is considered implemented when:

### Authentication

- [ ] Protected endpoints require authentication.
- [ ] Roles are enforced.
- [ ] Unauthorized access returns appropriate status codes.

### Projects

- [ ] Projects can be created.
- [ ] Projects can be viewed.
- [ ] Projects can be updated.
- [ ] Projects can be archived.

### Culture

- [ ] Cultural records can be searched.
- [ ] Cultural sources are accessible.
- [ ] Verification status is stored.
- [ ] Restrictions are retrievable.
- [ ] Unverified records cannot be silently treated as verified.

### Body

- [ ] Manual measurements can be stored.
- [ ] Estimated measurements are distinguishable.
- [ ] User corrections are recorded.

### Requirements

- [ ] Requirements support priority.
- [ ] Mandatory requirements are identifiable.
- [ ] Restricted requirements are identifiable.

### Materials

- [ ] Materials can be retrieved.
- [ ] Prices can be retrieved.
- [ ] Suppliers can be associated.
- [ ] Price history can be stored.

### AI

- [ ] Generation is asynchronous.
- [ ] Jobs are trackable.
- [ ] Jobs can fail safely.
- [ ] Idempotency is supported.
- [ ] AI output is versioned.
- [ ] AI context is traceable.

### Cost

- [ ] Costs are calculated deterministically.
- [ ] Material prices are captured.
- [ ] Labor is calculated.
- [ ] Contingency is calculated.
- [ ] Budget comparison is generated.
- [ ] Cost snapshots are reproducible.

### Evaluation

- [ ] Cultural evaluation exists.
- [ ] Body evaluation exists.
- [ ] Cost evaluation exists.
- [ ] Requirement evaluation exists.
- [ ] Findings are recorded.
- [ ] Findings can be resolved.

### Human Review

- [ ] Designer can accept.
- [ ] Designer can reject.
- [ ] Designer can request revision.
- [ ] Review history is retained.
- [ ] Approval is explicit.

### Reports

- [ ] Reports can be generated.
- [ ] Report generation is asynchronous.
- [ ] Reports include traceability information.

### Security

- [ ] API keys are server-side only.
- [ ] Body images are protected.
- [ ] Files are validated.
- [ ] Audit logs exist.
- [ ] Rate limiting exists.
- [ ] Errors do not expose internal secrets.

---

# 149. FINAL API PRINCIPLE

The API should implement the platform's central philosophy:

```text
KNOWLEDGE
    ↓
CONSTRAINTS
    ↓
AI GENERATION
    ↓
DETERMINISTIC VALIDATION
    ↓
EXPLANATION
    ↓
HUMAN REVIEW
    ↓
REVISION
    ↓
HUMAN APPROVAL
    ↓
FINAL DESIGN
```

The API is therefore not merely a CRUD layer.

It is the **control boundary that connects cultural knowledge, body information, design requirements, AI generation, deterministic costing, evaluation, explainability, and human decision-making into one traceable workflow.**

The most important separation is:

```text
             AI
              │
        RECOMMENDATIONS
              │
              ▼
        ┌─────────────┐
        │ APPLICATION │
        │    RULES    │
        └──────┬──────┘
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
   CULTURE   COST     EVALUATION
   SERVICE   ENGINE     ENGINE
      │        │        │
      └────────┼────────┘
               ▼
        EVIDENCE / RESULT
               │
               ▼
        HUMAN DESIGNER
               │
               ▼
          FINAL DECISION
```

This separation should remain intact even if the AI provider, database, frontend framework, or individual models are replaced in the future.

---

# 150. NEXT DOCUMENT

After `09_API_SPECIFICATION.md`, the next implementation document should be:

```text
10_MVP_IMPLEMENTATION_PLAN.md
```

This document should convert the architecture into an actual build sequence:

```text
Database
    ↓
Backend
    ↓
API
    ↓
Frontend
    ↓
Cultural Knowledge
    ↓
Cost Engine
    ↓
AI Orchestrator
    ↓
Evaluation
    ↓
Design Studio
    ↓
Reports
    ↓
Testing
    ↓
Deployment
```

It should also identify:

- what to build first
- what can be mocked
- what should be real
- which modules are MVP
- which features should wait
- database migration order
- folder/file creation order
- frontend screen implementation order
- backend service implementation order
- API implementation order
- AI integration points
- test strategy
- development milestones
- MVP acceptance criteria
- recommended demo flow
