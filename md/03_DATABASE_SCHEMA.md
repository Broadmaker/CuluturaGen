# 03_DATABASE_SCHEMA.md

# Human-AI Collaborative Cultural Attire Design Platform

## Database Schema Specification

**Document:** 03_DATABASE_SCHEMA.md
**Version:** 1.0
**Status:** Development Specification
**Database:** PostgreSQL
**Primary ORM:** Prisma / Drizzle / SQLAlchemy compatible
**Vector Extension:** pgvector
**Graph Integration:** Neo4j or PostgreSQL graph-compatible layer
**Storage:** Object Storage for images and generated files

---

# 1. PURPOSE

This document defines the database structure for the Human-AI Collaborative Creative Attire Design Platform.

The database must support:

- User management
- Role-based access
- Design projects
- Client profiles
- Body profiles
- Cultural knowledge
- Cultural relationships
- Cultural restrictions
- Cultural references
- Design requirements
- Materials
- Material pricing
- Cost calculations
- AI-generated designs
- Design specifications
- Design versions
- AI generation jobs
- Design evaluations
- Explainability records
- Human review
- Designer feedback
- Reports
- Audit logs
- File and image references

The database must preserve the relationship between:

```text
USER
 ↓
PROJECT
 ↓
DESIGN REQUIREMENTS
 ↓
CULTURAL KNOWLEDGE
 ↓
BODY PROFILE
 ↓
MATERIALS
 ↓
AI DESIGN
 ↓
EVALUATION
 ↓
HUMAN REVIEW
 ↓
FINAL DESIGN
```

---

# 2. DATABASE DESIGN PRINCIPLES

The database follows these principles.

## 2.1 Structured Data First

Important design information must be stored as structured data.

For example:

```text
Culture
Textile
Motif
Color
Material
Budget
Body Measurement
Requirement
Evaluation Result
```

should not exist only inside an AI prompt.

---

# 2.2 AI Output Is Not the Source of Truth

AI-generated information must be stored separately from verified system information.

For example:

```text
Cultural Knowledge
        ↓
Verified Cultural Record
        ↓
Design Constraint
        ↓
AI Recommendation
        ↓
Human Review
```

The AI cannot overwrite verified cultural records.

---

# 2.3 Human Decisions Must Be Traceable

The system must record:

- who created a design
- who modified it
- who reviewed it
- who approved it
- what AI generated
- what the designer changed
- when the change occurred

---

# 2.4 Version Everything Important

Designs should never simply overwrite previous designs.

Instead:

```text
Design V1
   ↓
Design V2
   ↓
Design V3
   ↓
Final Version
```

Each version retains its own:

- specification
- image
- AI context
- evaluation
- cost
- feedback
- approval state

---

# 2.5 Deterministic Costing

AI may suggest materials.

AI must NOT be responsible for the final arithmetic.

The database stores:

```text
Material
Quantity
Unit Price
Labor
Decoration
Other Cost
Contingency
```

The cost engine calculates the total.

---

# 3. DATABASE ARCHITECTURE

Recommended architecture:

```text
                    PostgreSQL
                        │
        ┌───────────────┼────────────────┐
        │               │                │
     Core Data      Knowledge Data    AI Data
        │               │                │
     Projects       Culture          Generations
     Users          Textiles         AI Context
     Clients        Motifs           AI Jobs
     Bodies         Symbols          Prompts
     Designs        References
        │
        ├──────────── Cost
        │
        ├──────────── Evaluation
        │
        ├──────────── Human Review
        │
        └──────────── Audit
```

---

# 4. SCHEMA ORGANIZATION

Recommended PostgreSQL schemas:

```text
public
auth
project
culture
design
ai
cost
evaluation
report
audit
```

For the MVP, these can initially remain in the `public` schema if implementing with a simpler ORM.

---

# 5. CORE ENTITIES

The primary entities are:

```text
User
Role
Project
Client
BodyProfile
DesignBrief
Design
DesignVersion
CulturalElement
Culture
Community
Region
CulturalReference
CulturalRestriction
Material
MaterialPrice
CostEstimate
CostItem
Evaluation
EvaluationFinding
Explanation
HumanReview
AIJob
AIContext
Report
AuditLog
FileAsset
```

---

# 6. USER TABLE

## Table: users

Stores application users.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT,

    first_name VARCHAR(100),
    last_name VARCHAR(100),

    display_name VARCHAR(200),

    profile_image_url TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    last_login_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Status

Allowed values:

```text
ACTIVE
INACTIVE
SUSPENDED
PENDING
```

---

# 7. ROLES

## Table: roles

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(100) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Initial roles:

```text
ADMIN
DESIGNER
CULTURAL_EXPERT
RESEARCHER
VIEWER
```

---

# 8. USER ROLES

## Table: user_roles

Many-to-many relationship between users and roles.

```sql
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, role_id)
);
```

A user may have multiple roles.

Example:

```text
Mark
 ├── DESIGNER
 └── RESEARCHER
```

---

# 9. PROJECTS

## Table: projects

A project represents one complete attire design task.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    created_by UUID NOT NULL REFERENCES users(id),

    assigned_designer UUID REFERENCES users(id),

    target_completion_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Project Status

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

# 10. CLIENTS

## Table: clients

Stores optional client information.

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    name VARCHAR(255),

    client_code VARCHAR(100),

    gender_presentation VARCHAR(100),

    age_range VARCHAR(50),

    notes TEXT,

    consent_status VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

For research/privacy purposes, unnecessary identifying information should not be stored.

---

# 11. BODY PROFILES

## Table: body_profiles

```sql
CREATE TABLE body_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    client_id UUID REFERENCES clients(id),

    height_cm DECIMAL(6,2),

    weight_kg DECIMAL(6,2),

    shoulder_width_cm DECIMAL(6,2),

    chest_cm DECIMAL(6,2),

    waist_cm DECIMAL(6,2),

    hip_cm DECIMAL(6,2),

    neck_cm DECIMAL(6,2),

    arm_length_cm DECIMAL(6,2),

    torso_length_cm DECIMAL(6,2),

    inseam_cm DECIMAL(6,2),

    leg_length_cm DECIMAL(6,2),

    measurement_source VARCHAR(50),

    confidence_level DECIMAL(5,2),

    designer_verified BOOLEAN DEFAULT FALSE,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Measurement Source

```text
MANUAL
COMPUTER_VISION
IMPORTED
ESTIMATED
```

Important:

Computer vision measurements must not automatically become authoritative measurements.

---

# 12. BODY MEASUREMENT HISTORY

## Table: body_measurement_history

```sql
CREATE TABLE body_measurement_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    body_profile_id UUID NOT NULL REFERENCES body_profiles(id),

    measurement_name VARCHAR(100) NOT NULL,

    value DECIMAL(8,2),

    unit VARCHAR(20) DEFAULT 'cm',

    source VARCHAR(50),

    confidence DECIMAL(5,2),

    verified BOOLEAN DEFAULT FALSE,

    created_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

This allows changes to body measurements without destroying historical data.

---

# 13. DESIGN BRIEFS

## Table: design_briefs

```sql
CREATE TABLE design_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    culture_id UUID,

    community_id UUID,

    occasion VARCHAR(255),

    garment_type VARCHAR(255),

    gender_presentation VARCHAR(100),

    style VARCHAR(255),

    silhouette VARCHAR(255),

    modern_traditional_balance VARCHAR(100),

    desired_complexity VARCHAR(100),

    budget DECIMAL(12,2),

    currency VARCHAR(10) DEFAULT 'PHP',

    description TEXT,

    created_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 14. DESIGN REQUIREMENTS

## Table: design_requirements

```sql
CREATE TABLE design_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_brief_id UUID NOT NULL REFERENCES design_briefs(id) ON DELETE CASCADE,

    category VARCHAR(100) NOT NULL,

    requirement TEXT NOT NULL,

    priority VARCHAR(30) NOT NULL,

    source VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Priority

```text
MANDATORY
PREFERRED
OPTIONAL
RESTRICTED
```

Example:

```text
Category:
CULTURAL

Requirement:
Use documented traditional textile.

Priority:
MANDATORY
```

---

# 15. CULTURES

## Table: cultures

```sql
CREATE TABLE cultures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL UNIQUE,

    description TEXT,

    historical_context TEXT,

    geographic_scope TEXT,

    validation_status VARCHAR(50) DEFAULT 'UNVERIFIED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 16. COMMUNITIES

## Table: communities

```sql
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    culture_id UUID REFERENCES cultures(id),

    name VARCHAR(255) NOT NULL,

    description TEXT,

    geographic_area TEXT,

    validation_status VARCHAR(50) DEFAULT 'UNVERIFIED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 17. REGIONS

## Table: regions

```sql
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    country VARCHAR(255),

    description TEXT
);
```

---

# 18. CULTURAL ELEMENTS

This is one of the most important tables in the system.

## Table: cultural_elements

```sql
CREATE TABLE cultural_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    element_code VARCHAR(100) UNIQUE NOT NULL,

    name VARCHAR(255) NOT NULL,

    alternative_names TEXT[],

    category VARCHAR(100) NOT NULL,

    description TEXT,

    historical_context TEXT,

    symbolism TEXT,

    traditional_usage TEXT,

    modern_usage TEXT,

    appropriate_context TEXT,

    restricted_context TEXT,

    validation_status VARCHAR(50) DEFAULT 'UNVERIFIED',

    expert_notes TEXT,

    created_by UUID REFERENCES users(id),

    verified_by UUID REFERENCES users(id),

    verified_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 19. CULTURAL ELEMENT CATEGORIES

Allowed categories may include:

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
HEADDRESS
FOOTWEAR
EMBELLISHMENT
CEREMONIAL_ELEMENT
OTHER
```

---

# 20. CULTURAL ELEMENT RELATIONSHIPS

## Table: cultural_element_relationships

```sql
CREATE TABLE cultural_element_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    source_element_id UUID NOT NULL
        REFERENCES cultural_elements(id) ON DELETE CASCADE,

    target_element_id UUID NOT NULL
        REFERENCES cultural_elements(id) ON DELETE CASCADE,

    relationship_type VARCHAR(100) NOT NULL,

    description TEXT,

    confidence DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Relationship types:

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
SIMILAR_TO
DOCUMENTED_BY
VALIDATED_BY
```

---

# 21. CULTURAL REFERENCES

## Table: cultural_references

Every important cultural claim should have a source.

```sql
CREATE TABLE cultural_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference_code VARCHAR(100) UNIQUE NOT NULL,

    title TEXT NOT NULL,

    author TEXT,

    publication_year INTEGER,

    publisher TEXT,

    source_type VARCHAR(100),

    url TEXT,

    citation TEXT,

    description TEXT,

    credibility_status VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Source types:

```text
BOOK
JOURNAL
GOVERNMENT
MUSEUM
UNIVERSITY
COMMUNITY_SOURCE
ARCHIVE
WEBSITE
EXPERT_INTERVIEW
OTHER
```

---

# 22. CULTURAL ELEMENT REFERENCES

## Table: cultural_element_references

```sql
CREATE TABLE cultural_element_references (
    cultural_element_id UUID
        REFERENCES cultural_elements(id) ON DELETE CASCADE,

    reference_id UUID
        REFERENCES cultural_references(id) ON DELETE CASCADE,

    relevance TEXT,

    PRIMARY KEY (
        cultural_element_id,
        reference_id
    )
);
```

This allows one cultural element to have multiple sources.

---

# 23. CULTURAL RESTRICTIONS

## Table: cultural_restrictions

```sql
CREATE TABLE cultural_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cultural_element_id UUID
        REFERENCES cultural_elements(id) ON DELETE CASCADE,

    culture_id UUID
        REFERENCES cultures(id),

    community_id UUID
        REFERENCES communities(id),

    restriction_type VARCHAR(100),

    description TEXT NOT NULL,

    severity VARCHAR(50),

    source_reference_id UUID
        REFERENCES cultural_references(id),

    validation_status VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Restriction Types

```text
CONTEXT_RESTRICTED
CEREMONIAL_ONLY
GENDER_SPECIFIC
COMMUNITY_SPECIFIC
STATUS_SPECIFIC
SACRED
NOT_FOR_COMMERCIAL_USE
NOT_FOR_MODIFICATION
UNKNOWN
```

---

# 24. CULTURAL VALIDATION STATUS

Standard statuses:

```text
UNVERIFIED
UNDER_REVIEW
VERIFIED
RESTRICTED
DEPRECATED
```

The application should distinguish:

```text
VERIFIED
```

from:

```text
AI_SUGGESTED
```

---

# 25. MATERIALS

## Table: materials

```sql
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    material_code VARCHAR(100) UNIQUE NOT NULL,

    name VARCHAR(255) NOT NULL,

    category VARCHAR(100),

    description TEXT,

    unit VARCHAR(50),

    fabric_width_cm DECIMAL(8,2),

    weight_gsm DECIMAL(8,2),

    color VARCHAR(100),

    cultural_association TEXT,

    availability_status VARCHAR(50),

    supplier VARCHAR(255),

    minimum_quantity DECIMAL(12,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 26. MATERIAL PRICES

## Table: material_prices

```sql
CREATE TABLE material_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    material_id UUID NOT NULL
        REFERENCES materials(id) ON DELETE CASCADE,

    price DECIMAL(12,2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'PHP',

    unit VARCHAR(50),

    supplier VARCHAR(255),

    effective_date DATE,

    expiration_date DATE,

    source TEXT,

    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

This allows historical pricing.

Example:

```text
2025 = ₱450/meter
2026 = ₱520/meter
```

The system should not overwrite the old price.

---

# 27. DESIGN MATERIALS

## Table: design_materials

```sql
CREATE TABLE design_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_version_id UUID NOT NULL,

    material_id UUID NOT NULL
        REFERENCES materials(id),

    quantity DECIMAL(12,3),

    unit VARCHAR(50),

    purpose TEXT,

    source_type VARCHAR(50),

    notes TEXT
);
```

Source types:

```text
DESIGNER
AI_SUGGESTED
DATABASE
IMPORTED
```

---

# 28. DESIGNS

## Table: designs

```sql
CREATE TABLE designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,

    design_code VARCHAR(100) UNIQUE NOT NULL,

    name VARCHAR(255),

    status VARCHAR(50) DEFAULT 'DRAFT',

    current_version INTEGER DEFAULT 1,

    created_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 29. DESIGN STATUS

```text
DRAFT
GENERATING
GENERATED
EVALUATING
REVIEW_REQUIRED
REVISION
REVIEWED
APPROVED
FINAL
REJECTED
ARCHIVED
```

---

# 30. DESIGN VERSIONS

This is a critical table.

## Table: design_versions

```sql
CREATE TABLE design_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_id UUID NOT NULL
        REFERENCES designs(id) ON DELETE CASCADE,

    version_number INTEGER NOT NULL,

    parent_version_id UUID REFERENCES design_versions(id),

    design_specification JSONB,

    visual_prompt TEXT,

    generated_image_url TEXT,

    thumbnail_url TEXT,

    generation_source VARCHAR(100),

    ai_model VARCHAR(255),

    status VARCHAR(50),

    designer_notes TEXT,

    created_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(design_id, version_number)
);
```

---

# 31. DESIGN SPECIFICATION JSON

The structured specification should resemble:

```json
{
  "designName": "Contemporary Heritage Gown",

  "silhouette": {
    "type": "A-line",
    "description": "..."
  },

  "garmentComponents": [
    {
      "name": "bodice",
      "description": "..."
    },
    {
      "name": "skirt",
      "description": "..."
    }
  ],

  "colors": [
    {
      "name": "deep blue",
      "hex": "#..."
    }
  ],

  "culturalElements": [
    {
      "elementId": "CE-001",
      "usage": "..."
    }
  ],

  "materials": [
    {
      "materialId": "MAT-001",
      "quantity": 4.5
    }
  ],

  "constructionNotes": ["..."],

  "bodyConsiderations": ["..."]
}
```

---

# 32. DESIGN CULTURAL ELEMENTS

## Table: design_cultural_elements

```sql
CREATE TABLE design_cultural_elements (

    design_version_id UUID NOT NULL
        REFERENCES design_versions(id) ON DELETE CASCADE,

    cultural_element_id UUID NOT NULL
        REFERENCES cultural_elements(id),

    usage_description TEXT,

    source_type VARCHAR(50),

    required BOOLEAN DEFAULT FALSE,

    approved_by_human BOOLEAN DEFAULT FALSE,

    PRIMARY KEY (
        design_version_id,
        cultural_element_id
    )
);
```

---

# 33. AI CONTEXT

## Table: ai_contexts

Stores the context sent to an AI model.

```sql
CREATE TABLE ai_contexts (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_version_id UUID
        REFERENCES design_versions(id),

    context JSONB NOT NULL,

    cultural_context JSONB,

    body_context JSONB,

    budget_context JSONB,

    material_context JSONB,

    requirement_context JSONB,

    constraint_context JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The exact AI context should be stored for reproducibility.

---

# 34. AI GENERATION JOBS

## Table: ai_jobs

```sql
CREATE TABLE ai_jobs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID REFERENCES projects(id),

    design_id UUID REFERENCES designs(id),

    design_version_id UUID
        REFERENCES design_versions(id),

    job_type VARCHAR(100) NOT NULL,

    provider VARCHAR(100),

    model VARCHAR(255),

    status VARCHAR(50) DEFAULT 'QUEUED',

    input_payload JSONB,

    output_payload JSONB,

    error_message TEXT,

    started_at TIMESTAMP,

    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Job types:

```text
TEXT_GENERATION
DESIGN_SPECIFICATION
IMAGE_GENERATION
BODY_ANALYSIS
EVALUATION
EXPLANATION
```

---

# 35. AI JOB STATUS

```text
QUEUED
PROCESSING
COMPLETED
FAILED
CANCELLED
```

---

# 36. COST ESTIMATES

## Table: cost_estimates

```sql
CREATE TABLE cost_estimates (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_version_id UUID NOT NULL
        REFERENCES design_versions(id),

    material_cost DECIMAL(12,2) DEFAULT 0,

    labor_cost DECIMAL(12,2) DEFAULT 0,

    decoration_cost DECIMAL(12,2) DEFAULT 0,

    other_cost DECIMAL(12,2) DEFAULT 0,

    contingency_cost DECIMAL(12,2) DEFAULT 0,

    subtotal DECIMAL(12,2) DEFAULT 0,

    total_cost DECIMAL(12,2) DEFAULT 0,

    budget DECIMAL(12,2),

    currency VARCHAR(10) DEFAULT 'PHP',

    budget_status VARCHAR(50),

    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 37. COST ITEMS

## Table: cost_items

```sql
CREATE TABLE cost_items (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cost_estimate_id UUID NOT NULL
        REFERENCES cost_estimates(id)
        ON DELETE CASCADE,

    category VARCHAR(100),

    description TEXT,

    material_id UUID REFERENCES materials(id),

    quantity DECIMAL(12,3),

    unit VARCHAR(50),

    unit_price DECIMAL(12,2),

    total DECIMAL(12,2),

    source VARCHAR(50)
);
```

---

# 38. COST FORMULA

The application should calculate:

```text
Material Cost
+
Labor Cost
+
Decoration Cost
+
Other Cost
+
Contingency
=
Estimated Total Cost
```

Example:

```text
Material      ₱12,500
Labor          ₱7,000
Decoration     ₱3,000
Other          ₱1,000
Contingency    ₱1,000
----------------------
TOTAL         ₱24,500
```

---

# 39. BUDGET STATUS

```text
UNDER_BUDGET
NEAR_BUDGET
OVER_BUDGET
UNKNOWN
```

The threshold for `NEAR_BUDGET` should be configurable rather than hard-coded.

---

# 40. EVALUATIONS

## Table: evaluations

```sql
CREATE TABLE evaluations (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_version_id UUID NOT NULL
        REFERENCES design_versions(id),

    overall_status VARCHAR(50),

    cultural_status VARCHAR(50),

    body_status VARCHAR(50),

    cost_status VARCHAR(50),

    requirement_status VARCHAR(50),

    material_status VARCHAR(50),

    human_review_required BOOLEAN DEFAULT TRUE,

    evaluated_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 41. EVALUATION FINDINGS

## Table: evaluation_findings

```sql
CREATE TABLE evaluation_findings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    evaluation_id UUID NOT NULL
        REFERENCES evaluations(id)
        ON DELETE CASCADE,

    category VARCHAR(100),

    severity VARCHAR(50),

    finding TEXT NOT NULL,

    evidence TEXT,

    recommendation TEXT,

    related_cultural_element UUID
        REFERENCES cultural_elements(id),

    resolved BOOLEAN DEFAULT FALSE,

    resolved_by UUID REFERENCES users(id),

    resolved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 42. EVALUATION CATEGORIES

```text
CULTURAL
BODY
COST
REQUIREMENT
MATERIAL
DESIGN
SOURCE
OTHER
```

---

# 43. FINDING SEVERITY

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

These are issue severity levels, not design quality scores.

---

# 44. EXPLANATIONS

## Table: explanations

```sql
CREATE TABLE explanations (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_version_id UUID
        REFERENCES design_versions(id),

    explanation_type VARCHAR(100),

    subject_type VARCHAR(100),

    subject_id UUID,

    what TEXT,

    why TEXT,

    source TEXT,

    constraint TEXT,

    evidence JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Example:

```text
WHAT:
Selected textile

WHY:
Matches the selected cultural context.

SOURCE:
Cultural Reference C-024

CONSTRAINT:
Traditional textile requirement = MANDATORY
```

---

# 45. HUMAN REVIEWS

## Table: human_reviews

```sql
CREATE TABLE human_reviews (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_version_id UUID NOT NULL
        REFERENCES design_versions(id),

    reviewer_id UUID NOT NULL
        REFERENCES users(id),

    decision VARCHAR(50),

    comments TEXT,

    cultural_review BOOLEAN DEFAULT FALSE,

    body_review BOOLEAN DEFAULT FALSE,

    cost_review BOOLEAN DEFAULT FALSE,

    final_approval BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 46. HUMAN REVIEW DECISIONS

```text
ACCEPT
REJECT
REQUEST_REVISION
PENDING
```

The system must not automatically mark a design as human-approved.

---

# 47. DESIGN FEEDBACK

## Table: design_feedback

```sql
CREATE TABLE design_feedback (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    design_version_id UUID
        REFERENCES design_versions(id),

    user_id UUID
        REFERENCES users(id),

    feedback_type VARCHAR(100),

    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Examples:

```text
CULTURAL
FIT
MATERIAL
COLOR
SILHOUETTE
AI_GENERATION
GENERAL
```

---

# 48. FILE ASSETS

## Table: file_assets

```sql
CREATE TABLE file_assets (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID
        REFERENCES projects(id)
        ON DELETE CASCADE,

    design_version_id UUID
        REFERENCES design_versions(id),

    file_type VARCHAR(100),

    file_name VARCHAR(255),

    storage_url TEXT NOT NULL,

    mime_type VARCHAR(100),

    file_size BIGINT,

    checksum VARCHAR(255),

    uploaded_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 49. FILE TYPES

```text
REFERENCE_IMAGE
GENERATED_IMAGE
BODY_IMAGE
DESIGN_SKETCH
REPORT
CULTURAL_DOCUMENT
ATTACHMENT
OTHER
```

---

# 50. REPORTS

## Table: reports

```sql
CREATE TABLE reports (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id),

    design_version_id UUID
        REFERENCES design_versions(id),

    report_type VARCHAR(100),

    file_url TEXT,

    generated_by UUID
        REFERENCES users(id),

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Report types:

```text
DESIGN_REPORT
CULTURAL_REPORT
COST_REPORT
EVALUATION_REPORT
FINAL_REPORT
```

---

# 51. AUDIT LOG

## Table: audit_logs

Every important system action should be traceable.

```sql
CREATE TABLE audit_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id UUID,

    old_value JSONB,

    new_value JSONB,

    metadata JSONB,

    ip_address INET,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Example actions:

```text
LOGIN
LOGOUT
PROJECT_CREATED
PROJECT_UPDATED
CULTURAL_RECORD_CREATED
CULTURAL_RECORD_UPDATED
CULTURAL_RECORD_VERIFIED
DESIGN_CREATED
DESIGN_GENERATED
DESIGN_MODIFIED
EVALUATION_RUN
DESIGN_ACCEPTED
DESIGN_REJECTED
REPORT_GENERATED
```

---

# 52. VECTOR SEARCH

The system may use PostgreSQL `pgvector`.

## Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

A searchable knowledge table may contain:

```sql
ALTER TABLE cultural_elements
ADD COLUMN embedding vector(1536);
```

The actual dimension depends on the selected embedding model.

Do not permanently hard-code `1536` if the chosen provider uses another dimension.

---

# 53. CULTURAL DOCUMENT CHUNKS

For larger cultural references:

## Table: cultural_document_chunks

```sql
CREATE TABLE cultural_document_chunks (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reference_id UUID
        REFERENCES cultural_references(id)
        ON DELETE CASCADE,

    chunk_index INTEGER,

    content TEXT NOT NULL,

    embedding vector(1536),

    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Purpose:

```text
Cultural Document
       ↓
Chunk
       ↓
Embedding
       ↓
Vector Search
       ↓
Relevant Evidence
       ↓
AI Context
```

---

# 54. IMPORTANT DISTINCTION

The vector database is for:

```text
semantic retrieval
```

It is not the authoritative cultural database.

The authoritative hierarchy is:

```text
Verified Cultural Record
        ↓
Cultural Reference
        ↓
Cultural Rule
        ↓
Retrieved Evidence
        ↓
AI Context
```

---

# 55. DATABASE RELATIONSHIP MAP

High-level relationship:

```text
USER
 │
 ├─────────────── PROJECT
 │                    │
 │                    ├── CLIENT
 │                    │      │
 │                    │      └── BODY PROFILE
 │                    │
 │                    ├── DESIGN BRIEF
 │                    │      │
 │                    │      └── REQUIREMENTS
 │                    │
 │                    └── DESIGN
 │                           │
 │                           └── DESIGN VERSION
 │                                  │
 │             ┌────────────────────┼─────────────────┐
 │             │                    │                 │
 │          AI CONTEXT          MATERIALS        CULTURAL ELEMENTS
 │             │                    │                 │
 │          AI JOB             COST ESTIMATE     REFERENCES
 │                                  │                 │
 │                               COST ITEMS       RESTRICTIONS
 │                                  │
 │                              EVALUATION
 │                                  │
 │                         EVALUATION FINDINGS
 │                                  │
 │                            HUMAN REVIEW
 │                                  │
 │                              REPORT
 │
 └── AUDIT LOG
```

---

# 56. CULTURAL KNOWLEDGE RELATIONSHIP

```text
CULTURE
   │
   ├── COMMUNITY
   │
   ├── REGION
   │
   └── CULTURAL ELEMENT
             │
             ├── TEXTILE
             ├── MOTIF
             ├── SYMBOL
             ├── COLOR
             ├── GARMENT
             ├── TECHNIQUE
             └── ORNAMENT
                    │
                    ├── REFERENCE
                    └── RESTRICTION
```

---

# 57. DESIGN RELATIONSHIP

```text
PROJECT
   │
   └── DESIGN
         │
         ├── VERSION 1
         ├── VERSION 2
         ├── VERSION 3
         └── FINAL VERSION
                │
                ├── Cultural Elements
                ├── Materials
                ├── AI Context
                ├── AI Generation
                ├── Cost Estimate
                ├── Evaluation
                ├── Explanation
                ├── Human Review
                └── Files
```

---

# 58. DESIGN VERSION IMMUTABILITY

Once a version has been evaluated or approved, it should generally be treated as immutable.

Instead of:

```text
V2 → edit V2
```

create:

```text
V2 → V3
```

This provides a reliable history.

---

# 59. VERSION CREATION RULE

When modifying a design:

```text
Existing Version
      ↓
Clone
      ↓
Increment Version Number
      ↓
Apply Changes
      ↓
Generate New Image
      ↓
Evaluate
      ↓
Human Review
```

---

# 60. DATABASE INDEXES

Recommended indexes:

```sql
CREATE INDEX idx_projects_created_by
ON projects(created_by);

CREATE INDEX idx_projects_status
ON projects(status);

CREATE INDEX idx_designs_project
ON designs(project_id);

CREATE INDEX idx_design_versions_design
ON design_versions(design_id);

CREATE INDEX idx_cultural_elements_category
ON cultural_elements(category);

CREATE INDEX idx_cultural_elements_status
ON cultural_elements(validation_status);

CREATE INDEX idx_cultural_references_type
ON cultural_references(source_type);

CREATE INDEX idx_materials_category
ON materials(category);

CREATE INDEX idx_material_prices_material
ON material_prices(material_id);

CREATE INDEX idx_evaluations_design
ON evaluations(design_version_id);

CREATE INDEX idx_audit_logs_entity
ON audit_logs(entity_type, entity_id);
```

---

# 61. SEARCH INDEX

For cultural search:

```sql
CREATE INDEX idx_cultural_elements_name
ON cultural_elements
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

For PostgreSQL full-text search.

---

# 62. DATA INTEGRITY RULES

The application must enforce:

### Rule 1

A design must belong to a project.

### Rule 2

A design version must belong to a design.

### Rule 3

A cultural element must have a validation status.

### Rule 4

Verified cultural elements should have at least one reference.

### Rule 5

Restricted cultural elements must have restriction information where applicable.

### Rule 6

Approved designs must have completed human review.

### Rule 7

Final designs must have an evaluation.

### Rule 8

Cost estimates must be generated from stored cost items.

### Rule 9

AI-generated cultural claims must not automatically modify cultural records.

### Rule 10

Deleted records should preferably use soft deletion where historical traceability matters.

---

# 63. SOFT DELETE

For important entities, add:

```sql
deleted_at TIMESTAMP
```

Recommended entities:

```text
Projects
Designs
Cultural Elements
Materials
References
Reports
```

Instead of physically deleting:

```text
DELETE
```

the application can mark:

```text
deleted_at = current_timestamp
```

---

# 64. CREATED/UPDATED METADATA

Important tables should contain:

```text
created_at
updated_at
created_by
updated_by
```

where appropriate.

This improves traceability.

---

# 65. JSONB USAGE

JSONB should be used for information that may evolve rapidly.

Good candidates:

```text
AI Context
AI Output
Design Specification
Evaluation Metadata
Computer Vision Output
AI Model Metadata
Prompt Parameters
```

Do not place core relational information exclusively inside JSONB.

For example, this is preferable:

```text
materials table
    +
design_materials table
```

instead of:

```text
design.materials = JSON blob
```

---

# 66. AI OUTPUT STORAGE RULE

AI responses should be stored in two forms when practical:

### Structured

```text
design_specification
```

### Raw

```text
ai_job.output_payload
```

This allows the system to inspect exactly what the AI returned.

---

# 67. PROMPT TRACEABILITY

For image generation, preserve:

```text
Model
Prompt
Negative Prompt
Parameters
Seed
Reference Images
AI Context ID
Generation Job ID
```

Recommended metadata:

```json
{
  "model": "...",
  "promptVersion": "v1.2",
  "seed": 12345,
  "resolution": "1024x1024",
  "referenceImages": [],
  "contextId": "..."
}
```

---

# 68. CULTURAL SOURCE TRACEABILITY

Every AI-generated cultural recommendation should be traceable:

```text
AI Recommendation
       ↓
Cultural Element
       ↓
Cultural Reference
       ↓
Source Document
```

If no supporting source exists:

```text
STATUS = REVIEW_REQUIRED
```

rather than:

```text
STATUS = VERIFIED
```

---

# 69. BODY DATA PRIVACY

Body information may be sensitive.

The database should therefore support:

```text
Access Control
Consent
Restricted Visibility
Data Deletion
Research Anonymization
```

Do not expose body measurements to users who do not require access.

---

# 70. RESEARCH DATA SEPARATION

If the system will eventually support thesis research, consider separating:

```text
Operational Data
```

from:

```text
Research Data
```

Example:

```text
Operational Database
       ↓
Anonymization
       ↓
Research Dataset
```

Do not directly expose identifiable project/client information in research exports.

---

# 71. SAMPLE PROJECT

Example:

```text
Project:
PROJECT-001

Name:
Modern Cultural Pageant Attire

Culture:
Culture A

Community:
Community A

Occasion:
Pageant

Budget:
₱30,000
```

---

# 72. SAMPLE DESIGN FLOW

```text
PROJECT-001
     │
     └── DESIGN-001
             │
             ├── V1
             │
             ├── V2
             │
             └── V3
                    │
                    ├── Cultural Evaluation
                    ├── Body Evaluation
                    ├── Cost Evaluation
                    ├── Requirement Evaluation
                    │
                    └── Human Review
```

---

# 73. SAMPLE DESIGN VERSION

```json
{
  "designId": "DES-001",
  "version": 3,

  "status": "REVIEW_REQUIRED",

  "designSpecification": {
    "silhouette": "A-line",
    "colors": ["deep blue", "gold"],
    "culturalElements": ["CE-001", "CE-004"],
    "materials": ["MAT-001", "MAT-002"]
  },

  "estimatedCost": 24500,

  "evaluation": {
    "cultural": "REVIEW_REQUIRED",
    "body": "PASS",
    "cost": "UNDER_BUDGET"
  }
}
```

---

# 74. MVP DATABASE SCOPE

Do not implement every table immediately.

For the first working prototype, prioritize:

```text
users
roles
user_roles

projects
clients
body_profiles

design_briefs
design_requirements

cultures
communities
cultural_elements
cultural_references
cultural_element_references
cultural_restrictions

materials
material_prices

designs
design_versions
design_cultural_elements
design_materials

ai_contexts
ai_jobs

cost_estimates
cost_items

evaluations
evaluation_findings

human_reviews

file_assets
audit_logs
```

---

# 75. PHASE 2 DATABASE

After the MVP:

```text
cultural_element_relationships

cultural_document_chunks
vector embeddings

body_measurement_history

design_feedback

explanations

reports

advanced AI metadata

research dataset tables
```

---

# 76. RECOMMENDED MIGRATION ORDER

Database migrations should be implemented in this order:

```text
001_auth
002_projects
003_clients
004_body_profiles
005_cultures
006_cultural_elements
007_cultural_references
008_cultural_restrictions
009_materials
010_material_prices
011_design_briefs
012_design_requirements
013_designs
014_design_versions
015_design_materials
016_design_cultural_elements
017_ai_contexts
018_ai_jobs
019_cost_estimates
020_cost_items
021_evaluations
022_evaluation_findings
023_human_reviews
024_file_assets
025_reports
026_audit_logs
027_vector_search
```

---

# 77. SEED DATA

The development database should contain initial seed data.

Example roles:

```text
ADMIN
DESIGNER
CULTURAL_EXPERT
RESEARCHER
VIEWER
```

Example project statuses:

```text
DRAFT
RESEARCH
DESIGNING
EVALUATION
REVISION
FINALIZATION
COMPLETED
```

Example evaluation statuses:

```text
PASS
REVIEW_REQUIRED
FAIL
NOT_EVALUATED
```

---

# 78. SAMPLE MATERIAL SEED

Example only:

```text
MAT-001
Name: Traditional Textile A
Category: Textile
Unit: meter
Currency: PHP

MAT-002
Name: Cotton
Category: Fabric
Unit: meter
Currency: PHP

MAT-003
Name: Embroidery Thread
Category: Decoration
Unit: spool
Currency: PHP
```

Actual cultural/material data should be populated from verified sources.

---

# 79. DATABASE → APPLICATION MAPPING

| Application Module    | Main Tables                                      |
| --------------------- | ------------------------------------------------ |
| Authentication        | users, roles, user_roles                         |
| Dashboard             | projects, designs                                |
| Project Management    | projects, clients                                |
| Body Profile          | body_profiles                                    |
| Design Brief          | design_briefs, design_requirements               |
| Cultural Knowledge    | cultures, communities, cultural_elements         |
| Cultural Sources      | cultural_references, cultural_element_references |
| Restrictions          | cultural_restrictions                            |
| Materials             | materials, material_prices                       |
| Design Studio         | designs, design_versions                         |
| AI Generation         | ai_contexts, ai_jobs                             |
| Costing               | cost_estimates, cost_items                       |
| Evaluation            | evaluations, evaluation_findings                 |
| Explainability        | explanations                                     |
| Human Review          | human_reviews, design_feedback                   |
| Files                 | file_assets                                      |
| Reports               | reports                                          |
| Security/Traceability | audit_logs                                       |

---

# 80. API DATA FLOW

Example:

```text
POST /api/projects
        ↓
projects
        ↓
POST /api/projects/:id/brief
        ↓
design_briefs
        ↓
POST /api/designs
        ↓
designs
        ↓
POST /api/designs/:id/generate
        ↓
ai_contexts
        ↓
ai_jobs
        ↓
design_versions
        ↓
POST /api/designs/:id/evaluate
        ↓
evaluations
        ↓
evaluation_findings
        ↓
POST /api/designs/:id/review
        ↓
human_reviews
```

---

# 81. CRITICAL BUSINESS RULE

The database should preserve this hierarchy:

```text
VERIFIED KNOWLEDGE
        ↓
SYSTEM CONSTRAINTS
        ↓
AI RECOMMENDATION
        ↓
AI GENERATED DESIGN
        ↓
SYSTEM EVALUATION
        ↓
HUMAN REVIEW
        ↓
FINAL DESIGN
```

Never reverse this hierarchy.

For example:

```text
AI says:
"This motif represents X."

```

must not automatically become:

```text
Cultural Knowledge:
"Motif represents X."
```

The AI claim must instead be evaluated against the cultural knowledge and references.

---

# 82. FINAL DATABASE ARCHITECTURE

The complete system can be summarized as:

```text
                         ┌──────────────┐
                         │    USERS     │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │   PROJECTS   │
                         └──────┬───────┘
                                │
            ┌───────────────────┼────────────────────┐
            │                   │                    │
     ┌──────▼──────┐     ┌──────▼──────┐      ┌─────▼─────┐
     │   CLIENT    │     │ DESIGN BRIEF│      │   BODY    │
     └──────┬──────┘     └──────┬──────┘      │  PROFILE  │
            │                   │              └───────────┘
            │             REQUIREMENTS
            │
            │
     ┌──────▼────────────────────────────────────────┐
     │              CULTURAL KNOWLEDGE               │
     │ Culture → Community → Elements → References  │
     │                         ↓                     │
     │                    Restrictions              │
     └───────────────────────┬───────────────────────┘
                             │
                     ┌───────▼────────┐
                     │ DESIGN VERSION │
                     └───────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼─────┐  ┌─────▼─────┐ ┌─────▼──────┐
       │ AI CONTEXT │  │ MATERIALS │ │ AI JOBS    │
       └──────┬─────┘  └─────┬─────┘ └────────────┘
              │              │
              │        ┌─────▼───────┐
              │        │ COST ENGINE │
              │        └─────┬───────┘
              │              │
              └──────┬───────┘
                     │
              ┌──────▼──────┐
              │ EVALUATION  │
              └──────┬──────┘
                     │
          ┌──────────▼──────────┐
          │   HUMAN REVIEW      │
          └──────────┬──────────┘
                     │
              ┌──────▼──────┐
              │   REPORT    │
              └─────────────┘

                 AUDIT LOG
                    │
                    ▼
              ALL IMPORTANT
               ACTIVITIES
```

---

# 83. IMPLEMENTATION PRIORITY

For actual development, implement the database in this order:

### Step 1 — Foundation

```text
users
roles
user_roles
```

### Step 2 — Project

```text
projects
clients
body_profiles
```

### Step 3 — Design Brief

```text
design_briefs
design_requirements
```

### Step 4 — Cultural Knowledge

```text
cultures
communities
cultural_elements
cultural_references
cultural_element_references
cultural_restrictions
```

### Step 5 — Materials

```text
materials
material_prices
```

### Step 6 — Design

```text
designs
design_versions
design_materials
design_cultural_elements
```

### Step 7 — AI

```text
ai_contexts
ai_jobs
```

### Step 8 — Cost

```text
cost_estimates
cost_items
```

### Step 9 — Evaluation

```text
evaluations
evaluation_findings
```

### Step 10 — Human Review

```text
human_reviews
design_feedback
```

### Step 11 — Files/Reports

```text
file_assets
reports
```

### Step 12 — Traceability

```text
audit_logs
```

### Step 13 — Advanced Knowledge Retrieval

```text
cultural_document_chunks
vector embeddings
cultural_element_relationships
```

---

# 84. DEFINITION OF DONE

The database layer is considered ready for MVP implementation when:

- [ ] Users can be stored
- [ ] Roles can be assigned
- [ ] Projects can be created
- [ ] Clients can be associated with projects
- [ ] Body profiles can be stored
- [ ] Design briefs can be created
- [ ] Requirements can be classified by priority
- [ ] Cultural records can be stored
- [ ] Cultural sources can be attached
- [ ] Cultural restrictions can be stored
- [ ] Materials can be stored
- [ ] Historical prices can be stored
- [ ] Designs can be created
- [ ] Design versions can be created
- [ ] AI context can be preserved
- [ ] AI jobs can be tracked
- [ ] Costs can be calculated
- [ ] Evaluations can be stored
- [ ] Findings can be recorded
- [ ] Human review can be recorded
- [ ] Files can be linked to projects/designs
- [ ] Reports can be generated and linked
- [ ] Important actions are auditable
- [ ] No verified cultural data can be silently overwritten by AI output
- [ ] Design history is preserved

---

# 85. NEXT DEVELOPMENT DOCUMENT

The next recommended document is:

```text
04_CULTURAL_KNOWLEDGE_MODEL.md
```

This document should define in detail:

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
Material
Technique
Occasion
Restriction
Reference
Expert Validation
```

It should also define:

```text
Knowledge Graph
       ↓
Relationships
       ↓
Cultural Rules
       ↓
Retrieval
       ↓
AI Context
       ↓
Cultural Evaluation
```

This is the next critical layer because the cultural knowledge model determines how the AI will obtain, interpret, and constrain cultural information.
