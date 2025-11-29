# AI LAB AS A SERVICE – POC ARCHITECTURE

## 1. Overview

**AI LAB AS A SERVICE** is a SaaS-style platform that provisions controlled AI lab environments on Azure for:

- Students and academic institutions
- Corporate users and innovation teams

The POC focuses on:

- Tier-based, prepaid lab environments
- Automated provisioning via Bicep
- Subscription + lab state stored in Cosmos DB
- A simple web portal (React) + Azure Functions backend

This document describes the technical architecture of the **Cosmos-based POC**.

---

## 2. High-Level Architecture

### 2.1 Logical View

Main layers:

1. **Portal Layer**
   - React + Vite SPA
   - Hosted on Azure Static Web Apps or App Service
   - Talks to Azure Functions backend via HTTPS

2. **Control Plane (Backend)**
   - Azure Functions (TypeScript)
   - Responsible for:
     - Tiers and plans
     - Subscriptions (prepaid)
     - Lab lifecycle (create/list)
     - Payment webhook handling (POC stub)
     - Usage/metrics stub

3. **State & Metadata**
   - Azure Cosmos DB (NoSQL)
   - Database: `ai-lab-db`
   - Containers:
     - `plans` – tier plans with price, credits, validity
     - `subscriptions` – user subscriptions and credits
     - `labs` – lab metadata per subscription

4. **Lab Environments**
   - Azure Resource Groups per lab
   - Deployed via Bicep:
     - AML workspace
     - Storage account
     - Compute cluster (CPU/GPU depending on tier)
   - Future: AOAI, AI Search, AI Studio, Prompt Flow, VNET + Private Endpoints for higher tiers

5. **Governance & Cost**
   - Azure Policy for SKU/location restrictions
   - Azure Budgets for lab/tier cost caps
   - Azure Monitor + Log Analytics (future POC extension)
   - Metering Functions (future) will read Cost Management APIs and update Cosmos

---

## 3. Identity & Multi-Tenancy

### 3.1 Identity

- **Planned**: Azure AD B2C
  - SPA registered as client app
  - Backend Functions secured via EasyAuth (App Service / Static Web Apps integration)
  - Roles: `Student`, `CorporateUser`, `Admin`
- **POC Implementation**:
  - Identity simplified using header `x-demo-user-id`
  - Allows quick testing of per-user subscriptions and labs

### 3.2 Multi-tenancy

- Logical multi-tenancy per:
  - `userId`
  - `subscriptionId`
  - `labId`

Each customer (student or corporate user):

- Has **one or more subscriptions** in `subscriptions` container.
- Each subscription can contain **one or more labs** in `labs` container.
- Lab resources are isolated by **resource group** and **tags**.

Scaling options:

- Single Azure subscription with per-lab resource groups (POC).
- Future: management groups and multiple subscriptions per institution.

---

## 4. Data Model

### 4.1 Plans (Cosmos: `plans`)

- Partition key: `/tierCode`
- Example fields:
  - `planCode` (id)
  - `tierCode` (`starter`, `explorer`, `pro`)
  - `name`
  - `credits`
  - `priceCurrency`
  - `priceAmount`
  - `validityDays`
  - `audience` (`student`, `corporate`, `both`)

### 4.2 Subscriptions (Cosmos: `subscriptions`)

- Partition key: `/userId`
- Example fields:
  - `subscriptionId` (id)
  - `userId`
  - `planCode`, `tierCode`
  - `status` (`PendingPayment`, `Active`, `Suspended`, `Expired`, `Cancelled`)
  - `creditsPurchased`, `creditsRemaining`
  - `currency`, `amountPaid`
  - `createdAt`, `activatedAt`, `expiresAt`
  - `labs` (array of `labId`)

### 4.3 Labs (Cosmos: `labs`)

- Partition key: `/subscriptionId`
- Example fields:
  - `labId` (id)
  - `subscriptionId`
  - `userId`
  - `tierCode`
  - `displayName`
  - `status` (`Active`, `Paused`, `Deleted`, etc.)
  - `createdAt`
  - `resourceGroupName`
  - `location`

---

## 5. Backend Services (Functions)

### 5.1 API Surface

- **Tiers**
  - `GET /tiers` – static tier definitions (Starter / Explorer / Pro)

- **Plans**
  - `GET /plans` – reads all plans from Cosmos `plans` container

- **Subscriptions**
  - `POST /subscriptions`
    - Input: `planCode`
    - Action: create subscription with `PendingPayment` status
  - `GET /subscriptions`
    - List subscriptions for current user
  - `GET /subscriptions/{subscriptionId}`
    - Get single subscription for current user

- **Payment Webhook (POC)**
  - `POST /payment/webhook`
    - Input: `subscriptionId`, `userId`
    - Action: activate subscription (`status = Active`) and set expiry

- **Labs**
  - `POST /labs`
    - Input: `subscriptionId`, `displayName`
    - Action:
      - Validate subscription is `Active`
      - Call Bicep to create lab resource group and tier resources
      - Write lab document in Cosmos
  - `GET /labs`
    - List labs for current user
  - `GET /labs/{labId}`
    - Get single lab for current user

- **Usage (POC stub)**
  - `GET /labs/{labId}/usage`
    - Returns dummy token+cost information

### 5.2 Tech Stack

- Runtime: Azure Functions (Node.js, TypeScript)
- Data access: `@azure/cosmos` SDK
- ARM deployment: `@azure/arm-resources` + `DefaultAzureCredential`
- Config: environment variables / Azure App Settings

---

## 6. Lab Provisioning (Bicep)

### 6.1 main-lab-deploy.bicep

- Target scope: **subscription**
- Parameters:
  - `prefix` (e.g., `ailab`)
  - `labId`
  - `tier` (`starter`, `explorer`, `pro`)
  - `owner` (userId or email)
- Logic:
  - Creates resource group: `${prefix}-lab-${tier}-${labId}`
  - Calls tier-specific module:
    - `tier-starter/main.bicep`
    - `tier-explorer/main.bicep`
    - `tier-pro/main.bicep`

### 6.2 Tier Modules (starter example)

- AML workspace (no GPU)
- Storage account
- CPU compute cluster (small)
- Tags: `LabId`, `Tier`, `Owner`

Explorer and Pro variants extend this with:

- AI Search
- GPU compute
- VNET + Private Endpoints
- Higher quota and budgets

---

## 7. Governance & Cost Controls

- **Azure Policy**
  - `deny-gpu-for-starter.bicep` – blocks GPU SKUs in Starter tier labs
  - Location restrictions for lab resource groups

- **Azure Budgets**
  - `lab-budget.bicep` – per-lab or per-tier monthly budget with alerts

- **Future Metering**
  - Timer-triggered Functions in `metering-billing/cost-ingestion`:
    - Use Azure Cost Management APIs filtered by tags (`LabId`, `SubscriptionId`)
    - Convert cost into consumption and decrement `creditsRemaining` in subscriptions

---

## 8. Frontend (Portal)

- Built with **React + Vite**
- Pages:
  - `Dashboard` – overview & messaging
  - `TiersPage` – tier descriptions + plans
  - `CheckoutPage` – simulated purchase + lab creation
  - `SubscriptionsPage` – view subscriptions and credits
  - `LabsPage` – view labs and status

- API calls (via `apiClient.ts`) to Functions backend:
  - `GET /tiers`, `GET /plans`
  - `POST /subscriptions`, `GET /subscriptions`
  - `POST /payment/webhook`
  - `POST /labs`, `GET /labs`

---

## 9. Deployment & CI/CD

- **Infra (Bicep)**:
  - Deployed via Azure CLI or GitHub Actions (`bicep-deploy.yml`)
  - Cosmos, core platform, and lab templates

- **Backend (Functions)**:
  - Deployed via GitHub Actions (`backend-deploy.yml`)
  - Uses OIDC + `azure/functions-action` (or publish profile for POC)

- **Frontend (Portal)**:
  - Deployed via GitHub Actions (`portal-deploy.yml`)
  - Uses `azure/static-web-apps-deploy` or App Service deploy

---

## 10. Future Enhancements

- Replace `x-demo-user-id` with:
  - Full Azure AD B2C + EasyAuth
- Real payment integration:
  - Razorpay/Stripe checkout + secure webhook handling
- Real usage metering:
  - Cost Management APIs
  - AOAI token logging
- Institution-level tenants:
  - Map groups/institutions to management groups or dedicated subscriptions
