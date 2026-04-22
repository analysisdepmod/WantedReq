using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WantedRec.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddDevicesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsMatch",
                table: "Recognitions",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserDeviceId",
                table: "Cameras",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserDevices",
                columns: table => new
                {
                    UserDeviceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDevices", x => x.UserDeviceId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cameras_UserDeviceId",
                table: "Cameras",
                column: "UserDeviceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cameras_UserDevices_UserDeviceId",
                table: "Cameras",
                column: "UserDeviceId",
                principalTable: "UserDevices",
                principalColumn: "UserDeviceId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cameras_UserDevices_UserDeviceId",
                table: "Cameras");

            migrationBuilder.DropTable(
                name: "UserDevices");

            migrationBuilder.DropIndex(
                name: "IX_Cameras_UserDeviceId",
                table: "Cameras");

            migrationBuilder.DropColumn(
                name: "UserDeviceId",
                table: "Cameras");

            migrationBuilder.AlterColumn<bool>(
                name: "IsMatch",
                table: "Recognitions",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit");
        }
    }
}
