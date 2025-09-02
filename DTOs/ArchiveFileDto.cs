using System.ComponentModel.DataAnnotations;

namespace ArchiveInventoryAPI.DTOs
{
    public class CreateArchiveFileDto
    {
        [Required(ErrorMessage = "Nama file wajib diisi")]
        [StringLength(200, ErrorMessage = "Nama file maksimal 200 karakter")]
        public string FileName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tipe file wajib diisi")]
        [StringLength(100, ErrorMessage = "Tipe file maksimal 100 karakter")]
        public string FileType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Lokasi file wajib diisi")]
        [StringLength(500, ErrorMessage = "Lokasi file maksimal 500 karakter")]
        public string FilePath { get; set; } = string.Empty;

        [Required(ErrorMessage = "Deskripsi wajib diisi")]
        [StringLength(300, ErrorMessage = "Deskripsi maksimal 300 karakter")]
        public string Description { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Kategori maksimal 100 karakter")]
        public string? Category { get; set; }

        [StringLength(100, ErrorMessage = "Departemen maksimal 100 karakter")]
        public string? Department { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Ukuran file harus lebih besar atau sama dengan 0")]
        public decimal FileSizeKB { get; set; }

        [StringLength(100, ErrorMessage = "Nama pembuat maksimal 100 karakter")]
        public string? CreatedBy { get; set; }

        [StringLength(500, ErrorMessage = "Tags maksimal 500 karakter")]
        public string? Tags { get; set; }

        [StringLength(200, ErrorMessage = "Catatan maksimal 200 karakter")]
        public string? Notes { get; set; }
    }

    public class UpdateArchiveFileDto
    {
        [Required(ErrorMessage = "Nama file wajib diisi")]
        [StringLength(200, ErrorMessage = "Nama file maksimal 200 karakter")]
        public string FileName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tipe file wajib diisi")]
        [StringLength(100, ErrorMessage = "Tipe file maksimal 100 karakter")]
        public string FileType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Lokasi file wajib diisi")]
        [StringLength(500, ErrorMessage = "Lokasi file maksimal 500 karakter")]
        public string FilePath { get; set; } = string.Empty;

        [Required(ErrorMessage = "Deskripsi wajib diisi")]
        [StringLength(300, ErrorMessage = "Deskripsi maksimal 300 karakter")]
        public string Description { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Kategori maksimal 100 karakter")]
        public string? Category { get; set; }

        [StringLength(100, ErrorMessage = "Departemen maksimal 100 karakter")]
        public string? Department { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Ukuran file harus lebih besar atau sama dengan 0")]
        public decimal FileSizeKB { get; set; }

        [StringLength(100, ErrorMessage = "Nama pembuat maksimal 100 karakter")]
        public string? ModifiedBy { get; set; }

        [StringLength(500, ErrorMessage = "Tags maksimal 500 karakter")]
        public string? Tags { get; set; }

        [StringLength(50, ErrorMessage = "Status maksimal 50 karakter")]
        public string? Status { get; set; }

        [StringLength(200, ErrorMessage = "Catatan maksimal 200 karakter")]
        public string? Notes { get; set; }
    }

    public class ArchiveFileResponseDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Department { get; set; }
        public decimal FileSizeKB { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? LastModified { get; set; }
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        public string? Tags { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ArchiveDate { get; set; }
        public string? Notes { get; set; }
    }
}