# AgriOps Component 2 - Integration & End-to-End (E2E) Test Suite

## Overview
This directory contains the End-to-End (E2E) and Cross-Platform Integration test assets for **Component 2: Task Management, Workforce Dispatch, and Crop Analysis Gatekeeper** (Developed by **Nileesha De Silva**).

The test suite validates four critical architectural dimensions:
1. **API Integration Testing**: Verifies REST API contracts, JSON request/response DTO schemas, query parameters, HTTP status codes (`200 OK`, `201 Created`, `204 NoContent`, `400 BadRequest`, `404 NotFound`).
2. **Cross-Component Integration Testing**: Validates interactions across:
   - **Component 1 (Agronomic Data / Fields)**: Farm & Field topology creation and linkage.
   - **Component 2 (Workforce & Task Operations)**: AI crop diagnostic evaluation, human-in-the-loop gatekeeper approvals, automated task provisioning, skill-based worker matching, and dispatch.
   - **Component 4 (Audit & Governance)**: Immutable `TaskHistory` log generation across every lifecycle transition.
3. **Complete Business-Workflow Testing**: Tests the full lifecycle:
   $$\text{Field Scouting} \longrightarrow \text{AI Diagnostic} \longrightarrow \text{Pending Gatekeeper Approval} \longrightarrow \text{Manager Sign-Off} \longrightarrow \text{Remediation Task Created} \longrightarrow \text{Worker Dispatched} \longrightarrow \text{Execution In-Progress} \longrightarrow \text{Evidence Upload} \longrightarrow \text{Rework Rejection} \longrightarrow \text{Evidence Resubmission} \longrightarrow \text{Manager Verification} \longrightarrow \text{Completed Task} \longrightarrow \text{Immutable Audit History}$$
4. **Cross-Platform Workflow Testing**:
   - **Mobile Client Simulation (`AgriOps-Mobile/1.0.0 (Android; Flutter)`)**: Field worker scouting observations, task acceptance, status progression, and photographic evidence uploads.
   - **Web Dashboard Simulation (`AgriOps-Web/1.0.0 (React/Vite)`)**: Farm manager pending queue inspection, gatekeeper one-click approval, worker dispatch recommendations, and evidence review/rejection/verification.

---

## Test Execution Approaches

### Approach 1: Automated In-Process E2E Suite (Zero-Config / Recommended)
Integrated into the .NET solution test runner. Executes against the real PostgreSQL database without requiring a separately hosted backend process or external ports:
```powershell
dotnet test backend/tests/AgriOps.IntegrationTests/AgriOps.IntegrationTests.csproj --filter "FullyQualifiedName~Component2EndToEndWorkflowTests"
```

### Approach 2: Postman / Newman CLI (Live Server E2E Runner)
Ideal for CI/CD pipelines, QA team handoff, and visual API verification.

1. **Start the Backend API**:
   ```powershell
   dotnet run --project backend/src/AgriOps.Api/AgriOps.Api.csproj
   ```
2. **Execute Newman Runner**:
   ```powershell
   # Using PowerShell runner script
   ./tests/e2e/run-e2e.ps1

   # Or directly via npx / newman
   npx --yes newman run tests/e2e/AgriOps_Component2_E2E.postman_collection.json -e tests/e2e/AgriOps_Component2.postman_environment.json
   ```

---

## E2E Workflow Steps Breakdown

| Phase | Step | Endpoint | Method | Actor / Platform | Description |
|---|---|---|---|---|---|
| **Phase 1** | 01 | `/api/farm` | `POST` | Web Manager (React) | Create Farm entity in Component 1 |
| | 02 | `/api/field` | `POST` | Web Manager (React) | Create Field boundary linked to Farm |
| **Phase 2** | 03 | `/api/workers` | `POST` | Web Manager (React) | Onboard field worker with contact details |
| | 04 | `/api/workers/{id}/skills` | `POST` | Web Manager (React) | Certify worker with `PestDiagnostic` skill |
| **Phase 3** | 05 | `/api/cropanalysis` | `POST` | Field Scout (Flutter) | Submit crop leaf observation with photo |
| | 06 | `/api/cropanalysis/pending` | `GET` | Farm Manager (React) | View gatekeeper approval inbox |
| | 07 | `/api/cropanalysis/{id}/approve` | `POST` | Farm Manager (React) | Approve AI diagnosis; auto-creates Task |
| **Phase 4** | 08 | `/api/workers/matched?taskType=PestInspection` | `GET` | Dispatch Engine (React) | Match qualified workers by skill & workload |
| | 09 | `/api/tasks/{id}/assign` | `POST` | Farm Manager (React) | Dispatch worker to remediation task |
| **Phase 5** | 10 | `/api/tasks/{id}/status` | `PATCH` | Field Worker (Flutter) | Transition task status to `InProgress` |
| | 11 | `/api/tasks/{id}/evidence` | `POST` | Field Worker (Flutter) | Submit initial photo evidence |
| | 12 | `/api/tasks/{id}/verify` | `POST` | Farm Manager (React) | Reject evidence with rework comments |
| | 13 | `/api/tasks/{id}/evidence` | `POST` | Field Worker (Flutter) | Resubmit rectified photo evidence |
| | 14 | `/api/tasks/{id}/verify` | `POST` | Farm Manager (React) | Approve evidence -> Task `Completed` |
| **Phase 6** | 15 | `/api/tasks/{id}/history` | `GET` | Farm Auditor (React) | Verify full immutable audit trail |
