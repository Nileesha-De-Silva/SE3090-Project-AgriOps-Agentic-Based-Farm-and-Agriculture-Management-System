# AgriOps Component 2 - Non-Functional Testing Specification & Results

## 1. Executive Summary
This document outlines the comprehensive **Non-Functional Testing (NFT)** suite implemented for **Component 2: Task Management, Workforce Dispatch, and Crop Analysis Gatekeeper** (Authored by **Nileesha De Silva**).

Following the software engineering project evaluation requirements:
- **Performance Testing & Security Testing** are **strictly required**.
- **Accessibility / Usability Testing** and **Reliability / Recovery Testing** have been selected and justified as domain-critical for an agentic farm management system.

---

## 2. Tooling Matrix & Justification

| Non-Functional Category | Requirement Status | Selected Tools / Frameworks | Justification in AgriOps Domain |
|---|---|---|---|
| **1. Performance & Load/Stress Testing** | **Required** | **k6** + xUnit In-Process Benchmarks | High-throughput operations during morning dispatch and harvesting seasons. Simulates concurrent field worker scouting uploads and supervisor verification queries with strict SLAs. |
| **2. Security Testing** | **Required** | **OWASP ZAP** + xUnit Security Suite + PowerShell Fuzzer | Prevention of OWASP API Top 10 vulnerabilities: SQL Injection via filters, Stored XSS in field notes, Broken Object Level Authorization (IDOR) on task approvals, and stack trace leaks. |
| **3. Accessibility & Usability (a11y)** | **Selected & Justified** | **axe-core** + **Lighthouse** + Vitest | Field scouts operate mobile devices under intense outdoor solar glare and wear protective gloves (requiring $\ge 48\times 48$px touch targets and high-contrast color chips with text labels). WCAG 2.1 AA compliance. |
| **4. Reliability & Recovery** | **Selected & Justified** | Fault-Injection + xUnit PostgreSQL Concurrency | Rural farms experience frequent cellular dropouts. If the external AI Subsystem or LLM microservice is offline, Component 2 must gracefully degrade to rule-based fallback and recover upon reconnection. |

---

## 3. Test Suites & Execution Details

### A. Performance & Load/Stress Testing (k6 & xUnit)
- **k6 Load Test Script**: [`tests/non-functional/performance/k6-load-test.js`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/tests/non-functional/performance/k6-load-test.js)
  - Simulates 60 concurrent virtual users across warm-up, nominal morning load, and peak afternoon harvest.
  - **SLA Thresholds**:
    - Request Duration: $p(95) < 300\text{ ms}$, $p(99) < 600\text{ ms}$.
    - HTTP Error Rate: $< 1.0\%$.
    - Gatekeeper Pending Queue Query: $p(95) < 150\text{ ms}$.
    - Workforce Dispatch Recommendation: $p(95) < 150\text{ ms}$.
- **k6 Stress & Spike Test**: [`tests/non-functional/performance/k6-stress-test.js`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/tests/non-functional/performance/k6-stress-test.js)
  - Pushes traffic up to 250 concurrent virtual users to verify graceful degradation without service crashes.
- **Automated In-Process C# Performance Suite**: [`backend/tests/AgriOps.IntegrationTests/NonFunctional/Component2PerformanceTests.cs`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/backend/tests/AgriOps.IntegrationTests/NonFunctional/Component2PerformanceTests.cs)
  - `Performance_ConcurrentTaskCreations_MaintainsSub250msLatency`: 20 concurrent asynchronous task creations; zero error rate.
  - `Performance_HighVolumeTaskListing_ExecutesWithinSLA`: Queries 50+ filtered tasks in $< 500\text{ ms}$.
  - `Performance_WorkforceMatchingEngine_Sub200msExecution`: Calculates skill-weighted rankings in $< 200\text{ ms}$.

### B. Security Testing (OWASP ZAP & Automated Test Harness)
- **OWASP ZAP Configuration**: [`tests/non-functional/security/zap-baseline-scan.conf`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/tests/non-functional/security/zap-baseline-scan.conf)
- **Automated Security Fuzzer**: [`tests/non-functional/security/security-test-suite.ps1`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/tests/non-functional/security/security-test-suite.ps1)
- **Automated In-Process C# Security Suite**: [`backend/tests/AgriOps.IntegrationTests/NonFunctional/Component2SecurityTests.cs`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/backend/tests/AgriOps.IntegrationTests/NonFunctional/Component2SecurityTests.cs)
  - **SQL Injection (SQLi)**: Fuzzes endpoints with `' OR 1=1; --` and `'; DROP TABLE "Tasks"; --`. Validates that EF Core parameterized queries prevent SQL syntax execution and table dropping.
  - **Cross-Site Scripting (XSS)**: Injects `<script>alert('XSS-C2')</script>` and `<img src=x onerror=alert(1)>` in task notes and scout observations. Confirms data is safely stored and retrieved as escaped literal text.
  - **Broken Object Level Authorization (IDOR)**: Probes arbitrary GUIDs (`deadbeef-dead-beef-dead-beefdeadbeef`) on `/api/tasks/{id}` and `/api/tasks/{id}/verify`. Ensures clean `404 NotFound` responses without leaking internal PostgreSQL connection strings or call stacks.

### C. Accessibility & Usability Testing (axe-core & Lighthouse)
- **Lighthouse CI Config**: [`tests/non-functional/accessibility/lighthouse-config.json`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/tests/non-functional/accessibility/lighthouse-config.json)
  - Target Score: $\ge 95\%$ on Accessibility, $\ge 90\%$ on Best Practices.
- **Vitest Accessibility Test Suite**: [`frontend-web/src/__tests__/accessibility/component2A11y.test.jsx`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/frontend-web/src/__tests__/accessibility/component2A11y.test.jsx)
  - **Color-Blind Usability**: Verifies `TaskCard` renders clear text badges alongside color chips for priority and status.
  - **Touch & Focus Usability**: Verifies form fields in `CreateTaskModal` possess explicit labels and required attributes.
  - **Unambiguous Action Buttons**: Verifies `EvidenceVerificationModal` features distinct accessible names ("Verify & Mark Completed" vs "Reject / Request Rework").
  - **Screen Reader Announcements**: Verifies `ErrorBanner` uses `role="alert"` and accessible dismiss buttons (`aria-label="Dismiss error"`).

### D. Reliability & Recovery Testing (Fault-Tolerance)
- **Automated In-Process C# Reliability Suite**: [`backend/tests/AgriOps.IntegrationTests/NonFunctional/Component2ReliabilityRecoveryTests.cs`](file:///c:/Users/User/Desktop/AgriOps%20Agent-Component2/backend/tests/AgriOps.IntegrationTests/NonFunctional/Component2ReliabilityRecoveryTests.cs)
  - **AI Gateway Outage Fallback**: Simulates failure of the external AI model server. Component 2 places observations in `PendingApproval` with rule-based fallback recommendations, preserving the human-in-the-loop decision path.
  - **Simultaneous Task Assignment Recovery**: Simulates concurrent reassignments by two farm managers. Resolves without database deadlocks; accurately maintains one `Active` and one `Reassigned` assignment.
  - **Persistent Audit Recovery**: Simulates unexpected server termination and restarts; confirms 100% of `TaskHistory` audit logs are preserved in persistent PostgreSQL storage.

---

## 4. How to Run Non-Functional Tests

### Run All Backend Non-Functional Tests (xUnit + PostgreSQL)
```powershell
dotnet test backend/tests/AgriOps.IntegrationTests/AgriOps.IntegrationTests.csproj --filter "FullyQualifiedName~NonFunctional"
```

### Run Web Accessibility & Usability Tests (Vitest)
```powershell
npm run test --prefix frontend-web src/__tests__/accessibility/component2A11y.test.jsx
```

### Run Automated Security Test Suite (PowerShell)
```powershell
./tests/non-functional/security/security-test-suite.ps1 -BaseUrl "http://localhost:5000"
```

### Run k6 Performance Benchmarks (k6 CLI)
```powershell
./tests/non-functional/performance/run-performance.ps1 -BaseUrl "http://localhost:5000" -Mode "load"
```
