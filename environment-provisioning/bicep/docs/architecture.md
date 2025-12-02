
---

# ✅ `docs/architecture.md`

```md
# AI LAB AS A SERVICE – Architecture

This document describes the **logical and technical architecture**
of the AI LAB AS A SERVICE Proof of Concept.

---

## 🧠 Architectural Principles

- SaaS-first design
- Control plane separated from workload plane
- Cost safety by default
- Emulator-first development
- Azure-native patterns
- Simple and explainable

---

## 📐 High-Level Architecture (Logical)


---

## ⚙️ Runtime Architecture (Local)

| Component | Technology | Port |
|---------|-----------|------|
| Frontend | Vite Dev Server | 5173 |
| Backend | Azure Functions v4 | 7071 |
| Data | Cosmos Emulator | 8081 |

CORS is enabled at the Functions host level using:

```bash
func start --cors http://localhost:5173
