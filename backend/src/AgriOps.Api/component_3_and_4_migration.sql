-- ==============================================================================
-- AgriOps AI - Database Migration for Components 3 & 4
-- ==============================================================================
-- Run this script in pgAdmin against your 'agriops_db' database.
-- It safely adds the 10 missing tables for Component 3 (Inventory) and
-- Component 4 (User Management, Roles & Audit Logs) alongside your existing
-- 15 tables for Components 1 & 2 without affecting existing data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Component 3: Inventory & Supply Chain Management
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "InventoryItems" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Category" character varying(50) NOT NULL,
    "UnitOfMeasurement" character varying(30) NOT NULL,
    "CurrentStock" numeric(10,2) NOT NULL,
    "MinimumStockLevel" numeric(10,2) NOT NULL,
    "UnitCost" numeric(10,2) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_InventoryItems" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Suppliers" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "ContactPerson" character varying(100),
    "Phone" character varying(20),
    "Email" character varying(150),
    "Address" character varying(250),
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Suppliers" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "SupplierItems" (
    "Id" uuid NOT NULL,
    "SupplierId" uuid NOT NULL,
    "InventoryItemId" uuid NOT NULL,
    "UnitPrice" numeric(10,2) NOT NULL,
    "LeadTimeDays" integer NOT NULL,
    "IsAvailable" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_SupplierItems" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SupplierItems_InventoryItems_InventoryItemId" FOREIGN KEY ("InventoryItemId") REFERENCES "InventoryItems" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_SupplierItems_Suppliers_SupplierId" FOREIGN KEY ("SupplierId") REFERENCES "Suppliers" ("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "InventoryTransactions" (
    "Id" uuid NOT NULL,
    "InventoryItemId" uuid NOT NULL,
    "TransactionType" character varying(50) NOT NULL,
    "Quantity" numeric(10,2) NOT NULL,
    "TransactionDate" timestamp with time zone NOT NULL,
    "Notes" character varying(500),
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_InventoryTransactions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_InventoryTransactions_InventoryItems_InventoryItemId" FOREIGN KEY ("InventoryItemId") REFERENCES "InventoryItems" ("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "PurchaseRequests" (
    "Id" uuid NOT NULL,
    "InventoryItemId" uuid NOT NULL,
    "SupplierId" uuid NOT NULL,
    "RequestedQuantity" numeric(10,2) NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "Status" character varying(50) NOT NULL,
    "RequestedAt" timestamp with time zone NOT NULL,
    "ApprovedAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_PurchaseRequests" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PurchaseRequests_InventoryItems_InventoryItemId" FOREIGN KEY ("InventoryItemId") REFERENCES "InventoryItems" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_PurchaseRequests_Suppliers_SupplierId" FOREIGN KEY ("SupplierId") REFERENCES "Suppliers" ("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "ReorderRecommendations" (
    "Id" uuid NOT NULL,
    "DemandSnapshotJson" text,
    "AgentRunId" uuid NOT NULL,
    "Model" character varying(100) NOT NULL,
    "ProposedBy" character varying(200) NOT NULL,
    "ProposedByIssuer" character varying(500) NOT NULL,
    "InventoryItemId" uuid NOT NULL,
    "SupplierId" uuid NOT NULL,
    "RecommendedQuantity" numeric(10,2) NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "StockAtProposal" numeric(10,2) NOT NULL,
    "MinimumStockAtProposal" numeric(10,2) NOT NULL,
    "UnitOfMeasurement" character varying(30) NOT NULL,
    "UnitPrice" numeric(10,2) NOT NULL,
    "LeadTimeDays" integer NOT NULL,
    "Status" character varying(20) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "DecidedAt" timestamp with time zone,
    "DecidedBy" character varying(200),
    "DecidedByIssuer" character varying(500),
    "DecisionNote" character varying(500),
    "PurchaseRequestId" uuid,
    CONSTRAINT "PK_ReorderRecommendations" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ReorderRecommendations_InventoryItems_InventoryItemId" FOREIGN KEY ("InventoryItemId") REFERENCES "InventoryItems" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ReorderRecommendations_PurchaseRequests_PurchaseRequestId" FOREIGN KEY ("PurchaseRequestId") REFERENCES "PurchaseRequests" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_ReorderRecommendations_Suppliers_SupplierId" FOREIGN KEY ("SupplierId") REFERENCES "Suppliers" ("Id") ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 2. Component 4: Roles, Users, UserRoles & AuditLogs
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" uuid NOT NULL,
    "RoleName" character varying(50) NOT NULL,
    "Description" character varying(250),
    "PermissionsMatrix" text,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Users" (
    "Id" uuid NOT NULL,
    "Username" character varying(50) NOT NULL,
    "Email" character varying(150) NOT NULL,
    "PasswordHash" text NOT NULL,
    "FullName" character varying(100) NOT NULL,
    "ContactNumber" character varying(20),
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "UserRoles" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "RoleId" uuid NOT NULL,
    CONSTRAINT "PK_UserRoles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserRoles_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserRoles_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id" uuid NOT NULL,
    "UserId" uuid,
    "ActionType" character varying(50) NOT NULL,
    "IpAddress" character varying(45),
    "Details" text,
    "Timestamp" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AuditLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "ValidationResults" (
    "Id" uuid NOT NULL,
    "ProposalId" character varying(100) NOT NULL,
    "GeneratingAgent" character varying(100) NOT NULL,
    "TargetFieldId" uuid,
    "CropVariety" character varying(100) NOT NULL,
    "ProposedAction" character varying(150) NOT NULL,
    "ProposedQuantity" numeric(10,2) NOT NULL,
    "UnitOfMeasurement" character varying(50) NOT NULL,
    "IsValid" boolean NOT NULL,
    "Decision" character varying(50) NOT NULL,
    "CheckResultsJson" text NOT NULL,
    "WeatherSnapshotJson" text NOT NULL,
    "FailureReasonsJson" text NOT NULL,
    "RevisionGuidance" text,
    "RequiresHumanApproval" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_ValidationResults" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ValidationResults_Fields_TargetFieldId" FOREIGN KEY ("TargetFieldId") REFERENCES "Fields" ("Id") ON DELETE SET NULL
);

-- ------------------------------------------------------------------------------
-- 3. Indexes for Components 3 & 4
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "IX_InventoryTransactions_InventoryItemId" ON "InventoryTransactions" ("InventoryItemId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseRequests_InventoryItemId" ON "PurchaseRequests" ("InventoryItemId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseRequests_SupplierId" ON "PurchaseRequests" ("SupplierId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SupplierItems_SupplierId_InventoryItemId" ON "SupplierItems" ("SupplierId", "InventoryItemId");
CREATE INDEX IF NOT EXISTS "IX_SupplierItems_InventoryItemId" ON "SupplierItems" ("InventoryItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ReorderRecommendations_AgentRunId_InventoryItemId" ON "ReorderRecommendations" ("AgentRunId", "InventoryItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ReorderRecommendations_InventoryItemId" ON "ReorderRecommendations" ("InventoryItemId") WHERE "Status" = 'Pending';
CREATE UNIQUE INDEX IF NOT EXISTS "IX_ReorderRecommendations_PurchaseRequestId" ON "ReorderRecommendations" ("PurchaseRequestId");
CREATE INDEX IF NOT EXISTS "IX_ReorderRecommendations_SupplierId" ON "ReorderRecommendations" ("SupplierId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserRoles_UserId_RoleId" ON "UserRoles" ("UserId", "RoleId");
CREATE INDEX IF NOT EXISTS "IX_UserRoles_RoleId" ON "UserRoles" ("RoleId");
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_UserId" ON "AuditLogs" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_ValidationResults_TargetFieldId" ON "ValidationResults" ("TargetFieldId");
CREATE INDEX IF NOT EXISTS "IX_ValidationResults_CreatedAt" ON "ValidationResults" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_ValidationResults_Decision" ON "ValidationResults" ("Decision");

-- ------------------------------------------------------------------------------
-- 4. Initial Seed Data (Roles & Development Admin Account)
-- ------------------------------------------------------------------------------

INSERT INTO "Roles" ("Id", "RoleName", "Description", "PermissionsMatrix")
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Administrator', 'Full system access and user management', 'ALL'),
    ('22222222-2222-2222-2222-222222222222', 'FarmManager', 'Farm operations, task management, and approvals', 'OPERATIONS,APPROVALS,ANALYTICS_VIEW'),
    ('33333333-3333-3333-3333-333333333333', 'FieldWorker', 'Task execution and progress reporting', 'TASKS_VIEW,EVIDENCE_UPLOAD'),
    ('55555555-5555-5555-5555-555555555555', 'Farmer', 'Field registration, crop observations, and task monitoring', 'FIELDS_REGISTER,SCOUTING_UPLOAD,TASKS_VIEW'),
    ('66666666-6666-6666-6666-666666666666', 'Agronomist', 'Agronomic analysis, crop health monitoring and analytics', 'ANALYTICS_VIEW,CROPS_MANAGE'),
    ('44444444-4444-4444-4444-444444444444', 'Manager', 'Manager access for inventory and approvals', 'MANAGER'),
    ('77777777-7777-7777-7777-777777777777', 'FarmWorker', 'Farm worker execution and stock usage', 'TASKS_VIEW,STOCK_USE')
ON CONFLICT ("Id") DO UPDATE SET "PermissionsMatrix" = EXCLUDED."PermissionsMatrix";

-- 1. Default Admin: admin / ChangeMe123!
INSERT INTO "Users" ("Id", "Username", "PasswordHash", "Email", "FullName", "ContactNumber", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$11$XsAlnYqCGzO/AN8vgvZN4uQBwXO5AND2GhL6WaKghQrJfgOzPrecq',
    'admin@agriops.local',
    'System Administrator',
    '+94771234567',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("Id") DO UPDATE SET "PasswordHash" = EXCLUDED."PasswordHash", "IsActive" = true;

INSERT INTO "UserRoles" ("Id", "UserId", "RoleId")
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- 2. Farm Manager: farm_manager / ChangeMe123!
INSERT INTO "Users" ("Id", "Username", "PasswordHash", "Email", "FullName", "ContactNumber", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'farm_manager',
    '$2a$11$XsAlnYqCGzO/AN8vgvZN4uQBwXO5AND2GhL6WaKghQrJfgOzPrecq',
    'farmmanager@agriops.local',
    'Nileesha (Farm Operations Manager)',
    '+94772345678',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("Id") DO UPDATE SET "PasswordHash" = EXCLUDED."PasswordHash", "IsActive" = true;

INSERT INTO "UserRoles" ("Id", "UserId", "RoleId")
VALUES 
    ('22222222-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
    ('22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- 3. Agronomist: agronomist / ChangeMe123!
INSERT INTO "Users" ("Id", "Username", "PasswordHash", "Email", "FullName", "ContactNumber", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (
    '00000000-0000-0000-0000-000000000003',
    'agronomist',
    '$2a$11$XsAlnYqCGzO/AN8vgvZN4uQBwXO5AND2GhL6WaKghQrJfgOzPrecq',
    'agronomist@agriops.local',
    'Dr. Perera (Crop Agronomist)',
    '+94773456789',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("Id") DO UPDATE SET "PasswordHash" = EXCLUDED."PasswordHash", "IsActive" = true;

INSERT INTO "UserRoles" ("Id", "UserId", "RoleId")
VALUES 
    ('33333333-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666666')
ON CONFLICT DO NOTHING;

-- 4. Field Worker: field_worker / ChangeMe123!
INSERT INTO "Users" ("Id", "Username", "PasswordHash", "Email", "FullName", "ContactNumber", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (
    '00000000-0000-0000-0000-000000000004',
    'field_worker',
    '$2a$11$XsAlnYqCGzO/AN8vgvZN4uQBwXO5AND2GhL6WaKghQrJfgOzPrecq',
    'fieldworker@agriops.local',
    'Kasun Silva (Field Technician)',
    '+94774567890',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("Id") DO UPDATE SET "PasswordHash" = EXCLUDED."PasswordHash", "IsActive" = true;

INSERT INTO "UserRoles" ("Id", "UserId", "RoleId")
VALUES 
    ('44444444-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333'),
    ('44444444-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '77777777-7777-7777-7777-777777777777')
ON CONFLICT DO NOTHING;

-- 5. Farmer: farmer / ChangeMe123!
INSERT INTO "Users" ("Id", "Username", "PasswordHash", "Email", "FullName", "ContactNumber", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'farmer',
    '$2a$11$XsAlnYqCGzO/AN8vgvZN4uQBwXO5AND2GhL6WaKghQrJfgOzPrecq',
    'farmer@agriops.local',
    'Sunil Bandara (Farm Owner / Farmer)',
    '+94775678901',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("Id") DO UPDATE SET "PasswordHash" = EXCLUDED."PasswordHash", "IsActive" = true;

INSERT INTO "UserRoles" ("Id", "UserId", "RoleId")
VALUES 
    ('55555555-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;
