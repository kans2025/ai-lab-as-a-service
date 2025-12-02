# AI LAB AS A SERVICE (POC)

AI LAB AS A SERVICE is a **SaaS-style AI experimentation platform** built on Microsoft Azure.
This Proof of Concept (POC) demonstrates how students, academic institutions, and corporate
innovation teams can self-serve **tier-based AI lab environments** in a controlled, prepaid model.

The POC focuses on the **control plane**:
- Subscription lifecycle
- Tier enforcement
- Usage governance
- Cost-safe sandboxing

All components run **locally** using Azure-native tooling and the Cosmos DB Emulator.

---

## 🎯 Business Objectives

- Provide a self-service AI Lab platform
- Enforce tier-based limits and entitlements
- Track subscriptions, labs, and consumption
- Enable sales demos and early pilots
- Remain cloud-native and Azure-aligned
- Be reproducible via Infrastructure as Code

---

## 🧱 System Components

### Frontend
- React + Vite + TypeScript
- Lightweight portal UI
- Tier & plan selection
- Lab and subscription views

### Backend
- Azure Functions v4 (Node.js, TypeScript)
- Stateless SaaS API:
  - Tiers
  - Plans
  - Subscriptions
  - Payments (simulated)
  - Labs

### Data Store
- Azure Cosmos DB Emulator
- Containers:
  - `plans`
  - `subscriptions`
  - `labs`

---

## 🧪 Local Environment Setup

### Prerequisites
- Node.js ≥ 18
- Azure Functions Core Tools v4
- Azure Cosmos DB Emulator (Windows)
- Git

---

### Backend Setup

```bash
cd portal/backe
