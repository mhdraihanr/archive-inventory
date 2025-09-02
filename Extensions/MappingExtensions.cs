using ArchiveInventoryAPI.Models;
using ArchiveInventoryAPI.DTOs;

namespace ArchiveInventoryAPI.Extensions
{
    public static class MappingExtensions
    {
        public static ArchiveFile ToEntity(this CreateArchiveFileDto dto)
        {
            return new ArchiveFile
            {
                FileName = dto.FileName,
                FileType = dto.FileType,
                FilePath = dto.FilePath,
                Description = dto.Description,
                Category = dto.Category ?? string.Empty,
                Department = dto.Department ?? string.Empty,
                FileSizeKB = dto.FileSizeKB,
                CreatedBy = dto.CreatedBy ?? string.Empty,
                Tags = dto.Tags,
                Notes = dto.Notes,
                CreatedDate = DateTime.Now,
                IsActive = true,
                Status = "Active"
            };
        }

        public static void UpdateFromDto(this ArchiveFile entity, UpdateArchiveFileDto dto)
        {
            entity.FileName = dto.FileName;
            entity.FileType = dto.FileType;
            entity.FilePath = dto.FilePath;
            entity.Description = dto.Description;
            entity.Category = dto.Category ?? string.Empty;
            entity.Department = dto.Department ?? string.Empty;
            entity.FileSizeKB = dto.FileSizeKB;
            entity.ModifiedBy = dto.ModifiedBy ?? string.Empty;
            entity.Tags = dto.Tags;
            entity.Status = dto.Status ?? "Active";
            entity.Notes = dto.Notes;
            entity.LastModified = DateTime.Now;
        }

        public static ArchiveFileResponseDto ToResponseDto(this ArchiveFile entity)
        {
            return new ArchiveFileResponseDto
            {
                Id = entity.Id,
                FileName = entity.FileName,
                FileType = entity.FileType,
                FilePath = entity.FilePath,
                Description = entity.Description,
                Category = entity.Category,
                Department = entity.Department,
                FileSizeKB = entity.FileSizeKB,
                CreatedDate = entity.CreatedDate,
                LastModified = entity.LastModified,
                CreatedBy = entity.CreatedBy,
                ModifiedBy = entity.ModifiedBy,
                IsActive = entity.IsActive,
                Tags = entity.Tags,
                Status = entity.Status,
                ArchiveDate = entity.ArchiveDate,
                Notes = entity.Notes
            };
        }
    }
}