from decimal import Decimal
from typing import TypedDict
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RecommendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: UUID  # Reuse on client retries; it identifies one analysis.
    inventory_item_id: UUID
    target_stock: Decimal = Field(gt=0, le=Decimal("99999999.99"), decimal_places=2)


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
    offers: list[OfferEvidence] = Field(max_length=20)
    offersTruncated: bool


class InventoryState(TypedDict, total=False):
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
