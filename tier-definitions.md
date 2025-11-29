# AI LAB AS A SERVICE – Tier Definitions (POC)

This document describes the **logical tiers** (Starter, Explorer, Pro) and their mapping to:

- Azure services
- Quotas & limits
- Governance policies
- Example plans (prepaid packs) stored in Cosmos DB (`plans` container)

---

## 1. Tier Overview

| Tier Code | Name                   | Target Audience           | Primary Use Cases                          |
|----------|------------------------|---------------------------|--------------------------------------------|
| starter  | Starter (Student)      | Students, academic users  | Intro to AI/ML, prompt engineering labs    |
| explorer | Explorer               | Student projects, PoCs    | Small real-world PoCs, AI Search & ML      |
| pro      | Pro (Corporate POC)    | Corporate innovation teams| Enterprise-grade PoCs with VNET & GPUs     |

Each tier is **implemented in Bicep** via tier-specific modules and is **sold via plans** (prepaid packs) defined in Cosmos `plans`.

---

## 2. Starter Tier (Student)

### 2.1 Description

**Starter** is a low-cost, student-focused tier designed for:

- Prompt engineering exercises
- Basic ML experimentation (CPU-only)
- Classroom-style labs

### 2.2 Azure Resources (per lab)

- Resource Group: `ailab-lab-starter-{labId}`
- Azure Machine Learning workspace:
  - CPU compute cluster only:
    - Example: `Standard_DS3_v2`
    - Autoscale: min 0, max 2 nodes
- Storage Account:
  - Standard_LRS
  - Small capacity (e.g., <= 20 GB practical usage)
- Access pattern:
  - AML Studio through workspace URL
  - Optionally shared AOAI endpoint (managed at platform layer)

### 2.3 Governance & Limits

- No GPU SKUs allowed:
  - Enforced via Azure Policy (`deny-gpu-for-starter.bicep`)
- Limited storage quota (policy/monitoring)
- Budget:
  - Example: USD 5 / month per lab (configured via `lab-budget.bicep`)
- Auto-cleanup:
  - Labs can be soft-deleted or automatically deleted after inactivity threshold (future enhancement)

### 2.4 Example Cosmos Plans

Stored in `ai-lab-db` → `plans` container.

```jsonc
[
  {
    "id": "starter-100",
    "planCode": "starter-100",
    "tierCode": "starter",
    "name": "Starter 100 Credits",
    "credits": 100,
    "priceCurrency": "INR",
    "priceAmount": 499,
    "validityDays": 30,
    "audience": "student"
  },
  {
    "id": "starter-300",
    "planCode": "starter-300",
    "tierCode": "starter",
    "name": "Starter 300 Credits",
    "credits": 300,
    "priceCurrency": "INR",
    "priceAmount": 1299,
    "validityDays": 90,
    "audience": "student"
  }
]
