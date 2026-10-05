# Component 1 — Farm & Crop Management

> Owner: THT
> Part of **AgriOps AI** (SE3090) — the structural and botanical backbone of the platform, tracking farms, fields, crops, and the full crop lifecycle from planting through harvest.

---

## 📌 What This Component Does

Component 1 maps the physical layout of a farm (farms → fields) and tracks the full lifecycle of what's grown on it (crop catalog → seasonal plantings → harvests), plus soil testing history per field. Every other component depends on this data:

- **Component 2** (Tasks) ties farm tasks to a valid `Field` and `CropSeason`.
- **Component 3** (Inventory) links resource consumption back to field/crop activity.
- **Component 4** (AI Agents) queries `Field`, `Crop`, and `SoilRecord` data as context before generating recommendations.

---

## 🗄️ Entities

| Entity | Purpose |
|---|---|
| `Farm` | The overarching agricultural property |
| `Field` | A subdivision of a farm where cultivation happens |
| `Crop` | Master catalog of plant types/varieties (reused across seasons) |
| `CropSeason` | A specific crop cycle in a specific field — the pivot connecting `Field` and `Crop` |
| `Planting` | A planting batch within a crop season |
| `Harvest` | A harvest record within a crop season |
| `SoilRecord` | A soil test log for a field (pH, N/P/K levels) |

**Relationships:** `Farm` 1—* `Field` 1—* `CropSeason` *—1 `Crop`, `CropSeason` 1—* `Planting`/`Harvest`, `Field` 1—* `SoilRecord`.

---

## 🧮 Business Logic Beyond CRUD

**Dynamic growth stage calculation** — a `CropSeason`'s current growth stage (`Germination → Vegetative → Flowering → Fruiting → Harvesting → PastHarvest`) is computed on every request from `PlantingDate` and the crop's `OptimalGrowthDurationDays`, rather than stored and manually updated. See `Services/GrowthStageCalculator.cs`.

---

## 🔌 API Reference

All endpoints under `/api/`. Full CRUD unless noted.

| Resource | Base route | Notes |
|---|---|---|
| Farm | `GET/POST/PUT/DELETE /api/farm` | |
| Field | `GET/POST/PUT/DELETE /api/field` | `GET` supports `?farmId=` filter |
| Crop | `GET/POST/PUT/DELETE /api/crop` | Delete is blocked (409) if referenced by a `CropSeason` |
| CropSeason | `GET/POST/PUT/DELETE /api/cropseason` | `GET` supports `?fieldId=` and `?status=` filters; response includes `currentGrowthStage` |
| Planting | `GET/POST/DELETE /api/cropseason/{cropSeasonId}/planting` | Nested under `CropSeason` |
| Harvest | `GET/POST/PUT/DELETE /api/cropseason/{cropSeasonId}/harvest` | Nested under `CropSeason` |
| SoilRecord | `GET/POST /api/field/{fieldId}/soilrecord` | Nested under `Field`, sorted newest-first |

All request/response bodies use DTOs (`DTOs/`), not raw entities — no navigation properties are ever exposed over the API. Enums (`CropSeasonStatus`, `GrowthStage`) serialize as strings.

---

## 🛠️ Tech Stack

- **API:** ASP.NET Core (.NET 8), C#
- **ORM:** Entity Framework Core 8 + Npgsql
- **Database:** PostgreSQL (hosted on Supabase)

---

## 📁 Where the Code Lives

```
backend/AgriOpsAI.Api/
├── Models/          # Farm, Field, Crop, CropSeason, Planting, Harvest, SoilRecord, GrowthStage
├── DTOs/            # Create/Update/response DTOs per entity
├── Data/            # AgriOpsDbContext
├── Services/        # GrowthStageCalculator
├── Controllers/      # One controller per entity
└── Migrations/       # EF Core migrations
```

---

## 🧪 Local Setup

1. `cd backend/AgriOpsAI.Api`
2. `dotnet restore`
3. Add your own PostgreSQL connection string to `appsettings.Development.json` (not committed — see `appsettings.Development.json.example`)
4. `dotnet ef database update`
5. `dotnet run`, then open `/swagger` to test endpoints

---

## ✅ Status

- [x] ERD finalized
- [x] Entity models + DbContext
- [x] Migrations applied to Supabase
- [x] Full CRUD via DTOs, all 7 entities
- [x] Input validation
- [x] Growth stage calculation
- [ ] React Farm Manager screens
- [ ] Flutter Farmer screens