CREATE TABLE "ApprovalItems" (
    "Id" uuid NOT NULL,
    "WorkflowId" uuid NOT NULL,
    "ActionDescription" character varying(500) NOT NULL,
    "ProposedTaskType" character varying(100) NOT NULL,
    "TargetFieldId" uuid NOT NULL,
    "Status" character varying(50) NOT NULL,
    "ReviewedByUserId" uuid,
    "Comments" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_ApprovalItems" PRIMARY KEY ("Id")
);


CREATE TABLE "CropAnalysisAssessments" (
    "Id" uuid NOT NULL,
    "WorkflowId" uuid NOT NULL,
    "FieldId" uuid NOT NULL,
    "CropVariety" character varying(100) NOT NULL,
    "GrowthStage" character varying(100) NOT NULL,
    "ObservationText" text NOT NULL,
    "ImageUrl" text NOT NULL,
    "PrimaryIndicator" text NOT NULL,
    "PotentialStressFactorsJson" text NOT NULL,
    "RiskLevel" character varying(50) NOT NULL,
    "RecommendedActionsJson" text NOT NULL,
    "SuggestedTaskType" text NOT NULL,
    "Priority" text NOT NULL,
    "Status" character varying(50) NOT NULL,
    "SubmittedByUserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_CropAnalysisAssessments" PRIMARY KEY ("Id")
);


CREATE TABLE "Crops" (
    "Id" uuid NOT NULL,
    "CropName" text NOT NULL,
    "Variety" text NOT NULL,
    "OptimalGrowthDurationDays" integer NOT NULL,
    "Description" text,
    CONSTRAINT "PK_Crops" PRIMARY KEY ("Id")
);


CREATE TABLE "Farms" (
    "Id" uuid NOT NULL,
    "Name" text NOT NULL,
    "Location" text NOT NULL,
    "TotalArea" numeric NOT NULL,
    "OwnerId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Farms" PRIMARY KEY ("Id")
);


CREATE TABLE "InventoryItems" (
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


CREATE TABLE "Roles" (
    "Id" uuid NOT NULL,
    "RoleName" character varying(50) NOT NULL,
    "Description" character varying(250),
    "PermissionsMatrix" text,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
);


CREATE TABLE "Suppliers" (
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


CREATE TABLE "Tasks" (
    "Id" uuid NOT NULL,
    "Title" character varying(200),
    "FieldId" uuid,
    "CropSeasonId" uuid,
    "TaskType" character varying(100) NOT NULL,
    "Priority" character varying(50) NOT NULL,
    "Description" character varying(1000) NOT NULL,
    "TargetDate" timestamp with time zone NOT NULL,
    "Status" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Tasks" PRIMARY KEY ("Id")
);


CREATE TABLE "Users" (
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


CREATE TABLE "Workers" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "FullName" character varying(200) NOT NULL,
    "ContactNumber" character varying(50) NOT NULL,
    "EmploymentType" character varying(50) NOT NULL,
    "Status" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Workers" PRIMARY KEY ("Id")
);


CREATE TABLE "Fields" (
    "Id" uuid NOT NULL,
    "FarmId" uuid NOT NULL,
    "FieldName" text NOT NULL,
    "AreaSize" numeric NOT NULL,
    "SoilType" text NOT NULL,
    "BoundaryCoordinates" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Fields" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Fields_Farms_FarmId" FOREIGN KEY ("FarmId") REFERENCES "Farms" ("Id") ON DELETE CASCADE
);


CREATE TABLE "InventoryTransactions" (
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


CREATE TABLE "PurchaseRequests" (
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


CREATE TABLE "SupplierItems" (
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


CREATE TABLE "TaskHistories" (
    "Id" uuid NOT NULL,
    "TaskId" uuid NOT NULL,
    "PreviousStatus" character varying(50) NOT NULL,
    "NewStatus" character varying(50) NOT NULL,
    "ChangedByUserId" uuid NOT NULL,
    "Remarks" text,
    "EvidencePhotoUrl" text,
    "Timestamp" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_TaskHistories" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TaskHistories_Tasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE
);


CREATE TABLE "TaskSchedules" (
    "Id" uuid NOT NULL,
    "TaskId" uuid NOT NULL,
    "Frequency" character varying(50) NOT NULL,
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone,
    "NextExecutionDate" timestamp with time zone NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_TaskSchedules" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TaskSchedules_Tasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE
);


CREATE TABLE "AuditLogs" (
    "Id" uuid NOT NULL,
    "UserId" uuid,
    "ActionType" character varying(50) NOT NULL,
    "IpAddress" character varying(45),
    "Details" text,
    "Timestamp" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AuditLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);


CREATE TABLE "UserRoles" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "RoleId" uuid NOT NULL,
    CONSTRAINT "PK_UserRoles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_UserRoles_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_UserRoles_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);


CREATE TABLE "TaskAssignments" (
    "Id" uuid NOT NULL,
    "TaskId" uuid NOT NULL,
    "WorkerId" uuid NOT NULL,
    "AssignedDate" timestamp with time zone NOT NULL,
    "Status" character varying(50) NOT NULL,
    CONSTRAINT "PK_TaskAssignments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TaskAssignments_Tasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskAssignments_Workers_WorkerId" FOREIGN KEY ("WorkerId") REFERENCES "Workers" ("Id") ON DELETE RESTRICT
);


CREATE TABLE "WorkerSkills" (
    "Id" uuid NOT NULL,
    "WorkerId" uuid NOT NULL,
    "SkillName" character varying(100) NOT NULL,
    "ProficiencyLevel" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_WorkerSkills" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_WorkerSkills_Workers_WorkerId" FOREIGN KEY ("WorkerId") REFERENCES "Workers" ("Id") ON DELETE CASCADE
);


CREATE TABLE "CropSeasons" (
    "Id" uuid NOT NULL,
    "FieldId" uuid NOT NULL,
    "CropId" uuid NOT NULL,
    "SeasonName" text NOT NULL,
    "StartDate" timestamp with time zone NOT NULL,
    "TargetEndDate" timestamp with time zone NOT NULL,
    "Status" integer NOT NULL,
    CONSTRAINT "PK_CropSeasons" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CropSeasons_Crops_CropId" FOREIGN KEY ("CropId") REFERENCES "Crops" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_CropSeasons_Fields_FieldId" FOREIGN KEY ("FieldId") REFERENCES "Fields" ("Id") ON DELETE CASCADE
);


CREATE TABLE "SoilRecords" (
    "Id" uuid NOT NULL,
    "FieldId" uuid NOT NULL,
    "TestDate" timestamp with time zone NOT NULL,
    "PhLevel" numeric NOT NULL,
    "NitrogenLevel" numeric NOT NULL,
    "PhosphorusLevel" numeric NOT NULL,
    "PotassiumLevel" numeric NOT NULL,
    "Notes" text,
    CONSTRAINT "PK_SoilRecords" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SoilRecords_Fields_FieldId" FOREIGN KEY ("FieldId") REFERENCES "Fields" ("Id") ON DELETE CASCADE
);


CREATE TABLE "ReorderRecommendations" (
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


CREATE TABLE "Harvests" (
    "Id" uuid NOT NULL,
    "CropSeasonId" uuid NOT NULL,
    "HarvestDate" timestamp with time zone NOT NULL,
    "YieldAmount" numeric NOT NULL,
    "QualityGrade" text,
    "RecordedByUserId" uuid NOT NULL,
    CONSTRAINT "PK_Harvests" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Harvests_CropSeasons_CropSeasonId" FOREIGN KEY ("CropSeasonId") REFERENCES "CropSeasons" ("Id") ON DELETE CASCADE
);


CREATE TABLE "Plantings" (
    "Id" uuid NOT NULL,
    "CropSeasonId" uuid NOT NULL,
    "PlantingDate" timestamp with time zone NOT NULL,
    "InitialQuantity" numeric NOT NULL,
    "PlantingMethod" text,
    "Notes" text,
    CONSTRAINT "PK_Plantings" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Plantings_CropSeasons_CropSeasonId" FOREIGN KEY ("CropSeasonId") REFERENCES "CropSeasons" ("Id") ON DELETE CASCADE
);


CREATE INDEX "IX_ApprovalItems_WorkflowId" ON "ApprovalItems" ("WorkflowId");


CREATE INDEX "IX_AuditLogs_UserId" ON "AuditLogs" ("UserId");


CREATE INDEX "IX_CropAnalysisAssessments_FieldId" ON "CropAnalysisAssessments" ("FieldId");


CREATE INDEX "IX_CropAnalysisAssessments_WorkflowId" ON "CropAnalysisAssessments" ("WorkflowId");


CREATE INDEX "IX_CropSeasons_CropId" ON "CropSeasons" ("CropId");


CREATE INDEX "IX_CropSeasons_FieldId" ON "CropSeasons" ("FieldId");


CREATE INDEX "IX_Fields_FarmId" ON "Fields" ("FarmId");


CREATE INDEX "IX_Harvests_CropSeasonId" ON "Harvests" ("CropSeasonId");


CREATE INDEX "IX_InventoryTransactions_InventoryItemId" ON "InventoryTransactions" ("InventoryItemId");


CREATE INDEX "IX_Plantings_CropSeasonId" ON "Plantings" ("CropSeasonId");


CREATE INDEX "IX_PurchaseRequests_InventoryItemId" ON "PurchaseRequests" ("InventoryItemId");


CREATE INDEX "IX_PurchaseRequests_SupplierId" ON "PurchaseRequests" ("SupplierId");


CREATE UNIQUE INDEX "IX_ReorderRecommendations_AgentRunId_InventoryItemId" ON "ReorderRecommendations" ("AgentRunId", "InventoryItemId");


CREATE UNIQUE INDEX "IX_ReorderRecommendations_InventoryItemId" ON "ReorderRecommendations" ("InventoryItemId") WHERE "Status" = 'Pending';


CREATE UNIQUE INDEX "IX_ReorderRecommendations_PurchaseRequestId" ON "ReorderRecommendations" ("PurchaseRequestId");


CREATE INDEX "IX_ReorderRecommendations_SupplierId" ON "ReorderRecommendations" ("SupplierId");


CREATE INDEX "IX_SoilRecords_FieldId" ON "SoilRecords" ("FieldId");


CREATE INDEX "IX_SupplierItems_InventoryItemId" ON "SupplierItems" ("InventoryItemId");


CREATE UNIQUE INDEX "IX_SupplierItems_SupplierId_InventoryItemId" ON "SupplierItems" ("SupplierId", "InventoryItemId");


CREATE INDEX "IX_TaskAssignments_TaskId" ON "TaskAssignments" ("TaskId");


CREATE INDEX "IX_TaskAssignments_WorkerId" ON "TaskAssignments" ("WorkerId");


CREATE INDEX "IX_TaskHistories_TaskId" ON "TaskHistories" ("TaskId");


CREATE INDEX "IX_Tasks_FieldId" ON "Tasks" ("FieldId");


CREATE INDEX "IX_Tasks_Status" ON "Tasks" ("Status");


CREATE UNIQUE INDEX "IX_TaskSchedules_TaskId" ON "TaskSchedules" ("TaskId");


CREATE INDEX "IX_UserRoles_RoleId" ON "UserRoles" ("RoleId");


CREATE UNIQUE INDEX "IX_UserRoles_UserId_RoleId" ON "UserRoles" ("UserId", "RoleId");


CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");


CREATE UNIQUE INDEX "IX_Users_Username" ON "Users" ("Username");


CREATE INDEX "IX_Workers_UserId" ON "Workers" ("UserId");


CREATE INDEX "IX_WorkerSkills_WorkerId" ON "WorkerSkills" ("WorkerId");


