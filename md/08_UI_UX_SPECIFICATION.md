# 08_UI_UX_SPECIFICATION.md

# Human-AI Collaborative Cultural Attire Design Platform

## UI/UX Specification

**Document:** `08_UI_UX_SPECIFICATION.md`
**Version:** 1.0
**System:** Human-AI Collaborative Cultural Attire Design Platform
**Module:** Frontend, User Experience & Application Interface
**Status:** Implementation Specification

---

# 1. Purpose

This document defines the user interface and user experience requirements for the platform.

The objective is to transform the system architecture into a practical application that allows users to:

- create projects
- research cultural knowledge
- define design requirements
- create client/body profiles
- select materials
- generate AI-assisted designs
- inspect generated designs
- calculate costs
- evaluate designs
- review findings
- revise designs
- compare versions
- approve designs
- generate reports

The interface must make the Human-AI collaboration visible.

The application should not feel like:

> "Enter a prompt → AI generates an image."

Instead, it should feel like:

> **Research → Define → Generate → Evaluate → Review → Refine → Approve**

---

# 2. UX Philosophy

The application should follow five principles.

## 2.1 Guided

The system should guide users through the design process.

## 2.2 Transparent

Users should always understand:

- where information came from
- why something was recommended
- what the AI generated
- what the system calculated
- what requires human review

## 2.3 Evidence-Aware

Cultural claims and recommendations should expose their supporting information.

## 2.4 Human-Controlled

The designer remains in control of the final design.

## 2.5 Progressive Complexity

Basic users should not be overwhelmed by advanced features.

Advanced information should be accessible through:

- expandable panels
- details
- tabs
- evidence drawers
- advanced settings

---

# 3. Primary User Journey

The primary workflow is:

```text
LOGIN
  ↓
DASHBOARD
  ↓
CREATE PROJECT
  ↓
CULTURAL RESEARCH
  ↓
DESIGN REQUIREMENTS
  ↓
BODY PROFILE
  ↓
MATERIALS / BUDGET
  ↓
DESIGN GENERATION
  ↓
DESIGN STUDIO
  ↓
EVALUATION
  ↓
HUMAN REVIEW
  ↓
REVISION
  ↓
RE-EVALUATION
  ↓
APPROVAL
  ↓
REPORT
```

---

# 4. Application Information Architecture

The main application navigation should contain:

```text
Dashboard
Projects
Culture
Design Studio
Materials
Evaluations
Reports
```

Administration should appear separately for authorized users:

```text
Administration
├── Users
├── Roles
├── Cultural Knowledge
├── Materials
├── Suppliers
├── Labor Rates
├── System Rules
└── Audit Logs
```

---

# 5. Main Navigation

Recommended desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ LOGO / GRUMPY?        Search...            User ▾           │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ Dashboard     │                                             │
│ Projects      │                 MAIN CONTENT                │
│ Culture       │                                             │
│ Design Studio │                                             │
│ Materials     │                                             │
│ Evaluations   │                                             │
│ Reports       │                                             │
│               │                                             │
│ ───────────   │                                             │
│ Administration│                                             │
│               │                                             │
│ Settings      │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

---

# 6. Header

The header should contain:

```text
Logo
Global Search
Notifications
Current Project
User Menu
```

Example:

```text
┌─────────────────────────────────────────────────────────────┐
│ ATTIRELAB     🔍 Search...       🔔 3       Designer ▾      │
└─────────────────────────────────────────────────────────────┘
```

---

# 7. Global Search

Search should eventually support:

```text
Projects
Designs
Cultural Elements
Materials
Suppliers
Reports
```

Example:

```text
Search:
"woven textile"
```

Results:

```text
Cultural Elements
├── Traditional Woven Textile
├── Textile Technique A
└── Motif Associated With Textile

Materials
├── Woven Textile A
└── Woven Textile B
```

---

# 8. Breadcrumb Navigation

Every deep page should provide context.

Example:

```text
Projects
/
Festival Attire 2026
/
Designs
/
Design V3
```

This prevents users from becoming lost inside the application.

---

# 9. Dashboard

The Dashboard provides a high-level overview.

Recommended layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Dashboard                                                    │
│                                                              │
│ Welcome back, Designer                                      │
│                                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Projects │ │ Designs  │ │ Review   │ │ Approved │         │
│ │    12    │ │    28    │ │    5     │ │    16    │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                              │
│ Recent Projects                                              │
│                                                              │
│ Project                  Status              Updated         │
│ Festival Attire          Designing           Today           │
│ Cultural Pageant         Review              Yesterday       │
│ Heritage Costume         Completed           3 days ago      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 10. Dashboard Components

The dashboard should contain:

### Summary Cards

- Active Projects
- Designs in Progress
- Pending Reviews
- Approved Designs

### Recent Projects

Shows:

- project name
- cultural context
- status
- last modified
- current design version

### Review Queue

Displays:

```text
5 items require your attention
```

### Recent Activity

Example:

```text
08:32
Design V4 generated

08:10
Evaluation completed

Yesterday
Project created
```

---

# 11. Project Management

Projects are the primary organizational unit.

A project may represent:

- one costume
- one client
- one event
- one cultural design task
- one collection

---

# 12. Project List

```text
┌──────────────────────────────────────────────────────────────┐
│ Projects                                      [+ New Project]│
├──────────────────────────────────────────────────────────────┤
│ Search projects...       Filter ▾       Sort ▾               │
│                                                              │
│ Project Name        Culture       Status       Updated       │
│ Festival Attire     Culture A     Designing    Today         │
│ Pageant Costume     Culture B     Review       Yesterday     │
│ Heritage Exhibit    Culture C     Completed    Sep 25        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 13. Project Status

Use:

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

# 14. Create Project

The project creation flow should be short.

Step 1:

```text
PROJECT INFORMATION

Project Name *
Description
Designer
Client
Occasion
Target Date
```

Step 2:

```text
CULTURAL CONTEXT

Culture *
Community
Region
Occasion
```

Step 3:

```text
BUDGET

Target Budget
Currency
```

Step 4:

```text
[Create Project]
```

---

# 15. Project Overview

Once created:

```text
┌──────────────────────────────────────────────────────────────┐
│ Festival Attire 2026                         [Actions ▾]      │
│ Culture A • Festival • ₱30,000                               │
├──────────────────────────────────────────────────────────────┤
│ Overview | Research | Requirements | Body | Designs | Report │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Current Design                                               │
│ Design V3                                                    │
│ REVIEW REQUIRED                                              │
│                                                              │
│ Budget                                                       │
│ ₱25,850 / ₱30,000                                            │
│                                                              │
│ Progress                                                     │
│ Research ✓  Requirements ✓  Design ✓  Evaluation ⚠          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 16. Project Workspace Tabs

Each project should contain:

```text
Overview
Research
Requirements
Body Profile
Materials
Designs
Evaluation
Reports
History
```

---

# 17. Cultural Research Interface

The Culture section should feel like a research workspace rather than a simple database.

Main layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Cultural Knowledge                                           │
├───────────────┬──────────────────────────────────────────────┤
│ Filters       │ Search cultural knowledge...                │
│               │                                              │
│ Culture       │ ┌──────────────────────────────────────────┐ │
│ Community     │ │ Textile A                                │ │
│ Region        │ │ Textile • Culture A                      │ │
│ Category      │ │ Verified ✓                               │ │
│ Status        │ │ Associated with...                       │ │
│               │ └──────────────────────────────────────────┘ │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

---

# 18. Cultural Search

Search should support:

```text
Name
Alternative Name
Culture
Community
Region
Textile
Motif
Symbol
Technique
Occasion
```

---

# 19. Cultural Element Card

```text
┌──────────────────────────────────────┐
│ Traditional Textile A                │
│                                      │
│ Culture A                            │
│ Textile                              │
│                                      │
│ VERIFIED ✓                           │
│                                      │
│ Associated with: Culture A           │
│ Occasion: Traditional Ceremony      │
│                                      │
│ [View Details]                       │
└──────────────────────────────────────┘
```

---

# 20. Cultural Detail Page

```text
┌──────────────────────────────────────────────────────────────┐
│ Traditional Textile A                                        │
│ VERIFIED ✓                                                   │
├───────────────────────┬──────────────────────────────────────┤
│ Image                 │ Description                          │
│                       │ Historical Context                   │
│                       │ Symbolism                            │
│                       │ Traditional Usage                   │
│                       │ Modern Usage                         │
│                       │ Appropriate Contexts                 │
│                       │ Restrictions                         │
├───────────────────────┴──────────────────────────────────────┤
│ Related Elements                                             │
│ [Motif A] [Technique B] [Color C]                            │
│                                                              │
│ Sources                                                      │
│ CR-001                                                       │
│ CR-004                                                       │
└──────────────────────────────────────────────────────────────┘
```

---

# 21. Knowledge Validation Badge

Use visually distinct states:

```text
✓ VERIFIED
◌ UNDER REVIEW
? UNVERIFIED
⚠ RESTRICTED
× DEPRECATED
```

The exact colors should be accessible and not rely on color alone.

---

# 22. Add to Project

From a cultural record:

```text
[Add to Project]
```

opens:

```text
Select Project
Select Role

☑ Cultural Element
☑ Design Reference
☐ Required Element

[Add]
```

---

# 23. Cultural Research Basket

Users should be able to collect references.

Example:

```text
PROJECT RESEARCH

Selected Cultural Elements

✓ Textile A
✓ Motif B
✓ Color Tradition C
✓ Technique D
```

Each selection retains:

- element ID
- source
- date added
- user
- notes

---

# 24. Design Requirements Interface

Requirements should be entered using structured controls.

```text
┌──────────────────────────────────────────────────────────────┐
│ Design Requirements                                          │
├──────────────────────────────────────────────────────────────┤
│ Culture             Culture A                                │
│ Community           Community A                              │
│ Occasion            Festival                                 │
│ Garment Type        Full Attire                              │
│ Silhouette          Fitted                                   │
│                                                              │
│ Colors                                                        │
│ ☑ Earth tones                                               │
│ ☐ Bright colors                                             │
│                                                              │
│ Textile                                                       │
│ ☑ Traditional textile required                              │
│                                                              │
│ Budget             ₱30,000                                   │
│                                                              │
│ [Save Requirements]                                          │
└──────────────────────────────────────────────────────────────┘
```

---

# 25. Requirement Priority

Every requirement should allow:

```text
MANDATORY
PREFERRED
OPTIONAL
RESTRICTED
```

Example:

```text
Requirement                    Priority

Traditional textile            MANDATORY
Embroidery                     PREFERRED
Metal ornament                 OPTIONAL
Synthetic fabric               RESTRICTED
```

---

# 26. Requirement Builder

A structured requirement row:

```text
┌───────────────────────────────────────────────────────────┐
│ Requirement                                               │
│ Traditional textile                                      │
│                                                           │
│ Priority: [MANDATORY ▾]                                   │
│                                                           │
│ Notes:                                                    │
│ Must be associated with selected cultural context.       │
│                                                           │
│ [Remove]                                                  │
└───────────────────────────────────────────────────────────┘
```

---

# 27. Body Profile

The Body Profile page should clearly separate:

```text
MANUAL MEASUREMENTS
```

from:

```text
COMPUTER VISION ESTIMATES
```

---

# 28. Body Profile Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Body Profile                                                 │
├──────────────────────────────┬───────────────────────────────┤
│ Measurements                 │ Body Reference                │
│                              │                               │
│ Height       165 cm          │       [Image]                 │
│ Shoulder      42 cm          │                               │
│ Chest         88 cm          │                               │
│ Waist         76 cm          │                               │
│ Hip           94 cm          │                               │
│ Arm           58 cm          │                               │
│                              │                               │
│ Source: Manual               │                               │
├──────────────────────────────┴───────────────────────────────┤
│ [Edit Measurements] [Upload Reference] [Run Body Analysis]   │
└──────────────────────────────────────────────────────────────┘
```

---

# 29. Measurement Source

Every measurement should show:

```text
MANUAL
ESTIMATED
COMPUTER VISION
DESIGNER CORRECTED
```

Example:

```text
Waist
76 cm
Source: Designer Corrected
```

---

# 30. Body Analysis

When computer vision is available:

```text
Upload Image
      ↓
Consent Confirmation
      ↓
Image Processing
      ↓
Landmark Detection
      ↓
Estimated Measurements
      ↓
Designer Verification
```

The UI must make it clear that measurements are estimates.

---

# 31. Body Analysis Results

```text
BODY ANALYSIS

Estimated Measurements

Height        165 cm
Shoulder       42 cm
Chest          88 cm
Waist          76 cm
Hip            94 cm

⚠ These values are estimates.

[Accept]
[Correct]
[Reject]
```

---

# 32. Materials Interface

The Materials section should provide:

```text
Material Library
Selected Materials
Supplier Prices
Price Sources
Availability
```

---

# 33. Material Library

```text
┌──────────────────────────────────────────────────────────────┐
│ Materials                                     [+ Add Material]│
├──────────────────────────────────────────────────────────────┤
│ Search materials...                                         │
│                                                              │
│ Material        Category     Price       Availability        │
│ Textile A       Fabric       ₱850/m      Available           │
│ Thread B        Thread       ₱120        Available           │
│ Ornament C      Decoration   ₱45/pc      Limited             │
└──────────────────────────────────────────────────────────────┘
```

---

# 34. Material Detail

```text
Material:
Traditional Textile A

Category:
Fabric

Unit:
Meter

Width:
60 in

Current Price:
₱850/m

Source:
Supplier Quote

Status:
VERIFIED

Availability:
AVAILABLE

Cultural Association:
Culture A

[Add to Design]
[View Price History]
```

---

# 35. Price History

```text
PRICE HISTORY

Date          Supplier        Price       Status

Sep 2026      Supplier A       ₱850        Verified
Jul 2026      Supplier A       ₱820        Verified
Apr 2026      Supplier B       ₱760        Verified
Jan 2026      Supplier A       ₱700        Verified
```

---

# 36. Design Generation Workspace

The Design Studio is the central application workspace.

It should not be a simple prompt box.

Recommended layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Design Studio                                                │
│ Festival Attire / Design V3                                 │
├───────────────┬──────────────────────────────┬───────────────┤
│ CONTEXT       │ DESIGN CANVAS               │ ANALYSIS      │
│               │                              │               │
│ Culture       │                              │ Cultural ✓    │
│ Occasion      │        GENERATED            │ Requirements ✓│
│ Materials     │          IMAGE               │ Body ⚠        │
│ Budget        │                              │ Cost ✓        │
│ Body          │                              │ Evidence ⚠    │
│ Requirements  │                              │               │
│               │                              │               │
├───────────────┴──────────────────────────────┴───────────────┤
│ Generate │ Regenerate │ Refine │ Compare │ Save │ Evaluate  │
└──────────────────────────────────────────────────────────────┘
```

---

# 37. Design Studio Layout

The Design Studio should use three primary areas:

### Left

Context and controls.

### Center

Design visualization.

### Right

Evaluation and explanation.

This keeps the human designer at the center of the workflow.

---

# 38. Left Panel — Context

Display:

```text
CULTURAL CONTEXT
Culture A
Community A
Festival

REQUIREMENTS
8 Mandatory
6 Preferred

BODY
Profile Available ✓

BUDGET
₱30,000

SELECTED MATERIALS
5
```

---

# 39. Center — Design Canvas

The center should display:

- generated image
- image metadata
- design version
- image version
- generation state

Example:

```text
DESIGN V3
IMAGE V2

[ Generated Design Image ]

Generated:
Sep 29, 2026
```

---

# 40. Right Panel — Evaluation

```text
EVALUATION

Cultural
✓ PASS

Requirements
✓ PASS

Body
⚠ REVIEW

Cost
✓ PASS

Evidence
⚠ REVIEW

[View Findings]
```

---

# 41. Design Specification Panel

Below or beside the image:

```text
DESIGN SPECIFICATION

Silhouette:
Fitted

Garment Components:
• Top
• Skirt
• Waist Piece

Textile:
Traditional Textile A

Colors:
Earth tones

Decoration:
Embroidered detail

Construction:
Structured bodice
```

---

# 42. Cultural Elements Panel

Show exactly which elements influenced the design.

```text
CULTURAL ELEMENTS

✓ Textile A
  Source: CR-001

✓ Motif B
  Source: CR-014

⚠ Ornament C
  Review required

[View Cultural Evidence]
```

---

# 43. Explainability Drawer

When a user clicks an explanation icon:

```text
WHY WAS THIS SELECTED?

Element:
Traditional Textile A

WHY:
The textile is associated with the
selected cultural context and matches
the requested occasion.

SOURCE:
Cultural Reference CR-001

CONSTRAINT:
Traditional textile = Mandatory

[View Source]
```

---

# 44. AI Transparency

The UI should clearly identify AI-generated content.

Examples:

```text
AI GENERATED
AI SUGGESTION
SYSTEM CALCULATION
KNOWLEDGE BASE
USER PROVIDED
HUMAN VERIFIED
```

This distinction is critical.

---

# 45. Visual Metadata

Under generated images:

```text
AI GENERATED

Model:
Configured Image Model

Generation:
GEN-001

Prompt Version:
PROMPT-003

Design Version:
V3

Image Version:
V2
```

Advanced metadata can be hidden under:

```text
[View Technical Details]
```

---

# 46. Generate Design

When clicking:

```text
[Generate Design]
```

the interface should display a progress state.

```text
GENERATING DESIGN

✓ Loading cultural context
✓ Loading requirements
✓ Loading body profile
● Preparing design specification
○ Generating visual concept
○ Running validation
```

---

# 47. Generation Progress

Do not display fake percentages if the backend cannot provide meaningful progress.

Prefer stages:

```text
Preparing
Generating Specification
Generating Image
Evaluating
Completed
```

---

# 48. Generation Completion

```text
DESIGN GENERATED

Design V4
Image V1

✓ Specification generated
✓ Cultural references attached
✓ Cost calculated
⚠ Body review recommended

[Review Design]
```

---

# 49. Regeneration

Regeneration should require a reason or allow optional feedback.

Example:

```text
REGENERATE

What would you like to change?

☑ More traditional
☐ Simpler silhouette
☐ Lower cost
☐ Different textile
☐ Different colors

Additional instruction:
[________________________]

[Generate Revision]
```

---

# 50. Refinement

The refinement interface should distinguish:

```text
CHANGE
```

from:

```text
NEW DESIGN
```

Example:

```text
REFINE DESIGN

Change:
"Reduce decorative elements."

Impact:
Decoration
Cost
Visual design

[Apply Revision]
```

---

# 51. Change Impact

Before applying major changes:

```text
Potential Impact

This change may affect:

✓ Decoration
✓ Estimated Cost
✓ Design Image
⚠ Cultural evaluation may need to be rerun

[Continue]
[Cancel]
```

---

# 52. Version History

The version history should be visual.

```text
DESIGN HISTORY

V1
│
├── Image 1
│
▼
V2
│
├── Image 1
├── Image 2
│
▼
V3
│
├── Image 1
└── Image 2
```

---

# 53. Version Comparison

Users should be able to select:

```text
Compare:

Design V2
vs
Design V4
```

Comparison:

```text
┌─────────────────────┬─────────────────────┐
│ DESIGN V2           │ DESIGN V4           │
├─────────────────────┼─────────────────────┤
│ Image               │ Image               │
│                     │                     │
│ Textile A           │ Textile B           │
│ ₱28,500             │ ₱25,850             │
│                     │                     │
│ Cultural Review ✓   │ Cultural Review ⚠   │
└─────────────────────┴─────────────────────┘
```

---

# 54. Cost Panel

Inside Design Studio:

```text
COST

Materials       ₱12,000
Labor            ₱7,500
Decoration       ₱3,000
Other            ₱1,000
Contingency      ₱2,350

TOTAL           ₱25,850

Budget          ₱30,000

Remaining        ₱4,150
```

---

# 55. Cost Evidence

Clicking a cost item should show:

```text
Fabric

Quantity:
4.2 m

Unit Price:
₱850/m

Source:
Supplier Quote

Supplier:
Supplier A

Price Date:
Sep 15, 2026

Status:
VERIFIED
```

---

# 56. Evaluation Workspace

The Evaluation page should provide a complete review environment.

```text
┌──────────────────────────────────────────────────────────────┐
│ Evaluation — Design V4                                      │
├──────────────────────────────────────────────────────────────┤
│ Summary | Cultural | Requirements | Body | Cost | Evidence  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Overall Status                                               │
│ REVIEW REQUIRED                                              │
│                                                              │
│ Findings                                                     │
│                                                              │
│ HIGH   Cultural usage requires review                        │
│ MEDIUM Waist measurement is estimated                        │
│ LOW    One preferred requirement not satisfied               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 57. Finding Card

```text
┌──────────────────────────────────────────────────────────────┐
│ HIGH — Cultural Usage Context                                │
├──────────────────────────────────────────────────────────────┤
│ The selected ornament's usage context requires verification.│
│                                                              │
│ Evidence                                                     │
│ CE-041                                                      │
│ CR-021                                                      │
│                                                              │
│ Recommendation                                               │
│ Consult cultural reference or expert.                       │
│                                                              │
│ [View Evidence] [Resolve] [Request Revision]                │
└──────────────────────────────────────────────────────────────┘
```

---

# 58. Finding Resolution

When resolving:

```text
RESOLVE FINDING

Finding:
Cultural usage context

Resolution:
[____________________________]

Evidence / Reference:
[____________________________]

Action:
[Resolve Finding]
```

The user must provide an appropriate explanation where required.

---

# 59. Human Review Panel

```text
HUMAN REVIEW

System Evaluation:
REVIEW REQUIRED

Open Findings:
2

Resolved:
4

Reviewer:
Designer A

Decision:

○ Approve
○ Request Revision
○ Reject

Comment:
[________________________]

[Submit Review]
```

---

# 60. Approval Requirements

The Approve button should be disabled when configured critical conditions remain unresolved.

Example:

```text
[Approve Design]
```

Disabled reason:

```text
2 HIGH findings remain unresolved.
```

---

# 61. Revision Request

```text
REQUEST REVISION

Select findings:

☑ Cultural usage
☑ Body measurement

Instructions:
Please replace the ornament and verify
waist measurement.

[Request Revision]
```

This creates a new revision task.

---

# 62. Reports Interface

Reports should be generated from structured project data.

```text
Reports

Project Report
Evaluation Report
Cost Report
Design History
Cultural Research Report
```

---

# 63. Report Preview

```text
┌──────────────────────────────────────────────────────────────┐
│ REPORT PREVIEW                                               │
├──────────────────────────────────────────────────────────────┤
│ Project Information                                         │
│ Cultural Research                                           │
│ Body Profile                                                │
│ Design Concept                                              │
│ Materials                                                   │
│ Cost                                                        │
│ Evaluation                                                  │
│ Human Review                                                │
│ Revision History                                            │
└──────────────────────────────────────────────────────────────┘

[Generate PDF]
```

---

# 64. Design Approval Page

Final approval should be deliberate.

```text
FINAL DESIGN REVIEW

Design:
V5

Evaluation:
PASSED WITHOUT CRITICAL ISSUES

Human Review:
PENDING

Cost:
₱25,850

Open Findings:
0

[Approve Final Design]
[Request Revision]
```

---

# 65. Final Approval Confirmation

The system should require confirmation:

```text
APPROVE DESIGN?

You are approving:

Project:
Festival Attire 2026

Design:
V5

This action will mark the current
design as the approved project design.

[Cancel]
[Confirm Approval]
```

---

# 66. Approved Design

After approval:

```text
APPROVED ✓

Design V5
Approved by:
Designer A

Date:
September 29, 2026

[Generate Report]
[View History]
```

---

# 67. Design State Indicator

Always display current state.

Example:

```text
DRAFT
GENERATING
GENERATED
EVALUATING
REVIEW REQUIRED
REVISION
REVIEWED
APPROVED
FINAL
```

---

# 68. Status Design

Status should be shown consistently across the application.

Example:

```text
┌─────────────────────────┐
│ REVIEW REQUIRED         │
└─────────────────────────┘
```

Do not use color alone.

Use:

- label
- icon
- optional color
- tooltip/details

---

# 69. Notification System

Notifications should include:

```text
Evaluation completed
Design generated
Revision requested
Finding created
Finding resolved
Report ready
Approval requested
```

Example:

```text
🔔 Evaluation completed for Design V4.

2 findings require review.
```

---

# 70. Review Queue

A dedicated review queue should be available.

```text
MY REVIEW QUEUE

Project              Item                Priority

Festival Attire      Cultural Finding    High
Pageant Costume      Design Approval     Medium
Heritage Costume     Body Review         Medium
```

---

# 71. Mobile UX

The application should be responsive.

Desktop:

```text
Sidebar + 3-column workspace
```

Tablet:

```text
Collapsible sidebar
2-column workspace
```

Mobile:

```text
Bottom navigation
Single-column content
Panels become drawers
```

---

# 72. Mobile Design Studio

Recommended order:

```text
Design Image
↓
Evaluation Summary
↓
Design Specification
↓
Cost
↓
Cultural Evidence
↓
Actions
```

---

# 73. Accessibility

The system should support:

```text
Keyboard navigation
Visible focus
Accessible labels
Screen-reader-compatible controls
Sufficient contrast
Non-color status indicators
Readable typography
Error messages associated with inputs
```

---

# 74. Form Validation

Errors should appear close to the field.

Bad:

```text
Error: invalid input
```

Good:

```text
Budget

₱-500

⚠ Budget must be greater than zero.
```

---

# 75. Empty States

Every major page needs a useful empty state.

Example:

```text
NO DESIGNS YET

Create your first design by defining
your cultural context and requirements.

[Create Design]
```

---

# 76. Loading States

Avoid blank screens.

Example:

```text
Loading cultural knowledge...

Loading materials...

Calculating cost...

Running evaluation...
```

---

# 77. Error States

Example:

```text
Unable to calculate cost.

The price for Traditional Textile A
is missing.

[Add Price]
[Try Again]
```

---

# 78. Confirmation Dialogs

Use confirmation for destructive actions:

```text
Delete project?

This cannot be undone.

[Cancel]
[Delete]
```

For non-destructive actions, prefer inline feedback.

---

# 79. Autosave

The application should autosave appropriate draft information.

Example:

```text
Saved 10 seconds ago
```

Do not autosave irreversible actions such as:

- final approval
- deletion
- publication

without explicit confirmation.

---

# 80. Design Draft Saving

While editing:

```text
Saving...
```

then:

```text
Saved
```

If synchronization fails:

```text
⚠ Changes not synchronized.

[Retry]
```

---

# 81. AI Interaction Design

AI controls should use explicit language.

Prefer:

```text
Generate Design
Suggest Materials
Explain Selection
Suggest Revision
```

Avoid:

```text
Magic
Auto-Fix
Perfect Design
Guaranteed Authentic
```

---

# 82. AI Suggestion Card

```text
AI SUGGESTION

Consider reducing the number of decorative
elements to lower estimated cost.

Estimated effect:
Decoration cost ↓

Reason:
Current decoration accounts for approximately
20% of estimated direct cost.

[Apply Suggestion]
[Ignore]
```

The user remains in control.

---

# 83. AI Suggestion Provenance

Each AI suggestion should show:

```text
Based on:

✓ Project Requirements
✓ Cultural Knowledge
✓ Material Database
✓ Cost Calculation
```

---

# 84. Explainability Interaction

Use a small:

```text
ⓘ
```

icon next to explainable items.

Click:

```text
Why?
```

opens the explanation drawer.

---

# 85. Evidence Interaction

Use:

```text
View Evidence
```

to open:

```text
Evidence Drawer

Knowledge Record:
CE-024

Source:
CR-018

Relationship:
ASSOCIATED_WITH

Verified:
Yes

Last Reviewed:
2026-09-10
```

---

# 86. Design Comparison UX

Comparison should support:

```text
Visual
Requirements
Culture
Cost
Materials
Evaluation
```

Example:

```text
COMPARE DESIGNS

        V3                  V5

Image   [IMAGE]             [IMAGE]

Cost    ₱28,500              ₱25,850

Culture Review              Review
Requirements 8/8            8/8

Materials 6                 5

Findings 3                  1
```

---

# 87. Project Timeline

The History page should show:

```text
PROJECT TIMELINE

Sep 29
Design V5 approved

Sep 29
Evaluation completed

Sep 29
Design V5 generated

Sep 28
Design V4 revised

Sep 28
Cost recalculated
```

---

# 88. Audit View

Authorized users may see:

```text
AUDIT LOG

User       Action              Time

Designer A DESIGN_GENERATED    09:12
Designer A EVALUATION_RUN     09:18
Designer A FINDING_RESOLVED   09:22
Designer A DESIGN_APPROVED    09:30
```

---

# 89. Administration UI

Administration should contain:

```text
Users
Roles
Cultural Knowledge
Materials
Suppliers
Labor Rates
Evaluation Rules
AI Configuration
Audit Logs
System Settings
```

---

# 90. Cultural Knowledge Administration

Authorized users can:

```text
Create Record
Edit Record
Verify Record
Restrict Record
Deprecate Record
Add Source
Manage Relationships
```

Changes should be versioned.

---

# 91. Evaluation Rule Administration

Authorized administrators can configure:

```text
Rule
Domain
Severity
Condition
Failure Status
Active/Inactive
Version
```

Example:

```text
Rule:
Mandatory Requirement

Severity:
HIGH

Failure:
REVISION_REQUIRED
```

---

# 92. AI Configuration

Do not expose API keys through the frontend.

Administration may configure:

```text
LLM Provider
Image Provider
Vision Provider
Model
Temperature
Token Limit
Prompt Version
Retry Policy
```

Sensitive secrets remain server-side.

---

# 93. Settings

User settings:

```text
Profile
Notifications
Language
Currency Preference
Units
Appearance
```

Project settings:

```text
Currency
Cost Profile
Evaluation Profile
Default Contingency
Measurement Units
```

---

# 94. Navigation by User Role

### Designer

```text
Dashboard
Projects
Culture
Design Studio
Materials
Evaluations
Reports
```

### Cultural Expert

```text
Dashboard
Projects
Culture
Evaluations
Reports
```

### Researcher

```text
Dashboard
Projects
Culture
Reports
```

### Viewer

```text
Dashboard
Projects
Reports
```

### Admin

All modules.

---

# 95. Design Studio Primary Actions

The most important actions should be visible:

```text
Generate
Refine
Evaluate
Compare
Save
Approve
```

Secondary actions:

```text
Duplicate
Archive
Export
Delete
```

---

# 96. Primary Action Hierarchy

The UI should avoid having too many equally prominent buttons.

Example:

```text
PRIMARY:
[Generate Design]

SECONDARY:
[Refine]
[Evaluate]

TERTIARY:
[Compare]
[Export]
```

---

# 97. Wizard vs Workspace

Do not force the entire application into a wizard.

Use:

### Wizard

For initial project creation.

### Workspace

For ongoing design work.

This allows users to return to earlier stages.

---

# 98. Project Progress

Display progress as a workflow:

```text
Research
   ✓
Requirements
   ✓
Body
   ✓
Design
   ✓
Evaluation
   ⚠
Review
   ○
Approval
   ○
```

Users should be able to return to earlier completed steps.

---

# 99. Design Workflow Navigation

Inside a project:

```text
1 Research
2 Requirements
3 Body
4 Materials
5 Design
6 Evaluate
7 Review
8 Final
```

The current stage is highlighted.

---

# 100. Context Persistence

The system should remember project context while navigating.

For example, when returning to Design Studio:

```text
Culture
Community
Occasion
Requirements
Body Profile
Budget
Selected Materials
```

should automatically load from the project.

The user should not need to repeatedly re-enter the same information.

---

# 101. AI Context Preview

Before generating a design, provide an optional context preview:

```text
AI DESIGN CONTEXT

Culture:
Culture A

Community:
Community A

Occasion:
Festival

Mandatory:
8

Preferred:
6

Budget:
₱30,000

Cultural References:
7

Body Profile:
Available

Materials:
5 selected
```

Action:

```text
[Generate Design]
```

---

# 102. Context Validation Before Generation

Before generation:

```text
READY TO GENERATE

✓ Cultural context selected
✓ Requirements defined
✓ Budget defined
✓ Body profile available
✓ Cultural references selected

[Generate]
```

If missing:

```text
NOT READY

⚠ Culture has not been selected.
⚠ Budget is missing.

[Complete Requirements]
```

---

# 103. Design Generation Settings

Advanced settings can include:

```text
Traditional ←──────→ Contemporary

Simple ←────────────→ Elaborate

Minimal ←───────────→ Decorative
```

However, these controls must translate into structured design constraints rather than simply modifying a free-form prompt.

---

# 104. Design Constraint Summary

Before generation:

```text
DESIGN CONSTRAINTS

Culture:
Culture A

Occasion:
Festival

Silhouette:
Fitted

Traditional Balance:
70%

Budget:
₱30,000

Required Textile:
Traditional Textile A
```

---

# 105. Design Result Actions

After generation:

```text
[Accept as Version]
[Refine]
[Regenerate]
[Compare]
[Evaluate]
```

Accepting an image should not automatically approve the entire design.

---

# 106. Image Version vs Design Version

The interface must make the distinction clear.

Example:

```text
DESIGN V4

Image:
V1
V2
V3

The design specification remains V4,
while multiple visual alternatives are generated.
```

---

# 107. Selecting an Image

User can select:

```text
Image V2
```

as the preferred representation.

The application records:

```text
Selected Image:
DES-V4-IMG-002
```

---

# 108. Final Design Package

An approved design should contain:

```text
Project
Design Specification
Selected Image
Cultural References
Body Profile
Materials
Cost Snapshot
Evaluation Snapshot
Human Approval
Revision History
```

This becomes the source for the final report.

---

# 109. Responsive Design Principle

All major screens must function at:

```text
Desktop
Tablet
Mobile
```

However, desktop should be the primary target for the design-intensive workflow.

---

# 110. Recommended Technology

Frontend:

```text
Next.js
React
TypeScript
Tailwind CSS
```

UI component library may be introduced if desired.

Recommended principle:

```text
Reusable components
+
Feature-based architecture
```

---

# 111. Frontend Structure

```text
src/
├── app/
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── forms/
│   ├── dialogs/
│   ├── evidence/
│   └── status/
│
├── features/
│   ├── dashboard/
│   ├── projects/
│   ├── culture/
│   ├── body/
│   ├── materials/
│   ├── design/
│   ├── costing/
│   ├── evaluation/
│   └── reports/
│
├── lib/
│   ├── api/
│   ├── validation/
│   ├── formatting/
│   └── permissions/
│
└── types/
```

---

# 112. Design System

Create reusable design tokens:

```text
Typography
Spacing
Radius
Shadows
Borders
Status styles
Buttons
Inputs
Cards
Tables
Dialogs
Drawers
Tabs
Badges
```

The interface should feel consistent across all modules.

---

# 113. Status Components

Create reusable:

```text
<StatusBadge />
<SeverityBadge />
<EvaluationStatus />
<ApprovalStatus />
<PriceStatus />
<KnowledgeStatus />
```

This prevents inconsistent status displays.

---

# 114. Reusable Evidence Component

Create:

```text
<EvidencePanel />
```

It should display:

```text
Evidence Type
Reference
Source
Relationship
Verification
Date
```

This component should be reusable across:

- Culture
- Evaluation
- AI explanations
- Reports

---

# 115. Reusable Finding Component

Create:

```text
<FindingCard />
```

Props:

```typescript
interface FindingCardProps {
  severity: FindingSeverity;
  title: string;
  description: string;
  evidence: Evidence[];
  status: FindingStatus;
  onResolve?: () => void;
  onRequestRevision?: () => void;
}
```

---

# 116. Frontend State

Project state should be centralized appropriately.

Important state:

```text
Current Project
Current Design
Current Design Version
Selected Image
Requirements
Body Profile
Materials
Cost Calculation
Evaluation
Review Status
```

---

# 117. Server vs Client Data

Server-side:

```text
Projects
Cultural Knowledge
Materials
Costs
Evaluations
Reports
```

Client-side:

```text
UI state
Modal state
Temporary form state
Selected tabs
Image viewer state
```

Do not expose sensitive server-side credentials.

---

# 118. API Integration

Frontend should communicate through:

```text
API Client
```

rather than directly accessing databases.

Architecture:

```text
React
 ↓
API Client
 ↓
Application API
 ↓
Services
 ↓
Database / AI / Knowledge Graph
```

---

# 119. Loading Strategy

Use:

```text
Skeletons
Progress states
Optimistic updates where safe
Polling for AI jobs
WebSockets later if needed
```

For long AI jobs:

```text
POST /generate
       ↓
Job ID
       ↓
Poll /api/ai/jobs/:id
       ↓
Completed
```

---

# 120. UX for Long-Running AI Jobs

Users should be allowed to leave the current screen.

Example:

```text
AI JOB RUNNING

Design V4 is being generated.

You can continue working.
We will notify you when it is ready.

[View Job]
```

---

# 121. Error Recovery

If generation fails:

```text
DESIGN GENERATION FAILED

The image generation service did not
complete successfully.

Your design specification was preserved.

[Retry]
[Modify Request]
[View Specification]
```

The design specification should not be lost.

---

# 122. Data Preservation

When any external AI service fails:

```text
Project data
Requirements
Cultural references
Body profile
Design specification
```

must remain preserved.

---

# 123. Confirmation Before Expensive AI Calls

For expensive generation operations:

```text
GENERATE DESIGN?

This will create:
1 design specification
1 visual generation
1 evaluation

Estimated AI usage:
[system-configured]

[Cancel]
[Generate]
```

Exact cost information should only be shown if the system can reliably calculate it.

---

# 124. Notification Preferences

Users should control:

```text
AI generation complete
Evaluation complete
Review required
Revision requested
Report ready
Approval requested
```

---

# 125. UX Acceptance Criteria

The UI/UX implementation is complete when:

```text
[ ] User can log in.
[ ] User can access dashboard.
[ ] User can create a project.
[ ] User can define cultural context.
[ ] User can browse cultural knowledge.
[ ] User can add cultural references to a project.
[ ] User can define design requirements.
[ ] User can define body profile.
[ ] User can select materials.
[ ] User can view material prices.
[ ] User can generate a design.
[ ] User can view generated image.
[ ] User can inspect design specification.
[ ] User can see AI provenance.
[ ] User can view cultural evidence.
[ ] User can calculate cost.
[ ] User can view evaluation.
[ ] User can inspect findings.
[ ] User can resolve findings.
[ ] User can request revision.
[ ] User can compare versions.
[ ] User can approve a design.
[ ] User can generate reports.
[ ] User can view revision history.
[ ] User can view appropriate audit information.
```

---

# 126. Recommended MVP Screens

Do not build every administrative screen before testing the core workflow.

The first usable prototype should prioritize:

```text
01 Login
02 Dashboard
03 Project List
04 Create Project
05 Project Overview
06 Cultural Research
07 Requirements
08 Body Profile
09 Materials
10 Design Studio
11 Design Generation
12 Cost Panel
13 Evaluation
14 Finding Details
15 Version History
16 Human Review
17 Final Approval
18 Report Preview
```

---

# 127. MVP Navigation

```text
Dashboard
│
├── Projects
│   └── Project
│       ├── Overview
│       ├── Research
│       ├── Requirements
│       ├── Body
│       ├── Materials
│       ├── Design Studio
│       ├── Evaluation
│       ├── History
│       └── Reports
│
├── Culture
│
├── Materials
│
├── Evaluations
│
└── Reports
```

---

# 128. Primary MVP Workflow

The complete MVP should successfully support:

```text
CREATE PROJECT
       ↓
SELECT CULTURE
       ↓
SELECT CULTURAL REFERENCES
       ↓
DEFINE REQUIREMENTS
       ↓
ENTER BODY PROFILE
       ↓
SET BUDGET
       ↓
SELECT MATERIALS
       ↓
GENERATE DESIGN
       ↓
VIEW DESIGN
       ↓
CALCULATE COST
       ↓
RUN EVALUATION
       ↓
REVIEW FINDINGS
       ↓
REFINE
       ↓
RE-EVALUATE
       ↓
APPROVE
       ↓
GENERATE REPORT
```

---

# 129. UX Success Criteria

The platform succeeds from a UX perspective when a designer can answer the following questions at every stage:

### Before Generation

> What am I asking the AI to design?

### During Generation

> What information is the AI using?

### After Generation

> Why did the system produce this design?

### During Evaluation

> What is supported by evidence?

### During Costing

> Where did this cost come from?

### During Revision

> What changed?

### Before Approval

> What issues remain?

### After Approval

> What exactly was approved, by whom, and based on which version?

---

# 130. Final UX Principle

The interface should continuously reinforce:

```text
┌───────────────────────────────────────────────┐
│                                               │
│        HUMAN DESIGNER                         │
│             ↓                                 │
│        DEFINES INTENT                         │
│             ↓                                 │
│        AI ASSISTS                             │
│             ↓                                 │
│        SYSTEM VALIDATES                       │
│             ↓                                 │
│        EVIDENCE EXPLAINS                      │
│             ↓                                 │
│        HUMAN REVIEWS                          │
│             ↓                                 │
│        HUMAN DECIDES                          │
│                                               │
└───────────────────────────────────────────────┘
```

The application should never obscure this relationship.

The AI is not presented as the final authority.

The application is not presented as the final cultural authority.

The system provides:

> **structured knowledge + AI assistance + deterministic calculations + evaluation + explainability + human control.**

---

# 131. Final UI Architecture

```text
                         APPLICATION
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        DASHBOARD         PROJECTS        KNOWLEDGE
             │                │                │
             │                ▼                ▼
             │          PROJECT WORKSPACE   CULTURAL KG
             │                │
             │     ┌──────────┼───────────┐
             │     │          │           │
             │     ▼          ▼           ▼
             │ REQUIREMENTS BODY       MATERIALS
             │     │          │           │
             │     └──────────┼───────────┘
             │                ▼
             │          DESIGN STUDIO
             │                │
             │        ┌───────┼────────┐
             │        ▼       ▼        ▼
             │       AI     COST   EVALUATION
             │        │       │        │
             │        └───────┼────────┘
             │                ▼
             │          HUMAN REVIEW
             │                │
             │        ┌───────┴────────┐
             │        ▼                ▼
             │     APPROVE           REVISE
             │                           │
             │                           ▼
             │                     NEW VERSION
             │
             └──────────────► REPORTS
```

---

# 132. Final Implementation Principle

The UI must make the system's architecture visible without overwhelming the user.

The user should experience the platform as:

```text
RESEARCH
   ↓
PLAN
   ↓
DESIGN
   ↓
CALCULATE
   ↓
EVALUATE
   ↓
REVIEW
   ↓
REFINE
   ↓
APPROVE
```

while the underlying platform performs:

```text
Knowledge Retrieval
+
Knowledge Graph Reasoning
+
AI Orchestration
+
Computer Vision
+
Deterministic Costing
+
Rule-Based Evaluation
+
Evidence Management
+
Versioning
+
Audit Logging
```

The result is a **Human-AI collaborative design workspace**, rather than a simple generative-AI interface.
