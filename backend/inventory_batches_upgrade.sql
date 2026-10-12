-- Apply to the deployed inventory database before deploying the new backend.
ALTER TABLE "SupplierItems" ADD COLUMN IF NOT EXISTS "ExpirationDate" date NULL;

-- QR labels identify individual received batches. This additive upgrade does not change existing totals.
CREATE TABLE IF NOT EXISTS "InventoryBatches" (
    "Id" uuid PRIMARY KEY,
    "InventoryItemId" uuid NOT NULL REFERENCES "InventoryItems" ("Id") ON DELETE RESTRICT,
    "PurchaseRequestId" uuid NULL REFERENCES "PurchaseRequests" ("Id") ON DELETE RESTRICT,
    "SupplierId" uuid NULL REFERENCES "Suppliers" ("Id") ON DELETE RESTRICT,
    "BatchNumber" character varying(100) NULL,
    "ShelfLocation" character varying(100) NULL,
    "ExpirationDate" date NULL,
    "ReceivedQuantity" numeric(10,2) NOT NULL CHECK ("ReceivedQuantity" >= 0),
    "RemainingQuantity" numeric(10,2) NOT NULL CHECK ("RemainingQuantity" >= 0 AND "RemainingQuantity" <= "ReceivedQuantity"),
    "ReceivedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "IsLegacy" boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS "IX_InventoryBatches_InventoryItemId" ON "InventoryBatches" ("InventoryItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_InventoryBatches_PurchaseRequestId" ON "InventoryBatches" ("PurchaseRequestId");
CREATE TABLE IF NOT EXISTS "InventoryBatchMovements" (
    "Id" uuid PRIMARY KEY,
    "InventoryBatchId" uuid NOT NULL REFERENCES "InventoryBatches" ("Id") ON DELETE RESTRICT,
    "InventoryTransactionId" uuid NOT NULL REFERENCES "InventoryTransactions" ("Id") ON DELETE RESTRICT,
    "Quantity" numeric(10,2) NOT NULL CHECK ("Quantity" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_InventoryBatchMovements_InventoryBatchId_InventoryTransactionId"
ON "InventoryBatchMovements" ("InventoryBatchId", "InventoryTransactionId");
CREATE INDEX IF NOT EXISTS "IX_InventoryBatchMovements_InventoryTransactionId" ON "InventoryBatchMovements" ("InventoryTransactionId");
