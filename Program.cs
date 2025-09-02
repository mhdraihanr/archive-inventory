using Microsoft.EntityFrameworkCore;
using ArchiveInventoryAPI.Data;
using ArchiveInventoryAPI.Models;
using ArchiveInventoryAPI.DTOs;
using ArchiveInventoryAPI.Extensions;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ArchiveDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseStaticFiles();

// Default route to serve index.html
app.MapGet("/", () => Results.Redirect("/index.html"));

// Create database if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ArchiveDbContext>();
    context.Database.EnsureCreated();
}

// CRUD API Endpoints for Archive Files

// GET: Get all archive files
app.MapGet("/api/archives", async (ArchiveDbContext db) =>
{
    try
    {
        var archives = await db.ArchiveFiles
            .Where(a => a.IsActive)
            .OrderByDescending(a => a.CreatedDate)
            .Select(a => a.ToResponseDto())
            .ToListAsync();
        return Results.Ok(archives);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error retrieving archives: {ex.Message}");
    }
})
.WithName("GetAllArchives")
.WithOpenApi();

// GET: Get archive file by ID
app.MapGet("/api/archives/{id}", async (int id, ArchiveDbContext db) =>
{
    try
    {
        if (id <= 0)
            return Results.BadRequest("ID harus lebih besar dari 0");
            
        var archive = await db.ArchiveFiles
            .FirstOrDefaultAsync(a => a.Id == id && a.IsActive);
        
        return archive is not null ? Results.Ok(archive.ToResponseDto()) : Results.NotFound("Arsip tidak ditemukan");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error retrieving archive: {ex.Message}");
    }
})
.WithName("GetArchiveById")
.WithOpenApi();

// POST: Upload file and create new archive
app.MapPost("/api/archives/upload", async (HttpRequest request, ArchiveDbContext db) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest("Request must be multipart/form-data");
        }

        var form = await request.ReadFormAsync();
        var file = form.Files.GetFile("file");
        
        // Create DTO from form data
        var dto = new CreateArchiveFileDto
        {
            FileName = form["fileName"].ToString(),
            FileType = form["fileType"].ToString(),
            FilePath = form["filePath"].ToString(),
            Description = form["description"].ToString(),
            Category = form["category"].ToString(),
            Department = form["department"].ToString(),
            FileSizeKB = decimal.TryParse(form["fileSizeKB"], out var size) ? size : 0,
            CreatedBy = form["createdBy"].ToString(),
            Tags = form["tags"].ToString(),
            Notes = form["notes"].ToString()
        };

        // Handle file upload if present
        if (file != null && file.Length > 0)
        {
            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update DTO with file information
            dto.FileName = file.FileName;
            dto.FilePath = $"/uploads/{uniqueFileName}";
            dto.FileSizeKB = (decimal)(file.Length / 1024.0);
            
            // Auto-detect file type if not provided
            if (string.IsNullOrEmpty(dto.FileType))
            {
                dto.FileType = fileExtension.ToUpper().TrimStart('.');
            }
        }

        // Validate DTO
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(dto);
        
        if (!Validator.TryValidateObject(dto, validationContext, validationResults, true))
        {
            var errors = validationResults.Select(vr => vr.ErrorMessage).ToList();
            return Results.BadRequest(new { Errors = errors });
        }
        
        var archive = dto.ToEntity();
        
        db.ArchiveFiles.Add(archive);
        await db.SaveChangesAsync();
        
        return Results.Created($"/api/archives/{archive.Id}", archive.ToResponseDto());
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error creating archive: {ex.Message}");
    }
})
.WithName("UploadArchive")
.WithOpenApi()
.DisableAntiforgery();

// POST: Create new archive file (without upload)
app.MapPost("/api/archives", async (CreateArchiveFileDto dto, ArchiveDbContext db) =>
{
    try
    {
        // Validate DTO
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(dto);
        
        if (!Validator.TryValidateObject(dto, validationContext, validationResults, true))
        {
            var errors = validationResults.Select(vr => vr.ErrorMessage).ToList();
            return Results.BadRequest(new { Errors = errors });
        }
        
        var archive = dto.ToEntity();
        
        db.ArchiveFiles.Add(archive);
        await db.SaveChangesAsync();
        
        return Results.Created($"/api/archives/{archive.Id}", archive.ToResponseDto());
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error creating archive: {ex.Message}");
    }
})
.WithName("CreateArchive")
.WithOpenApi();

// PUT: Update archive file
app.MapPut("/api/archives/{id}", async (int id, UpdateArchiveFileDto dto, ArchiveDbContext db) =>
{
    try
    {
        if (id <= 0)
            return Results.BadRequest("ID harus lebih besar dari 0");
            
        // Validate DTO
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(dto);
        
        if (!Validator.TryValidateObject(dto, validationContext, validationResults, true))
        {
            var errors = validationResults.Select(vr => vr.ErrorMessage).ToList();
            return Results.BadRequest(new { Errors = errors });
        }
        
        var archive = await db.ArchiveFiles.FindAsync(id);
        
        if (archive is null || !archive.IsActive)
            return Results.NotFound("Arsip tidak ditemukan");
        
        archive.UpdateFromDto(dto);
        
        await db.SaveChangesAsync();
        
        return Results.Ok(archive.ToResponseDto());
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error updating archive: {ex.Message}");
    }
})
.WithName("UpdateArchive")
.WithOpenApi();

// DELETE: Soft delete archive file
app.MapDelete("/api/archives/{id}", async (int id, ArchiveDbContext db) =>
{
    try
    {
        if (id <= 0)
            return Results.BadRequest("ID harus lebih besar dari 0");
            
        var archive = await db.ArchiveFiles.FindAsync(id);
        
        if (archive is null || !archive.IsActive)
            return Results.NotFound("Arsip tidak ditemukan");
        
        archive.IsActive = false;
        archive.LastModified = DateTime.Now;
        
        await db.SaveChangesAsync();
        
        return Results.Ok(new { message = "Arsip berhasil dihapus" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error deleting archive: {ex.Message}");
    }
})
.WithName("DeleteArchive")
.WithOpenApi();

// GET: Search archives by category
app.MapGet("/api/archives/category/{category}", async (string category, ArchiveDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(category))
            return Results.BadRequest("Kategori tidak boleh kosong");
            
        var archives = await db.ArchiveFiles
            .Where(a => a.IsActive && a.Category.ToLower().Contains(category.ToLower()))
            .OrderByDescending(a => a.CreatedDate)
            .Select(a => a.ToResponseDto())
            .ToListAsync();
        return Results.Ok(archives);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error searching archives by category: {ex.Message}");
    }
})
.WithName("GetArchivesByCategory")
.WithOpenApi();

// GET: Search archives by department
app.MapGet("/api/archives/department/{department}", async (string department, ArchiveDbContext db) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(department))
            return Results.BadRequest("Departemen tidak boleh kosong");
            
        var archives = await db.ArchiveFiles
            .Where(a => a.IsActive && a.Department.ToLower().Contains(department.ToLower()))
            .OrderByDescending(a => a.CreatedDate)
            .Select(a => a.ToResponseDto())
            .ToListAsync();
        return Results.Ok(archives);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error searching archives by department: {ex.Message}");
    }
})
.WithName("GetArchivesByDepartment")
.WithOpenApi();

// GET: Download uploaded file
app.MapGet("/uploads/{fileName}", async (string fileName, IWebHostEnvironment env) =>
{
    try
    {
        var uploadsPath = Path.Combine(env.WebRootPath, "uploads");
        var filePath = Path.Combine(uploadsPath, fileName);
        
        if (!File.Exists(filePath))
        {
            return Results.NotFound("File tidak ditemukan");
        }
        
        var fileBytes = await File.ReadAllBytesAsync(filePath);
        var contentType = GetContentType(fileName);
        
        return Results.File(fileBytes, contentType, fileName);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error downloading file: {ex.Message}");
    }
})
.WithName("DownloadFile")
.WithOpenApi();

static string GetContentType(string fileName)
{
    var extension = Path.GetExtension(fileName).ToLowerInvariant();
    return extension switch
    {
        ".pdf" => "application/pdf",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls" => "application/vnd.ms-excel",
        ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".ppt" => "application/vnd.ms-powerpoint",
        ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".txt" => "text/plain",
        _ => "application/octet-stream"
    };
}

app.Run();
