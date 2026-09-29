# 04_CULTURAL_KNOWLEDGE_MODEL.md

# Human-AI Collaborative Cultural Attire Design Platform

## Cultural Knowledge Model & Knowledge Graph Specification

**Document:** 04_CULTURAL_KNOWLEDGE_MODEL.md
**Version:** 1.0
**Status:** Development Specification
**Domain:** Cultural Heritage / Traditional Attire / Creative Design
**Primary Storage:** PostgreSQL + Knowledge Graph
**Graph Database:** Neo4j recommended for advanced implementation
**Vector Retrieval:** PostgreSQL + pgvector
**Primary Users:** Designer, Cultural Expert, Researcher, Administrator

---

# 1. PURPOSE

This document defines how cultural knowledge will be represented, organized, validated, connected, retrieved, and used by the application.

The Cultural Knowledge Model is one of the most important components of the system because the application should not rely on an AI model's internal knowledge as the authoritative source of cultural information.

The intended architecture is:

```text
CULTURAL SOURCES
       ↓
CULTURAL KNOWLEDGE
       ↓
VALIDATION
       ↓
KNOWLEDGE GRAPH
       ↓
CULTURAL RULES
       ↓
CONTEXT RETRIEVAL
       ↓
DESIGN CONSTRAINTS
       ↓
AI GENERATION
       ↓
EVALUATION
       ↓
HUMAN REVIEW
```

The system therefore follows:

> **Knowledge → Constraints → Generation → Evaluation → Human Review**

rather than:

> **Prompt → AI Image → Final Design**

---

# 2. OBJECTIVES

The Cultural Knowledge Model must allow the application to:

1. Store cultural information in structured form.
2. Connect related cultural entities.
3. Store cultural sources and references.
4. Represent community-specific information.
5. Represent contextual usage.
6. Represent restrictions and sensitivities.
7. Track validation status.
8. Support expert review.
9. Retrieve culturally relevant information for a design project.
10. Provide evidence to the AI system.
11. Support explainable AI recommendations.
12. Detect unsupported cultural claims.
13. Preserve historical and contextual information.
14. Support future knowledge-graph expansion.

---

# 3. DESIGN PRINCIPLE

The system must distinguish between four different types of information.

## 3.1 Verified Knowledge

Information supported by an approved source and/or expert validation.

Example:

```text
Textile X
→ associated with Community A
→ documented by Reference R001
→ validated by Cultural Expert
```

---

## 3.2 System Rules

Rules created by the application based on structured knowledge.

Example:

```text
IF
    cultural_element = ceremonial_only
AND
    occasion != ceremonial
THEN
    FLAG_FOR_REVIEW
```

---

## 3.3 AI Recommendations

Suggestions produced by the AI.

Example:

```text
AI Suggestion:
Consider using Textile X as the primary textile.
```

This is a recommendation, not a verified cultural fact.

---

## 3.4 Human Decisions

The final decision made by a designer or authorized expert.

Example:

```text
Designer:
Accepted Textile X.

Cultural Expert:
Approved usage for this project.
```

---

# 4. KNOWLEDGE HIERARCHY

The application should maintain this hierarchy:

```text
SOURCE
   ↓
EVIDENCE
   ↓
CULTURAL CLAIM
   ↓
CULTURAL ENTITY
   ↓
RELATIONSHIP
   ↓
RULE
   ↓
DESIGN CONSTRAINT
   ↓
AI RECOMMENDATION
   ↓
HUMAN REVIEW
```

The lower layers must not silently overwrite the higher layers.

For example:

```text
AI Output
    ↓
cannot directly modify
    ↓
Verified Cultural Knowledge
```

---

# 5. CULTURAL KNOWLEDGE DOMAIN

The initial domain model should contain:

```text
Culture
Community
Region
Cultural Tradition
Traditional Attire
Garment
Textile
Material
Motif
Pattern
Symbol
Color
Ornament
Accessory
Headdress
Footwear
Technique
Construction Method
Occasion
Usage Context
Restriction
Meaning
Reference
Expert
Validation
```

---

# 6. CORE ENTITY MODEL

The high-level model is:

```text
                        CULTURE
                           │
             ┌─────────────┼─────────────┐
             │             │             │
         COMMUNITY       REGION       TRADITION
             │                           │
             │                           │
             └──────────────┬────────────┘
                            │
                     TRADITIONAL ATTIRE
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       GARMENT           TEXTILE           ORNAMENT
          │                 │                 │
          ├── MOTIF         ├── MATERIAL      ├── SYMBOL
          │                 │                 │
          └── TECHNIQUE     └── COLOR         └── MEANING
                            │
                         OCCASION
                            │
                        RESTRICTION
                            │
                         REFERENCE
```

---

# 7. CULTURE

A Culture represents a broader cultural identity or cultural tradition represented in the system.

## Attributes

```text
Culture ID
Name
Alternative Names
Description
Historical Context
Geographic Scope
Validation Status
References
Notes
Created Date
Updated Date
```

Example:

```text
Culture:
Culture A

Description:
Structured description supported by references.

Geographic Scope:
Region A

Validation:
VERIFIED
```

---

# 8. COMMUNITY

A Community represents a specific community associated with a cultural practice.

## Attributes

```text
Community ID
Name
Culture
Region
Description
Historical Context
Current Context
Validation Status
References
Expert Notes
```

Relationship:

```text
Culture
   │
   └── HAS_COMMUNITY
             │
             └── Community
```

This distinction is important because a broader cultural category may contain multiple communities with different practices.

---

# 9. REGION

A Region represents geographic context.

## Attributes

```text
Region ID
Name
Country
Administrative Level
Description
Coordinates (optional)
Historical Names
References
```

Relationships:

```text
Community
   ↓
LOCATED_IN
   ↓
Region
```

---

# 10. CULTURAL TRADITION

A Cultural Tradition represents a documented cultural practice or tradition.

## Attributes

```text
Tradition ID
Name
Description
Culture
Community
Region
Historical Context
Current Status
Associated Occasion
References
Validation Status
```

Relationships:

```text
Community
     ↓
PRACTICES
     ↓
Tradition
```

---

# 11. TRADITIONAL ATTIRE

Traditional Attire represents a complete attire tradition or documented clothing system.

## Attributes

```text
Attire ID
Name
Culture
Community
Region
Description
Historical Period
Occasion
Gender Context
Components
Textiles
Colors
Motifs
Accessories
References
Validation Status
```

Example structure:

```text
Traditional Attire
       │
       ├── Garment A
       ├── Garment B
       ├── Textile A
       ├── Motif A
       └── Accessory A
```

---

# 12. GARMENT

A Garment represents an individual clothing component.

Examples:

```text
Upper garment
Lower garment
Dress
Skirt
Vest
Jacket
Sash
Shawl
Head covering
Ceremonial garment
```

## Attributes

```text
Garment ID
Name
Alternative Names
Description
Culture
Community
Attire
Silhouette
Construction
Material
Technique
Occasion
Usage
Restriction
References
```

---

# 13. TEXTILE

Textile is a specialized cultural element.

## Attributes

```text
Textile ID
Name
Alternative Names
Culture
Community
Region
Material
Production Method
Pattern
Color
Technique
Historical Context
Traditional Usage
Modern Usage
Occasion
Restrictions
References
Validation Status
```

Example:

```text
Textile A
    ↓
ASSOCIATED_WITH
    ↓
Community A
```

---

# 14. MATERIAL

Materials describe physical substances used in attire.

Examples:

```text
Cotton
Silk
Abaca
Pineapple fiber
Wool
Synthetic fiber
Metal
Beads
Shell
Wood
```

Important distinction:

```text
TEXTILE
```

is not necessarily the same as:

```text
MATERIAL
```

For example:

```text
Textile A
   ↓
MADE_FROM
   ↓
Material B
```

---

# 15. MOTIF

A Motif represents a recurring visual design element.

## Attributes

```text
Motif ID
Name
Description
Visual Description
Culture
Community
Symbolic Meaning
Associated Textile
Associated Garment
Usage Context
Restriction
References
Validation Status
```

---

# 16. PATTERN

Pattern represents a larger visual arrangement.

Example:

```text
Motif A
+
Motif B
+
Motif C
=
Pattern X
```

Attributes:

```text
Pattern ID
Name
Description
Composition
Motifs
Culture
Community
Textile
Technique
Usage
References
```

---

# 17. SYMBOL

A Symbol represents a documented symbolic element.

Attributes:

```text
Symbol ID
Name
Description
Meaning
Culture
Community
Context
Usage
Restrictions
References
Validation Status
```

Important:

The system should distinguish:

```text
DOCUMENTED MEANING
```

from:

```text
AI-INFERRED MEANING
```

---

# 18. COLOR

Color can represent both visual characteristics and cultural associations.

Attributes:

```text
Color ID
Name
Hex Code
RGB
Description
Cultural Association
Symbolic Meaning
Context
Restrictions
References
Validation Status
```

Example:

```text
Color
  ↓
ASSOCIATED_WITH
  ↓
Culture
```

But an association must not automatically be treated as universal symbolism.

---

# 19. ORNAMENT

Ornaments represent decorative objects or components.

Examples:

```text
Beads
Jewelry
Embroidery
Metalwork
Shell decoration
Decorative fasteners
```

Attributes:

```text
Ornament ID
Name
Description
Material
Technique
Culture
Community
Garment
Occasion
Meaning
Restriction
References
```

---

# 20. TECHNIQUE

Technique represents a documented production or construction method.

Examples:

```text
Weaving
Embroidery
Beading
Appliqué
Printing
Dyeing
Metalworking
Hand stitching
```

Attributes:

```text
Technique ID
Name
Description
Culture
Community
Material
Textile
Garment
Traditional Usage
Modern Usage
References
Validation Status
```

---

# 21. OCCASION

Occasion represents the context in which an attire or cultural element is used.

Examples:

```text
Daily Wear
Festival
Wedding
Ceremony
Religious Event
Ritual
Performance
Competition
Pageant
Formal Event
Modern Fashion
```

The application should distinguish between:

```text
TRADITIONAL OCCASION
```

and:

```text
MODERN ADAPTATION
```

---

# 22. USAGE CONTEXT

A cultural element may have different meanings or appropriateness depending on context.

Therefore the graph should support:

```text
Element
   ↓
USED_IN
   ↓
Occasion
```

and:

```text
Element
   ↓
APPROPRIATE_FOR
   ↓
Context
```

Example:

```text
Motif A
    ↓
APPROPRIATE_FOR
    ↓
Festival
```

but:

```text
Motif A
    ↓
RESTRICTED_IN
    ↓
Commercial Casual Wear
```

if such a restriction is supported by the knowledge source.

---

# 23. CULTURAL RESTRICTION

Restrictions are first-class knowledge entities.

A restriction should contain:

```text
Restriction ID
Affected Element
Culture
Community
Context
Restriction Type
Description
Severity
Source
Validation Status
```

Examples:

```text
CEREMONIAL_ONLY
COMMUNITY_SPECIFIC
SACRED
CONTEXT_RESTRICTED
GENDER_SPECIFIC
STATUS_SPECIFIC
NOT_FOR_MODIFICATION
NOT_FOR_COMMERCIAL_USE
UNKNOWN
```

---

# 24. RESTRICTION MODEL

Instead of storing:

```text
Element.restricted = true
```

use contextual relationships.

Better:

```text
Element A
   ↓
RESTRICTED_IN
   ↓
Context B
```

This allows the system to represent more precise knowledge.

---

# 25. CULTURAL MEANING

Meaning should be represented separately from the cultural element itself.

```text
Element
   ↓
HAS_MEANING
   ↓
Meaning
```

Meaning attributes:

```text
Meaning ID
Description
Culture
Community
Context
Evidence
Reference
Validation Status
```

This avoids assuming that a symbol has exactly one universal meaning.

---

# 26. CULTURAL REFERENCES

Every important knowledge statement should have provenance.

A reference can be:

```text
Academic Publication
Book
Museum
Government Institution
University
Community Source
Archive
Expert Interview
Documented Website
Other
```

Attributes:

```text
Reference ID
Title
Author
Year
Publisher
Source Type
URL
Citation
Description
Credibility Status
```

---

# 27. PROVENANCE MODEL

The system should support:

```text
CLAIM
   ↓
SUPPORTED_BY
   ↓
REFERENCE
```

Example:

```text
Claim:
Textile A is associated with Community A.

       ↓
SUPPORTED_BY

Reference:
R-001
```

---

# 28. EVIDENCE

A reference may contain multiple pieces of evidence.

Therefore:

```text
Reference
    │
    ├── Evidence 1
    ├── Evidence 2
    └── Evidence 3
```

Each evidence item can contain:

```text
Evidence ID
Reference ID
Page
Section
Quoted/Extracted Text
Interpretation
Location
Created Date
```

The application does not necessarily need to expose the full quotation to users; it can provide a source citation and relevant excerpt where appropriate.

---

# 29. CULTURAL CLAIM

A Cultural Claim is a statement about a cultural entity or relationship.

Example:

```text
"Textile A is traditionally associated with Community A."
```

Structured representation:

```json id="6j6k7y"
{
  "subject": "Textile A",
  "predicate": "ASSOCIATED_WITH",
  "object": "Community A",
  "source": "REF-001",
  "status": "VERIFIED"
}
```

This is effectively a knowledge graph triple.

---

# 30. KNOWLEDGE GRAPH TRIPLE

The fundamental graph structure is:

```text
SUBJECT
   ↓
RELATIONSHIP
   ↓
OBJECT
```

Example:

```text
Textile A
   ↓
ASSOCIATED_WITH
   ↓
Community A
```

Another:

```text
Garment A
   ↓
USES
   ↓
Textile A
```

Another:

```text
Motif A
   ↓
APPROPRIATE_FOR
   ↓
Festival A
```

---

# 31. CORE RELATIONSHIPS

The initial graph should support:

```text
BELONGS_TO
ASSOCIATED_WITH
USED_BY
USED_IN
APPROPRIATE_FOR
RESTRICTED_IN
CONTAINS
MADE_FROM
USES
HAS_MOTIF
HAS_PATTERN
HAS_COLOR
HAS_SYMBOL
HAS_MEANING
USES_TECHNIQUE
RELATED_TO
DERIVED_FROM
ORIGINATES_FROM
DOCUMENTED_BY
SUPPORTED_BY
VALIDATED_BY
```

---

# 32. RELATIONSHIP SEMANTICS

Every relationship must have a clear meaning.

For example:

```text
ASSOCIATED_WITH
```

means an association is documented.

It does not necessarily mean:

```text
EXCLUSIVELY_OWNED_BY
```

Similarly:

```text
USED_IN
```

does not automatically mean:

```text
REQUIRED_FOR
```

The system should avoid ambiguous relationship names.

---

# 33. RELATIONSHIP METADATA

Each important relationship may contain:

```text
Relationship ID
Source Entity
Relationship Type
Target Entity
Description
Source
Confidence
Validation Status
Valid From
Valid Until
Notes
```

This supports temporal and contextual knowledge.

---

# 34. TEMPORAL KNOWLEDGE

Cultural practices may change over time.

Therefore the system should optionally support:

```text
valid_from
valid_until
historical_period
```

Example:

```text
Textile A
   ↓
USED_IN
   ↓
Occasion A

Historical Period:
1900–1950
```

while another record may describe:

```text
Modern Usage:
2000–Present
```

---

# 35. KNOWLEDGE VERSIONING

Cultural records should be versioned.

Example:

```text
Cultural Element A
       │
       ├── V1
       ├── V2
       └── V3
```

Each version records:

```text
Changed By
Changed Date
Previous Value
New Value
Reason
Source
Validation
```

This is especially useful where interpretations or documentation evolve.

---

# 36. CULTURAL KNOWLEDGE STATUS

Every record should have one of:

```text
UNVERIFIED
UNDER_REVIEW
VERIFIED
RESTRICTED
DEPRECATED
```

Meaning:

### UNVERIFIED

Information has been entered but has not been validated.

### UNDER_REVIEW

An expert or authorized reviewer is examining it.

### VERIFIED

The information has adequate supporting evidence and has passed the application's validation process.

### RESTRICTED

The information can be stored but should not be freely used in design recommendations.

### DEPRECATED

The record should no longer be used as the current representation.

---

# 37. EXPERT VALIDATION

Cultural experts should be able to review:

```text
Entity
Relationship
Claim
Reference
Restriction
Interpretation
```

Review decision:

```text
APPROVE
REJECT
REQUEST_REVISION
MARK_RESTRICTED
```

---

# 38. VALIDATION WORKFLOW

```text
NEW RECORD
    ↓
UNVERIFIED
    ↓
SUBMIT FOR REVIEW
    ↓
UNDER REVIEW
    ↓
┌───────────────┬───────────────┐
│               │               │
APPROVE      REVISION         REJECT
│               │
↓               ↓
VERIFIED    UNDER REVIEW
```

A record may also become:

```text
RESTRICTED
```

when appropriate.

---

# 39. HUMAN CURATION

The knowledge graph should support human curation rather than attempting to fully automate cultural knowledge creation.

A recommended model is:

```text
Source Discovery
      ↓
Candidate Extraction
      ↓
AI-Assisted Structuring
      ↓
Human Validation
      ↓
Knowledge Graph
```

Current cultural-heritage KG research similarly emphasizes hybrid workflows and human validation for entity linking, relationship approval, and semantic consistency.

---

# 40. AI-ASSISTED KNOWLEDGE EXTRACTION

AI may assist with:

```text
Entity Detection
Relationship Detection
Document Classification
Metadata Extraction
Candidate Summarization
Duplicate Detection
```

But:

```text
AI Extraction ≠ Verification
```

The pipeline is:

```text
DOCUMENT
   ↓
AI EXTRACTION
   ↓
CANDIDATE KNOWLEDGE
   ↓
VALIDATION
   ↓
APPROVED KNOWLEDGE
```

---

# 41. KNOWLEDGE INGESTION PIPELINE

```text
SOURCE
  ↓
DOCUMENT UPLOAD
  ↓
DOCUMENT PROCESSING
  ↓
TEXT EXTRACTION
  ↓
CHUNKING
  ↓
ENTITY EXTRACTION
  ↓
RELATIONSHIP EXTRACTION
  ↓
CANDIDATE GRAPH
  ↓
HUMAN REVIEW
  ↓
APPROVED GRAPH
```

---

# 42. SOURCE TYPES

The system should allow different source types:

```text
ACADEMIC
GOVERNMENT
MUSEUM
UNIVERSITY
ARCHIVE
COMMUNITY
EXPERT
BOOK
JOURNAL
WEBSITE
INTERVIEW
FIELD_DOCUMENTATION
OTHER
```

Source type should be stored explicitly.

---

# 43. SOURCE QUALITY

Instead of a single simplistic numerical "trust score", use structured metadata:

```text
Institution
Publication Type
Author
Publication Date
Peer Review Status
Community Origin
Expert Validation
Citation
```

This makes the basis for source assessment transparent.

---

# 44. COMMUNITY-SOURCED KNOWLEDGE

The model should allow community sources.

Example:

```text
Community Source
       ↓
Cultural Claim
       ↓
Community Validation
```

This is important because cultural knowledge may not be completely represented in academic publications.

However, community-sourced knowledge should still have provenance and validation metadata.

---

# 45. DISPUTED KNOWLEDGE

The system must support disagreement.

Do not force:

```text
ONE FACT
```

when sources disagree.

Instead:

```text
Claim A
   ↓
Source A

Claim B
   ↓
Source B
```

The system can record:

```text
status = DISPUTED
```

or:

```text
requires_expert_review = true
```

where appropriate.

---

# 46. CONTEXTUAL VALIDITY

A cultural statement may be valid only under a specific context.

Represent:

```text
Claim
 ↓
VALID_IN
 ↓
Context
```

Example:

```text
Element A
   ↓
APPROPRIATE_FOR
   ↓
Ceremony A
```

rather than assuming:

```text
Element A
   ↓
ALWAYS_APPROPRIATE
```

---

# 47. CULTURAL RULE ENGINE

The knowledge graph provides facts.

The rule engine converts selected knowledge into application constraints.

Example:

```text
Knowledge:

Textile A
→ associated with Community A

Rule:

IF project.community = Community A
THEN Textile A may be recommended.
```

Another:

```text
Knowledge:

Element B
→ restricted in Occasion C

Rule:

IF project.occasion = Occasion C
AND design contains Element B
THEN FLAG_REVIEW.
```

---

# 48. RULE TYPES

The application should support:

```text
RECOMMENDATION
RESTRICTION
VALIDATION
WARNING
REQUIREMENT
COMPATIBILITY
CONTEXT
SOURCE
```

---

# 49. RULE STRUCTURE

Example:

```json id="p7g8xv"
{
  "ruleId": "RULE-001",

  "type": "RESTRICTION",

  "condition": {
    "element": "CE-001",
    "context": "OCC-003"
  },

  "action": {
    "type": "FLAG_REVIEW",
    "severity": "HIGH"
  },

  "source": ["REF-001"]
}
```

---

# 50. RULE PRIORITY

Rules may have:

```text
MANDATORY
HIGH
MEDIUM
LOW
INFORMATIONAL
```

A restriction should generally override a recommendation.

Example:

```text
RECOMMENDATION:
Use Motif A.

RESTRICTION:
Motif A is restricted in this context.

Final system behavior:
FLAG / DO NOT RECOMMEND
```

---

# 51. CULTURAL COMPATIBILITY

The application should not attempt to produce a simplistic:

```text
CULTURALLY CORRECT = 100%
```

Instead, evaluation should be evidence-based.

Example:

```text
Cultural Evaluation

Verified Elements:
4

Supported Relationships:
6

Unsupported Claims:
1

Restricted Elements:
0

Human Review:
REQUIRED
```

---

# 52. CULTURAL EVALUATION STATES

Use:

```text
SUPPORTED
PARTIALLY_SUPPORTED
UNSUPPORTED
RESTRICTED
REVIEW_REQUIRED
NOT_EVALUATED
```

---

# 53. CULTURAL EVALUATION PROCESS

```text
GENERATED DESIGN
       ↓
EXTRACT CULTURAL ELEMENTS
       ↓
MATCH KNOWLEDGE GRAPH
       ↓
CHECK RELATIONSHIPS
       ↓
CHECK SOURCES
       ↓
CHECK RESTRICTIONS
       ↓
CHECK CONTEXT
       ↓
GENERATE FINDINGS
       ↓
HUMAN REVIEW
```

---

# 54. KNOWLEDGE RETRIEVAL

When generating a design, the system should retrieve:

```text
Culture
Community
Occasion
Garment
Relevant Textiles
Relevant Motifs
Relevant Patterns
Relevant Colors
Relevant Techniques
Relevant Materials
Restrictions
Sources
Expert Notes
```

---

# 55. RETRIEVAL QUERY

Example conceptual query:

```text
Find:

Culture = X
Community = Y
Occasion = Z
Garment = G

Return:

Associated textiles
Associated motifs
Associated colors
Associated techniques
Appropriate contexts
Restrictions
References
Validation status
```

---

# 56. GRAPH RETRIEVAL

Example:

```text
Community A
    │
    ├── USES → Textile A
    │              │
    │              └── MADE_FROM → Material A
    │
    ├── USES → Motif A
    │              │
    │              └── HAS_MEANING → Meaning A
    │
    └── PRACTICES → Tradition A
                         │
                         └── USED_IN → Occasion A
```

The AI context builder receives these relationships.

---

# 57. MULTI-HOP RETRIEVAL

The graph should support queries such as:

```text
Community
   ↓
Textile
   ↓
Material
```

or:

```text
Community
   ↓
Motif
   ↓
Meaning
   ↓
Occasion
```

or:

```text
Garment
   ↓
Textile
   ↓
Technique
   ↓
Material
```

Knowledge graphs are particularly useful for these connected relationships and semantic retrieval tasks.

---

# 58. GRAPH QUERY EXAMPLE

Neo4j conceptual query:

```cypher id="wz8j3x"
MATCH (c:Community {name: $community})
      -[:USES|ASSOCIATED_WITH*1..2]->(e:CulturalElement)
WHERE e.validationStatus = 'VERIFIED'
RETURN e
```

The actual query should be constrained further by category and context before being used in production.

---

# 59. RESTRICTION QUERY

```cypher id="xkqjps"
MATCH (e:CulturalElement)-[:RESTRICTED_IN]->(r:Context)
WHERE e.id IN $elementIds
RETURN e, r
```

---

# 60. OCCASION QUERY

```cypher id="g9g1rt"
MATCH (e:CulturalElement)-[:APPROPRIATE_FOR]->(o:Occasion)
WHERE o.id = $occasionId
RETURN e
```

---

# 61. KNOWLEDGE GRAPH → AI

The AI should not receive the entire graph.

Instead:

```text
PROJECT
   ↓
DESIGN REQUIREMENTS
   ↓
RELEVANT CULTURAL QUERY
   ↓
GRAPH RETRIEVAL
   ↓
FILTER
   ↓
VALIDATED CONTEXT
   ↓
AI
```

---

# 62. AI CULTURAL CONTEXT

Example:

```json id="hjcdj3"
{
  "culture": {
    "id": "CULT-001",
    "name": "Culture A"
  },

  "community": {
    "id": "COMM-001",
    "name": "Community A"
  },

  "occasion": {
    "id": "OCC-001",
    "name": "Festival"
  },

  "approvedElements": [
    {
      "id": "CE-001",
      "name": "Textile A",
      "category": "TEXTILE",
      "status": "VERIFIED",
      "sources": ["REF-001"]
    }
  ],

  "restrictedElements": [
    {
      "id": "CE-010",
      "reason": "Context restricted"
    }
  ]
}
```

---

# 63. AI INSTRUCTION

The AI context should explicitly state:

```text
Use verified cultural information provided by the system.

Do not invent cultural facts.

Do not reinterpret unsupported symbolism as fact.

Do not use restricted elements unless explicitly authorized.

If sufficient cultural information is unavailable,
request human review rather than inventing information.
```

---

# 64. CULTURAL GROUNDING

The application should track:

```text
Retrieved Cultural Facts
       ↓
Used in AI Context
       ↓
Used in Design Specification
       ↓
Appears in Generated Design
       ↓
Evaluated
```

This creates traceability.

---

# 65. CULTURAL ELEMENT USAGE RECORD

For each design version:

```text
Element
Usage
Source
Required?
AI Suggested?
Designer Selected?
Human Approved?
```

Example:

```json id="axg5ag"
{
  "elementId": "CE-001",

  "usage": "Primary textile",

  "source": "CULTURAL_DATABASE",

  "aiSuggested": true,

  "designerSelected": true,

  "humanApproved": false
}
```

---

# 66. EXPLAINABILITY CONNECTION

Every significant cultural recommendation should be explainable.

Structure:

```text
WHAT
WHY
SOURCE
CONSTRAINT
```

Example:

```text
WHAT:
Textile A

WHY:
Associated with the selected community and documented for the selected context.

SOURCE:
Reference R-001

CONSTRAINT:
Community-specific textile requirement.
```

---

# 67. CULTURAL KNOWLEDGE UI

The Cultural Knowledge module should provide:

```text
Culture Browser
Community Browser
Cultural Element Browser
Relationship Explorer
Reference Manager
Restriction Manager
Expert Review
Knowledge Graph Visualization
Search
Filters
```

---

# 68. CULTURE DETAIL PAGE

Suggested layout:

```text
┌──────────────────────────────────────────┐
│ CULTURE NAME                             │
├──────────────────────────────────────────┤
│ Description                              │
│ Geographic Context                       │
│ Historical Context                       │
│ Validation Status                        │
├──────────────────────────────────────────┤
│ COMMUNITIES                              │
│ • Community A                            │
│ • Community B                            │
├──────────────────────────────────────────┤
│ TRADITIONAL ATTIRE                       │
│ • Attire A                               │
│ • Attire B                               │
├──────────────────────────────────────────┤
│ TEXTILES                                 │
│ • Textile A                              │
├──────────────────────────────────────────┤
│ MOTIFS                                   │
│ • Motif A                                │
├──────────────────────────────────────────┤
│ REFERENCES                               │
│ • Reference A                            │
└──────────────────────────────────────────┘
```

---

# 69. CULTURAL ELEMENT DETAIL PAGE

Suggested layout:

```text
┌──────────────────────────────────────────┐
│ TEXTILE A                                │
│ VERIFIED                                 │
├──────────────────────────────────────────┤
│ Description                              │
│ Historical Context                       │
│ Traditional Usage                        │
│ Modern Usage                             │
├──────────────────────────────────────────┤
│ ASSOCIATED WITH                           │
│ Community A                              │
├──────────────────────────────────────────┤
│ MADE FROM                                │
│ Material A                               │
├──────────────────────────────────────────┤
│ APPROPRIATE FOR                          │
│ Occasion A                               │
├──────────────────────────────────────────┤
│ RESTRICTIONS                             │
│ None / Restricted Context                │
├──────────────────────────────────────────┤
│ SOURCES                                  │
│ Reference A                              │
└──────────────────────────────────────────┘
```

---

# 70. GRAPH VISUALIZATION

The application may provide:

```text
Community A
    │
    ├──── Textile A
    │       │
    │       └──── Material A
    │
    ├──── Motif A
    │       │
    │       └──── Meaning A
    │
    └──── Garment A
            │
            └──── Occasion A
```

Users should be able to click an entity to inspect its evidence.

---

# 71. GRAPH FILTERS

The graph interface should support filters:

```text
Culture
Community
Region
Category
Occasion
Historical Period
Validation Status
Restriction
Source Type
```

---

# 72. SEARCH MODES

The system should provide three search modes.

## Mode 1 — Exact Search

```text
Search:
"Textile A"
```

Returns exact/keyword matches.

---

## Mode 2 — Semantic Search

```text
Search:
"traditional woven textile associated with Community A"
```

Uses embeddings.

---

## Mode 3 — Graph Search

```text
Community A
→ textiles
→ motifs
→ occasions
```

Uses relationships.

---

# 73. HYBRID RETRIEVAL

Recommended retrieval architecture:

```text
USER REQUEST
     ↓
KEYWORD SEARCH
     +
VECTOR SEARCH
     +
GRAPH SEARCH
     ↓
MERGE RESULTS
     ↓
VALIDATION FILTER
     ↓
RELEVANCE FILTER
     ↓
CULTURAL CONTEXT
```

This provides richer retrieval than relying on vector similarity alone.

---

# 74. RETRIEVAL PRIORITY

The retrieval system should prioritize:

```text
1. Verified
2. Community-specific
3. Context-specific
4. Directly referenced
5. Relevant
6. Under-review
7. Unverified
```

Unverified information should not silently appear as authoritative context.

---

# 75. RESTRICTED KNOWLEDGE

Restricted records may still be visible to authorized users.

For example:

```text
Designer:
Limited information

Cultural Expert:
Full information

Administrator:
Full information
```

Access should be controlled by role.

---

# 76. CULTURAL KNOWLEDGE API

Recommended endpoints:

```text
GET /api/cultures

GET /api/cultures/:id

GET /api/cultures/:id/communities

GET /api/communities/:id

GET /api/cultural-elements

GET /api/cultural-elements/:id

GET /api/cultural-elements/:id/relationships

GET /api/cultural-elements/:id/references

GET /api/cultural-elements/:id/restrictions

POST /api/cultural-elements

PUT /api/cultural-elements/:id

POST /api/cultural-elements/:id/submit-review

POST /api/cultural-elements/:id/verify

GET /api/cultural-search

GET /api/cultural-graph
```

---

# 77. KNOWLEDGE GRAPH SERVICE

The backend should expose a dedicated service:

```text
CultureService
       │
       ├── getCulture()
       ├── getCommunity()
       ├── getElement()
       ├── searchElements()
       ├── getRelationships()
       ├── getRestrictions()
       ├── getReferences()
       └── buildCulturalContext()
```

---

# 78. CULTURAL CONTEXT BUILDER

The Context Builder receives:

```text
Culture
Community
Occasion
Garment
Design Requirements
```

and returns:

```text
Verified Cultural Facts
Relevant Elements
Allowed Elements
Restricted Elements
Sources
Expert Notes
Context Rules
```

---

# 79. CULTURAL CONTEXT OBJECT

Example:

```json id="0z5mna"
{
  "projectId": "PROJECT-001",

  "cultureId": "CULT-001",

  "communityId": "COMM-001",

  "occasionId": "OCC-001",

  "verifiedFacts": [],

  "recommendedElements": [],

  "restrictedElements": [],

  "contextRules": [],

  "references": [],

  "expertNotes": [],

  "retrievalTimestamp": "..."
}
```

---

# 80. CULTURAL CONTEXT VERSIONING

The exact cultural context used for an AI generation should be stored.

This is important because the knowledge database may change later.

Example:

```text
Design V1
    ↓
Culture Context Snapshot C-001
    ↓
AI Generation
```

Later:

```text
Knowledge Base updated
```

does not change the historical context of V1.

---

# 81. KNOWLEDGE SNAPSHOT

Each AI generation should reference:

```text
Knowledge Snapshot ID
```

The snapshot records:

```text
Cultural Elements
Relationships
Rules
Restrictions
References
Validation Status
Timestamp
```

This supports reproducibility.

---

# 82. KNOWLEDGE GRAPH TECHNOLOGY

Recommended implementation:

```text
PostgreSQL
+
Neo4j
+
pgvector
```

However, the MVP does not necessarily need all three.

---

# 83. MVP GRAPH IMPLEMENTATION

For the first prototype, the system can use PostgreSQL relationships:

```text
cultures
communities
cultural_elements
cultural_element_relationships
references
restrictions
```

This is enough to validate the application workflow.

---

# 84. ADVANCED GRAPH IMPLEMENTATION

When the number of entities and relationships grows:

```text
PostgreSQL
      +
Neo4j
```

Neo4j can become the graph-query layer.

PostgreSQL remains responsible for:

```text
Users
Projects
Designs
Costs
Evaluations
Audit
```

Neo4j handles:

```text
Cultural Entities
Relationships
Graph Traversal
Semantic Relationships
```

---

# 85. ONTOLOGY APPROACH

The system should use a lightweight domain ontology rather than attempting to create an enormous universal cultural ontology.

Initial ontology:

```text
Culture
Community
Region
Tradition
Attire
Garment
Textile
Material
Motif
Pattern
Symbol
Color
Technique
Occasion
Restriction
Reference
```

The model can later be expanded.

---

# 86. INTEROPERABILITY

Where useful, the system may align concepts with established cultural-heritage semantic models rather than inventing every concept independently.

CIDOC CRM is one possible interoperability reference for broader cultural-heritage modeling; current cultural-heritage KG work also demonstrates combining domain ontologies with established standards.

However:

```text
DO NOT
```

make the MVP dependent on full CIDOC CRM implementation.

Use it as an interoperability/reference direction.

---

# 87. WHY A LIGHTWEIGHT MODEL FIRST

The thesis prototype needs to demonstrate:

```text
Cultural Knowledge
        ↓
Structured Relationships
        ↓
AI Context
        ↓
Design Generation
        ↓
Evaluation
```

It does not need to recreate the entire global cultural heritage semantic web.

The ontology should therefore grow incrementally.

---

# 88. KNOWLEDGE GRAPH QUALITY CONTROL

The system should perform automated checks.

Examples:

### Orphan Check

```text
Cultural Element
    ↓
No Culture
```

Flag for review.

### Source Check

```text
Verified Element
    ↓
No Reference
```

Flag.

### Restriction Check

```text
Restricted Element
    ↓
No Restriction Context
```

Flag.

### Relationship Check

```text
Element
    ↓
Unknown Relationship
```

Reject.

---

# 89. GRAPH VALIDATION RULES

Example:

```text
IF status = VERIFIED
AND references = 0

THEN
status = UNDER_REVIEW
```

Another:

```text
IF relationship.type = RESTRICTED_IN
AND source = null

THEN
require validation
```

---

# 90. DUPLICATE DETECTION

The system should detect potential duplicates.

Example:

```text
"Textile A"

vs.

"Traditional Textile A"

vs.

"Textile-A"
```

AI may identify candidate duplicates.

But merging should require human confirmation.

Workflow:

```text
Candidate Duplicate
        ↓
Human Review
        ↓
MERGE / KEEP SEPARATE
```

---

# 91. ENTITY RESOLUTION

Potential matching fields:

```text
Name
Alternative Name
Culture
Community
Category
Description
Reference
```

The system may generate:

```text
MATCH_CONFIDENCE
```

but should not automatically merge culturally significant entities solely on similarity.

---

# 92. KNOWLEDGE GRAPH ADMINISTRATION

Administrators should be able to:

```text
Create Entity
Edit Entity
Archive Entity
Merge Entity
Create Relationship
Remove Relationship
Add Reference
Add Restriction
Submit for Review
Approve
Reject
View History
```

---

# 93. CULTURAL EXPERT WORKFLOW

Recommended interface:

```text
Review Queue
     ↓
Candidate Knowledge
     ↓
Evidence
     ↓
Related Entities
     ↓
Source References
     ↓
Expert Decision
```

The expert should see the evidence before approving.

---

# 94. REVIEW SCREEN

Example:

```text
┌────────────────────────────────────────────┐
│ CULTURAL KNOWLEDGE REVIEW                  │
├────────────────────────────────────────────┤
│ Entity: Textile A                          │
│ Category: Textile                          │
│ Culture: Culture A                         │
│ Community: Community A                     │
├────────────────────────────────────────────┤
│ CLAIM                                      │
│ Textile A is associated with Community A.  │
├────────────────────────────────────────────┤
│ EVIDENCE                                   │
│ Reference R-001                            │
│ Page 42                                    │
├────────────────────────────────────────────┤
│ RELATIONSHIPS                              │
│ Community A → Textile A                    │
├────────────────────────────────────────────┤
│ DECISION                                   │
│ [ APPROVE ] [ REQUEST REVISION ] [ REJECT ]│
└────────────────────────────────────────────┘
```

---

# 95. CULTURAL KNOWLEDGE AND DESIGN GENERATION

When a designer starts a project:

```text
SELECT CULTURE
       ↓
SELECT COMMUNITY
       ↓
SELECT OCCASION
       ↓
SELECT GARMENT
       ↓
SYSTEM RETRIEVES KNOWLEDGE
       ↓
DESIGN CONSTRAINTS
       ↓
AI DESIGN GENERATION
```

---

# 96. CULTURAL CONSTRAINT OBJECT

Example:

```json id="s0l1sk"
{
  "culture": "CULT-001",

  "community": "COMM-001",

  "occasion": "OCC-001",

  "mandatory": ["CE-001"],

  "allowed": ["CE-002", "CE-003"],

  "restricted": ["CE-010"],

  "reviewRequired": ["CE-011"]
}
```

---

# 97. DESIGN GENERATION RULE

The AI receives:

```text
Allowed Cultural Elements
+
Mandatory Elements
+
Restricted Elements
+
Context
+
Design Requirements
+
Body Constraints
+
Budget
```

It does NOT receive:

```text
"Use anything culturally relevant."
```

without structured context.

---

# 98. CULTURAL CONSTRAINT PIPELINE

```text
CULTURAL KNOWLEDGE
        ↓
RETRIEVAL
        ↓
VALIDATION
        ↓
CONTEXT FILTER
        ↓
CONSTRAINT BUILDER
        ↓
AI CONTEXT
```

---

# 99. CULTURAL EVALUATION AFTER GENERATION

After AI generation:

```text
AI DESIGN
   ↓
IDENTIFY CLAIMED CULTURAL ELEMENTS
   ↓
MATCH KNOWLEDGE GRAPH
   ↓
CHECK SOURCES
   ↓
CHECK CONTEXT
   ↓
CHECK RESTRICTIONS
   ↓
CHECK DESIGN REQUIREMENTS
   ↓
CREATE FINDINGS
```

---

# 100. UNSUPPORTED CULTURAL CLAIM

If AI produces:

```text
"This motif represents prosperity in Culture A."
```

but the graph contains no evidence:

```text
STATUS = UNSUPPORTED
```

The system should display:

```text
⚠ Unsupported cultural claim

No verified cultural reference was found for this interpretation.

Human review recommended.
```

---

# 101. MISSING KNOWLEDGE

If the system cannot find sufficient cultural information:

```text
CULTURAL_CONTEXT_NOT_FOUND
```

The application should not fabricate information.

Instead:

```text
No verified cultural information was found for this request.

Options:
[Review Cultural Knowledge]
[Add Reference]
[Continue With Human-Defined Constraints]
[Cancel Generation]
```

---

# 102. CULTURAL KNOWLEDGE CONFIDENCE

Avoid presenting a single AI-generated "cultural correctness score."

Instead expose evidence states:

```text
VERIFIED
SUPPORTED
PARTIALLY_SUPPORTED
UNSUPPORTED
RESTRICTED
REVIEW_REQUIRED
```

This is more interpretable.

---

# 103. EXPLANATION GENERATION

The explanation engine receives:

```text
Design
+
Cultural Context
+
Rules
+
Evidence
```

and produces:

```text
Recommendation
Reason
Source
Constraint
```

---

# 104. EXPLANATION EXAMPLE

```text
Recommendation:
Use Textile A as the primary textile.

Reason:
The knowledge base associates Textile A with the selected community
and the selected occasion.

Evidence:
Reference R-001.

Constraint:
Traditional textile requirement = Mandatory.

Status:
Verified cultural association.
```

---

# 105. CULTURAL KNOWLEDGE GRAPH AND COST

The cultural graph may also connect:

```text
Cultural Textile
       ↓
Material
       ↓
Supplier
       ↓
Price
```

Example:

```text
Textile A
   ↓
MADE_FROM
   ↓
Material A
   ↓
AVAILABLE_FROM
   ↓
Supplier A
```

This allows the design system to connect cultural appropriateness with practical material planning.

---

# 106. CULTURAL KNOWLEDGE GRAPH AND BODY DESIGN

The graph should not directly determine body fit.

Instead:

```text
Cultural Knowledge
       ↓
Garment Structure
       ↓
Design Requirement
       ↓
Body Profile
       ↓
Fit Evaluation
```

This keeps cultural reasoning separate from body analysis.

---

# 107. CULTURAL KNOWLEDGE GRAPH AND MODERN DESIGN

The system should allow:

```text
Traditional Element
        ↓
Modern Adaptation
```

But the adaptation should be explicitly identified.

Example:

```text
Usage:
MODERN_ADAPTATION
```

rather than claiming:

```text
Traditional Usage
```

---

# 108. MODERN ADAPTATION RECORD

Attributes:

```text
Adaptation ID
Original Element
Modern Design
Adaptation Description
Changes Made
Reason
Designer
Cultural Review
References
```

---

# 109. DESIGNER-DEFINED CULTURAL INPUT

A designer may explicitly provide:

```text
Required Textile
Required Motif
Required Color
Required Garment
Excluded Element
```

These become:

```text
USER CONSTRAINTS
```

They should remain distinguishable from:

```text
CULTURAL FACTS
```

---

# 110. KNOWLEDGE TYPES

The application should visually distinguish:

```text
FACT
RULE
RECOMMENDATION
USER CONSTRAINT
AI SUGGESTION
HUMAN DECISION
```

Example:

| Type            | Meaning                     |
| --------------- | --------------------------- |
| FACT            | Verified knowledge          |
| RULE            | System-derived constraint   |
| RECOMMENDATION  | System suggestion           |
| USER CONSTRAINT | Designer/client requirement |
| AI SUGGESTION   | AI-generated idea           |
| HUMAN DECISION  | Final human action          |

---

# 111. AI SAFETY BOUNDARY

The AI may:

```text
Suggest
Summarize
Generate
Compare
Explain
Transform
```

The AI must not independently:

```text
Verify cultural truth
Approve cultural usage
Remove restrictions
Modify verified cultural knowledge
Declare final cultural acceptability
```

---

# 112. KNOWLEDGE GRAPH SECURITY

Only authorized users may:

```text
Create verified records
Modify verified records
Approve relationships
Remove restrictions
Change validation status
```

Suggested permission:

```text
ADMIN
CULTURAL_EXPERT
```

for high-impact cultural modifications.

---

# 113. AUDIT REQUIREMENTS

Every change to cultural knowledge should record:

```text
User
Action
Entity
Old Value
New Value
Timestamp
Reason
Source
```

Example:

```text
USER:
Cultural Expert A

ACTION:
VERIFY

ENTITY:
CE-001

OLD:
UNDER_REVIEW

NEW:
VERIFIED

SOURCE:
REF-001

TIME:
2026-09-28
```

---

# 114. KNOWLEDGE GRAPH BACKUP

Back up:

```text
Entities
Relationships
References
Restrictions
Validation History
Version History
```

Do not back up only the graph database.

The source database and provenance must also be preserved.

---

# 115. KNOWLEDGE GRAPH TESTING

The system should contain predefined competency questions.

Examples:

### CQ1

What textiles are associated with Community A?

### CQ2

What motifs are documented for Community A?

### CQ3

Which elements are restricted for Occasion A?

### CQ4

What sources support Textile A?

### CQ5

Which techniques are associated with Garment A?

### CQ6

Which cultural elements can be recommended for Project A?

### CQ7

Which design elements lack verified sources?

These questions become test cases for the knowledge graph.

---

# 116. COMPETENCY QUESTION EXAMPLE

Question:

```text
What verified textiles are associated with Community A?
```

Expected query:

```text
Community A
    ↓
ASSOCIATED_WITH / USES
    ↓
Textile
    ↓
validation_status = VERIFIED
```

Expected output:

```text
Textile A
Textile B
Textile C
```

Each result should have its supporting references.

---

# 117. GRAPH QUALITY METRICS

For the application itself, monitor:

```text
Number of cultural entities
Number of relationships
Number of verified entities
Number of restricted entities
Number of referenced entities
Number of unresolved entities
Number of orphan entities
Number of duplicate candidates
```

---

# 118. KNOWLEDGE COVERAGE

The dashboard may display:

```text
Cultural Knowledge Coverage

Cultures: 5
Communities: 18
Cultural Elements: 420

Verified: 310
Under Review: 72
Unverified: 38
```

This is a knowledge-base management metric, not a claim about cultural completeness.

---

# 119. IMPORTANT LIMITATION

The system should never imply:

```text
"The knowledge graph contains all cultural knowledge."
```

Instead:

```text
"The system contains the currently documented knowledge available
within its configured sources and validated records."
```

This distinction is essential.

---

# 120. KNOWLEDGE GRAPH ARCHITECTURE

Final conceptual architecture:

```text
                 CULTURAL SOURCES
                       │
                       ▼
              DOCUMENT PROCESSING
                       │
                       ▼
             CANDIDATE KNOWLEDGE
                       │
                       ▼
              HUMAN VALIDATION
                       │
                       ▼
              CULTURAL KNOWLEDGE
                       │
          ┌────────────┼─────────────┐
          │            │             │
       ENTITIES    RELATIONSHIPS   SOURCES
          │            │             │
          └────────────┼─────────────┘
                       │
                       ▼
                 KNOWLEDGE GRAPH
                       │
                       ▼
                 CULTURAL RULES
                       │
                       ▼
                RETRIEVAL ENGINE
                       │
                       ▼
               CULTURAL CONTEXT
                       │
                       ▼
               CONSTRAINT ENGINE
                       │
                       ▼
                    AI
                       │
                       ▼
                GENERATED DESIGN
                       │
                       ▼
                EVALUATION ENGINE
                       │
                       ▼
                 HUMAN REVIEW
```

---

# 121. MVP IMPLEMENTATION

The MVP does not need to implement every advanced feature.

Start with:

```text
Culture
Community
Region
Cultural Element
Reference
Restriction
Relationship
Validation Status
```

Then connect:

```text
Design Brief
       ↓
Cultural Retrieval
       ↓
Cultural Context
```

---

# 122. MVP CULTURAL KNOWLEDGE WORKFLOW

```text
ADMIN/EXPERT
      ↓
ADD CULTURAL RECORD
      ↓
ADD SOURCE
      ↓
CREATE RELATIONSHIPS
      ↓
SUBMIT
      ↓
VALIDATE
      ↓
VERIFIED
      ↓
AVAILABLE TO DESIGN SYSTEM
```

---

# 123. PHASE 2

Add:

```text
Vector Search
Document Chunking
Semantic Search
Knowledge Graph Visualization
Advanced Relationships
Historical Context
Temporal Data
Duplicate Detection
Expert Collaboration
```

---

# 124. PHASE 3

Add:

```text
AI-Assisted Extraction
Automatic Candidate Relationship Detection
Graph Recommendation
Advanced Semantic Reasoning
Cross-Source Conflict Detection
Advanced Cultural Explainability
```

---

# 125. RECOMMENDED TECHNOLOGY STACK

## MVP

```text
PostgreSQL
+
Prisma / Drizzle
+
Next.js API
```

The relational tables from `03_DATABASE_SCHEMA.md` can serve as the initial knowledge layer.

---

## Advanced

```text
PostgreSQL
+
Neo4j
+
pgvector
```

Architecture:

```text
                 APPLICATION
                      │
          ┌───────────┴───────────┐
          │                       │
    PostgreSQL                  Neo4j
          │                       │
  Operational Data          Cultural Graph
          │                       │
          └───────────┬───────────┘
                      │
                   AI CONTEXT
                      │
                   AI MODEL
```

---

# 126. RECOMMENDED MVP DECISION

For the first working prototype:

**Do not start with Neo4j immediately.**

Start with:

```text
PostgreSQL
```

and implement:

```text
cultural_elements
cultural_element_relationships
cultures
communities
references
restrictions
```

Once the application workflow is working, Neo4j can be introduced if graph traversal becomes a meaningful requirement.

This keeps the first implementation manageable while preserving a migration path toward a dedicated graph database.

---

# 127. CRITICAL SYSTEM RULES

The following rules are mandatory.

### RULE 1

AI-generated cultural information is not automatically verified.

### RULE 2

Verified cultural knowledge requires provenance.

### RULE 3

Restrictions must be contextual.

### RULE 4

Human experts can validate or reject cultural records.

### RULE 5

AI cannot remove cultural restrictions.

### RULE 6

AI cannot modify verified cultural knowledge without an authorized workflow.

### RULE 7

Historical versions must be preserved.

### RULE 8

Conflicting sources must be representable.

### RULE 9

Missing knowledge must result in review rather than fabrication.

### RULE 10

Every significant cultural recommendation should be traceable to evidence.

---

# 128. DEFINITION OF DONE

The Cultural Knowledge Model is ready for MVP integration when:

- [ ] Culture entities exist
- [ ] Community entities exist
- [ ] Region entities exist
- [ ] Cultural elements can be stored
- [ ] Cultural elements have categories
- [ ] Relationships can be stored
- [ ] References can be attached
- [ ] Restrictions can be represented
- [ ] Validation status exists
- [ ] Expert review exists
- [ ] Cultural records can be searched
- [ ] Cultural records can be filtered
- [ ] Relevant cultural knowledge can be retrieved for a project
- [ ] Restricted elements can be identified
- [ ] Verified information can be distinguished from AI suggestions
- [ ] Cultural context can be passed to the AI orchestrator
- [ ] Cultural evidence can be shown in explanations
- [ ] Knowledge snapshots can be attached to AI generations
- [ ] Changes are auditable
- [ ] Missing knowledge triggers review rather than fabrication

---

# 129. FINAL MODEL

The complete cultural intelligence layer is:

```text
                   ┌─────────────────┐
                   │ CULTURAL SOURCES│
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │    EVIDENCE     │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ CULTURAL CLAIMS │
                   └────────┬────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │    CULTURAL KNOWLEDGE       │
              │                             │
              │ Culture                     │
              │ Community                   │
              │ Region                      │
              │ Garment                     │
              │ Textile                     │
              │ Motif                       │
              │ Pattern                     │
              │ Symbol                      │
              │ Color                       │
              │ Technique                   │
              │ Material                    │
              │ Occasion                    │
              └─────────────┬───────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ KNOWLEDGE GRAPH │
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
          RELATIONS      SOURCES      RESTRICTIONS
              │             │             │
              └─────────────┼─────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ CULTURAL RULES  │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ RETRIEVAL ENGINE│
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ CULTURAL CONTEXT│
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │    CONSTRAINT   │
                   │     ENGINE      │
                   └────────┬────────┘
                            │
                            ▼
                         AI MODEL
                            │
                            ▼
                    GENERATED DESIGN
                            │
                            ▼
                   EVALUATION ENGINE
                            │
                            ▼
                     HUMAN REVIEW
                            │
                            ▼
                     FINAL DESIGN
```

---

# 130. NEXT DEVELOPMENT DOCUMENT

The next document should be:

```text
05_AI_ORCHESTRATION.md
```

That document will define exactly how the application connects:

```text
PROJECT
   ↓
DESIGN BRIEF
   ↓
CULTURAL KNOWLEDGE
   ↓
BODY PROFILE
   ↓
MATERIALS
   ↓
BUDGET
   ↓
CONSTRAINT ENGINE
   ↓
CONTEXT BUILDER
   ↓
LLM
   ↓
STRUCTURED DESIGN SPECIFICATION
   ↓
IMAGE GENERATION
   ↓
EVALUATION
   ↓
EXPLANATION
   ↓
HUMAN REVIEW
```

It should also specify the **prompt architecture, AI context object, model boundaries, tool/MCP calls, structured JSON outputs, retry handling, hallucination controls, generation jobs, model abstraction, and the exact interface between your application and the AI services.**
