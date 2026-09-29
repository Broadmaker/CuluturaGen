# 06_COST_ENGINE.md

# Human-AI Collaborative Cultural Attire Design Platform

## Deterministic Cost Engine Specification

**Document:** `06_COST_ENGINE.md`
**Version:** 1.0
**System:** Human-AI Collaborative Cultural Attire Design Platform
**Module:** Material, Labor, Decoration & Cost Estimation Engine
**Status:** Implementation Specification

---

# 1. Purpose

The Cost Engine is responsible for calculating the estimated cost of a cultural attire design using deterministic and auditable calculations.

The engine converts:

```text
Design Requirements
        ↓
Materials
        ↓
Quantities
        ↓
Material Prices
        ↓
Labor
        ↓
Decoration
        ↓
Other Costs
        ↓
Contingency
        ↓
TOTAL ESTIMATED COST
```

The Cost Engine must provide a reproducible answer.

Given the same:

- design version
- material quantities
- material prices
- labor rates
- decoration prices
- other costs
- contingency settings

the system must produce the same calculated result.

---

# 2. Critical Architecture Rule

## AI does NOT calculate the final cost.

The AI system may:

- recommend materials
- suggest quantities
- identify possible decoration requirements
- estimate construction complexity
- suggest labor operations
- suggest alternative materials

However:

> **The deterministic Cost Engine performs the authoritative calculation.**

Example:

```text
AI:
"Approximately 4 meters of embroidered fabric may be required."

        ↓

Cost Engine:
Fabric quantity = 4.2 meters
Unit price = ₱850/meter

Material cost:
4.2 × ₱850 = ₱3,570
```

The final value displayed by the system must come from the Cost Engine.

---

# 3. Cost Calculation Philosophy

The system distinguishes between:

### 3.1 Estimated Cost

A system-generated calculation based on available prices and assumptions.

### 3.2 Quoted Cost

A cost based on an actual supplier quotation or manually entered quotation.

### 3.3 Actual Cost

The real amount paid during production.

These values must not be treated as interchangeable.

Example:

```text
Estimated Cost
₱25,000

Supplier Quote
₱27,500

Actual Production Cost
₱26,850
```

This allows the system to eventually compare:

```text
Estimated vs Quoted vs Actual
```

---

# 4. Cost Components

The system calculates:

```text
Material Cost
+
Labor Cost
+
Decoration Cost
+
Other Costs
+
Contingency
=
Estimated Total Cost
```

Detailed structure:

```text
DIRECT COST
├── Materials
├── Labor
├── Decorations / Ornamentation
└── Other Direct Costs

CONTINGENCY

TOTAL ESTIMATED COST
```

---

# 5. Cost Formula

## 5.1 Material Line Cost

```text
Material Line Cost =
Quantity × Unit Price
```

Example:

```text
4 meters × ₱850/meter
= ₱3,400
```

---

# 6. Material Subtotal

```text
Material Subtotal =
Σ Material Line Costs
```

Example:

```text
Fabric             ₱3,400
Lining             ₱1,200
Thread                ₱250
Fasteners             ₱300
────────────────────────
Material Subtotal  ₱5,150
```

---

# 7. Labor Cost

Labor may be calculated using either:

### Method A — Hourly Labor

```text
Labor Cost =
Labor Hours × Hourly Rate
```

Example:

```text
18 hours × ₱180/hour
= ₱3,240
```

### Method B — Operation-Based Labor

Each construction operation can have its own cost.

Example:

```text
Pattern preparation     ₱500
Cutting                 ₱400
Sewing                ₱2,500
Embroidery            ₱1,800
Finishing               ₱700
────────────────────────────
Labor Total           ₱5,900
```

The system should support both methods.

---

# 8. Decoration Cost

Decoration includes items such as:

- embroidery
- beads
- sequins
- appliqué
- shells
- metal ornaments
- decorative trims
- ribbons
- traditional accessories
- specialized ornamentation

Formula:

```text
Decoration Cost =
Quantity × Unit Price
```

Example:

```text
Decorative beads

500 pieces × ₱1.50
= ₱750
```

---

# 9. Other Costs

Other costs may include:

- transportation
- packaging
- printing
- special tools
- rental
- finishing services
- cleaning
- alteration
- delivery
- miscellaneous expenses

Formula:

```text
Other Cost =
Σ Individual Other Costs
```

---

# 10. Direct Cost

```text
Direct Cost =
Material Cost
+ Labor Cost
+ Decoration Cost
+ Other Cost
```

Example:

```text
Materials       ₱12,000
Labor            ₱7,500
Decoration       ₱3,000
Other            ₱1,000
────────────────────────
Direct Cost     ₱23,500
```

---

# 11. Contingency

The system may apply a configurable contingency percentage.

Formula:

```text
Contingency =
Direct Cost × Contingency %
```

Example:

```text
Direct Cost = ₱23,500
Contingency = 10%

₱23,500 × 0.10
= ₱2,350
```

---

# 12. Final Estimated Cost

```text
Estimated Total =
Direct Cost + Contingency
```

Example:

```text
Direct Cost       ₱23,500
Contingency        ₱2,350
─────────────────────────
Estimated Total   ₱25,850
```

---

# 13. Budget Calculation

Each project may specify a target budget.

Example:

```text
Budget:
₱30,000

Estimated Total:
₱25,850
```

Budget variance:

```text
Budget Variance =
Budget - Estimated Total
```

Therefore:

```text
₱30,000 - ₱25,850
= ₱4,150 remaining
```

---

# 14. Budget Variance Percentage

Formula:

```text
Variance % =
((Estimated Total - Budget) / Budget) × 100
```

Example:

```text
((25,850 - 30,000) / 30,000) × 100

= -13.83%
```

Negative means the design is below the target budget.

Positive means the design exceeds the target budget.

---

# 15. Cost Status

The system must calculate a status automatically.

Supported statuses:

```text
UNDER_BUDGET
NEAR_BUDGET
AT_BUDGET
OVER_BUDGET
INCOMPLETE
REVIEW_REQUIRED
```

Suggested configurable thresholds:

```text
UNDER_BUDGET
Estimated < 90% of budget

NEAR_BUDGET
90%–99% of budget

AT_BUDGET
100% of budget

OVER_BUDGET
>100% of budget
```

These thresholds must be configuration values rather than hard-coded business logic.

---

# 16. Example

```text
Budget:
₱30,000

Estimated:
₱25,850

Budget Utilization:
86.17%

Status:
UNDER_BUDGET
```

UI:

```text
BUDGET

₱30,000

ESTIMATED COST

₱25,850

REMAINING

₱4,150

STATUS

UNDER BUDGET
```

---

# 17. Cost Confidence

The system must NOT allow the AI to simply declare:

```text
"Cost confidence: 95%"
```

Instead, cost reliability should be derived from evidence.

Possible evidence:

```text
Supplier Quote
Verified Price
Recent Price
User-Entered Price
Estimated Price
Expired Price
Missing Price
```

Example:

```text
Cost Evidence

Fabric:
Supplier Quote       ✓

Thread:
Verified Price       ✓

Beads:
User Entered         ⚠

Special Ornament:
Estimated Price      ⚠
```

Overall status:

```text
REVIEW_REQUIRED
```

---

# 18. Price Source Status

Each price must have a source status.

```text
VERIFIED
USER_ENTERED
SUPPLIER_QUOTE
ESTIMATED
EXPIRED
MISSING
```

---

# 19. Price Metadata

Every price record should preserve:

```text
Price ID
Material ID
Supplier ID
Currency
Unit
Price
Effective Date
Expiration Date
Source Type
Source Reference
Entered By
Verified By
Created At
Updated At
```

This provides traceability.

---

# 20. Price History

Prices should never simply be overwritten.

Instead:

```text
Material: Fabric A

Price History

2026-01-01
₱700/m

2026-04-01
₱760/m

2026-07-01
₱820/m

2026-09-01
₱850/m
```

This allows historical calculations to remain reproducible.

---

# 21. Cost Snapshot

Every completed calculation must create a snapshot.

Example:

```text
COST SNAPSHOT

Design Version:
DES-001-V3

Calculated:
2026-09-28

Currency:
PHP

Material Price Version:
MP-2026-09-28

Labor Rate Version:
LR-2026-09

Contingency:
10%

Estimated Total:
₱25,850
```

The snapshot must preserve the actual values used during calculation.

---

# 22. Why Cost Snapshots Are Required

Suppose a fabric costs:

```text
₱700/m
```

today.

Three months later:

```text
₱950/m
```

If the application recalculates the old design using the new price, its historical cost changes.

That would make the original report inaccurate.

Therefore:

```text
Design V1
      ↓
Cost Snapshot V1
      ↓
Prices used at that time
```

must remain immutable.

---

# 23. Material Database

The material database should contain:

```text
Material
├── Identity
├── Category
├── Description
├── Unit
├── Fabric Properties
├── Cultural Association
├── Suppliers
├── Prices
└── Availability
```

---

# 24. Material Entity

Recommended fields:

```text
Material ID
Name
Alternative Names
Category
Description
Unit
Fabric Width
Weight
Color
Texture
Availability
Cultural Association
Cultural Element ID
Status
Created By
Created At
Updated At
```

---

# 25. Material Categories

Examples:

```text
FABRIC
TEXTILE
LINING
THREAD
FASTENER
TRIM
EMBROIDERY
BEADS
SEQUINS
ORNAMENT
ACCESSORY
PACKAGING
OTHER
```

The category list should be configurable.

---

# 26. Units

Supported units should include:

```text
meter
centimeter
yard
inch
piece
set
pair
kilogram
gram
liter
milliliter
hour
day
service
flat
```

The system should use standardized internal units where possible.

---

# 27. Unit Conversion

The Cost Engine should support conversions.

Example:

```text
1 meter = 100 centimeters
```

If material price is:

```text
₱800 / meter
```

and required quantity is:

```text
250 centimeters
```

the engine converts:

```text
250 cm = 2.5 m

2.5 × ₱800
= ₱2,000
```

---

# 28. Fabric Consumption

Fabric costing requires more than simply asking the AI:

```text
"How many meters?"
```

The application should eventually support garment-specific consumption rules.

Inputs may include:

```text
Garment Type
Body Measurements
Garment Length
Sleeve Length
Silhouette
Fabric Width
Pattern Allowance
Seam Allowance
Shrinkage Allowance
Design Complexity
```

---

# 29. Basic Fabric Formula

A simplified calculation may be:

```text
Required Fabric =
Base Consumption
+ Seam Allowance
+ Design Allowance
+ Waste Allowance
```

Example:

```text
Base:
3.5 m

Seam allowance:
0.2 m

Waste:
0.3 m

Required:
4.0 m
```

---

# 30. Fabric Width

Fabric width must be considered.

Example:

```text
Fabric A:
Width = 45 inches

Fabric B:
Width = 60 inches
```

The same garment may require different fabric quantities.

Therefore:

```text
Required Fabric Quantity
```

must not be determined solely by garment type.

---

# 31. AI and Fabric Consumption

The AI may suggest:

```text
Recommended fabric:
4 meters
```

The Cost Engine may calculate:

```text
Required:
4.25 meters
```

The application should use the deterministic calculation.

Example explanation:

```text
AI Suggestion:
4.0 m

System Calculation:
4.25 m

Reason:
60-inch fabric width and 10% waste allowance
```

---

# 32. Material Availability

Each material may have:

```text
AVAILABLE
LIMITED
OUT_OF_STOCK
UNKNOWN
DISCONTINUED
```

A design may still use a limited material, but the system should flag it.

Example:

```text
Material Availability

Embroidered Textile
LIMITED

⚠ Supplier availability should be verified.
```

---

# 33. Supplier Entity

Recommended fields:

```text
Supplier ID
Supplier Name
Contact Information
Location
Website
Material Categories
Reliability Status
Notes
Created At
Updated At
```

---

# 34. Supplier Pricing

A supplier may provide different prices for the same material.

Example:

```text
Material:
Handwoven Textile

Supplier A:
₱900/m

Supplier B:
₱850/m

Supplier C:
₱950/m
```

The application must preserve all supplier-specific prices.

---

# 35. Minimum Order Quantity

Materials may have minimum quantities.

Example:

```text
Required:
3 meters

Supplier minimum:
5 meters
```

The system may calculate:

```text
Purchase Quantity = 5 meters
```

while distinguishing it from:

```text
Design Consumption = 3 meters
```

This distinction is important.

---

# 36. Purchase Quantity vs Consumption

Two fields should exist:

```text
Required Quantity
Purchase Quantity
```

Example:

```text
Required:
3.2 m

Purchase:
4 m
```

Cost may therefore be based on:

```text
4 × Unit Price
```

while garment consumption remains:

```text
3.2 m
```

---

# 37. Material Waste

Waste percentage may be configurable.

Example:

```text
Base Consumption:
4 m

Waste:
8%

Waste Quantity:
0.32 m

Purchase Requirement:
4.32 m
```

---

# 38. Labor Rate Database

Labor rates should be stored separately.

Fields:

```text
Labor Rate ID
Role
Operation
Rate Type
Rate
Unit
Region
Effective Date
Expiration Date
Source
Status
```

Examples:

```text
Tailor
₱180/hour

Embroiderer
₱220/hour

Pattern Maker
₱250/hour
```

---

# 39. Labor Rate Types

Support:

```text
HOURLY
DAILY
PER_OPERATION
PER_PIECE
FLAT_RATE
```

---

# 40. Operation-Based Labor

Example:

```text
Operation                  Hours

Pattern Development         2.0
Cutting                     1.5
Assembly                    6.0
Sewing                      8.0
Finishing                   2.0
```

The system calculates each operation individually.

---

# 41. Labor Calculation

Example:

```text
Operation:
Sewing

Hours:
8

Rate:
₱180/hour

Cost:
₱1,440
```

---

# 42. Decoration Database

Decoration records should support:

```text
Decoration ID
Name
Category
Unit
Unit Price
Supplier
Cultural Association
Availability
Price Source
Status
```

Examples:

```text
Beads
Sequins
Metal Ornament
Embroidery Thread
Decorative Trim
Shell
Appliqué
```

---

# 43. Cultural Association

Some materials and decorations may be culturally associated with particular traditions.

The Cost Engine should store the relationship but should NOT determine cultural appropriateness itself.

Example:

```text
Material
    ↓
Cultural Element
    ↓
Cultural Knowledge Service
```

The Culture Service determines:

```text
Is this culturally associated?
Is this usage appropriate?
Is there a restriction?
```

The Cost Engine determines:

```text
How much does it cost?
```

This preserves separation of concerns.

---

# 44. Cost Database Model

Recommended entities:

```text
materials
material_prices
suppliers
labor_rates
labor_operations
decoration_items
cost_profiles
cost_items
cost_calculations
cost_snapshots
```

---

# 45. `materials`

Example schema:

```text
materials
---------------------------
id
name
category
description
unit
fabric_width
weight
color
texture
availability_status
cultural_element_id
status
created_by
created_at
updated_at
```

---

# 46. `material_prices`

```text
material_prices
---------------------------
id
material_id
supplier_id
currency
unit
price
minimum_quantity
effective_date
expiration_date
source_type
source_reference
verification_status
created_by
verified_by
created_at
updated_at
```

---

# 47. `suppliers`

```text
suppliers
---------------------------
id
name
contact_name
email
phone
location
website
status
created_at
updated_at
```

---

# 48. `labor_rates`

```text
labor_rates
---------------------------
id
role
operation
rate_type
rate
currency
unit
region
effective_date
expiration_date
source_type
status
created_at
updated_at
```

---

# 49. `decoration_items`

```text
decoration_items
---------------------------
id
name
category
unit
unit_price
currency
supplier_id
cultural_element_id
availability_status
price_source
status
created_at
updated_at
```

---

# 50. `cost_profiles`

A cost profile defines calculation settings.

```text
cost_profiles
---------------------------
id
name
currency
default_contingency
waste_percentage
rounding_rule
budget_threshold_near
budget_threshold_over
status
created_at
updated_at
```

Example:

```text
Default Apparel Cost Profile

Currency:
PHP

Contingency:
10%

Waste:
8%

Near Budget:
90%

Over Budget:
100%
```

---

# 51. `cost_items`

This table stores individual calculation lines.

```text
cost_items
---------------------------
id
calculation_id
category
reference_id
description
quantity
unit
unit_price
currency
subtotal
source_type
source_reference
notes
```

Possible categories:

```text
MATERIAL
LABOR
DECORATION
OTHER
```

---

# 52. `cost_calculations`

```text
cost_calculations
---------------------------
id
project_id
design_id
design_version_id
currency
material_subtotal
labor_subtotal
decoration_subtotal
other_subtotal
direct_cost
contingency_percentage
contingency_amount
estimated_total
budget
budget_variance
budget_variance_percentage
status
calculated_at
calculated_by
```

---

# 53. `cost_snapshots`

```text
cost_snapshots
---------------------------
id
calculation_id
project_id
design_version_id
snapshot_data
price_version
labor_rate_version
calculation_version
created_at
```

`snapshot_data` should preserve the exact inputs used.

---

# 54. Calculation Version

The engine itself should have a version.

Example:

```text
Cost Engine Version:
1.0.0
```

Later:

```text
1.1.0
```

If calculation rules change, old snapshots remain associated with the old calculation version.

---

# 55. Calculation Pipeline

The complete process:

```text
Design Version
      ↓
Load Design Materials
      ↓
Validate Materials
      ↓
Resolve Prices
      ↓
Calculate Material Consumption
      ↓
Calculate Labor
      ↓
Calculate Decoration
      ↓
Calculate Other Costs
      ↓
Calculate Direct Cost
      ↓
Apply Contingency
      ↓
Compare Budget
      ↓
Determine Cost Status
      ↓
Create Cost Snapshot
      ↓
Return Result
```

---

# 56. Input Validation

Before calculation:

```text
✓ Design exists
✓ Design version exists
✓ Material IDs valid
✓ Quantities > 0
✓ Units valid
✓ Prices available
✓ Currency compatible
✓ Labor rates available
✓ Budget valid
✓ Contingency valid
```

If required information is missing:

```text
INCOMPLETE
```

must be returned instead of inventing a value.

---

# 57. Missing Price Handling

If:

```text
Material:
Traditional Textile

Price:
MISSING
```

the system must not automatically invent:

```text
₱500/m
```

Instead:

```text
⚠ PRICE MISSING

Traditional Textile does not have
a verified price.

Please:
[Enter Price]
[Add Supplier Quote]
[Mark as Estimated]
```

---

# 58. Estimated Price

A user may intentionally enter an estimated price.

Example:

```text
Material:
Special Ornament

Price:
₱1,500

Source:
ESTIMATED

Status:
REVIEW_REQUIRED
```

The calculation can proceed, but the report must identify the assumption.

---

# 59. Expired Price

If:

```text
Price:
₱850/m

Expiration:
2026-06-30

Current:
2026-09-28
```

the system should display:

```text
⚠ PRICE EXPIRED
```

The system may:

```text
Continue Calculation
```

but should mark:

```text
REVIEW_REQUIRED
```

unless project rules prohibit expired prices.

---

# 60. Currency

Currency must be stored explicitly.

Example:

```text
PHP
USD
EUR
JPY
```

The system should never assume that:

```text
850
```

means:

```text
₱850
```

without currency metadata.

Recommended default for the initial implementation:

```text
PHP
```

while keeping currency configurable.

---

# 61. Currency Conversion

Currency conversion should be handled separately from the core calculation engine.

Architecture:

```text
Cost Engine
      ↓
Currency Service
      ↓
Exchange Rate
```

The LLM should not perform currency conversion.

---

# 62. Rounding Rules

The system should define consistent rounding.

Possible:

```text
LINE_ITEM:
2 decimal places

SUBTOTAL:
2 decimal places

FINAL TOTAL:
2 decimal places
```

Currency-specific rounding rules may be configured later.

---

# 63. Cost Result Object

Example:

```json
{
  "calculationId": "CALC-001",
  "currency": "PHP",
  "materials": 12000,
  "labor": 7500,
  "decoration": 3000,
  "other": 1000,
  "directCost": 23500,
  "contingencyPercentage": 10,
  "contingency": 2350,
  "estimatedTotal": 25850,
  "budget": 30000,
  "budgetVariance": 4150,
  "budgetVariancePercentage": -13.83,
  "status": "UNDER_BUDGET",
  "requiresReview": false
}
```

---

# 64. API

## Create Cost Calculation

```http
POST /api/cost/calculate
```

Request:

```json
{
  "projectId": "PROJ-001",
  "designId": "DES-001",
  "designVersionId": "DES-001-V3"
}
```

---

# 65. Get Cost Calculation

```http
GET /api/cost/calculations/:id
```

---

# 66. Get Cost Snapshot

```http
GET /api/cost/calculations/:id/snapshot
```

---

# 67. Get Material Prices

```http
GET /api/materials/:id/prices
```

---

# 68. Add Material Price

```http
POST /api/materials/:id/prices
```

---

# 69. Get Labor Rates

```http
GET /api/labor/rates
```

---

# 70. Get Cost History

```http
GET /api/designs/:id/cost-history
```

---

# 71. Compare Cost Versions

```http
GET /api/designs/:id/cost-history/compare
```

Example:

```text
V1:
₱22,500

V2:
₱24,800

V3:
₱25,850
```

---

# 72. Cost Service

Recommended service:

```text
CostService
```

Responsibilities:

```text
calculate()
validateInputs()
resolveMaterialPrices()
calculateMaterials()
calculateLabor()
calculateDecorations()
calculateOtherCosts()
calculateContingency()
compareBudget()
createSnapshot()
getCostHistory()
compareCostVersions()
```

---

# 73. Material Service

```text
MaterialService
```

Responsibilities:

```text
getMaterial()
searchMaterials()
getAvailableMaterials()
getMaterialPrices()
getSupplierPrices()
validateAvailability()
```

---

# 74. Labor Service

```text
LaborService
```

Responsibilities:

```text
getLaborRates()
calculateHourlyLabor()
calculateOperationLabor()
validateLaborRate()
```

---

# 75. Cost Calculation Interface

Example TypeScript:

```typescript
interface CostCalculationInput {
  projectId: string;
  designId: string;
  designVersionId: string;
  budget?: number;
  currency: string;
  contingencyPercentage: number;
}
```

Result:

```typescript
interface CostCalculationResult {
  materials: number;
  labor: number;
  decoration: number;
  other: number;
  directCost: number;
  contingency: number;
  estimatedTotal: number;
  budget?: number;
  budgetVariance?: number;
  budgetVariancePercentage?: number;
  status: CostStatus;
  requiresReview: boolean;
}
```

---

# 76. Frontend Costing Screen

The Design Studio should contain:

```text
┌───────────────────────────────────────────┐
│ COST ESTIMATE                             │
├───────────────────────────────────────────┤
│ Materials                       ₱12,000   │
│ Labor                            ₱7,500   │
│ Decoration                       ₱3,000   │
│ Other                            ₱1,000   │
│                                           │
│ Direct Cost                    ₱23,500    │
│ Contingency 10%                 ₱2,350    │
│ ───────────────────────────────────────── │
│ ESTIMATED TOTAL                ₱25,850    │
│                                           │
│ Budget                          ₱30,000   │
│ Remaining                        ₱4,150   │
│                                           │
│ Status: UNDER BUDGET                     │
└───────────────────────────────────────────┘
```

---

# 77. Material Editor

Each material should display:

```text
Material
Quantity
Unit
Unit Price
Supplier
Price Source
Subtotal
Availability
```

Example:

```text
Traditional Textile

Quantity:
4.2 m

Price:
₱850/m

Source:
Supplier Quote

Subtotal:
₱3,570
```

---

# 78. Cost Evidence Panel

Users should be able to inspect why a price exists.

Example:

```text
PRICE INFORMATION

Material:
Traditional Textile

Price:
₱850 / meter

Source:
Supplier Quote

Supplier:
Supplier A

Effective:
2026-09-15

Status:
VERIFIED
```

---

# 79. AI Material Recommendation

The AI may produce:

```text
Suggested Material

Material ID:
MAT-024

Reason:
Associated with selected cultural context
and suitable for requested garment type.

Suggested Quantity:
4.0 m
```

The system then validates:

```text
Material exists?        ✓
Cultural association?   ✓
Available?              ✓
Price available?        ✓
Quantity recalculated?  ✓
```

Then the Cost Engine performs the calculation.

---

# 80. AI Boundary

The following must NOT be trusted directly from AI:

```text
Final material price
Final labor cost
Final total cost
Currency conversion
Budget status
Price validity
Supplier availability
```

These come from deterministic services.

---

# 81. Cost + AI Integration

Architecture:

```text
AI Orchestrator
      ↓
Material Recommendation
      ↓
Material IDs
      ↓
Cost Engine
      ↓
Verified Prices
      ↓
Deterministic Calculation
      ↓
Cost Result
      ↓
AI Explanation
```

---

# 82. Cost + Cultural Knowledge

The Cost Engine does not decide:

```text
"This material is culturally appropriate."
```

Instead:

```text
Cultural Service:
MAT-024 associated with Culture X
```

and:

```text
Cost Service:
MAT-024 costs ₱850/m
```

This separation prevents the costing module from becoming an accidental cultural authority.

---

# 83. Budget Optimization

The system may support AI-assisted alternatives.

Example:

```text
CURRENT DESIGN

Estimated:
₱34,500

Budget:
₱30,000

Difference:
₱4,500 over budget
```

AI may suggest:

```text
Alternative textile
Reduced ornamentation
Simplified construction
Alternative accessory
```

Each suggestion must then be recalculated by the Cost Engine.

---

# 84. Optimization Workflow

```text
Budget Exceeded
       ↓
AI Generates Alternatives
       ↓
Alternative Design Specification
       ↓
Cost Engine Recalculates
       ↓
Compare Results
       ↓
Designer Chooses
```

The system should never silently modify the design merely to meet budget.

---

# 85. Cost Comparison

Design Studio should support:

```text
CURRENT DESIGN
vs
ALTERNATIVE DESIGN
```

Example:

| Component   |    Design A |    Design B |
| ----------- | ----------: | ----------: |
| Materials   |     ₱14,000 |     ₱11,500 |
| Labor       |      ₱8,000 |      ₱7,000 |
| Decoration  |      ₱4,000 |      ₱2,500 |
| Other       |      ₱1,000 |      ₱1,000 |
| Contingency |      ₱2,700 |      ₱2,200 |
| **Total**   | **₱29,700** | **₱24,200** |

The user decides whether the alternative is acceptable.

---

# 86. Cost Change Explanation

When cost changes between versions:

```text
V2 → V3

Cost increased by:
₱2,350
```

The system should identify contributing changes.

Example:

```text
+ ₱1,700
Additional fabric

+ ₱500
Additional embroidery

+ ₱150
Additional labor
```

This is much more useful than simply showing:

```text
V2 = ₱23,500
V3 = ₱25,850
```

---

# 87. Cost Audit Trail

Every calculation should record:

```text
Who calculated it
When it was calculated
Design version
Materials
Quantities
Prices
Labor rates
Decoration costs
Contingency
Currency
Cost engine version
Result
```

---

# 88. Audit Example

```text
COST CALCULATION AUDIT

Calculation:
CALC-001

User:
Designer A

Date:
2026-09-28

Design:
DES-001-V3

Engine:
1.0.0

Result:
₱25,850

Status:
UNDER_BUDGET
```

---

# 89. Permissions

### ADMIN

Can:

- manage prices
- manage suppliers
- manage labor rates
- modify cost profiles
- view all calculations

### DESIGNER

Can:

- calculate cost
- add project-specific prices
- request supplier quotations
- modify quantities
- compare costs

### CULTURAL EXPERT

Can:

- review cultural associations
- validate cultural materials
- add cultural notes

They should not automatically gain permission to modify prices unless explicitly granted.

### VIEWER

Can:

- view approved cost information

---

# 90. Security

Cost endpoints must enforce:

```text
Authentication
+
Authorization
+
Project Ownership
+
Role Permissions
+
Input Validation
```

Users must not be able to modify another project's cost records by changing an ID in the request.

---

# 91. Error Handling

Example:

```json
{
  "error": "MATERIAL_PRICE_MISSING",
  "message": "No valid price was found for material MAT-024.",
  "materialId": "MAT-024",
  "requiresAction": true
}
```

Other errors:

```text
INVALID_QUANTITY
INVALID_UNIT
PRICE_EXPIRED
CURRENCY_MISMATCH
LABOR_RATE_MISSING
INVALID_BUDGET
INVALID_CONTINGENCY
MATERIAL_NOT_FOUND
SUPPLIER_NOT_FOUND
CALCULATION_FAILED
```

---

# 92. Calculation Safety

The Cost Engine must avoid:

```text
NaN
Infinity
negative quantities
negative prices
invalid percentages
unknown currencies
missing units
```

Validation must happen before calculation.

---

# 93. Decimal Precision

Financial calculations should use decimal-safe arithmetic.

Do not rely blindly on JavaScript floating-point arithmetic for financial totals.

Prefer:

```text
decimal.js
```

or a database-supported decimal/numeric type.

Database values should use:

```text
NUMERIC
```

rather than floating-point types for financial amounts.

---

# 94. Testing Strategy

The Cost Engine requires extensive automated tests.

### Unit Tests

Test:

```text
Material calculation
Labor calculation
Decoration calculation
Contingency
Budget variance
Status classification
Unit conversion
Rounding
```

---

# 95. Example Unit Test

Input:

```text
Quantity = 4
Price = ₱850
```

Expected:

```text
₱3,400
```

---

# 96. Contingency Test

Input:

```text
Direct Cost = ₱20,000
Contingency = 10%
```

Expected:

```text
₱2,000
```

---

# 97. Total Test

```text
Materials = ₱10,000
Labor = ₱5,000
Decoration = ₱2,000
Other = ₱1,000
Contingency = 10%
```

Direct:

```text
₱18,000
```

Contingency:

```text
₱1,800
```

Expected:

```text
₱19,800
```

---

# 98. Budget Test

```text
Budget = ₱20,000
Estimated = ₱19,800
```

Expected:

```text
Status = UNDER_BUDGET
Variance = ₱200
```

---

# 99. Missing Price Test

Input:

```text
Material:
MAT-001

Price:
NULL
```

Expected:

```text
Status:
INCOMPLETE
```

The engine must not invent a price.

---

# 100. Expired Price Test

Input:

```text
Price:
₱800

Expiration:
2026-01-01

Current:
2026-09-28
```

Expected:

```text
requiresReview = true
```

---

# 101. Reproducibility Test

The same snapshot must produce the same result.

```text
Calculation V1
+
Same Inputs
=
Same Result
```

This is an important system quality requirement.

---

# 102. Integration Tests

Test:

```text
Design → Material → Price → Cost Engine
```

and:

```text
AI Recommendation
→ Validation
→ Cost Engine
→ Result
```

---

# 103. End-to-End Test

Example:

```text
Create Project
      ↓
Create Design
      ↓
Select Materials
      ↓
Add Body Profile
      ↓
Generate Design
      ↓
Calculate Cost
      ↓
Evaluate Budget
      ↓
Modify Design
      ↓
Recalculate
      ↓
Save Cost Snapshot
      ↓
Generate Report
```

---

# 104. Report Integration

The report should display:

```text
COST SUMMARY

Material Cost:
₱12,000

Labor:
₱7,500

Decoration:
₱3,000

Other:
₱1,000

Direct Cost:
₱23,500

Contingency:
₱2,350

Estimated Total:
₱25,850

Budget:
₱30,000

Variance:
₱4,150
```

It should also show price assumptions.

---

# 105. Cost Assumptions

The report should include:

```text
ASSUMPTIONS

• Fabric price based on supplier quotation.
• Labor calculated using configured hourly rates.
• 10% contingency applied.
• Decoration prices based on latest available records.
• Some material prices may require confirmation.
```

---

# 106. Estimated vs Actual

After production, the system can record actual values.

Example:

```text
                 Estimated     Actual

Materials         ₱12,000      ₱12,700
Labor              ₱7,500       ₱7,200
Decoration         ₱3,000       ₱3,400
Other              ₱1,000       ₱1,200
────────────────────────────────────────
Total             ₱23,500      ₱24,500
```

This allows:

```text
Cost Variance Analysis
```

---

# 107. Future Predictive Costing

Predictive costing can be added later.

For example:

```text
Historical Projects
        ↓
Actual Costs
        ↓
Machine Learning Model
        ↓
Predicted Cost Range
```

However:

> Predictive costing must remain separate from the deterministic Cost Engine.

Architecture:

```text
Deterministic Cost
        +
Predictive Estimate
```

rather than replacing deterministic calculations.

---

# 108. Recommended MVP

The first implementation should NOT attempt to build every advanced costing feature.

MVP should include:

```text
✓ Materials
✓ Material prices
✓ Suppliers
✓ Labor rates
✓ Decoration items
✓ Quantity entry
✓ Material calculation
✓ Labor calculation
✓ Decoration calculation
✓ Other costs
✓ Contingency
✓ Budget comparison
✓ Cost status
✓ Cost snapshot
✓ Cost history
✓ Audit trail
```

---

# 109. Phase 2

Add:

```text
✓ Fabric consumption rules
✓ Fabric-width calculations
✓ Waste calculation
✓ Purchase quantity
✓ Supplier comparison
✓ Price expiration warnings
✓ Cost alternatives
✓ Version comparison
✓ Estimated vs quoted cost
```

---

# 110. Phase 3

Add:

```text
✓ Actual production costs
✓ Estimated vs actual analysis
✓ Historical cost analytics
✓ Predictive costing
✓ Regional pricing
✓ Advanced material optimization
✓ Automated supplier quotation workflows
```

---

# 111. Recommended Frontend Structure

```text
src/
└── features/
    └── costing/
        ├── components/
        │   ├── CostSummary.tsx
        │   ├── MaterialCostTable.tsx
        │   ├── LaborCostTable.tsx
        │   ├── DecorationCostTable.tsx
        │   ├── BudgetStatus.tsx
        │   ├── PriceSource.tsx
        │   ├── CostHistory.tsx
        │   ├── CostComparison.tsx
        │   └── CostAssumptions.tsx
        │
        ├── services/
        │   └── costApi.ts
        │
        ├── hooks/
        │   ├── useCostCalculation.ts
        │   └── useCostHistory.ts
        │
        ├── types/
        │   └── costing.ts
        │
        └── utils/
            ├── formatCurrency.ts
            └── costValidation.ts
```

---

# 112. Backend Structure

```text
backend/
└── services/
    └── costing/
        ├── CostService
        ├── MaterialService
        ├── LaborService
        ├── DecorationService
        ├── PriceService
        ├── BudgetService
        ├── SnapshotService
        └── CurrencyService
```

---

# 113. Cost Engine Architecture

Final architecture:

```text
                    DESIGN VERSION
                           │
                           ▼
                  ┌─────────────────┐
                  │  COST SERVICE   │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     MATERIAL          LABOR          DECORATION
      SERVICE          SERVICE          SERVICE
          │                │                │
          ▼                ▼                ▼
       PRICES          RATES           PRICES
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                  ┌─────────────────┐
                  │ CALCULATION     │
                  │ ENGINE          │
                  └────────┬────────┘
                           │
                           ▼
                  DIRECT COST
                           │
                           ▼
                    CONTINGENCY
                           │
                           ▼
                  ESTIMATED TOTAL
                           │
                           ▼
                  BUDGET ANALYSIS
                           │
                           ▼
                   COST SNAPSHOT
                           │
                           ▼
                 DESIGN EVALUATION
```

---

# 114. Relationship With Evaluation Engine

The Cost Engine produces facts.

The Evaluation Engine interprets them against project requirements.

Example:

```text
Cost Engine:

Estimated:
₱32,500

Budget:
₱30,000
```

Then:

```text
Evaluation Engine:

Budget:
REVIEW_REQUIRED

Finding:
Estimated cost exceeds specified budget by ₱2,500.
```

The Cost Engine should not make broader design judgments.

---

# 115. Relationship With Explanation Engine

The Cost Engine provides evidence:

```text
Fabric:
₱3,570

Embroidery:
₱4,500

Labor:
₱7,500
```

The Explanation Engine can then produce:

```text
The estimated cost increased primarily because
the revised design uses additional embroidered
material and requires additional labor.
```

---

# 116. Relationship With Design Versioning

Every design version has its own cost calculation.

```text
Design V1
    ↓
Cost Snapshot V1

Design V2
    ↓
Cost Snapshot V2

Design V3
    ↓
Cost Snapshot V3
```

Never overwrite historical cost snapshots.

---

# 117. Relationship With Human Review

The final cost is still subject to human verification.

The interface should provide:

```text
COST REVIEW

Estimated:
₱25,850

Price Issues:
⚠ 1 estimated material price

Labor:
✓ Verified

Supplier:
✓ Current

Designer Review:
[PENDING]
```

Actions:

```text
[Accept Cost]
[Edit Cost]
[Update Prices]
[Recalculate]
```

---

# 118. Acceptance Criteria

The Cost Engine is considered complete when:

```text
[ ] Materials can be stored.
[ ] Supplier prices can be stored.
[ ] Price history is preserved.
[ ] Labor rates can be stored.
[ ] Decoration costs can be stored.
[ ] Quantities can be entered.
[ ] Material costs calculate correctly.
[ ] Labor costs calculate correctly.
[ ] Decoration costs calculate correctly.
[ ] Other costs calculate correctly.
[ ] Contingency calculates correctly.
[ ] Total cost calculates correctly.
[ ] Budget variance calculates correctly.
[ ] Cost status is determined automatically.
[ ] Missing prices are detected.
[ ] Expired prices are detected.
[ ] Cost snapshots are created.
[ ] Historical calculations remain reproducible.
[ ] Cost history is available.
[ ] AI cannot override deterministic calculations.
[ ] Audit logs are generated.
[ ] Reports can consume cost results.
[ ] Automated tests pass.
```

---

# 119. Critical Rules

The implementation must follow these rules:

### Rule 1

**AI may suggest; the Cost Engine calculates.**

### Rule 2

**Never invent missing prices.**

### Rule 3

**Historical cost calculations must remain reproducible.**

### Rule 4

**Every price must have source metadata.**

### Rule 5

**Financial calculations must use decimal-safe arithmetic.**

### Rule 6

**Currency must always be explicit.**

### Rule 7

**Purchase quantity and design consumption are different concepts.**

### Rule 8

**Cultural appropriateness is determined by the Cultural Knowledge/Evaluation layer, not the Cost Engine.**

### Rule 9

**Cost changes must be traceable to design changes or pricing changes.**

### Rule 10

**Human review remains available before final approval.**

---

# 120. Final Cost Engine Flow

The complete system flow is:

```text
USER / DESIGNER
      │
      ▼
DESIGN VERSION
      │
      ▼
MATERIAL REQUIREMENTS
      │
      ├───────────────┐
      ▼               ▼
MATERIAL SERVICE   LABOR SERVICE
      │               │
      ▼               ▼
PRICE DATABASE     LABOR RATES
      │               │
      └───────┬───────┘
              ▼
       DECORATION COSTS
              │
              ▼
        COST CALCULATOR
              │
              ▼
          DIRECT COST
              │
              ▼
         CONTINGENCY
              │
              ▼
       ESTIMATED TOTAL
              │
              ▼
        BUDGET ANALYSIS
              │
              ▼
        COST STATUS
              │
              ▼
       COST SNAPSHOT
              │
              ▼
       EXPLANATION DATA
              │
              ▼
      EVALUATION ENGINE
              │
              ▼
       HUMAN DESIGNER
              │
        ┌─────┴─────┐
        ▼           ▼
      ACCEPT      REVISE
                    │
                    ▼
               NEW VERSION
```

---

# 121. Final Architectural Principle

The Cost Engine should be treated as a **deterministic financial calculation service**, not an AI feature.

The overall Human-AI system therefore follows:

```text
AI
│
├── Understands requirements
├── Retrieves cultural knowledge
├── Suggests design concepts
├── Suggests materials
├── Explains recommendations
└── Proposes alternatives

APPLICATION
│
├── Validates data
├── Applies rules
├── Calculates costs
├── Checks requirements
├── Evaluates constraints
├── Preserves versions
└── Maintains auditability

HUMAN
│
├── Reviews cultural context
├── Reviews design
├── Reviews body suitability
├── Reviews cost
├── Modifies recommendations
└── Makes final design decision
```

Therefore:

> **AI proposes. The application verifies and calculates. The human decides.**

This principle must remain consistent throughout the entire platform.
