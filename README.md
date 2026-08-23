# AgriOps Agent - Component 2

AgriOps is an agriculture operations platform focused on crop analysis, task coordination, and field workforce management. This workspace brings together an AI-powered crop analysis subsystem, a backend API, a web frontend, a mobile app, and supporting documentation.

## Project Overview

The project is organized into a few key areas:

- `ai-subsystem/` — AI and analysis logic for crop diagnostics and symptom interpretation
- `backend/` — .NET ASP.NET Core application exposing APIs for crop analysis, tasks, and worker operations
- `frontend-web/` — web frontend for viewing and managing crop analysis and tasks
- `mobile-app/` — mobile application codebase for field workers and operators
- `Documentations/` — project documentation and design notes
- `snippts/` — supporting code snippets or examples

## Repository Structure

```text
AgriOps Agent-Component2/
├── ai-subsystem/
│   ├── agents/
│   ├── tests/
│   └── ...
├── backend/
│   ├── AgriOps.sln
│   └── src/
│       ├── AgriOps.Api/
│       ├── AgriOps.Core/
│       └── AgriOps.Infrastructure/
├── Documentations/
├── frontend-web/
│   └── src/
├── mobile-app/
│   └── lib/
├── snippts/
└── README.md
```

## Components

### AI Subsystem

The AI subsystem is intended to support crop analysis workflows through intelligent agents and tools. The current structure includes:

- `ai-subsystem/agents/` for agent logic
- `ai-subsystem/tests/` for validation and regression tests
- prompt and schema definitions for crop analysis contracts

This area is designed to process crop symptoms, map them to likely issues, and provide analysis outputs used by the application.

### Backend

The backend is a .NET solution under `backend/` and uses ASP.NET Core. It includes:

- `AgriOps.Api` — API application and controller layer
- `AgriOps.Core` — domain entities, interfaces, and core business logic
- `AgriOps.Infrastructure` — persistence and service implementations

The API is set up to expose endpoints for:

- crop analysis
- task management
- worker operations

### Frontend Web

The frontend web app under `frontend-web/` contains components, services, and Redux-like slices for:

- crop analysis approvals and inboxes
- task management and kanban board UI
- evidence verification modal
- assignment flows

### Mobile App

The mobile app under `mobile-app/` is organized as a Flutter/Dart-style feature structure with:

- `lib/src/bloc/` for state management patterns
- `lib/src/services/` for API/service layer access
- `lib/src/views/` for screens and UI views

## Tech Stack

This workspace currently includes a mix of technologies:

- .NET 8 / ASP.NET Core for the backend API
- Python for AI subsystem logic and agent workflows
- JavaScript / React-style web frontend
- Dart / Flutter-style mobile app
- SQL-backed infrastructure patterns through the .NET project structure

## Prerequisites

Before running the project, ensure the following tools are installed:

- .NET SDK
- Python 3.10+
- Node.js and npm (for frontend tooling)
- Flutter SDK (if working on the mobile app)

## Getting Started

### 1. Backend

From the repository root:

```bash
cd backend

dotnet restore

dotnet build AgriOps.sln

dotnet run --project src/AgriOps.Api/AgriOps.Api.csproj
```

The API runs with Swagger enabled in development mode for local testing.

### 2. AI Subsystem

From the repository root:

```bash
cd ai-subsystem

python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or .venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

If a dedicated requirements file is not present yet, install the packages needed for the crop analysis workflow as the project evolves.

### 3. Frontend Web

From the repository root:

```bash
cd frontend-web

npm install
npm start
```

### 4. Mobile App

From the repository root:

```bash
cd mobile-app

flutter pub get
flutter run
```

## Development Notes

- The backend and frontend are intended to work together through the API layer.
- The AI subsystem likely acts as a decision-support component for crop analysis workflows.
- The project is still structured as a multi-component workspace, so the exact integration points may evolve as features are finalized.

## Suggested Next Steps

1. Confirm the API contracts for crop analysis and task operations.
2. Add a shared data model or contract layer between backend and frontend.
3. Integrate the AI subsystem into the backend service flow.
4. Complete the mobile app wiring to the same API endpoints.
5. Add environment configuration and deployment guidance.

## License

This project does not yet declare a license in the repository. Add one if you plan to distribute or publish the codebase.
