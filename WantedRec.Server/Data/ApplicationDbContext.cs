

using WantedRec.Models;
using WantedRec.Server.Model.VM;
using WantedRec.Server.Models;

namespace WantedRec.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
             : base(options) { }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            /////////////
            ///

            ConfigurePerson(builder);
            ConfigurePersonFaceImage(builder);
            ConfigureRecognition(builder);
            ConfigureSuspect(builder);
            ConfigureCamera(builder);

            ////

            // مفتاح مركب لـ ChatGroupUser
            builder.Entity<ChatGroupUser>()
                .HasKey(c => new { c.ChatGroupId, c.UserId });

            //builder.Entity<ChatGroupUser>()
            //  .Property(e => e.UserId)
            //  .HasMaxLength(100);
            // علاقات الربط
            builder.Entity<ChatGroupUser>()
                .HasOne(c => c.ChatGroup)
                .WithMany(g => g.Members)
                .HasForeignKey(c => c.ChatGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ChatGroupUser>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<GroupMessage>()
                .HasOne(g => g.ChatGroup)
                .WithMany(c => c.Messages)
                .HasForeignKey(g => g.ChatGroupId)
               .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<GroupMessage>()
                .HasOne(g => g.Sender)
                .WithMany()
                .HasForeignKey(g => g.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                 .HasOne(m => m.Sender)
                 .WithMany()
                 .HasForeignKey(m => m.SenderId)
                 .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<SeenPosted>()
                .HasOne(m => m.Posteds)
                .WithMany()
                .HasForeignKey(m => m.PostedId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Unit>()
                .HasNoKey()
                .ToView("Units");

                builder.Entity<OrgUnit>()
               .HasNoKey()
               .ToView("OrgUnits");

                builder.Entity<HrPersonData>()
                .HasNoKey()
                .ToView("HrPersonDatas");

            builder.Entity<ChatGroupUserRead>()
                .HasKey(x => new { x.ChatGroupId, x.UserId });

            builder.Entity<ChatGroupUserRead>()
                .HasOne(x => x.ChatGroup)
                .WithMany()
                .HasForeignKey(x => x.ChatGroupId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ChatGroupUserRead>()
                .HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            builder.Entity<ApplicationUser>()
                .HasMany(u => u.CreatedFaceImages)
                 .WithOne(fi => fi.CreatedByUser)
                 .HasForeignKey(fi => fi.CreatedByUserId)
                 .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<ApplicationUser>()
                .HasMany(u => u.ReviewedFaceImages)
                  .WithOne(fi => fi.ReviewedByUser)
                  .HasForeignKey(fi => fi.ReviewedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ApplicationUser>()
                .HasMany(u => u.ReviewedRecognitions)
                  .WithOne(r => r.ReviewedByUser)
                  .HasForeignKey(r => r.ReviewedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        }

        public DbSet<ChatGroupUserRead> ChatGroupUserReads { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Rank> Ranks { get; set; }
        public DbSet<SpiUnit> SpiUnits { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<OrgUnit> OrgUnits { get; set; }
        public DbSet<Posted> Posteds { get; set; }
        public DbSet<SeenPosted> SeenPosteds { get; set; }
        public DbSet<ApplicationRole> ApplicationRoles { get; set; }
        public DbSet<ApplicationUser> ApplicationUser { get; set; }
        public DbSet<Images> Imagess { get; set; }
        public DbSet<SpniPdf> SpniPdfs { get; set; }
        public DbSet<News> Newses { get; set; }
        public DbSet<ChatGroup> ChatGroups { get; set; }
        public DbSet<ChatGroupUser> ChatGroupUsers { get; set; }
        public DbSet<GroupMessage> GroupMessages { get; set; }
        [NotMapped]
        public DbSet<HrPersonData> HrPersonDatas { get; set; }
        /// <summary>
        /// //////////////////////////////////////////////////////////////////////////
        /// </summary>
        public DbSet<Person> Persons { get; set; }
        public DbSet<PersonFaceImage> PersonFaceImages { get; set; }
        public DbSet<Recognition> Recognitions { get; set; }
        public DbSet<Suspect> Suspects { get; set; }
        public DbSet<Camera> Cameras { get; set; }




        private void ConfigurePerson(ModelBuilder modelBuilder)
        {
            var entity = modelBuilder.Entity<Person>();

            entity.ToTable("Persons");

            entity.HasKey(p => p.PersonId);

            entity.Property(p => p.FullName)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(p => p.DisplayName)
                  .HasMaxLength(200);

            entity.Property(p => p.Gender)
                  .HasMaxLength(20);

            entity.Property(p => p.NationalId)
                  .HasMaxLength(50);

            entity.Property(p => p.ExternalCode)
                  .HasMaxLength(50);

            entity.Property(p => p.PhoneNumber)
                  .HasMaxLength(50);



            entity.Property(p => p.Address)
                  .HasMaxLength(500);

            entity.Property(p => p.Notes)
                  .HasColumnType("nvarchar(max)");

            entity.Property(p => p.IsActive)
                  .IsRequired();

            entity.Property(p => p.CreatedAt)
                  .HasColumnType("datetime2(0)")
                  .IsRequired();

            entity.Property(p => p.UpdatedAt)
                  .HasColumnType("datetime2(0)");

            // Relations
            entity.HasMany(p => p.FaceImages)
                  .WithOne(fi => fi.Person)
                  .HasForeignKey(fi => fi.PersonId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(p => p.Recognitions)
                  .WithOne(r => r.Person)
                  .HasForeignKey(r => r.PersonId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(p => p.Suspect)
                  .WithOne(s => s.Person)
                  .HasForeignKey<Suspect>(s => s.PersonId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(p => p.Gender)
              .IsRequired()
              .HasConversion<int>();

        }


        private void ConfigurePersonFaceImage(ModelBuilder modelBuilder)
        {
            var entity = modelBuilder.Entity<PersonFaceImage>();

            entity.ToTable("PersonFaceImages");
            entity.HasKey(fi => fi.FaceImageId);

            // ── بيانات الصورة ──
            entity.Property(fi => fi.ImageFileName).HasMaxLength(255);
            entity.Property(fi => fi.ImageFilePath).HasMaxLength(500);
            entity.Property(fi => fi.FaceProcessedImage).HasColumnType("varbinary(max)");

            entity.Property(fi => fi.CapturedAt).HasColumnType("datetime2(0)");
            entity.Property(fi => fi.IsActive).IsRequired();
            entity.Property(fi => fi.IsPrimary).IsRequired();
            entity.Property(fi => fi.CreatedAt).HasColumnType("datetime2(0)").IsRequired();
            entity.Property(fi => fi.UpdatedAt).HasColumnType("datetime2(0)");

            // ── ImageSource كـ int ──
            entity.Property(fi => fi.ImageSource).HasColumnType("int");

            // ── خصائص الوجه كـ int (وليس string) ──
            entity.Property(fi => fi.FaceShape).HasColumnType("int");
            entity.Property(fi => fi.SkinTone).HasColumnType("int");
            entity.Property(fi => fi.NoseType).HasColumnType("int");
            entity.Property(fi => fi.NoseSize).HasColumnType("int");
            entity.Property(fi => fi.EyeShape).HasColumnType("int");
            entity.Property(fi => fi.EyeSize).HasColumnType("int");
            entity.Property(fi => fi.EyeColor).HasColumnType("int");
            entity.Property(fi => fi.EyebrowShape).HasColumnType("int");
            entity.Property(fi => fi.EyebrowThickness).HasColumnType("int");
            entity.Property(fi => fi.MouthShape).HasColumnType("int");
            entity.Property(fi => fi.LipThickness).HasColumnType("int");
            entity.Property(fi => fi.BeardPresence).HasColumnType("int");
            entity.Property(fi => fi.BeardStyle).HasColumnType("int");
            entity.Property(fi => fi.MustachePresence).HasColumnType("int");
            entity.Property(fi => fi.MustacheStyle).HasColumnType("int");
            entity.Property(fi => fi.HairPresence).HasColumnType("int");
            entity.Property(fi => fi.HairStyle).HasColumnType("int");
            entity.Property(fi => fi.HairLength).HasColumnType("int");
            entity.Property(fi => fi.HairColor).HasColumnType("int");
            entity.Property(fi => fi.GlassesType).HasColumnType("int");
            entity.Property(fi => fi.HeadCoverType).HasColumnType("int");
            entity.Property(fi => fi.SpecialMarks).HasMaxLength(500);
            entity.Property(fi => fi.DescriptionNotes).HasColumnType("nvarchar(max)");

            // ── AI Embedding ──
            // ✅ Value Converter لـ float[] → varbinary
            //entity.Property(fi => fi.EmbeddingVector)
            //      .HasColumnType("varbinary(max)")
            //      .HasConversion(
            //          v => v == null ? null : v.SelectMany(BitConverter.GetBytes).ToArray(),
            //          v => v == null ? null : Enumerable.Range(0, v.Length / 4)
            //                                            .Select(i => BitConverter.ToSingle(v, i * 4))
            //                                            .ToArray());

            entity.Property(fi => fi.EmbeddingVector)
            .HasColumnType("varbinary(max)")
            .HasConversion(
                // float[] → bytes (الحفظ)
                v => v == null
                    ? null
                    : v.SelectMany(f => BitConverter.GetBytes(f)).ToArray(),

                // bytes → float[] (القراءة) ✅ هذا هو الصح
                v => v == null
                    ? null
                    : Enumerable.Range(0, v.Length / sizeof(float))
                                .Select(i => BitConverter.ToSingle(v, i * sizeof(float)))
                                .ToArray()
            );

            entity.Property(fi => fi.EmbeddingDimension).HasColumnType("smallint");
            entity.Property(fi => fi.EmbeddingModel).HasMaxLength(100);
            entity.Property(fi => fi.EmbeddingVersion).HasMaxLength(50);
            entity.Property(fi => fi.EmbeddingCreatedAt).HasColumnType("datetime2(0)");
            entity.Property(fi => fi.EmbeddingQualityScore).HasColumnType("real");
            entity.Property(fi => fi.GeneratedByAi).IsRequired();
            entity.Property(fi => fi.DescriptionConfidenceScore).HasColumnType("real");

            // ── Review ──
            entity.Property(fi => fi.ReviewedAt).HasColumnType("datetime2(0)");
            entity.Property(fi => fi.ReviewNotes).HasColumnType("nvarchar(max)");

            // ── Relations ──
            entity.HasOne(fi => fi.Person)
                  .WithMany(p => p.FaceImages)
                  .HasForeignKey(fi => fi.PersonId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(fi => fi.Camera)
                  .WithMany(c => c.FaceImages)
                  .HasForeignKey(fi => fi.CameraId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(fi => fi.CreatedByUser)
                  .WithMany(u => u.CreatedFaceImages)
                  .HasForeignKey(fi => fi.CreatedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(fi => fi.ReviewedByUser)
                  .WithMany(u => u.ReviewedFaceImages)
                  .HasForeignKey(fi => fi.ReviewedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        }

        private void ConfigureRecognition(ModelBuilder modelBuilder)
        {
            var entity = modelBuilder.Entity<Recognition>();

            entity.ToTable("Recognitions");

            entity.HasKey(r => r.RecognitionId);

            entity.Property(r => r.RecognitionScore)
                  .HasColumnType("float");

            entity.Property(r => r.ThresholdUsed)
                  .HasColumnType("float");

            entity.Property(r => r.RecognitionStatus)
                  .HasMaxLength(50);

            entity.Property(r => r.RecognitionDateTime)
                  .HasColumnType("datetime2(0)")
                  .IsRequired();

            entity.Property(r => r.SnapshotPath)
                  .HasMaxLength(500);

            entity.Property(r => r.Latitude)
                  .HasColumnType("float");

            entity.Property(r => r.Longitude)
                  .HasColumnType("float");

            entity.Property(r => r.LocationDescription)
                  .HasMaxLength(200);

            entity.Property(r => r.CreatedAt)
                  .HasColumnType("datetime2(0)")
                  .IsRequired();

            entity.Property(r => r.ReviewNotes)
                  .HasColumnType("nvarchar(max)");

            // Relations
            entity.HasOne(r => r.Person)
                  .WithMany(p => p.Recognitions)
                  .HasForeignKey(r => r.PersonId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(r => r.FaceImage)
                  .WithMany(fi => fi.Recognitions)
                  .HasForeignKey(r => r.FaceImageId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(r => r.Camera)
                  .WithMany(c => c.Recognitions)
                  .HasForeignKey(r => r.CameraId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(r => r.ReviewedByUser)
                  .WithMany(u => u.ReviewedRecognitions)
                  .HasForeignKey(r => r.ReviewedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        }

        private void ConfigureSuspect(ModelBuilder modelBuilder)
        {
            var entity = modelBuilder.Entity<Suspect>();

            entity.ToTable("Suspects");

            entity.HasKey(s => s.SuspectId);

            entity.Property(s => s.Code)
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(s => s.FullName)
                  .HasMaxLength(200);

            entity.Property(s => s.RiskLevel)
                  .HasMaxLength(20);

            entity.Property(s => s.Status)
                  .HasMaxLength(20);

            entity.Property(s => s.CaseReference)
                  .HasMaxLength(100);

            entity.Property(s => s.WantedSince)
                  .HasColumnType("datetime2(0)");

            entity.Property(s => s.Notes)
                  .HasColumnType("nvarchar(max)");

            entity.Property(s => s.IsActive)
                  .IsRequired();

            entity.Property(s => s.CreatedAt)
                  .HasColumnType("datetime2(0)")
                  .IsRequired();

            entity.Property(s => s.UpdatedAt)
                  .HasColumnType("datetime2(0)");

            // One-to-one with Person
            entity.HasOne(s => s.Person)
                  .WithOne(p => p.Suspect)
                  .HasForeignKey<Suspect>(s => s.PersonId)
                  .OnDelete(DeleteBehavior.Cascade);
        }

        private void ConfigureCamera(ModelBuilder modelBuilder)
        {
            var entity = modelBuilder.Entity<Camera>();

            entity.ToTable("Cameras");

            entity.HasKey(c => c.CameraId);

            entity.Property(c => c.Name)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(c => c.Code)
                  .HasMaxLength(50);

            entity.Property(c => c.Description)
                  .HasMaxLength(500);

            entity.Property(c => c.IpAddress)
                  .HasMaxLength(50);

            entity.Property(c => c.StreamUrl)
                  .HasMaxLength(500);

            entity.Property(c => c.Latitude)
                  .HasColumnType("float");

            entity.Property(c => c.Longitude)
                  .HasColumnType("float");

            entity.Property(c => c.Floor)
                  .HasMaxLength(50);

            entity.Property(c => c.Area)
                  .HasMaxLength(100);

            entity.Property(c => c.IsIndoor)
                  .IsRequired();

            entity.Property(c => c.IsActive)
                  .IsRequired();

            entity.Property(c => c.InstallationDate)
                  .HasColumnType("datetime2(0)");

            entity.Property(c => c.LastMaintenanceDate)
                  .HasColumnType("datetime2(0)");

            entity.Property(c => c.Notes)
                  .HasColumnType("nvarchar(max)");

            // Relations
            entity.HasMany(c => c.FaceImages)
                  .WithOne(fi => fi.Camera)
                  .HasForeignKey(fi => fi.CameraId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(c => c.Recognitions)
                  .WithOne(r => r.Camera)
                  .HasForeignKey(r => r.CameraId)
                  .OnDelete(DeleteBehavior.SetNull);
        }
    }
}