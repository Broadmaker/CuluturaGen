# 07_EVALUATION_ENGINE.md

# Human-AI Collaborative Cultural Attire Design Platform

## Design Evaluation & Validation Engine Specification

**Document:** `07_EVALUATION_ENGINE.md`
**Version:** 1.0
**System:** Human-AI Collaborative Cultural Attire Design Platform
**Module:** Evaluation, Validation, Findings & Review Management
**Status:** Implementation Specification

---

# 1. Purpose

The Evaluation Engine determines whether a proposed attire design satisfies the system's documented requirements and constraints.

It evaluates:

1. Cultural grounding
2. Cultural usage context
3. Cultural restrictions
4. Cultural evidence
5. Design requirements
6. Body-profile considerations
7. Material availability
8. Budget
9. Cost assumptions
10. Design completeness
11. Unsupported claims
12. Human-review requirements

The engine does **not** decide whether a design is artistically beautiful, culturally authentic in an absolute sense, or finally acceptable.

Instead, it produces:

> **Evidence-based findings that help the human designer make the final decision.**

---

# 2. Core Principle

The evaluation architecture follows:

```text
RULE
  ↓
EVIDENCE
  ↓
CHECK
  ↓
RESULT
  ↓
FINDING
  ↓
EXPLANATION
  ↓
HUMAN REVIEW
```

Example:

```text
Rule:
Selected textile must have a documented cultural association.

Evidence:
Cultural Element CE-024
Source: Cultural Reference CR-018

Check:
Association exists.

Result:
PASS

Finding:
Textile has documented association with the selected cultural context.
```

---

# 3. What the Evaluation Engine Is NOT

The Evaluation Engine must not:

```text
❌ Automatically declare cultural authenticity
❌ Replace cultural experts
❌ Make subjective artistic judgments
❌ Diagnose body conditions
❌ Guarantee physical garment fit
❌ Invent missing evidence
❌ Treat AI confidence as factual evidence
❌ Automatically approve a design
```

Instead:

```text
Evaluation Engine
        ↓
Evidence + Rules + Findings
        ↓
Human Designer
        ↓
Final Decision
```

---

# 4. Evaluation Domains

The initial system should evaluate six major domains:

```text
┌─────────────────────────────┐
│      DESIGN EVALUATION      │
├─────────────────────────────┤
│ 1. Cultural                 │
│ 2. Requirements             │
│ 3. Body Profile             │
│ 4. Cost & Budget            │
│ 5. Materials                │
│ 6. Completeness & Evidence  │
└─────────────────────────────┘
```

Later domains may include:

- sustainability
- construction feasibility
- production time
- supplier risk
- historical consistency
- environmental impact

---

# 5. Evaluation Pipeline

```text
DESIGN VERSION
      ↓
LOAD REQUIREMENTS
      ↓
LOAD CULTURAL KNOWLEDGE
      ↓
LOAD BODY PROFILE
      ↓
LOAD MATERIAL DATA
      ↓
LOAD COST CALCULATION
      ↓
RUN EVALUATION RULES
      ↓
GENERATE FINDINGS
      ↓
CLASSIFY SEVERITY
      ↓
GENERATE EXPLANATIONS
      ↓
DETERMINE REVIEW STATUS
      ↓
HUMAN REVIEW
```

---

# 6. Evaluation Input

The evaluator receives a structured object.

Example:

```json
{
  "projectId": "PROJ-001",
  "designId": "DES-001",
  "designVersionId": "DES-001-V3",
  "requirements": {},
  "designSpecification": {},
  "culturalElements": [],
  "bodyProfile": {},
  "materials": [],
  "costCalculation": {},
  "sources": []
}
```

---

# 7. Evaluation Output

Example:

```json
{
  "evaluationId": "EVAL-001",
  "designVersionId": "DES-001-V3",
  "status": "REVIEW_REQUIRED",
  "cultural": {},
  "requirements": {},
  "body": {},
  "cost": {},
  "materials": {},
  "evidence": {},
  "findings": [],
  "humanReview": {}
}
```

---

# 8. Evaluation Status

The overall evaluation may have:

```text
DRAFT
RUNNING
PASSED_WITHOUT_CRITICAL_ISSUES
REVIEW_REQUIRED
REVISION_REQUIRED
BLOCKED
APPROVED_BY_HUMAN
REJECTED_BY_HUMAN
```

Important:

```text
PASSED_WITHOUT_CRITICAL_ISSUES
```

does not mean:

```text
CULTURALLY AUTHENTIC
```

and does not mean:

```text
FINAL APPROVAL
```

---

# 9. Domain Status

Each domain should independently have a status.

```text
PASS
PASS_WITH_WARNINGS
REVIEW_REQUIRED
FAIL
NOT_EVALUATED
INSUFFICIENT_EVIDENCE
```

Example:

```text
Cultural:
PASS_WITH_WARNINGS

Requirements:
PASS

Body:
REVIEW_REQUIRED

Cost:
PASS

Materials:
PASS

Evidence:
REVIEW_REQUIRED
```

---

# 10. Finding Model

Every issue should become a structured finding.

Recommended structure:

```text
Finding
├── Finding ID
├── Domain
├── Rule
├── Severity
├── Status
├── Description
├── Evidence
├── Source
├── Affected Element
├── Recommendation
├── Human Review Required
└── Resolution
```

---

# 11. Finding Severity

Use:

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

Meaning:

### INFO

Useful information with no detected problem.

### LOW

Minor issue that may be worth reviewing.

### MEDIUM

Potential issue that should be reviewed.

### HIGH

Significant issue requiring attention before approval.

### CRITICAL

Design should not proceed to final approval until resolved or explicitly reviewed.

---

# 12. Example Finding

```json
{
  "id": "F-024",
  "domain": "CULTURAL",
  "severity": "HIGH",
  "status": "REVIEW_REQUIRED",
  "title": "Cultural usage context requires verification",
  "description": "The selected element is documented but its use for the specified occasion is not established.",
  "evidence": ["CE-024"],
  "humanReviewRequired": true
}
```

---

# 13. Cultural Evaluation

Cultural evaluation is the most important evaluation domain for the platform.

The evaluator checks:

```text
Cultural Element Exists?
        ↓
Cultural Association?
        ↓
Source Available?
        ↓
Usage Context?
        ↓
Restriction?
        ↓
Occasion Compatibility?
        ↓
Design Application?
```

---

# 14. Cultural Element Existence

Every culturally significant design element should reference a known cultural record where possible.

Example:

```text
Design:
Traditional Textile A

Knowledge Base:
CE-001 exists

Result:
PASS
```

If no record exists:

```text
Result:
INSUFFICIENT_EVIDENCE
```

The system must not automatically assume that the element is culturally valid.

---

# 15. Cultural Source Requirement

A cultural element should ideally have one or more references.

Example:

```text
Cultural Element:
Traditional Textile A

Sources:
CR-001
CR-004
CR-007
```

If no source exists:

```text
⚠ No supporting source found.
```

Status:

```text
REVIEW_REQUIRED
```

---

# 16. Cultural Association Check

Check:

```text
Does the selected cultural element belong to
the selected culture/community/region?
```

Example:

```text
Project Culture:
Culture A

Selected Element:
Element B

Knowledge Graph:
Element B → ASSOCIATED_WITH → Culture A
```

Result:

```text
PASS
```

---

# 17. Incorrect Association

Example:

```text
Project:
Culture A

Element:
Element B

Knowledge Graph:
Element B → ASSOCIATED_WITH → Culture C
```

Result:

```text
HIGH
REVIEW_REQUIRED
```

Finding:

```text
Selected element has no verified association
with the project's selected cultural context.
```

The system should provide the evidence rather than make an unsupported accusation.

---

# 18. Usage Context Check

A culturally associated element may not be appropriate for every context.

Check:

```text
Element
+
Occasion
+
Usage Context
```

Example:

```text
Element:
Traditional Ceremonial Ornament

Project Occasion:
Casual Festival Wear
```

If the knowledge base indicates ceremonial use only:

```text
REVIEW_REQUIRED
```

---

# 19. Cultural Restriction Check

Knowledge records may contain:

```text
Restricted Usage
```

Example:

```text
Element:
Ceremonial Symbol

Restriction:
Specific ceremonial context
```

If the design uses the element outside the documented context:

```text
CRITICAL
```

or:

```text
HIGH
```

depending on the configured rule.

---

# 20. Restricted Element Rule

If an element is marked:

```text
RESTRICTED
```

the evaluation engine must flag it.

Example:

```text
⚠ RESTRICTED CULTURAL ELEMENT

Element:
CE-104

Reason:
Knowledge record identifies restricted usage.

Human cultural review required.
```

---

# 21. Deprecated Knowledge

If a cultural record is:

```text
DEPRECATED
```

the system should not silently use it as current authoritative information.

Result:

```text
REVIEW_REQUIRED
```

Example:

```text
⚠ Knowledge record has been deprecated.
Please verify whether a newer cultural record exists.
```

---

# 22. Unverified Knowledge

If:

```text
Validation Status:
UNVERIFIED
```

the system may still display the information for research purposes, but should distinguish it from verified records.

Example:

```text
Element:
Traditional Motif X

Status:
UNVERIFIED

Evaluation:
REVIEW_REQUIRED
```

---

# 23. Cultural Evidence Levels

The system may classify evidence as:

```text
VERIFIED
DOCUMENTED
PARTIALLY_DOCUMENTED
UNVERIFIED
MISSING
CONFLICTING
```

This should be based on the knowledge record and sources, not generated by the LLM.

---

# 24. Conflicting Sources

If sources disagree:

```text
Source A:
Element used for Occasion X

Source B:
Element primarily associated with Occasion Y
```

the system should not choose one arbitrarily.

Instead:

```text
CONFLICTING_EVIDENCE
```

and:

```text
Human cultural review required.
```

---

# 25. Cultural Evaluation Example

```text
CULTURAL EVALUATION

✓ Culture association verified
✓ Textile association documented
✓ Motif source available
⚠ Occasion usage requires review
⚠ One decorative element has limited documentation
✓ No known restricted element detected

Overall:
REVIEW_REQUIRED
```

---

# 26. Requirements Evaluation

The evaluator compares the generated design against the design brief.

Requirements have priorities:

```text
MANDATORY
PREFERRED
OPTIONAL
RESTRICTED
```

---

# 27. Mandatory Requirement

If:

```text
Requirement:
Long sleeves

Priority:
MANDATORY
```

and the design contains:

```text
Sleeveless
```

result:

```text
FAIL
```

Finding:

```text
Mandatory requirement not satisfied.
```

---

# 28. Preferred Requirement

If:

```text
Requirement:
Embroidered detail

Priority:
PREFERRED
```

and design has no embroidery:

```text
PASS_WITH_WARNINGS
```

It should not automatically be treated as a failure.

---

# 29. Optional Requirement

Optional requirements should not negatively affect approval when absent.

Example:

```text
Optional:
Decorative belt
```

If absent:

```text
INFO
```

---

# 30. Restricted Requirement

If the brief says:

```text
Restricted:
No synthetic fabric
```

and the design uses:

```text
Synthetic fabric
```

result:

```text
HIGH
REVISION_REQUIRED
```

---

# 31. Requirement Coverage

The system should calculate:

```text
Mandatory Requirements:
8

Satisfied:
7

Coverage:
87.5%
```

Example:

```text
REQUIREMENTS

Mandatory:
7/8 ✓

Preferred:
4/6

Optional:
2/4

Restricted:
0 violations
```

---

# 32. Requirement Evaluation Object

```json
{
  "mandatoryTotal": 8,
  "mandatorySatisfied": 7,
  "preferredTotal": 6,
  "preferredSatisfied": 4,
  "optionalTotal": 4,
  "optionalSatisfied": 2,
  "restrictedViolations": 0
}
```

---

# 33. Body Evaluation

The body evaluation system checks whether the design specification considers the available body profile.

It does NOT guarantee actual garment fit.

It evaluates:

```text
Available Measurements
        ↓
Design Dimensions
        ↓
Silhouette
        ↓
Construction Considerations
        ↓
Potential Fit Issues
```

---

# 34. Body Data Quality

Before body evaluation:

```text
Height
Shoulder
Chest/Bust
Waist
Hip
Arm Length
Torso
Inseam
```

must be checked for availability.

Example:

```text
Height:
Available

Chest:
Available

Waist:
Missing

Hip:
Available
```

Result:

```text
REVIEW_REQUIRED
```

---

# 35. Estimated Measurements

Computer vision measurements must be labeled:

```text
ESTIMATED
```

rather than:

```text
VERIFIED
```

Example:

```text
Shoulder Width:
42 cm

Source:
Computer Vision Estimate

Status:
Estimated
```

---

# 36. Body Measurement Confidence

Do not use vague AI confidence.

Instead record:

```text
Source:
Manual
Computer Vision
Imported
Designer Corrected
```

Example:

```text
Waist:
78 cm

Source:
Designer Corrected CV Estimate
```

This provides traceability.

---

# 37. Body Evaluation Example

```text
BODY PROFILE

✓ Height available
✓ Shoulder measurement available
✓ Chest measurement available
⚠ Waist measurement estimated
✓ Hip measurement available

Potential Issue:
Design uses fitted waist construction.

Recommendation:
Verify waist measurement before final construction.

Status:
REVIEW_REQUIRED
```

---

# 38. Silhouette Evaluation

The evaluator may check whether design specifications contain:

```text
Silhouette
Ease
Garment Length
Sleeve Type
Waist Construction
Closure
```

If important dimensions are missing:

```text
INCOMPLETE
```

---

# 39. Fit Warning

The system should use wording such as:

```text
Potential fit consideration
```

rather than:

```text
This garment will not fit.
```

Example:

```text
Potential fit consideration:
The design specifies a fitted bodice, but
the waist measurement has not been verified.
```

---

# 40. Cost Evaluation

The evaluator consumes the deterministic Cost Engine output.

Example:

```text
Budget:
₱30,000

Estimated:
₱25,850

Result:
PASS
```

If:

```text
Estimated:
₱34,500
```

then:

```text
REVIEW_REQUIRED
```

or:

```text
REVISION_REQUIRED
```

depending on project rules.

---

# 41. Cost Evidence

The evaluator should check:

```text
Price Sources
Price Age
Missing Prices
Estimated Prices
Supplier Availability
```

Example:

```text
Cost:
₱25,850

Price Issues:
✓ 8 verified
⚠ 1 estimated
⚠ 1 expired
```

Result:

```text
REVIEW_REQUIRED
```

---

# 42. Material Evaluation

Check:

```text
Material Exists?
Price Available?
Availability Known?
Quantity Valid?
Cultural Association?
Restricted?
```

---

# 43. Material Availability

Example:

```text
Material A:
AVAILABLE ✓

Material B:
LIMITED ⚠

Material C:
OUT_OF_STOCK ❌
```

If Material C is mandatory:

```text
REVISION_REQUIRED
```

---

# 44. Material Quantity

The system should compare:

```text
Required Quantity
```

against:

```text
Available Quantity
```

Example:

```text
Required:
5 m

Available:
3 m
```

Result:

```text
REVIEW_REQUIRED
```

---

# 45. Design Completeness

The evaluator should check whether a design has the required information.

Minimum design record:

```text
Design Name
Silhouette
Garment Components
Cultural Elements
Materials
Colors
Construction Notes
Body Considerations
Cost
References
```

Missing required fields:

```text
INCOMPLETE
```

---

# 46. Unsupported Claims

AI-generated text may contain claims such as:

```text
"This motif traditionally represents prosperity."
```

The system should require supporting evidence for factual cultural claims.

If no source exists:

```text
UNSUPPORTED_CLAIM
```

Example:

```text
⚠ Unsupported cultural statement

Claim:
"The motif symbolizes prosperity."

No supporting cultural source was found.

Action:
Verify or remove statement.
```

---

# 47. AI Explanation Validation

AI explanations should reference:

```text
Cultural Element IDs
Source IDs
Requirement IDs
Material IDs
Cost Calculation IDs
```

Example:

```text
Reason:
Textile MAT-024 was selected because it is
associated with CULT-003.

Source:
CR-018.

Requirement:
REQ-004.
```

---

# 48. Evidence Hierarchy

The evaluator should prioritize:

```text
1. Verified Knowledge Records
2. Referenced Sources
3. Application Rules
4. Structured User Requirements
5. Deterministic Calculations
6. AI Suggestions
```

AI-generated text alone should have the lowest evidentiary authority.

---

# 49. Evaluation Rule Model

Rules should be stored as structured configuration.

Example:

```json
{
  "ruleId": "CULT-001",
  "domain": "CULTURAL",
  "name": "Cultural Association Required",
  "severity": "HIGH",
  "condition": "culturalElement.associationExists === true",
  "failureStatus": "REVIEW_REQUIRED"
}
```

---

# 50. Rule Types

Recommended:

```text
CULTURAL_ASSOCIATION
CULTURAL_SOURCE
CULTURAL_RESTRICTION
CULTURAL_USAGE
REQUIREMENT_MANDATORY
REQUIREMENT_PREFERRED
REQUIREMENT_RESTRICTED
BODY_DATA
BODY_CONSIDERATION
MATERIAL_AVAILABILITY
MATERIAL_PRICE
BUDGET
COST_EVIDENCE
DESIGN_COMPLETENESS
SOURCE_EVIDENCE
```

---

# 51. Rule Engine

Architecture:

```text
EvaluationService
       ↓
RuleRegistry
       ↓
RuleExecutor
       ↓
EvidenceProvider
       ↓
FindingGenerator
```

---

# 52. Evaluation Service

Recommended responsibilities:

```text
evaluateDesign()
evaluateCulture()
evaluateRequirements()
evaluateBody()
evaluateMaterials()
evaluateCost()
evaluateEvidence()
generateFindings()
calculateCoverage()
determineReviewStatus()
createEvaluationSnapshot()
```

---

# 53. Evaluation Snapshot

Every evaluation should be saved.

Example:

```text
Evaluation:
EVAL-001

Design:
DES-001-V3

Executed:
2026-09-28

Engine Version:
1.0.0

Result:
REVIEW_REQUIRED
```

The snapshot should preserve the evidence used at that time.

---

# 54. Why Evaluation Snapshots Matter

Suppose:

```text
Today:
Material price = ₱850
```

Later:

```text
Material price = ₱1,000
```

Historical evaluation should not silently change.

Therefore:

```text
Design V3
    ↓
Cost Snapshot
    ↓
Evaluation Snapshot
```

must remain immutable.

---

# 55. Evaluation Database

Recommended entities:

```text
evaluation_runs
evaluation_rules
evaluation_findings
evaluation_evidence
evaluation_snapshots
review_actions
```

---

# 56. `evaluation_runs`

```text
evaluation_runs
-------------------------
id
project_id
design_id
design_version_id
status
engine_version
started_at
completed_at
created_by
```

---

# 57. `evaluation_rules`

```text
evaluation_rules
-------------------------
id
rule_code
domain
name
description
severity
configuration
version
status
created_at
updated_at
```

---

# 58. `evaluation_findings`

```text
evaluation_findings
-------------------------
id
evaluation_id
rule_id
domain
severity
status
title
description
affected_entity_type
affected_entity_id
recommendation
human_review_required
resolved
resolved_by
resolved_at
created_at
```

---

# 59. `evaluation_evidence`

```text
evaluation_evidence
-------------------------
id
finding_id
evidence_type
entity_type
entity_id
source_id
value
description
created_at
```

---

# 60. `review_actions`

```text
review_actions
-------------------------
id
evaluation_id
finding_id
reviewer_id
action
comment
created_at
```

Possible actions:

```text
ACKNOWLEDGE
RESOLVE
REJECT
REQUEST_REVISION
ACCEPT
ESCALATE
```

---

# 61. Evaluation API

## Run Evaluation

```http
POST /api/designs/:id/evaluate
```

---

# 62. Get Evaluation

```http
GET /api/designs/:id/evaluation
```

---

# 63. Get Findings

```http
GET /api/designs/:id/evaluation/findings
```

---

# 64. Resolve Finding

```http
POST /api/evaluation/findings/:id/resolve
```

Request:

```json
{
  "comment": "Verified with cultural reference.",
  "action": "RESOLVE"
}
```

---

# 65. Request Revision

```http
POST /api/evaluation/:id/request-revision
```

---

# 66. Human Approval

```http
POST /api/evaluation/:id/approve
```

Approval must require an authorized human user.

The AI must never call the approval endpoint.

---

# 67. Evaluation UI

Recommended Design Studio panel:

```text
┌──────────────────────────────────────────┐
│ DESIGN EVALUATION                        │
├──────────────────────────────────────────┤
│                                          │
│ CULTURAL                 ✓ PASS          │
│ Requirements            ✓ PASS          │
│ Body Profile             ⚠ REVIEW        │
│ Materials                ✓ PASS          │
│ Cost                     ✓ PASS          │
│ Evidence                 ⚠ REVIEW        │
│                                          │
│ Overall: REVIEW REQUIRED                │
│                                          │
│ [View Findings] [Request Revision]       │
└──────────────────────────────────────────┘
```

---

# 68. Evaluation Dashboard

A dedicated evaluation dashboard should display:

```text
Evaluation Summary

Cultural
████████████████ PASS

Requirements
████████████████ PASS

Body
███████████░░░░░ REVIEW

Cost
████████████████ PASS

Materials
████████████████ PASS

Evidence
███████████░░░░░ REVIEW
```

Avoid presenting this as a single simplistic "AI score."

---

# 69. Why Avoid a Single Score

A score such as:

```text
Cultural Score:
94%
```

can falsely imply scientific precision.

Instead show:

```text
PASS
WARNING
REVIEW REQUIRED
FAIL
```

along with evidence.

If numerical metrics are useful, they should represent explicit measurable quantities such as:

```text
Mandatory requirements satisfied:
7/8

Referenced cultural elements:
6/7

Materials with verified prices:
8/10
```

---

# 70. Cultural Coverage Metric

Example:

```text
Cultural Elements:
8

With verified records:
7

Coverage:
87.5%
```

This is a factual coverage measure.

It should not be labeled:

```text
Authenticity Score
```

---

# 71. Requirement Coverage Metric

Example:

```text
Mandatory Requirements:
8

Satisfied:
8

Coverage:
100%
```

This is appropriate because it measures explicit requirements.

---

# 72. Evidence Coverage

Example:

```text
Cultural Claims:
10

Supported:
8

Unsupported:
2

Evidence Coverage:
80%
```

This provides a measurable transparency metric.

---

# 73. Review Priority

Findings can be sorted by severity:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

But the system should not hide lower-severity findings.

---

# 74. Finding Example

```text
HIGH
Cultural Usage Context

The selected ornament is documented
for ceremonial use, while this project
is configured as festival attire.

Evidence:
CE-041
CR-021

Action:
Request cultural review.
```

---

# 75. Human Review Workflow

```text
AI / System Evaluation
          ↓
Findings
          ↓
Designer Review
          ↓
┌─────────┼───────────┐
↓         ↓           ↓
Accept   Modify      Reject
          ↓
      New Version
          ↓
     Re-evaluation
```

---

# 76. Revision Loop

If a finding is unresolved:

```text
REVIEW_REQUIRED
```

Designer modifies design:

```text
DESIGN V4
```

System runs:

```text
EVALUATION V4
```

Old evaluation remains preserved.

---

# 77. Example Revision

### V3

```text
Cost:
₱34,500

Budget:
₱30,000

Finding:
Budget exceeded
```

Designer changes material.

### V4

```text
Cost:
₱29,800

Budget:
₱30,000

Finding:
Resolved
```

History:

```text
V3 → Budget Finding
V4 → Finding Resolved
```

---

# 78. Human Review Record

Every decision should record:

```text
Reviewer
Date
Action
Comment
Affected Finding
Design Version
Evaluation Version
```

Example:

```text
Reviewer:
Designer A

Action:
RESOLVE

Comment:
"Verified material availability with supplier."

Date:
2026-09-28
```

---

# 79. Cultural Expert Review

Some findings should allow escalation.

Example:

```text
Designer
    ↓
Cultural Expert
    ↓
Review
    ↓
Comment
    ↓
Resolve / Request Revision
```

The expert's decision becomes part of the audit trail.

---

# 80. Cultural Expert Does Not Rewrite History

If an expert changes a knowledge record later:

```text
Old Evaluation:
EVAL-001
```

must remain unchanged.

New evaluations use:

```text
Knowledge Version 2
```

This maintains historical traceability.

---

# 81. Knowledge Versioning

Cultural records should ideally contain:

```text
Knowledge Version
```

Example:

```text
CE-024
Version 1

CE-024
Version 2
```

Evaluation snapshots reference the version used.

---

# 82. Evidence-Based Explanation

Each finding should support:

```text
WHAT
WHY
EVIDENCE
ACTION
```

Example:

```text
WHAT:
Material association requires review.

WHY:
No verified cultural association was found.

EVIDENCE:
Knowledge record CE-044.

ACTION:
Verify with cultural expert.
```

---

# 83. Explainability Integration

Architecture:

```text
Evaluation Rule
       ↓
Finding
       ↓
Evidence
       ↓
Explanation Engine
       ↓
Human-readable Explanation
```

The explanation engine should not invent evidence.

---

# 84. AI Evaluation Boundary

The AI may help:

- identify possible issues
- interpret design descriptions
- map free text to known entities
- suggest explanations
- suggest which rule may apply

But final evaluation status should come from structured application rules and evidence.

---

# 85. Example

AI says:

```text
"The textile appears culturally appropriate."
```

This is not enough.

System checks:

```text
Cultural Element:
MAT-024

Knowledge:
Associated with selected culture ✓

Source:
CR-018 ✓

Usage:
Compatible with occasion ✓
```

Then:

```text
Rule Result:
PASS
```

---

# 86. Rule Execution

Example pseudocode:

```typescript
if (!culturalElement.sourceIds.length) {
  createFinding({
    domain: "CULTURAL",
    severity: "HIGH",
    status: "REVIEW_REQUIRED",
    title: "Missing cultural evidence",
  });
}
```

---

# 87. Requirement Rule

```typescript
if (requirement.priority === "MANDATORY" && !requirementSatisfied) {
  createFinding({
    domain: "REQUIREMENTS",
    severity: "HIGH",
    status: "REVISION_REQUIRED",
    title: "Mandatory requirement not satisfied",
  });
}
```

---

# 88. Budget Rule

```typescript
if (cost.estimatedTotal > requirements.budget) {
  createFinding({
    domain: "COST",
    severity: "HIGH",
    status: "REVIEW_REQUIRED",
    title: "Estimated cost exceeds budget",
  });
}
```

---

# 89. Missing Body Measurement Rule

```typescript
if (design.requiresFittedWaist && !bodyProfile.waist) {
  createFinding({
    domain: "BODY",
    severity: "MEDIUM",
    status: "REVIEW_REQUIRED",
    title: "Waist measurement required",
  });
}
```

---

# 90. Material Availability Rule

```typescript
if (material.availability === "OUT_OF_STOCK") {
  createFinding({
    domain: "MATERIAL",
    severity: "HIGH",
    status: "REVIEW_REQUIRED",
    title: "Required material unavailable",
  });
}
```

---

# 91. Evaluation Decision Logic

The overall status should be derived from findings.

Conceptually:

```text
If CRITICAL unresolved:
    BLOCKED

Else if HIGH unresolved:
    REVISION_REQUIRED or REVIEW_REQUIRED

Else if MEDIUM unresolved:
    REVIEW_REQUIRED

Else if LOW/INFO only:
    PASS_WITH_WARNINGS

Else:
    PASSED_WITHOUT_CRITICAL_ISSUES
```

The exact behavior should be configurable.

---

# 92. Important Distinction

The system must distinguish:

```text
SYSTEM EVALUATION
```

from:

```text
HUMAN APPROVAL
```

Example:

```text
System:
PASSED_WITHOUT_CRITICAL_ISSUES

Human:
PENDING
```

The final state is still:

```text
REVIEW_REQUIRED
```

until the authorized human completes review.

---

# 93. Approval State

Recommended:

```text
NOT_REVIEWED
IN_REVIEW
APPROVED
REJECTED
REVISION_REQUESTED
```

---

# 94. Final Design State

A design should reach:

```text
FINAL
```

only when:

```text
Evaluation complete
+
Required findings resolved
+
Human review completed
+
Human approval recorded
```

---

# 95. Evaluation + Design State

```text
DESIGN GENERATED
      ↓
EVALUATING
      ↓
REVIEW_REQUIRED
      ↓
HUMAN REVIEW
      ↓
┌─────────────┐
│             │
▼             ▼
APPROVED    REVISION
              ↓
         NEW DESIGN VERSION
              ↓
          RE-EVALUATE
```

---

# 96. Evaluation API Response Example

```json
{
  "evaluationId": "EVAL-003",
  "status": "REVIEW_REQUIRED",

  "cultural": {
    "status": "PASS_WITH_WARNINGS",
    "verifiedElements": 6,
    "totalElements": 7,
    "findings": 1
  },

  "requirements": {
    "status": "PASS",
    "mandatorySatisfied": 8,
    "mandatoryTotal": 8,
    "preferredSatisfied": 4,
    "preferredTotal": 6
  },

  "body": {
    "status": "REVIEW_REQUIRED",
    "findings": 1
  },

  "materials": {
    "status": "PASS",
    "available": 8,
    "total": 8
  },

  "cost": {
    "status": "PASS",
    "estimatedTotal": 25850,
    "budget": 30000
  },

  "evidence": {
    "status": "REVIEW_REQUIRED",
    "supportedClaims": 8,
    "totalClaims": 10
  },

  "humanReview": {
    "status": "PENDING"
  }
}
```

---

# 97. Evaluation UI — Finding Details

When the designer clicks a finding:

```text
┌──────────────────────────────────────────┐
│ CULTURAL USAGE REVIEW                    │
├──────────────────────────────────────────┤
│ Severity: HIGH                           │
│                                          │
│ Element                                  │
│ Traditional Ornament                     │
│                                          │
│ Issue                                    │
│ Usage context requires verification.     │
│                                          │
│ Evidence                                 │
│ CE-041                                   │
│ CR-021                                   │
│                                          │
│ Recommendation                           │
│ Consult cultural reference/expert.       │
│                                          │
│ [Resolve] [Request Revision] [Escalate]  │
└──────────────────────────────────────────┘
```

---

# 98. Evaluation Summary for Reports

Reports should contain:

```text
EVALUATION SUMMARY

Cultural:
PASS WITH WARNINGS

Requirements:
8/8 mandatory satisfied

Body:
REVIEW REQUIRED

Materials:
PASS

Cost:
PASS

Evidence:
REVIEW REQUIRED

Human Review:
APPROVED / PENDING
```

---

# 99. No Artificial Approval

The report must never state:

```text
"AI certified this costume as culturally authentic."
```

Instead:

```text
"System evaluation identified the following documented
cultural evidence and review findings."
```

---

# 100. Evaluation Logging

Every evaluation should generate an audit event:

```text
EVALUATION_STARTED
EVALUATION_COMPLETED
FINDING_CREATED
FINDING_RESOLVED
REVIEW_STARTED
REVISION_REQUESTED
DESIGN_APPROVED
DESIGN_REJECTED
```

---

# 101. Evaluation Performance

For normal designs:

```text
Target:
< 3 seconds
```

for deterministic evaluation, excluding external AI/image generation.

Large knowledge retrieval may be asynchronous.

---

# 102. Asynchronous Evaluation

For complex projects:

```text
QUEUED
   ↓
RUNNING
   ↓
CULTURAL_CHECK
   ↓
REQUIREMENT_CHECK
   ↓
BODY_CHECK
   ↓
MATERIAL_CHECK
   ↓
COST_CHECK
   ↓
EVIDENCE_CHECK
   ↓
COMPLETED
```

---

# 103. Evaluation Job Object

```json
{
  "jobId": "EVAL-JOB-001",
  "status": "RUNNING",
  "currentStage": "CULTURAL_CHECK",
  "progress": 35
}
```

---

# 104. Evaluation Testing

Tests must cover:

```text
Cultural association
Missing cultural source
Restricted cultural element
Conflicting cultural evidence
Mandatory requirement failure
Preferred requirement omission
Restricted requirement violation
Missing body measurement
Estimated body measurement
Budget exceeded
Missing price
Expired price
Out-of-stock material
Unsupported cultural claim
Successful evaluation
Human approval
Revision loop
```

---

# 105. Security Testing

Verify that users cannot:

```text
Modify another project's evaluation
Resolve another user's restricted finding
Approve without permission
Modify evaluation snapshots
Delete audit history
Modify verified cultural records without authorization
```

---

# 106. Auditability

For every finding, the system should answer:

```text
Why was this finding generated?
Which rule generated it?
Which evidence was used?
Which knowledge record was referenced?
Which design version was evaluated?
Who resolved it?
When was it resolved?
```

If these questions cannot be answered, the evaluation system is insufficiently traceable.

---

# 107. Evaluation Data Flow

```text
                 DESIGN VERSION
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
      CULTURAL      REQUIREMENTS   BODY PROFILE
      KNOWLEDGE          │             │
          │              │             │
          └──────────────┼─────────────┘
                         ▼
                    EVALUATION
                       ENGINE
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          MATERIAL      COST      EVIDENCE
              │          │          │
              └──────────┼──────────┘
                         ▼
                      FINDINGS
                         │
                         ▼
                    EXPLANATIONS
                         │
                         ▼
                   HUMAN REVIEW
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
           APPROVE                REVISE
                                    │
                                    ▼
                              NEW VERSION
```

---

# 108. Final Evaluation Architecture

```text
┌────────────────────────────────────────────────┐
│                EVALUATION ENGINE               │
├────────────────────────────────────────────────┤
│                                                │
│  Cultural Rules                                │
│  Requirement Rules                             │
│  Body Rules                                    │
│  Material Rules                                │
│  Cost Rules                                    │
│  Evidence Rules                                │
│                                                │
├────────────────────────────────────────────────┤
│                 RULE EXECUTOR                  │
├────────────────────────────────────────────────┤
│                                                │
│                 EVIDENCE LAYER                 │
│                                                │
│ Cultural KG | Requirements | Body | Cost       │
│ Materials   | Sources       | Design Version   │
│                                                │
├────────────────────────────────────────────────┤
│                 FINDING ENGINE                 │
├────────────────────────────────────────────────┤
│                                                │
│ PASS | WARNING | REVIEW | REVISION | BLOCKED  │
│                                                │
├────────────────────────────────────────────────┤
│               EXPLANATION ENGINE               │
├────────────────────────────────────────────────┤
│                                                │
│ WHAT → WHY → EVIDENCE → ACTION                 │
│                                                │
├────────────────────────────────────────────────┤
│                HUMAN REVIEW                   │
└────────────────────────────────────────────────┘
```

---

# 109. MVP Scope

The first implementation should include:

```text
✓ Cultural association checking
✓ Cultural source checking
✓ Cultural restriction checking
✓ Mandatory requirement checking
✓ Preferred requirement checking
✓ Restricted requirement checking
✓ Basic body-profile completeness
✓ Material availability
✓ Deterministic cost evaluation
✓ Budget evaluation
✓ Missing-price detection
✓ Basic evidence validation
✓ Structured findings
✓ Severity levels
✓ Evaluation snapshots
✓ Human review
✓ Revision workflow
✓ Audit logging
```

---

# 110. Phase 2

Add:

```text
✓ Advanced cultural context rules
✓ Knowledge graph relationship validation
✓ Conflicting-source detection
✓ Advanced body design checks
✓ Fabric consumption validation
✓ Supplier availability validation
✓ Evidence coverage metrics
✓ Evaluation comparison between versions
✓ Cultural expert escalation
✓ Advanced explanation generation
```

---

# 111. Phase 3

Add:

```text
✓ Historical design comparison
✓ Advanced production feasibility
✓ Sustainability evaluation
✓ Predictive risk detection
✓ Learned evaluation assistance
✓ Advanced computer vision measurements
✓ Automated evidence retrieval
✓ Advanced analytics
```

---

# 112. Recommended Frontend Structure

```text
src/
└── features/
    └── evaluation/
        ├── components/
        │   ├── EvaluationSummary.tsx
        │   ├── EvaluationDomain.tsx
        │   ├── FindingList.tsx
        │   ├── FindingCard.tsx
        │   ├── FindingDetails.tsx
        │   ├── EvidencePanel.tsx
        │   ├── RequirementCoverage.tsx
        │   ├── CulturalEvaluation.tsx
        │   ├── BodyEvaluation.tsx
        │   ├── CostEvaluation.tsx
        │   ├── MaterialEvaluation.tsx
        │   ├── HumanReviewPanel.tsx
        │   └── EvaluationHistory.tsx
        │
        ├── services/
        │   └── evaluationApi.ts
        │
        ├── hooks/
        │   ├── useEvaluation.ts
        │   ├── useFindings.ts
        │   └── useHumanReview.ts
        │
        ├── types/
        │   └── evaluation.ts
        │
        └── utils/
            ├── evaluationStatus.ts
            └── findingSeverity.ts
```

---

# 113. Backend Structure

```text
backend/
└── services/
    └── evaluation/
        ├── EvaluationService
        ├── CulturalEvaluator
        ├── RequirementEvaluator
        ├── BodyEvaluator
        ├── MaterialEvaluator
        ├── CostEvaluator
        ├── EvidenceEvaluator
        ├── RuleEngine
        ├── FindingService
        ├── ExplanationService
        ├── ReviewService
        └── EvaluationSnapshotService
```

---

# 114. Acceptance Criteria

The Evaluation Engine is complete when:

```text
[ ] A design can be evaluated.
[ ] Each evaluation has a version.
[ ] Cultural associations are checked.
[ ] Cultural sources are checked.
[ ] Cultural restrictions are checked.
[ ] Requirements are checked.
[ ] Mandatory requirements are distinguished from preferred.
[ ] Restricted requirements are detected.
[ ] Body-profile completeness is checked.
[ ] Material availability is checked.
[ ] Cost and budget are checked.
[ ] Missing/expired prices generate findings.
[ ] Unsupported claims are identified.
[ ] Findings contain evidence.
[ ] Findings have severity.
[ ] Findings have resolution states.
[ ] Human review is supported.
[ ] Revision requests create a new design version.
[ ] Evaluation snapshots are preserved.
[ ] Audit records are created.
[ ] AI cannot approve a design.
[ ] Final approval requires an authorized human.
```

---

# 115. Critical Rules

The following rules are mandatory:

### Rule 1

**Evaluation is evidence-based, not AI-confidence-based.**

### Rule 2

**The system must distinguish cultural documentation from cultural interpretation.**

### Rule 3

**Missing evidence must not be converted into positive evidence.**

### Rule 4

**The system must not claim absolute cultural authenticity.**

### Rule 5

**Body evaluation identifies potential considerations; it does not guarantee physical fit.**

### Rule 6

**The Cost Engine remains the source of deterministic cost calculations.**

### Rule 7

**Evaluation findings must be traceable to rules and evidence.**

### Rule 8

**Historical evaluations must remain reproducible.**

### Rule 9

**Human review remains the final decision layer.**

### Rule 10

**A generated image is not evidence of cultural correctness.**

---

# 116. Final Evaluation Principle

The Evaluation Engine transforms the platform from:

```text
AI generates design
```

into:

```text
AI generates design
        ↓
System checks design
        ↓
Evidence is displayed
        ↓
Problems are identified
        ↓
Human reviews
        ↓
Designer revises if necessary
        ↓
System evaluates again
        ↓
Human approves final design
```

The fundamental architecture is:

```text
                    KNOWLEDGE
                        │
                        ▼
                    RULES
                        │
                        ▼
                     DESIGN
                        │
                        ▼
                  EVALUATION
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           CULTURE    BODY      COST
              │         │         │
              └─────────┼─────────┘
                        ▼
                    FINDINGS
                        │
                        ▼
                   EXPLANATION
                        │
                        ▼
                 HUMAN REVIEW
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
           APPROVE              REVISE
                                  │
                                  ▼
                           NEW DESIGN VERSION
```

> **The Evaluation Engine does not replace the designer. It makes the designer's review more systematic, traceable, evidence-aware, and repeatable.**
