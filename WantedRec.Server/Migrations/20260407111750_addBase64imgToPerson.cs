using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WantedRec.Server.Migrations
{
    /// <inheritdoc />
    public partial class addBase64imgToPerson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PersonFaceImages_AspNetUsers_ReviewedByUserId",
                table: "PersonFaceImages");

            migrationBuilder.DropForeignKey(
                name: "FK_Recognitions_AspNetUsers_ReviewedByUserId",
                table: "Recognitions");

            migrationBuilder.AddColumn<byte[]>(
                name: "ProcessedImageBase64",
                table: "PersonFaceImages",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddForeignKey(
                name: "FK_PersonFaceImages_AspNetUsers_ReviewedByUserId",
                table: "PersonFaceImages",
                column: "ReviewedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Recognitions_AspNetUsers_ReviewedByUserId",
                table: "Recognitions",
                column: "ReviewedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PersonFaceImages_AspNetUsers_ReviewedByUserId",
                table: "PersonFaceImages");

            migrationBuilder.DropForeignKey(
                name: "FK_Recognitions_AspNetUsers_ReviewedByUserId",
                table: "Recognitions");

            migrationBuilder.DropColumn(
                name: "ProcessedImageBase64",
                table: "PersonFaceImages");

            migrationBuilder.AddForeignKey(
                name: "FK_PersonFaceImages_AspNetUsers_ReviewedByUserId",
                table: "PersonFaceImages",
                column: "ReviewedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Recognitions_AspNetUsers_ReviewedByUserId",
                table: "Recognitions",
                column: "ReviewedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
