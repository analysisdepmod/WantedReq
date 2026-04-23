using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WantedRec.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonSecurityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AlertExpiresAt",
                table: "Persons",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AlertInstructions",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AlertIssuedAt",
                table: "Persons",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Aliases",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ArrestWarrantNumber",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CaseNumber",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DangerLevel",
                table: "Persons",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "DistinguishingMarks",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasActiveAlert",
                table: "Persons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArmedAndDangerous",
                table: "Persons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "IssuedBy",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenAt",
                table: "Persons",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastSeenLocation",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecurityNotes",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecurityReason",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SecurityStatus",
                table: "Persons",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "VehicleInfo",
                table: "Persons",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlertExpiresAt",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "AlertInstructions",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "AlertIssuedAt",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "Aliases",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "ArrestWarrantNumber",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "CaseNumber",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "DangerLevel",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "DistinguishingMarks",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "HasActiveAlert",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "IsArmedAndDangerous",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "IssuedBy",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "LastSeenAt",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "LastSeenLocation",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "SecurityNotes",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "SecurityReason",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "SecurityStatus",
                table: "Persons");

            migrationBuilder.DropColumn(
                name: "VehicleInfo",
                table: "Persons");
        }
    }
}
