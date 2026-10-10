from decimal import Decimal
from datetime import datetime
from typing import TypedDict
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class RecommendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # Clients should send/reuse this ID for retries. Omission starts a new run.
    request_id: UUID = Field(default_factory=uuid4)
    inventory_item_id: UUID
    # Omit target_stock for demand planning; retain explicit targets for legacy runs.
    target_stock: Decimal | None = Field(default=None, gt=0, le=Decimal("99999999.99"), decimal_places=2)
    weekly_estimate: Decimal | None = Field(default=None, gt=0, le=Decimal("99999999.99"), decimal_places=2)
    safety_days: int = Field(default=7, ge=0, le=90)
    message: str = Field(default="", max_length=500)


class SupplierChoice(BaseModel):
    """Only select from the observed offers; quantities and costs are calculated by code."""
    model_config = ConfigDict(extra="forbid")
    supplier_id: UUID
    reason: str = Field(min_length=1, max_length=400)


class ItemEvidence(BaseModel):
    id: UUID
    name: str = Field(max_length=100)
    currentStock: Decimal = Field(ge=0, le=Decimal("99999999.99"), decimal_places=2)
    minimumStockLevel: Decimal = Field(ge=0, le=Decimal("99999999.99"), decimal_places=2)
    unitOfMeasurement: str = Field(min_length=1, max_length=30)


class OfferEvidence(BaseModel):
    supplierId: UUID
    supplierName: str = Field(max_length=100)
    unitPrice: Decimal = Field(ge=0, le=Decimal("99999999.99"), decimal_places=2)
    leadTimeDays: int = Field(ge=0)


class ContextEvidence(BaseModel):
    item: ItemEvidence
    incomingQuantity: Decimal = Field(ge=0)
    pendingRecommendationId: UUID | None
    usageLast30Days: Decimal = Field(ge=0)
    usageLast28Days: Decimal | None = Field(default=None, ge=0)
    historyDays: int = Field(default=0, ge=0, le=28)
    asOf: datetime | None = None
    offers: list[OfferEvidence] = Field(max_length=20)
    offersTruncated: bool


class InventoryState(TypedDict, total=False):
    message: str
    request_input: dict
    automatic: bool
    demand_mode: bool
    weekly_estimate: str | None
    safety_days: int
    demand_plans: list[dict]
    demand: dict
    run_id: str
    inventory_item_id: str
    target_stock: str
    context: dict
    quantity: str
    candidate: dict | None
    payload: dict
    recommendation: dict
    status: str
    error: str | None
    model_attempts: int
    total_tokens: int
    trace: list[dict]
