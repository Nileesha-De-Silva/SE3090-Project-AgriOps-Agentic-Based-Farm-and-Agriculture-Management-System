# AgriOps AI – Agentic-Based Agriculture Farm Management Platform

<div align="center">

[![AgriOps CI/CD Pipeline](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml)
[![Tests Passing](https://img.shields.io/badge/Tests-147%20Passed%20(100%25)-brightgreen?style=flat&logo=checkmarx&logoColor=white)](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml)
[![.NET](https://img.shields.io/badge/.NET-10.0%20(82%20Tests)-512BD4?style=flat&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React%2018-Vitest%20(38%20Tests)-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x%20(22%20Tests)-02569B?style=flat&logo=flutter&logoColor=white)](https://flutter.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17%2B-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

> An intelligent, end-to-end farm operations and decision-support ecosystem integrating mobile field execution, administrative web governance, a centralized ASP.NET Core REST API, PostgreSQL relational persistence, and a multi-agent AI subsystem with human-in-the-loop validation.

---

## 📌 Project Overview

**AgriOps AI** (SE3090) is an intelligent farm management platform designed to automate agricultural workflows, optimize field workforce utilization, track inventory lifecycles, and deliver actionable, weather-aware operational recommendations. 

Rather than functioning as a conversational chatbot, the platform implements **deterministic, multi-step agentic AI workflows** that ingest real-time field data and third-party meteorological telemetry, execute allow-listed tool calls, pass safety checks, and enforce mandatory human approval for high-impact farm decisions.

---

## 🏛️ System Architecture

AgriOps AI links two client applications with a centralized backend and multi-agent AI system:

* **Flutter Mobile Application:** Designed for **Farmers** and **Field Workers** to register farms, record planting activities, track daily tasks, log observations, and capture field evidence.

* **React Web Dashboard:** Designed for **Farm Managers** and **Agronomists/Administrators** to supervise field layouts, assign tasks, track inventory thresholds, monitor agent executions, and approve/reject AI recommendations.

* **ASP.NET Core Web API:** Centralized REST backend managing business logic, role-based authorization, external API integrations, and PostgreSQL persistence via Entity Framework Core.

* **PostgreSQL Database:** Normalized relational database storing system entities, transactional task histories, and immutable agent audit logs.

* **Multi-Agent AI Subsystem:** An orchestration layer featuring specialized agents operating with allow-listed tools, deterministic safety validators, and execution tracking.

## 👥 Role-Based Access Control (RBAC)

| Role | Interface | Core Permissions & Capabilities |

| :--- | :--- | :--- |
| **Farmer** | Flutter Mobile | Register farms/fields, add crops, log planting, upload crop images, report problems, view weather & AI suggestions. |

| **Farm Worker** | Flutter Mobile | View daily task schedules, update task status, upload completion evidence photos, record harvest data. |

| **Farm Manager** | React Web | Oversee multiple farms, plan crop seasons, balance worker workloads, review and approve high-impact AI actions. |

| **Administrator / Agronomist** | React Web | Manage user access, configure farming rules & thresholds, monitor stock levels, audit agent decision logs. |

---

## 🧩 Four Core Application Components

### 1. Component 1: Farm & Crop Management

The structural and botanical backbone of the platform.

* **Key Entities:** `Farm`, `Field`, `Crop`, `CropSeason`, `Planting`, `Harvest`, `SoilRecord`.

* **Features:** Multi-field spatial mapping with GPS boundary coordinates, crop lifecycle tracking (Germination to Harvest),

* soil chemistry logging (pH, NPK levels), and harvest yield recording.


### 2. Component 2: Farm Task & Worker Management

Handles workforce dispatching, labor load-balancing, and verified execution pipelines.

* **Key Entities:** `Worker`, `WorkerSkill`, `FarmTask`, `TaskAssignment`, `TaskSchedule`, `TaskHistory`.

* **Features:** Multi-step operational status pipeline (`Created` → `Assigned` → `In Progress` → `Pending Verification` with

* photo evidence → `Manager Approved`), skill-based task matching, and cyclical task scheduling.


### 3. Component 3: Inventory & Agricultural Resources

Manages the internal agricultural supply chain and material usage.

* **Key Entities:** `InventoryItem`, `InventoryTransaction`, `Supplier`, `PurchaseRequest`.

* **Features:** Continuous stock level monitoring against safety thresholds, automatic material deductions upon task completion,
* and AI-assisted purchase request generation.


### 4. Component 4: AI Monitoring, Recommendations & Analytics

The administrative intelligence layer managing agent execution state and high-level reporting.

* **Key Entities:** `AIWorkflow`, `AgentExecution`, `ToolCall`, `ValidationResult`, `Approval`, `WeatherRecord`.

* **Features:** End-to-end execution state persistence, human-in-the-loop review queues, live meteorological caching, and

* analytics tracking recommendation acceptance rates and agent latency.

---

## 🤖 The Multi-Agent AI Subsystem

AgriOps AI implements 4 distinct domain agents designed with explicit input/output contracts, least-privilege tool execution, and deterministic safeguards:

* **Agent 1 – Farm Planning Agent (Master Orchestrator):** Ingests farm parameters and constructs a sequential 8-step farming plan (weather review, soil evaluation, activity sequencing, and resource checks).

* **Agent 2 – Crop Analysis Agent (Diagnostic Support):** Ingests uploaded crop images and field notes to detect environmental or nutrient stress markers (e.g., chlorosis) without making unsafe, speculative disease diagnoses.

* **Agent 3 – Weather & Resource Planning Agent (Tool Execution Engine):** Interacts securely with external weather APIs and database services using allow-listed tools (`getWeatherForecast`, `getInventory`, `calculateResourceRequirement`) to proactively adjust farming schedules (e.g., postponing irrigation before forecasted heavy rain).

* **Agent 4 – Validation & Safety Agent (Deterministic Gatekeeper):** Validates all proposed actions against hard-coded agricultural rules, resource thresholds, and chemical dosage limits. Halts and routes valid plans to the React dashboard for human approval before any database state mutation occurs.

---

## 🗄️ Database Schema & Relational Design

The system relies on a normalized PostgreSQL schema with strong relational constraints and audit logging:

```text
Users ──< Roles
  └──< Workers ──< WorkerSkills

Farms ──< Fields ──< CropSeasons ──< Plantings
                         │        ──< CropObservations
                         │        ──< Harvests
                         └──< SoilRecords

FarmTasks ──< TaskAssignments
    │     ──< TaskSchedules
    └──< TaskHistory

InventoryItems ──< InventoryTransactions
       │       ──< PurchaseRequests >── Suppliers

AIWorkflows ──< AgentExecutions ──< ToolCalls
     │      ──< ValidationResults
     └──< Approvals

WeatherRecords
AuditLogs

---

## 🧪 Automated Testing & Continuous Integration (CI/CD)

The platform is fortified with an automated testing ecosystem covering **100% of core controllers and domain services** across Component 1 and Component 2:

| Test Project | Framework | Tests | Purpose | Status |
| :--- | :--- | :---: | :--- | :---: |
| **`AgriOps.Tests`** | xUnit (.NET 10) | **65** | Unit tests for domain calculations (growth stages), controller DTO projections, worker skill matching algorithms, and task state machines. | **PASSED (100%)** |
| **`AgriOps.IntegrationTests`** | xUnit + PostgreSQL | **17** | End-to-end integration tests over in-process Kestrel HTTP against a dedicated PostgreSQL database, testing real API routing, AI approval gates, and database persistence. | **PASSED (100%)** |
| **Total Test Suite** | Full Solution | **82** | Continuous verification across all 10 controllers and services. | **82 / 82 PASSED** |

### Running Tests Locally

```powershell
# Run the entire test suite (all 82 tests):
dotnet test AgriOps.sln --logger "console;verbosity=normal"

# Run Unit Tests only:
dotnet test backend/tests/AgriOps.Tests/AgriOps.Tests.csproj

# Run Integration Tests only (requires local PostgreSQL):
dotnet test backend/tests/AgriOps.IntegrationTests/AgriOps.IntegrationTests.csproj
```

### GitHub Actions CI/CD Pipeline
- **Workflow File**: [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)
- **Continuous Integration (CI)**: Automatically spins up an ephemeral PostgreSQL 17 container on every `push` and `pull_request` to `main` and `development`, runs code formatting checks, builds the solution, and executes all 82 tests.
- **Continuous Delivery (CD)**: Packages the release binary, creates Docker container artifacts, and manages staging and production deployment steps.

