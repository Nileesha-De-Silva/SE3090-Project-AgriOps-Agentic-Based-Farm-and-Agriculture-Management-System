-- ========================================================
-- Migration: 20260928130000_AddAuthAndUserTables (Component 4)
-- ========================================================

-- 1. Create Roles table
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" uuid NOT NULL,
    "RoleName" character varying(50) NOT NULL,
    "Description" character varying(250) NULL,
    "PermissionsMatrix" text NULL,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
);

-- 2. Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" uuid NOT NULL,
    "Username" character varying(50) NOT NULL,
    "Email" character varying(150) NOT NULL,
    "PasswordHash" text NOT NULL,
    "FullName" character varying(100) NOT NULL,
    "ContactNumber" character varying(20) NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

-- 3. Create AuditLogs table
CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id" uuid NOT NULL,
    "UserId" uuid NULL,
    "ActionType" character varying(50) NOT NULL,
    "IpAddress" character varying(45) NULL,
    "Details" text NULL,
    "Timestamp" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AuditLogs_Users_UserId" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE SET NULL
);

-- 4. Create UserRoles table
CREATE TABLE IF NOT EXISTS "UserRoles" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "RoleId" uuid NOT NULL,
    CONSTRAINT "PK_UserRoles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserRoles_Roles_RoleId" FOREIGN KEY ("RoleId") 
        REFERENCES "Roles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserRoles_Users_UserId" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_UserId" ON "AuditLogs" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_UserRoles_RoleId" ON "UserRoles" ("RoleId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserRoles_UserId_RoleId" ON "UserRoles" ("UserId", "RoleId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");

-- 6. EF Core Migrations History record
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260928130000_AddAuthAndUserTables', '10.0.12')
ON CONFLICT ("MigrationId") DO NOTHING;
