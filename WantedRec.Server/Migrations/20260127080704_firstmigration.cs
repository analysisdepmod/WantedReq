using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WantedRec.Server.Migrations
{
    /// <inheritdoc />
    public partial class firstmigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Discriminator = table.Column<string>(type: "nvarchar(21)", maxLength: 21, nullable: false),
                    RoleNameAR = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cameras",
                columns: table => new
                {
                    CameraId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StreamUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Latitude = table.Column<double>(type: "float", nullable: true),
                    Longitude = table.Column<double>(type: "float", nullable: true),
                    Floor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Area = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsIndoor = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    InstallationDate = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    LastMaintenanceDate = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cameras", x => x.CameraId);
                });

            migrationBuilder.CreateTable(
                name: "Ranks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ranks", x => x.Id);
                });

            //migrationBuilder.CreateTable(
            //    name: "SpiUnits",
            //    columns: table => new
            //    {
            //        Id = table.Column<int>(type: "int", nullable: false),
            //        Ur_no = table.Column<int>(type: "int", nullable: false),
            //        Sort = table.Column<int>(type: "int", nullable: false),
            //        Active = table.Column<bool>(type: "bit", nullable: false),
            //        NameEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        BgColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        CanAdd = table.Column<bool>(type: "bit", nullable: false)
            //    },
            //    constraints: table =>
            //    {
            //        table.PrimaryKey("PK_SpiUnits", x => x.Id);
            //    });

            //migrationBuilder.CreateTable(
            //    name: "SpniPdfs",
            //    columns: table => new
            //    {
            //        Id = table.Column<int>(type: "int", nullable: false)
            //            .Annotation("SqlServer:Identity", "1, 1"),
            //        PdfFileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        NameEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        sort = table.Column<int>(type: "int", nullable: false),
            //        Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        DescriptionEn = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        Color = table.Column<string>(type: "nvarchar(max)", nullable: false)
            //    },
            //    constraints: table =>
            //    {
            //        table.PrimaryKey("PK_SpniPdfs", x => x.Id);
            //    });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ur_no = table.Column<int>(type: "int", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PersonNo = table.Column<long>(type: "bigint", nullable: false),
                    PersonName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PersonPosition = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastLogin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LoginTimes = table.Column<int>(type: "int", nullable: false),
                    PassChange = table.Column<bool>(type: "bit", nullable: false),
                    RankId = table.Column<int>(type: "int", nullable: false),
                    Cisco = table.Column<long>(type: "bigint", nullable: false),
                    Created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Created_by = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Updated_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Updated_by = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SeenUpdate = table.Column<bool>(type: "bit", nullable: false),
                    PassChangeDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ClosedAccountFlag = table.Column<int>(type: "int", nullable: false),
                    ClosedAccountNotc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClosedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClosedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HrTest = table.Column<bool>(type: "bit", nullable: false),
                    OriginalUintUser = table.Column<int>(type: "int", nullable: false),
                    LastOriginalUintUser = table.Column<int>(type: "int", nullable: false),
                    CreateLevel = table.Column<int>(type: "int", nullable: false),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsEn = table.Column<bool>(type: "bit", nullable: false),
                    LastSeen = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConnectionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUsers_Ranks_RankId",
                        column: x => x.RankId,
                        principalTable: "Ranks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsClosed = table.Column<bool>(type: "bit", nullable: false),
                    IsClosedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatGroups_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Imagess",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ImageFileName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Sort = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DescriptionEn = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApplicationUserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Imagess", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Imagess_AspNetUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SenderId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ReceiverId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_AspNetUsers_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Messages_AspNetUsers_SenderId",
                        column: x => x.SenderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Newses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ApplicationUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DetailsEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Can = table.Column<bool>(type: "bit", nullable: false),
                    CanAll = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Newses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Newses_AspNetUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Persons",
                columns: table => new
                {
                    PersonId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Gender = table.Column<int>(type: "int", maxLength: 20, nullable: false),
                    BirthDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NationalId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExternalCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Persons", x => x.PersonId);
                    table.ForeignKey(
                        name: "FK_Persons_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Persons_AspNetUsers_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Posteds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ApplicationUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PostedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Att_pk = table.Column<int>(type: "int", nullable: false),
                    WhatAction = table.Column<int>(type: "int", nullable: false),
                    Att_Controller_Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Posteds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Posteds_AspNetUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatGroupUserReads",
                columns: table => new
                {
                    ChatGroupId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LastReadAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatGroupUserReads", x => new { x.ChatGroupId, x.UserId });
                    table.ForeignKey(
                        name: "FK_ChatGroupUserReads_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatGroupUserReads_ChatGroups_ChatGroupId",
                        column: x => x.ChatGroupId,
                        principalTable: "ChatGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChatGroupUsers",
                columns: table => new
                {
                    ChatGroupId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsAdmin = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatGroupUsers", x => new { x.ChatGroupId, x.UserId });
                    table.ForeignKey(
                        name: "FK_ChatGroupUsers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatGroupUsers_ChatGroups_ChatGroupId",
                        column: x => x.ChatGroupId,
                        principalTable: "ChatGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatGroupId = table.Column<int>(type: "int", nullable: false),
                    SenderId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentEn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsEdited = table.Column<bool>(type: "bit", nullable: false),
                    AttachmentData = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    AttachmentName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachmentMimeType = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupMessages_AspNetUsers_SenderId",
                        column: x => x.SenderId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupMessages_ChatGroups_ChatGroupId",
                        column: x => x.ChatGroupId,
                        principalTable: "ChatGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PersonFaceImages",
                columns: table => new
                {
                    FaceImageId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PersonId = table.Column<int>(type: "int", nullable: false),
                    CameraId = table.Column<int>(type: "int", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    ImageFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ImageFilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ImageSource = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    CapturedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    FaceShape = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    SkinTone = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    NoseType = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    NoseSize = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    EyeShape = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    EyeSize = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    EyeColor = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    EyebrowShape = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    EyebrowThickness = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    MouthShape = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    LipThickness = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    BeardPresence = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    BeardStyle = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    MustachePresence = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    MustacheStyle = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    HairPresence = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    HairStyle = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    HairLength = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    HairColor = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    GlassesType = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    HeadCoverType = table.Column<int>(type: "int", maxLength: 50, nullable: true),
                    SpecialMarks = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DescriptionNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmbeddingVector = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    EmbeddingDimension = table.Column<short>(type: "smallint", nullable: true),
                    EmbeddingModel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EmbeddingVersion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EmbeddingCreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    EmbeddingQualityScore = table.Column<double>(type: "float", nullable: true),
                    GeneratedByAi = table.Column<bool>(type: "bit", nullable: true),
                    DescriptionConfidenceScore = table.Column<double>(type: "float", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ReviewNotes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonFaceImages", x => x.FaceImageId);
                    table.ForeignKey(
                        name: "FK_PersonFaceImages_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PersonFaceImages_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PersonFaceImages_AspNetUsers_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PersonFaceImages_Cameras_CameraId",
                        column: x => x.CameraId,
                        principalTable: "Cameras",
                        principalColumn: "CameraId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PersonFaceImages_Persons_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Persons",
                        principalColumn: "PersonId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Suspects",
                columns: table => new
                {
                    SuspectId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PersonId = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RiskLevel = table.Column<int>(type: "int", maxLength: 20, nullable: false),
                    Status = table.Column<int>(type: "int", maxLength: 20, nullable: false),
                    CaseReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    WantedSince = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UpdatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suspects", x => x.SuspectId);
                    table.ForeignKey(
                        name: "FK_Suspects_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Suspects_AspNetUsers_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Suspects_Persons_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Persons",
                        principalColumn: "PersonId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeenPosteds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ApplicationUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PostedId = table.Column<int>(type: "int", nullable: false),
                    IsSeen = table.Column<bool>(type: "bit", nullable: false),
                    SeenDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeenPosteds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeenPosteds_AspNetUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeenPosteds_Posteds_PostedId",
                        column: x => x.PostedId,
                        principalTable: "Posteds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Recognitions",
                columns: table => new
                {
                    RecognitionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PersonId = table.Column<int>(type: "int", nullable: true),
                    FaceImageId = table.Column<long>(type: "bigint", nullable: true),
                    CameraId = table.Column<int>(type: "int", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    RecognitionScore = table.Column<double>(type: "float", nullable: true),
                    IsMatch = table.Column<bool>(type: "bit", nullable: true),
                    ThresholdUsed = table.Column<double>(type: "float", nullable: true),
                    RecognitionStatus = table.Column<int>(type: "int", maxLength: 50, nullable: false),
                    RecognitionDateTime = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    BBoxX1 = table.Column<int>(type: "int", nullable: true),
                    BBoxY1 = table.Column<int>(type: "int", nullable: true),
                    BBoxX2 = table.Column<int>(type: "int", nullable: true),
                    BBoxY2 = table.Column<int>(type: "int", nullable: true),
                    FrameNumber = table.Column<int>(type: "int", nullable: true),
                    SnapshotPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Latitude = table.Column<double>(type: "float", nullable: true),
                    Longitude = table.Column<double>(type: "float", nullable: true),
                    LocationDescription = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    ReviewNotes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recognitions", x => x.RecognitionId);
                    table.ForeignKey(
                        name: "FK_Recognitions_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Recognitions_Cameras_CameraId",
                        column: x => x.CameraId,
                        principalTable: "Cameras",
                        principalColumn: "CameraId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Recognitions_PersonFaceImages_FaceImageId",
                        column: x => x.FaceImageId,
                        principalTable: "PersonFaceImages",
                        principalColumn: "FaceImageId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Recognitions_Persons_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Persons",
                        principalColumn: "PersonId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_RankId",
                table: "AspNetUsers",
                column: "RankId");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGroups_CreatedByUserId",
                table: "ChatGroups",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGroupUserReads_UserId",
                table: "ChatGroupUserReads",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGroupUsers_UserId",
                table: "ChatGroupUsers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessages_ChatGroupId",
                table: "GroupMessages",
                column: "ChatGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessages_SenderId",
                table: "GroupMessages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Imagess_ApplicationUserId",
                table: "Imagess",
                column: "ApplicationUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ReceiverId",
                table: "Messages",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_SenderId",
                table: "Messages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Newses_ApplicationUserId",
                table: "Newses",
                column: "ApplicationUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonFaceImages_CameraId",
                table: "PersonFaceImages",
                column: "CameraId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonFaceImages_CreatedByUserId",
                table: "PersonFaceImages",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonFaceImages_PersonId",
                table: "PersonFaceImages",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonFaceImages_ReviewedByUserId",
                table: "PersonFaceImages",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonFaceImages_UpdatedByUserId",
                table: "PersonFaceImages",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Persons_CreatedByUserId",
                table: "Persons",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Persons_UpdatedByUserId",
                table: "Persons",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Posteds_ApplicationUserId",
                table: "Posteds",
                column: "ApplicationUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_CameraId",
                table: "Recognitions",
                column: "CameraId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_FaceImageId",
                table: "Recognitions",
                column: "FaceImageId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_PersonId",
                table: "Recognitions",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Recognitions_ReviewedByUserId",
                table: "Recognitions",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeenPosteds_ApplicationUserId",
                table: "SeenPosteds",
                column: "ApplicationUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeenPosteds_PostedId",
                table: "SeenPosteds",
                column: "PostedId");

            migrationBuilder.CreateIndex(
                name: "IX_Suspects_CreatedByUserId",
                table: "Suspects",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Suspects_PersonId",
                table: "Suspects",
                column: "PersonId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Suspects_UpdatedByUserId",
                table: "Suspects",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "ChatGroupUserReads");

            migrationBuilder.DropTable(
                name: "ChatGroupUsers");

            migrationBuilder.DropTable(
                name: "GroupMessages");

            migrationBuilder.DropTable(
                name: "Imagess");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "Newses");

            migrationBuilder.DropTable(
                name: "Recognitions");

            migrationBuilder.DropTable(
                name: "SeenPosteds");

            migrationBuilder.DropTable(
                name: "SpiUnits");

            migrationBuilder.DropTable(
                name: "SpniPdfs");

            migrationBuilder.DropTable(
                name: "Suspects");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "ChatGroups");

            migrationBuilder.DropTable(
                name: "PersonFaceImages");

            migrationBuilder.DropTable(
                name: "Posteds");

            migrationBuilder.DropTable(
                name: "Cameras");

            migrationBuilder.DropTable(
                name: "Persons");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Ranks");
        }
    }
}
