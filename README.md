# AgriOps AI – Integrated Full-Stack & Agentic AI Farm Management System

[![AgriOps CI/CD Pipeline](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

An intelligent, end-to-end agricultural farm management platform built to coordinate farm records, daily activities, inventory, and management decisions within a shared system[cite: 7]. AgriOps AI bridges field-worker mobile execution with administrative web governance through a secure ASP.NET Core REST API backend, PostgreSQL relational persistence, and an autonomous multi-agent AI subsystem featuring Human-in-the-Loop (HITL) approvals.

---

# AgriOps AI – Integrated Full-Stack & Agentic AI Farm Management System

An intelligent, end-to-end agricultural farm management platform built to coordinate farm records, daily activities, inventory, and management decisions within a shared system. AgriOps AI bridges field-worker mobile execution with administrative web governance through a secure ASP.NET Core REST API backend, PostgreSQL relational persistence, and an autonomous multi-agent AI subsystem featuring Human-in-the-Loop (HITL) approvals.

---

## System Architecture & Tech Stack

AgriOps AI is structured around a multi-tier architecture where client applications communicate **exclusively** through the centralized ASP.NET Core gateway:

* **Web Client:** React 18, Vite, Redux Toolkit, React Router, Tailwind CSS
* **Mobile Client:** Flutter 3.x / Dart (Secure storage, mobile QR scanning, camera evidence upload)
* **Backend Gateway:** ASP.NET Core 10 Web API, Entity Framework Core 10, Npgsql, JWT Bearer Authentication, BCrypt
* **Database:** PostgreSQL 17 relational database
* **Agentic AI Subsystem:** Python, FastAPI, Uvicorn, LangGraph, LangChain, Pydantic, Google Gemini (`gemini-2.5-flash`)
* **DevOps & CI/CD:** Docker, Docker Compose, GitHub Actions

---

## Business Components & Team Ownership

The platform is divided into four primary business components:

1. **Component 01 – Farm and Crop Management** (IT24103690): Farms, fields, crop catalogue, crop seasons, plantings, harvests, soil records, and dynamic growth stage calculations.
2. **Component 02 – Farm Task and Worker Management** (IT24103527): Task lifecycle management, worker profiles, skill-based worker matching algorithms (`WorkerSkillMatcher`), photo evidence verification, and Agent 2 (Crop Analysis / Crop Doctor).
3. **Component 03 – Inventory Management and AI-Assisted Reordering** (IT24103140): Inventory item control, FIFO batch tracking, lot expiration dates, supplier directories, stock transactions (Use/Receive), and Agent 3 (AI Reordering workflow).
4. **Component 04 – Reporting, Analytics, and User Management** (IT24102378): User administration, role-based access control (RBAC), automatic audit logging via EF Core interceptors, operational analytics (harvest yields, resource efficiency, worker workload), and Agent 4 / Sentinel (Validation & Safety).

---

## Component 03: Inventory & AI-Assisted Reordering Details

* **Relational Schema:** 8 normalized tables covering `InventoryItems`, `Suppliers`, `SupplierItems` (with prices and lead times), `InventoryTransactions`, `PurchaseRequests`, `ReorderRecommendations`, `InventoryBatches`, and `InventoryBatchMovements`.
* **FIFO Batch Tracking & QR Scanning:** Goods receipts generate tracked batches with lot numbers and expiration dates. Field workers can scan QR codes via the Flutter mobile app to inspect batch balances and record stock usage under strict FIFO rules.
* **Agentic Reordering Pipeline (LangGraph + Gemini):** Evaluates 28-day usage trends, safety buffers, minimum thresholds, and open purchase quantities to compute precise replenishment needs. The LLM selects the optimal supplier based on lead-time and price trade-offs without performing raw financial math.
* **Human-in-the-Loop (HITL) Controls:** AI reorder proposals are saved as `Pending`. Manager approval atomically generates a linked `PurchaseRequest` without mutating physical inventory stock until delivery and receipt confirmation occur.

---

## Multi-Agent AI Subsystem

| Agent | Port | Responsibility | Human-in-the-Loop Gate |
| --- | --- | --- | --- |
| **Agent 1 – Farm Planner** | `8001` | Builds recommended farm schedules based on weather, soil, and crop stage. | Manager Schedule Review |
| **Agent 2 – Crop Doctor** | `8000` | Diagnoses plant symptoms, self-grades confidence, and applies bounded query rewrites. | `interrupt()` gate for High/Critical risk treatments |
| **Agent 3 – Inventory Reorder** | `8003` | Computes stock shortages, selects suppliers, and submits recommendation proposals. | Manager approval creates a purchase request |
| **Agent 4 / Sentinel** | `8004` | Applies 7 deterministic safety/weather checks and generates strategic operational analytics. | Approval required for operational interventions |
