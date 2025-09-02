using Microsoft.EntityFrameworkCore;
using ArchiveInventoryAPI.Models;

namespace ArchiveInventoryAPI.Data
{
    public class ArchiveDbContext : DbContext
    {
        public ArchiveDbContext(DbContextOptions<ArchiveDbContext> options) : base(options)
        {
        }

        public DbSet<ArchiveFile> ArchiveFiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure ArchiveFile entity
            modelBuilder.Entity<ArchiveFile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                
                entity.Property(e => e.FileName)
                    .IsRequired()
                    .HasMaxLength(200);
                
                entity.Property(e => e.FileType)
                    .IsRequired()
                    .HasMaxLength(100);
                
                entity.Property(e => e.FilePath)
                    .IsRequired()
                    .HasMaxLength(500);
                
                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasMaxLength(300);
                
                entity.Property(e => e.Category)
                    .HasMaxLength(100);
                
                entity.Property(e => e.Department)
                    .HasMaxLength(100);
                
                entity.Property(e => e.FileSizeKB)
                    .HasColumnType("decimal(10,2)");
                
                entity.Property(e => e.CreatedDate)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.Property(e => e.CreatedBy)
                    .HasMaxLength(100);
                
                entity.Property(e => e.ModifiedBy)
                    .HasMaxLength(100);
                
                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true);
                
                entity.Property(e => e.Tags)
                    .HasMaxLength(500);
                
                entity.Property(e => e.Status)
                    .HasMaxLength(50)
                    .HasDefaultValue("Active");
                
                entity.Property(e => e.Notes)
                    .HasMaxLength(200);

                // Index for better performance
                entity.HasIndex(e => e.FileName);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.Department);
                entity.HasIndex(e => e.Status);
            });
        }
    }
}