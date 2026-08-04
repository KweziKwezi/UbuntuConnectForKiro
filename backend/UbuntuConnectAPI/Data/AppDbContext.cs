using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Business> Businesses { get; set; }

    public virtual DbSet<CampaignApplication> CampaignApplications { get; set; }

    public virtual DbSet<Follow> Follows { get; set; }

    public virtual DbSet<FundingRequest> FundingRequests { get; set; }

    public virtual DbSet<ImpactTrack> ImpactTracks { get; set; }

    public virtual DbSet<Individual> Individuals { get; set; }

    public virtual DbSet<Npo> Npos { get; set; }

    public virtual DbSet<PartnershipCampaign> PartnershipCampaigns { get; set; }

    public virtual DbSet<Post> Posts { get; set; }

    public virtual DbSet<Profile> Profiles { get; set; }

    public virtual DbSet<Project> Projects { get; set; }

    public virtual DbSet<Transaction> Transactions { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Verification> Verifications { get; set; }

    public virtual DbSet<VolunteerApplication> VolunteerApplications { get; set; }

    public virtual DbSet<VolunteerLog> VolunteerLogs { get; set; }

    public virtual DbSet<VolunteerOpportunity> VolunteerOpportunities { get; set; }

    public virtual DbSet<Wallet> Wallets { get; set; }

    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Business>(entity =>
        {
            entity.HasKey(e => e.BusinessId).HasName("PK__Business__F1EAA36EE1003118");

            entity.ToTable("Business");

            entity.HasIndex(e => e.BusinessRegNum, "UQ__Business__A7C15B7BDA3D07EF").IsUnique();

            entity.Property(e => e.BusinessEmail).HasMaxLength(255);
            entity.Property(e => e.BusinessRegNum).HasMaxLength(50);
            entity.Property(e => e.ContactPersonName).HasMaxLength(150);
            entity.Property(e => e.ContactPersonTitle).HasMaxLength(100);
            entity.Property(e => e.CsrGoal)
                .HasMaxLength(500)
                .HasColumnName("CSR_Goal");
            entity.Property(e => e.Industry).HasMaxLength(100);

            entity.HasOne(d => d.User).WithMany(p => p.Businesses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Business_Users");
        });

        modelBuilder.Entity<CampaignApplication>(entity =>
        {
            entity.HasKey(e => e.ApplicationId).HasName("PK__Campaign__C93A4C99F7F6BC0A");

            entity.ToTable("CampaignApplication");

            entity.HasIndex(e => new { e.CampaignId, e.NpoId }, "UQ_CampaignApplication").IsUnique();

            entity.Property(e => e.ApplicationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Motivation).HasMaxLength(1000);
            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.Campaign).WithMany(p => p.CampaignApplications)
                .HasForeignKey(d => d.CampaignId)
                .HasConstraintName("FK_CampApp_Campaign");

            entity.HasOne(d => d.Npo).WithMany(p => p.CampaignApplications)
                .HasForeignKey(d => d.NpoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CampApp_NPO");
        });

        modelBuilder.Entity<Follow>(entity =>
        {
            entity.HasKey(e => e.FollowId).HasName("PK__Follow__2CE810AED05B26BF");

            entity.ToTable("Follow");

            entity.HasIndex(e => new { e.UserId, e.NpoId }, "UQ_Follow").IsUnique();

            entity.Property(e => e.FollowDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");

            entity.HasOne(d => d.Npo).WithMany(p => p.Follows)
                .HasForeignKey(d => d.NpoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Follow_NPO");

            entity.HasOne(d => d.User).WithMany(p => p.Follows)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Follow_Users");
        });

        modelBuilder.Entity<FundingRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__FundingR__33A8517A11A75383");

            entity.ToTable("FundingRequest");

            entity.Property(e => e.Images).HasMaxLength(500);
            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");
            entity.Property(e => e.Purpose).HasMaxLength(1000);
            entity.Property(e => e.RaisedAmount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.TargetAmount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.Npo).WithMany(p => p.FundingRequests)
                .HasForeignKey(d => d.NpoId)
                .HasConstraintName("FK_FundingRequest_NPO");
        });

        modelBuilder.Entity<ImpactTrack>(entity =>
        {
            entity.HasKey(e => e.ImpactId).HasName("PK__ImpactTr__2297C5FD6213B8BD");

            entity.ToTable("ImpactTrack");

            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ImpactMetric).HasMaxLength(255);
            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");
            entity.Property(e => e.Period).HasMaxLength(50);
            entity.Property(e => e.Value).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.Npo).WithMany(p => p.ImpactTracks)
                .HasForeignKey(d => d.NpoId)
                .HasConstraintName("FK_ImpactTrack_NPO");
        });

        modelBuilder.Entity<Individual>(entity =>
        {
            entity.HasKey(e => e.IndividualId).HasName("PK__Individu__2DA106D647F0CE22");

            entity.ToTable("Individual");

            entity.Property(e => e.CauseOfCare).HasMaxLength(255);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);

            entity.HasOne(d => d.User).WithMany(p => p.Individuals)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Individual_Users");
        });

        modelBuilder.Entity<Npo>(entity =>
        {
            entity.HasKey(e => e.NpoId).HasName("PK__NPO__BBE2A2C68A014DEF");

            entity.ToTable("NPO");

            entity.HasIndex(e => e.NporegNum, "UQ__NPO__12A0E9A7C973BA37").IsUnique();

            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");
            entity.Property(e => e.NpofocusArea)
                .HasMaxLength(255)
                .HasColumnName("NPOFocusArea");
            entity.Property(e => e.Npomission)
                .HasMaxLength(1000)
                .HasColumnName("NPOMission");
            entity.Property(e => e.NporegNum)
                .HasMaxLength(50)
                .HasColumnName("NPORegNum");
            entity.Property(e => e.OrganizationName).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.Npos)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_NPO_Users");
        });

        modelBuilder.Entity<PartnershipCampaign>(entity =>
        {
            entity.HasKey(e => e.CampaignId).HasName("PK__Partners__3F5E8A994D003EB5");

            entity.ToTable("PartnershipCampaign");

            entity.Property(e => e.BudgetPerPartner).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Requirements).HasMaxLength(1000);
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.Business).WithMany(p => p.PartnershipCampaigns)
                .HasForeignKey(d => d.BusinessId)
                .HasConstraintName("FK_Campaign_Business");
        });

        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasKey(e => e.PostId).HasName("PK__Post__AA12601825437C28");

            entity.ToTable("Post");

            entity.Property(e => e.ActivityStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Active");
            entity.Property(e => e.MediaUrl)
                .HasMaxLength(500)
                .HasColumnName("MediaURL");
            entity.Property(e => e.PostTitle).HasMaxLength(255);
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.User).WithMany(p => p.Posts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Post_Users");
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasKey(e => e.ProfileId).HasName("PK__Profile__290C88E46B2DE127");

            entity.ToTable("Profile");

            entity.HasIndex(e => e.UserId, "UQ__Profile__1788CC4D80628101").IsUnique();

            entity.Property(e => e.Bio).HasMaxLength(1000);
            entity.Property(e => e.ProfileImage).HasMaxLength(500);
            entity.Property(e => e.ProfileName).HasMaxLength(150);

            entity.HasOne(d => d.User).WithOne(p => p.Profile)
                .HasForeignKey<Profile>(d => d.UserId)
                .HasConstraintName("FK_Profile_Users");
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.ProjectId).HasName("PK__Projects__761ABEF0E7141F4E");

            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");
            entity.Property(e => e.ProjectDesc).HasMaxLength(2000);
            entity.Property(e => e.ProjectName).HasMaxLength(255);
            entity.Property(e => e.ProjectProgress).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.ProjectStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Planning");

            entity.HasOne(d => d.Npo).WithMany(p => p.Projects)
                .HasForeignKey(d => d.NpoId)
                .HasConstraintName("FK_Projects_NPO");
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.TransactionId).HasName("PK__Transact__55433A6B8358D73A");

            entity.Property(e => e.Amount).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.TransactionType).HasMaxLength(30);

            entity.HasOne(d => d.ReceiverUser).WithMany(p => p.TransactionReceiverUsers)
                .HasForeignKey(d => d.ReceiverUserId)
                .HasConstraintName("FK_Transactions_Receiver");

            entity.HasOne(d => d.SenderUser).WithMany(p => p.TransactionSenderUsers)
                .HasForeignKey(d => d.SenderUserId)
                .HasConstraintName("FK_Transactions_Sender");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CC4C39018686");

            entity.HasIndex(e => e.UserEmail, "UQ__Users__08638DF8F974D3A9").IsUnique();

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Location).HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.RegistrationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UserContact).HasMaxLength(20);
            entity.Property(e => e.UserEmail).HasMaxLength(255);
            entity.Property(e => e.UserType).HasMaxLength(20);
        });

        modelBuilder.Entity<Verification>(entity =>
        {
            entity.HasKey(e => e.VerificationId).HasName("PK__Verifica__306D49070C4B3F28");

            entity.ToTable("Verification");

            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");
            entity.Property(e => e.Npocertificate)
                .HasMaxLength(500)
                .HasColumnName("NPOCertificate");
            entity.Property(e => e.NpotaxCertificate)
                .HasMaxLength(500)
                .HasColumnName("NPOTaxCertificate");
            entity.Property(e => e.ReviewedDate).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.SubmittedDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Npo).WithMany(p => p.Verifications)
                .HasForeignKey(d => d.NpoId)
                .HasConstraintName("FK_Verification_NPO");

            entity.HasOne(d => d.ReviewedByUser).WithMany(p => p.Verifications)
                .HasForeignKey(d => d.ReviewedByUserId)
                .HasConstraintName("FK_Verification_Admin");
        });

        modelBuilder.Entity<VolunteerApplication>(entity =>
        {
            entity.HasKey(e => e.ApplicationId).HasName("PK__Voluntee__C93A4C99EB6DCA2A");

            entity.ToTable("VolunteerApplication");

            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.ApplicationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Availability).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FaceImage).HasMaxLength(500);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.IdcardImage)
                .HasMaxLength(500)
                .HasColumnName("IDCardImage");
            entity.Property(e => e.Idnumber)
                .HasMaxLength(20)
                .HasColumnName("IDNumber");
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.PhoneNum).HasMaxLength(20);
            entity.Property(e => e.Skills).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.WhyVolunteer).HasMaxLength(1000);

            entity.HasOne(d => d.Opportunity).WithMany(p => p.VolunteerApplications)
                .HasForeignKey(d => d.OpportunityId)
                .HasConstraintName("FK_VolApp_Opportunity");

            entity.HasOne(d => d.User).WithMany(p => p.VolunteerApplications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_VolApp_Users");
        });

        modelBuilder.Entity<VolunteerLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("PK__Voluntee__5E54864868A5BDFD");

            entity.ToTable("VolunteerLog");

            entity.Property(e => e.LogHours).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(d => d.Application).WithMany(p => p.VolunteerLogs)
                .HasForeignKey(d => d.ApplicationId)
                .HasConstraintName("FK_VolLog_Application");
        });

        modelBuilder.Entity<VolunteerOpportunity>(entity =>
        {
            entity.HasKey(e => e.OpportunityId).HasName("PK__Voluntee__0034ED91C70C71E5");

            entity.ToTable("VolunteerOpportunity");

            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Duration).HasMaxLength(100);
            entity.Property(e => e.MediaUrl)
                .HasMaxLength(500)
                .HasColumnName("MediaURL");
            entity.Property(e => e.NpoId).HasColumnName("NPO_Id");
            entity.Property(e => e.NumOfPositions).HasDefaultValue(1);
            entity.Property(e => e.RoleTitle).HasMaxLength(150);
            entity.Property(e => e.SkillsRequired).HasMaxLength(500);
            entity.Property(e => e.TimeCommitment).HasMaxLength(100);

            entity.HasOne(d => d.FundingRequest).WithMany(p => p.VolunteerOpportunities)
                .HasForeignKey(d => d.FundingRequestId)
                .HasConstraintName("FK_VolOpp_FundingRequest");

            entity.HasOne(d => d.Npo).WithMany(p => p.VolunteerOpportunities)
                .HasForeignKey(d => d.NpoId)
                .HasConstraintName("FK_VolOpp_NPO");
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(e => e.WalletId).HasName("PK__Wallet__84D4F90E677A24AF");

            entity.ToTable("Wallet");

            entity.HasIndex(e => e.UserId, "UQ__Wallet__1788CC4D3AAF2012").IsUnique();

            entity.Property(e => e.Balance).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.User).WithOne(p => p.Wallet)
                .HasForeignKey<Wallet>(d => d.UserId)
                .HasConstraintName("FK_Wallet_Users");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
