using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WantedRec.Server.Migrations
{
    /// <inheritdoc />
    public partial class Altertablecameratable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LocalDeviceIndex",
                table: "Cameras",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LocalDeviceIndex",
                table: "Cameras");
        }
    }
}
