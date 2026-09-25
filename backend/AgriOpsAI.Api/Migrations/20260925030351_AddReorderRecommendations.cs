using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgriOpsAI.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReorderRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReorderRecommendations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentRunId = table.Column<Guid>(type: "uuid", nullable: false),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProposedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProposedByIssuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecommendedQuantity = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StockAtProposal = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MinimumStockAtProposal = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    UnitOfMeasurement = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    LeadTimeDays = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DecidedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DecidedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DecidedByIssuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DecisionNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PurchaseRequestId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReorderRecommendations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReorderRecommendations_InventoryItems_InventoryItemId",
                        column: x => x.InventoryItemId,
                        principalTable: "InventoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReorderRecommendations_PurchaseRequests_PurchaseRequestId",
                        column: x => x.PurchaseRequestId,
                        principalTable: "PurchaseRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReorderRecommendations_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReorderRecommendations_AgentRunId_InventoryItemId",
                table: "ReorderRecommendations",
                columns: new[] { "AgentRunId", "InventoryItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReorderRecommendations_InventoryItemId",
                table: "ReorderRecommendations",
                column: "InventoryItemId",
                unique: true,
                filter: "\"Status\" = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_ReorderRecommendations_PurchaseRequestId",
                table: "ReorderRecommendations",
                column: "PurchaseRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReorderRecommendations_SupplierId",
                table: "ReorderRecommendations",
                column: "SupplierId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReorderRecommendations");
        }
    }
}
