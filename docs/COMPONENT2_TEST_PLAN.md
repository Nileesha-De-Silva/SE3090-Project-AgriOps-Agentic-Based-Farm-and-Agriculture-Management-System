# Software Test Plan (STP)
## AgriOps AI — Component 2 (Farm Task & Worker Management) & Agent 2 (Crop Analysis Agent)
**Document ID:** STP-AGRIOPS-COMP2-2026  
**Version:** 2.0  
**Responsible Member:** Nileesha De Silva (Component 2 Lead & AI Agent 2 Developer)  
**Target Module:** SE3090 — Advanced Software Engineering Project  
**Date:** October 2026  
**Status:** Approved & Implemented  

---

## 1. Scope

### 1.1 In-Scope Items
This Test Plan covers the complete vertical slice of **Component 2** and **Agent 2**, including:
1. **Core Backend Layer (C# ASP.NET Core 10 Web API)**:
   - Task orchestration services, 7-state lifecycle state machine, and scheduling engines.
   - Worker management, skill matching algorithm (`WorkerSkill` cross-referencing), and active workload balancing.
   - Controllers: `TasksController`, `WorkersController`, `CropAnalysisController`, `CropAnalysisAgentGatewayController`.
   - Security: Role-Based Access Control (RBAC), JWT validation, and input sanitization.
2. **Database & Persistence Layer (PostgreSQL & EF Core)**:
   - Tables: `Workers`, `WorkerSkills`, `FarmTasks`, `TaskAssignments`, `TaskSchedules`, `TaskHistories`, `CropAnalysisAssessments`, `ApprovalItems`.
   - Foreign key integrity, transaction atomicity, and immutable audit logging.
3. **Management Interface (React 18 Web Dashboard)**:
   - 4-column drag-and-drop Task Kanban board (Pending, In Progress, Pending Verification, Completed).
   - Worker assignment modal with skill compatibility filtering.
   - Photographic evidence verification portal (split-screen inspection view).
   - Agent 2 Pending Approvals Inbox (review AI recommendations, approve/reject).
4. **Field Worker Interface (Flutter 3.27 Mobile Application)**:
   - Today's Tasks screen categorized by urgency with action triggers.
   - Camera device integration (`image_picker`) for capturing photo evidence.
   - Crop diagnostics screen with symptom input and photo submission.
   - Offline caching and connectivity state handling.
5. **Agentic AI Subsystem (Python 3.12 / LangGraph / FastAPI)**:
   - Explicit LangGraph `StateGraph`: `input_guard` $\rightarrow$ `diagnose` $\rightarrow$ `grade_assessment` $\rightarrow$ `rewrite` $\rightarrow$ `human_gate` $\rightarrow$ `create_task` $\rightarrow$ `log_rejection`.
   - ReAct tools: `lookup_crop_handbook` and `calculate_treatment_dosage`.
   - Self-correcting query rewrite loop (strictly capped at `MAX_RETRIES = 2`).
   - Human-in-the-loop gatekeeper using LangGraph `interrupt()` and `Command(resume=...)`.
   - FastAPI REST endpoints: `/analyze`, `/resume`, `/tools`, `/health`, `/threads/{id}`.
6. **Integration & Non-Functional Benchmarks**:
   - ASP.NET Core gateway routing to internal Python AI service.
   - API latency benchmarking (sub-200ms CRUD, sub-500ms worker matching SLA).
   - Adversarial prompt injection defense and WCAG 2.1 AA accessibility compliance.

### 1.2 Out-of-Scope Items
- Component 1: Farm, Field, and Crop botanical master data management.
- Component 3: Supply chain inventory decrement execution and vendor reordering.
- Component 4: High-level macro farm planning (Agent 1) and external live meteorological APIs (Agent 3).

---

## 2. Objectives

The primary quality objectives for Component 2 and Agent 2 testing are:
1. **Functional Correctness**: Verify 100% adherence to the 7-step operational task pipeline (Task Creation $\rightarrow$ Assignment $\rightarrow$ In Progress $\rightarrow$ Evidence Upload $\rightarrow$ Manager Verification $\rightarrow$ Completion).
2. **Business Rule Enforcement**: Ensure only certified workers are assigned to hazardous tasks (e.g. chemical fertilization), and prevent worker burnout through workload threshold checks.
3. **Evidence Integrity**: Ensure a worker cannot mark a task as completed without uploading verified camera photo evidence.
4. **Agentic AI Reliability & Safety**:
   - Enforce the **SE3090 Viva Defense Rule**: Agent 2 must operate strictly as an AI-Assisted Crop Health Stress Assessor, identifying stress markers (chlorosis, wilting, necrosis) without making unvalidated clinical pathology assertions.
   - Verify that High/Critical risk recommendations **cannot bypass** human manager approval.
   - Verify that self-correction loops terminate deterministically within 2 retries.
5. **Performance & Security**: Validate sub-200ms state transition latencies, complete RBAC protection against privilege escalation, and zero SQL injection or prompt tampering vulnerabilities.
6. **Zero Defect Mandate**: Achieve 100% pass rate across all automated test suites prior to final project submission.

---

## 3. Testing Areas

The test strategy encompasses 7 dedicated testing areas:

```
+---------------------------------------------------------------------------------------+
|                               TESTING AREAS & ARCHITECTURE                             |
+---------------------------------------------------------------------------------------+
|  1. Backend / API Testing       | Service logic, controllers, DTO validation, RBAC    |
|  2. Database Integration        | Entity relationships, 7-state machine, audit trails |
|  3. React Web Frontend Testing  | Kanban board, modals, evidence viewer, approvals    |
|  4. Flutter Mobile Testing      | Worker task lists, camera forms, navigation         |
|  5. Integration & E2E Testing   | Cross-tier business workflows, gateway proxies      |
|  6. Non-Functional Testing      | Performance SLA (<200ms), k6 load, security, a11y   |
|  7. Agentic AI Evaluation       | 9-dimension evaluation (pytest + Pydantic v2)       |
+---------------------------------------------------------------------------------------+
```

### Detailed Area Breakdown:
- **Area 1: Backend / API Testing**: Unit and functional testing of domain services (`TaskService`, `WorkerService`, `CropAnalysisService`, `WorkerSkillMatcher`).
- **Area 2: Database Integration Testing**: Validates PostgreSQL EF Core relational schema, foreign key cascade behaviors, and `TaskHistories` audit persistence.
- **Area 3: React Web Frontend Testing**: Component rendering, form validation, Redux Toolkit slice state transitions, and role-based protected routes.
- **Area 4: Flutter Mobile Application Testing**: Widget tree verification, BLoC state transitions, camera photo mock attachment, and offline banner display.
- **Area 5: End-to-End Workflow Testing**: Validates the complete lifecycle journey across Web, Mobile, and API gateways.
- **Area 6: Non-Functional Testing**: Benchmark latency SLAs, concurrent reassignment stress, JWT authentication guards, and WCAG 2.1 AA screen-reader attributes.
- **Area 7: Agentic AI Testing & Evaluation**: 9 mandatory evaluation dimensions:
  1. Task-Completion Testing
  2. Agent Selection Testing
  3. Tool-Selection Testing
  4. Structured-Output Validation
  5. Business Rule Compliance Testing
  6. Prompt Injection Testing
  7. Approval-Enforcement Testing
  8. Failure-Recovery Testing
  9. Safe Failure Testing

---

## 4. Tools and Frameworks

| Subsystem / Tier | Tool / Framework | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Backend Testing** | **xUnit** | 2.9.x | Industry standard .NET testing framework for unit and service tests. |
| **Integration Testing** | **Microsoft.AspNetCore.Mvc.Testing** | 10.0.x | In-memory web application factory for HTTP endpoint integration testing. |
| **Assertions** | **FluentAssertions** | 6.x | Expressive, readable assertions for complex domain state. |
| **Database Testing** | **EF Core In-Memory / PostgreSQL** | 10.0.x | Relational constraint, transaction, and repository testing. |
| **Frontend Web Testing** | **Vitest** | 4.x | Fast, modern test runner with native ESM and Vite configuration support. |
| **Web UI Testing** | **React Testing Library (@testing-library/react)** | 14.x | Tests React components from the end-user perspective. |
| **Mobile Testing** | **flutter_test** | 3.27.x | Official Flutter SDK testing suite for unit, widget, and form validation. |
| **Mobile Mocking** | **mocktail** | 1.x | Null-safe mocking library for camera hardware and HTTP services in Flutter. |
| **Agentic AI Evaluation** | **pytest** | 9.x | Standard Python testing framework for LangGraph state trajectories. |
| **Schema Validation** | **Pydantic v2** | 2.10.x | Deterministic type-checking and JSON schema enforcement for AI contracts. |
| **Performance Testing** | **k6** | 0.49.x | Load and stress benchmarking against task orchestration APIs. |
| **Security Testing** | **PowerShell Security Suite / OWASP ZAP** | Custom / 2.14 | Automated security checks for RBAC bypass, SQLi, and prompt injection. |
| **Accessibility Testing** | **axe-core / Vitest A11y** | 4.x | WCAG 2.1 AA compliance audit for UI modals and forms. |

---

## 5. Test Environment

### 5.1 Hardware & Operating System Specifications
- **Operating System:** Windows 11 Enterprise (64-bit) / Windows Subsystem for Linux (WSL2)
- **Processor:** Intel Core i7 / AMD Ryzen 7 (16 vCPUs)
- **Memory (RAM):** 16 GB minimum (32 GB recommended)
- **Storage:** 512 GB SSD (with minimum 20 GB free workspace)

### 5.2 Software Runtimes & Dependencies
- **.NET Runtime:** .NET 10.0 SDK (`dotnet --version`: `10.0.x`)
- **Node.js Environment:** Node.js v20.x LTS, npm v10.x
- **Flutter Framework:** Flutter 3.27.x, Dart 3.6.x
- **Python Environment:** Python 3.12.8 64-bit (isolated virtual environment at `.venv\`)
- **Database Engine:** PostgreSQL 16.x (Docker container / local service on port 5432)
- **AI Gateway / Service Port:** Internal FastAPI service bound to `http://localhost:8000/`
- **Backend API Port:** C# ASP.NET Core API bound to `http://localhost:5000/` or `https://localhost:7001/`
- **Frontend Dashboard Port:** Vite development server bound to `http://localhost:5173/`

### 5.3 Test Data Management
- Dedicated test database schemas with automated rollback/cleanup between runs.
- Seeded test datasets: 5 sample workers with diverse skill profiles (`ChemicalHandling`, `MachineryOperation`, `PestDiagnostic`, `Irrigation`), 3 tomato field plots, and standard agronomic handbook excerpts.

---

## 6. Roles & Responsibilities

| Role | Name | Key Responsibilities |
| :--- | :--- | :--- |
| **Component 2 Lead & AI Agent 2 Developer** | **Nileesha De Silva** | - Authoring and maintaining this Master Test Plan.<br>- Designing and coding backend xUnit tests (`AgriOps.Tests`, `AgriOps.IntegrationTests`).<br>- Designing and coding React Web Vitest suites.<br>- Designing and coding Flutter Mobile widget and form validation tests.<br>- Designing and implementing the 9-dimensional Agentic AI evaluation suite in Python.<br>- Performing defect triage, code refactoring, and retesting.<br>- Preparing test evidence, logs, and defense slides for viva evaluation. |
| **Backend Integration Reviewer** | Team Member (Peer) | - Code review of ASP.NET Core gateway controllers and security guards.<br>- Verification of cross-component database migrations. |
| **Peer Tester (Cross-Component)** | Component 1 & 3 Leads | - Verifying integration hooks (Component 1 Field linking & Component 3 Inventory triggers). |

---

## 7. Test Schedule & Milestones

The testing lifecycle for Component 2 and Agent 2 is structured into 6 sequential phases:

```
+-----------------------------------------------------------------------------------------+
|                               TEST EXECUTION SCHEDULE & PHASES                          |
+---------+-----------------------------------+--------------------+----------------------+
| Phase   | Phase Description                 | Target Timeline    | Key Deliverable      |
+---------+-----------------------------------+--------------------+----------------------+
| Phase 1 | Backend Unit & Domain Testing     | Week 1 (Days 1–3)  | 72 xUnit tests pass  |
| Phase 2 | Database & API Integration        | Week 1 (Days 4–5)  | 47 Integration tests |
| Phase 3 | Frontend Web & Mobile Testing     | Week 2 (Days 1–3)  | 85 Web + 70 Mobile   |
| Phase 4 | Agentic AI Testing & Evaluation   | Week 2 (Days 4–5)  | 27 AI tests pass     |
| Phase 5 | Non-Functional & Security Audit   | Week 3 (Days 1–2)  | k6 + Sec scan logs   |
| Phase 6 | End-to-End Verification & Signoff | Week 3 (Days 3–4)  | Final STP Report     |
+---------+-----------------------------------+--------------------+----------------------+
```

### Milestone Details:
1. **Milestone 1: Backend Domain Stability (Phase 1)**
   - All worker skill matching, task creation, and state transition unit tests verified.
   - *Exit Criteria:* 100% pass rate in `AgriOps.Tests.dll`.
2. **Milestone 2: Database & Gateway Integration (Phase 2)**
   - EF Core transactional integrity, cascade constraints, and gateway proxying verified.
   - *Exit Criteria:* 100% pass rate in `AgriOps.IntegrationTests.dll`.
3. **Milestone 3: UI & Mobile Validation (Phase 3)**
   - React Kanban board, evidence verification modal, and Flutter mobile camera forms verified.
   - *Exit Criteria:* 85 Vitest tests and 70 Flutter tests pass without warning.
4. **Milestone 4: Agentic AI 9-Dimension Evaluation (Phase 4)**
   - Task completion, agent selection, tool schema, business rules, prompt injection, and HITL gatekeeper verified.
   - *Exit Criteria:* `python ai-subsystem/evaluate_agent.py` outputs 100% success across all 9 dimensions.
5. **Milestone 5: Non-Functional Benchmarking (Phase 5)**
   - Sub-200ms latency verified via k6; RBAC security checks verified; WCAG 2.1 AA verified.
   - *Exit Criteria:* 0 security vulnerabilities, SLA met.
6. **Milestone 6: Final Sign-off & Viva Readiness (Phase 6)**
   - Final test report compiled, defect log verified, and viva demonstration rehearsed.

---

## 8. Defect Management & Exit Criteria

### 8.1 Severity Classification
- **Critical (Sev 1)**: Application crash, database deadlock, or AI supervisor gatekeeper bypass.
- **High (Sev 2)**: Core business rule failure (e.g. uncertified worker assigned without warning), or broken task state transition.
- **Medium (Sev 3)**: Performance SLA breach (e.g. cold-start JIT latency spike), or UI rendering glitches.
- **Low (Sev 4)**: Deprecation warnings, minor styling discrepancies, or non-blocking logging issues.

### 8.2 Project Sign-off & Exit Criteria
Component 2 and Agent 2 achieve formal test sign-off when:
1. **0 Critical and 0 High Severity defects** remain open.
2. **100% automated test execution pass rate** across all 313 test cases (.NET, React, Flutter, Python).
3. **All 9 Agentic AI evaluation dimensions** pass successfully.
4. **Code coverage exceeds 85%** across core operational and diagnostic services.
5. **Master Test Plan and Test Report** are documented and peer-reviewed.
