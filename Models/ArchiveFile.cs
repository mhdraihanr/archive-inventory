using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ArchiveInventoryAPI.Models
{
    public class ArchiveFile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FileType { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [StringLength(300)]
        public string Description { get; set; } = string.Empty;

        [StringLength(100)]
        public string Category { get; set; } = string.Empty;

        [StringLength(100)]
        public string Department { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal FileSizeKB { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? LastModified { get; set; }

        [StringLength(100)]
        public string CreatedBy { get; set; } = string.Empty;

        [StringLength(100)]
        public string ModifiedBy { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        [StringLength(500)]
        public string? Tags { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Active";

        public DateTime? ArchiveDate { get; set; }

        [StringLength(200)]
        public string? Notes { get; set; }
    }
}