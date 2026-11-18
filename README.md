# AgriOps AI – Integrated Full-Stack & Agentic AI Farm Management System

[![AgriOps CI/CD Pipeline](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

An intelligent, end-to-end agricultural farm management platform built to coordinate farm records, daily activities, inventory, and management decisions within a shared system[cite: 7]. AgriOps AI bridges field-worker mobile execution with administrative web governance through a secure ASP.NET Core REST API backend, PostgreSQL relational persistence, and an autonomous multi-agent AI subsystem featuring Human-in-the-Loop (HITL) approvals[cite: 7, 23, 67].

---

## System Architecture & Tech Stack

AgriOps AI is structured around a multi-tier architecture where client applications communicate **exclusively** through the centralized ASP.NET Core gateway[cite: 23, 33]:

* **Web Client:** React 18, Vite, Redux Toolkit, React Router, Tailwind CSS[cite: 24]
* **Mobile Client:** Flutter 3.x / Dart (Secure storage, mobile QR scanning, camera evidence upload)[cite: 24, 26]
* **Backend Gateway:** ASP.NET Core 10 Web API, Entity Framework Core 10, Npgsql, JWT Bearer Authentication, BCrypt[cite: 24]
* **Database:** PostgreSQL 17 relational database[cite: 24]
* **Agentic AI Subsystem:** Python, FastAPI, Uvicorn, LangGraph, LangChain, Pydantic, Google Gemini (`gemini-2.5-flash`)[cite: 24]
* **DevOps & CI/CD:** Docker, Docker Compose, GitHub Actions[cite: 24]

---

## Business Components & Team Ownership

The platform is divided into four primary business components[cite: 7]:

1. **Component 01 – Farm and Crop Management** (IT24103690): Farms, fields, crop catalogue, crop seasons, plantings, harvests, soil records, and dynamic growth stage calculations[cite: 2, 51, 93].
2. **Component 02 – Farm Task and Worker Management** (IT24103527): Task lifecycle management, worker profiles, skill-based worker matching algorithms (`WorkerSkillMatcher`), photo evidence verification, and Agent 2 (Crop Analysis / Crop Doctor)[cite: 2, 15, 54].
3. **Component 03 – Inventory Management and AI-Assisted Reordering** (IT24103140): Inventory item control, FIFO batch tracking, lot expiration dates, supplier directories, stock transactions (Use/Receive), and Agent 3 (AI Reordering workflow)[cite: 3, 16, 105].
4. **Component 04 – Reporting, Analytics, and User Management** (IT24102378): User administration, role-based access control (RBAC), automatic audit logging via EF Core interceptors, operational analytics (harvest yields, resource efficiency, worker workload), and Agent 4 / Sentinel (Validation & Safety)[cite: 3, 17, 63].

---

## Component 03: Inventory & AI-Assisted Reordering Details

* **Relational Schema:** 8 normalized tables covering `InventoryItems`, `Suppliers`, `SupplierItems` (with prices and lead times), `InventoryTransactions`, `PurchaseRequests`, `ReorderRecommendations`, `InventoryBatches`, and `InventoryBatchMovements`[cite: 41, 105].
* **FIFO Batch Tracking & QR Scanning:** Goods receipts generate tracked batches with lot numbers and expiration dates[cite: 105, 107]. Field workers can scan QR codes via the Flutter mobile app to inspect batch balances and record stock usage under strict FIFO rules[cite: 107, 111].
* **Agentic Reordering Pipeline (LangGraph + Gemini):** Evaluates 28-day usage trends, safety buffers, minimum thresholds, and open purchase quantities to compute precise replenishment needs[cite: 16, 60, 107]. The LLM selects the optimal supplier based on lead-time and price trade-offs without performing raw financial math[cite: 60, 107].
* **Human-in-the-Loop (HITL) Controls:** AI reorder proposals are saved as `Pending`[cite: 60, 108]. Manager approval atomically generates a linked `PurchaseRequest` without mutating physical inventory stock until delivery and receipt confirmation occur[cite: 16, 60, 107].

---

## Multi-Agent AI Subsystem

| Agent | Port | Responsibility | Human-in-the-Loop Gate |
| :--- | :--- | :--- | :--- |
| **Agent 1 – Farm Planner**[cite: 29] | `8001`[cite: 29] | Builds recommended farm schedules based on weather, soil, and crop stage[cite: 14, 29]. | Manager Schedule Review[cite: 69] |
| **Agent 2 – Crop Doctor**[cite: 29] | `8000`[cite: 29] | Diagnoses plant symptoms, self-grades confidence, and applies bounded query rewrites[cite: 15, 29, 31]. | `interrupt()` gate for High/Critical risk treatments[cite: 31, 69] |
| **Agent 3 – Inventory Reorder**[cite: 29] | `8003`[cite: 29] | Computes stock shortages, selects suppliers, and submits recommendation proposals[cite: 16, 29, 60]. | Manager approval creates a purchase request[cite: 16, 60] |
| **Agent 4 / Sentinel**[cite: 29] | `8004`[cite: 29] | Applies 7 deterministic safety/weather checks and generates strategic operational analytics[cite: 18, 29, 64]. | Approval required for operational interventions[cite: 18, 69] |

---

