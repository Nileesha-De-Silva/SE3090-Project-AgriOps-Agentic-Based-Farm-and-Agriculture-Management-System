using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgriOpsAI.Api.Migrations;

public partial class AddDemandSnapshots : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.AddColumn<string>(name: "DemandSnapshotJson", table: "ReorderRecommendations", type: "text", nullable: true);

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropColumn(name: "DemandSnapshotJson", table: "ReorderRecommendations");
}
