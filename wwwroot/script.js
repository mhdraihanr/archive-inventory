// API Configuration
const API_BASE = "/api/archives";

// Global Variables
let archives = [];
let editingId = null;
let allArchives = [];

// Initialize Application
document.addEventListener("DOMContentLoaded", function () {
  // Set dashboard as default active section
  showSection("dashboard");
  loadArchives();
  loadDashboardStats();

  // Initialize form submission
  initializeFormSubmission();

  // Initialize file upload functionality
  initializeFileUpload();
});

// Navigation Management
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll(".section");
  sections.forEach((section) => section.classList.remove("active"));

  // Remove active class from all nav links
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => link.classList.remove("active"));

  // Show selected section
  const targetSection = document.getElementById(sectionName + "-section");
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Add active class to clicked nav link
  const activeLink = document.querySelector(
    `[onclick="showSection('${sectionName}')"]`
  );
  if (activeLink) {
    activeLink.classList.add("active");
  }

  // Load data based on section
  if (sectionName === "dashboard") {
    loadDashboardStats();
  } else if (sectionName === "list") {
    loadArchives();
  }
}

// Dashboard Functions
function loadDashboardStats() {
  fetch(API_BASE)
    .then((response) => response.json())
    .then((data) => {
      allArchives = data;
      updateDashboardStats(data);
      loadRecentArchives(data);
    })
    .catch((error) => {
      console.error("Error loading dashboard stats:", error);
      showMessage("Gagal memuat statistik dashboard", "error");
    });
}

function updateDashboardStats(archives) {
  const totalArchives = archives.length;
  const categories = [
    ...new Set(archives.map((a) => a.category).filter((c) => c)),
  ];
  const departments = [
    ...new Set(archives.map((a) => a.department).filter((d) => d)),
  ];
  const totalSize = archives.reduce(
    (sum, archive) => sum + (archive.fileSizeKB || 0),
    0
  );

  document.getElementById("totalArchives").textContent = totalArchives;
  document.getElementById("totalCategories").textContent = categories.length;
  document.getElementById("totalDepartments").textContent = departments.length;
  document.getElementById("totalSize").textContent = formatFileSize(
    totalSize * 1024
  );
}

function loadRecentArchives(archives) {
  const recentArchives = archives
    .sort((a, b) => {
      const dateA = new Date(a.lastModified || a.createdDate || a.createdAt);
      const dateB = new Date(b.lastModified || b.createdDate || b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 5);

  const container = document.getElementById("recentArchivesList");

  if (recentArchives.length === 0) {
    container.innerHTML =
      '<p class="no-results">Belum ada arsip yang tersedia</p>';
    return;
  }

  container.innerHTML = recentArchives
    .map(
      (archive) => `
    <div class="archive-item">
      <div class="archive-header">
        <h3>${escapeHtml(archive.fileName)}</h3>
        <span class="badge category">${escapeHtml(
          archive.category || "Tidak ada kategori"
        )}</span>
      </div>
      <div class="archive-details">
        <p><strong>Deskripsi:</strong> ${escapeHtml(
          archive.description || "Tidak ada deskripsi"
        )}</p>
        <p><strong>Departemen:</strong> ${escapeHtml(
          archive.department || "Tidak ada departemen"
        )}</p>
        <p><strong>Dibuat:</strong> ${formatDate(
          archive.createdDate || archive.createdAt
        )}</p>
        ${
          archive.lastModified
            ? `<p><strong>Diperbarui:</strong> ${formatDate(
                archive.lastModified
              )} oleh ${escapeHtml(archive.modifiedBy || "N/A")}</p>`
            : ""
        }
        <p><strong>Status:</strong> <span class="status-badge status-${(
          archive.status || "Active"
        ).toLowerCase()}">${escapeHtml(archive.status || "Active")}</span></p>
      </div>
    </div>
  `
    )
    .join("");
}

// Search Functions
function searchArchives() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();
  const categoryFilter = document.getElementById("category-filter").value;
  const departmentFilter = document.getElementById("department-filter").value;

  let filteredArchives = allArchives.filter((archive) => {
    const matchesSearch =
      !searchTerm ||
      archive.fileName.toLowerCase().includes(searchTerm) ||
      (archive.description &&
        archive.description.toLowerCase().includes(searchTerm)) ||
      (archive.tags && archive.tags.toLowerCase().includes(searchTerm));

    const matchesCategory =
      !categoryFilter || archive.category === categoryFilter;
    const matchesDepartment =
      !departmentFilter || archive.department === departmentFilter;

    return matchesSearch && matchesCategory && matchesDepartment;
  });

  displaySearchResults(filteredArchives);
}

function displaySearchResults(results) {
  const container = document.getElementById("search-results");

  if (results.length === 0) {
    container.innerHTML =
      '<div class="no-results"><p>Tidak ada hasil yang ditemukan</p></div>';
    return;
  }

  container.innerHTML = results
    .map(
      (archive) => `
    <div class="archive-item">
      <div class="archive-header">
        <h3 class="archive-title">${escapeHtml(archive.fileName)}</h3>
        <div class="archive-actions">
          ${
            archive.filePath && archive.filePath.startsWith("/uploads/")
              ? `<button class="btn-download" onclick="downloadFile('${archive.filePath}', '${archive.fileName}')" title="Download">📥</button>`
              : ""
          }
          <button class="btn-edit" onclick="editArchive(${
            archive.id
          })" title="Edit">✏️</button>
          <button class="btn-delete" onclick="deleteArchive(${
            archive.id
          })" title="Hapus">🗑️</button>
        </div>
      </div>
      <div class="archive-meta">
        <div class="meta-item">
          <span class="meta-label">Tipe:</span> ${escapeHtml(
            archive.fileType || "N/A"
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Ukuran:</span> ${formatFileSize(
            (archive.fileSizeKB || 0) * 1024
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Dibuat:</span> ${formatDate(
            archive.createdDate || archive.createdAt
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Oleh:</span> ${escapeHtml(
            archive.createdBy || "N/A"
          )}
        </div>
        ${
          archive.lastModified
            ? `
        <div class="meta-item">
          <span class="meta-label">Diperbarui:</span> ${formatDate(
            archive.lastModified
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Oleh:</span> ${escapeHtml(
            archive.modifiedBy || "N/A"
          )}
        </div>`
            : ""
        }
        <div class="meta-item">
          <span class="meta-label">Status:</span> <span class="status-badge status-${(
            archive.status || "Active"
          ).toLowerCase()}">${escapeHtml(archive.status || "Active")}</span>
        </div>
      </div>
      <div class="archive-details">
        <p><strong>Deskripsi:</strong> ${escapeHtml(
          archive.description || "Tidak ada deskripsi"
        )}</p>
        <p><strong>Lokasi:</strong> ${escapeHtml(archive.filePath || "N/A")}</p>
        ${
          archive.tags
            ? `<p><strong>Tags:</strong> ${escapeHtml(archive.tags)}</p>`
            : ""
        }
        ${
          archive.notes
            ? `<p><strong>Catatan:</strong> ${escapeHtml(archive.notes)}</p>`
            : ""
        }
        ${
          archive.category
            ? `<span class="badge category">${escapeHtml(
                archive.category
              )}</span>`
            : ""
        }
        ${
          archive.department
            ? `<span class="badge department">${escapeHtml(
                archive.department
              )}</span>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");
}

// Archive Management Functions
function loadArchives() {
  const loadingElement = document.getElementById("loading");
  const archiveListElement = document.getElementById("archive-list");

  if (loadingElement) loadingElement.classList.remove("hidden");

  fetch(API_BASE)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      archives = data;
      allArchives = data;
      displayArchives(data);
      if (loadingElement) loadingElement.classList.add("hidden");
    })
    .catch((error) => {
      console.error("Error loading archives:", error);
      if (loadingElement) loadingElement.classList.add("hidden");
      if (archiveListElement) {
        archiveListElement.innerHTML =
          '<div class="error">Gagal memuat data arsip. Silakan coba lagi.</div>';
      }
    });
}

function displayArchives(archivesToDisplay) {
  const container = document.getElementById("archive-list");

  if (!container) return;

  if (archivesToDisplay.length === 0) {
    container.innerHTML =
      '<div class="no-results"><p>Belum ada arsip yang tersedia</p></div>';
    return;
  }

  container.innerHTML = archivesToDisplay
    .map(
      (archive) => `
    <div class="archive-item">
      <div class="archive-header">
        <h3 class="archive-title">${escapeHtml(archive.fileName)}</h3>
        <div class="archive-actions">
          <button class="btn-edit" onclick="editArchive(${
            archive.id
          })" title="Edit">✏️</button>
          <button class="btn-delete" onclick="deleteArchive(${
            archive.id
          })" title="Hapus">🗑️</button>
        </div>
      </div>
      <div class="archive-meta">
        <div class="meta-item">
          <span class="meta-label">Tipe:</span> ${escapeHtml(
            archive.fileType || "N/A"
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Ukuran:</span> ${formatFileSize(
            (archive.fileSizeKB || 0) * 1024
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Dibuat:</span> ${formatDate(
            archive.createdDate || archive.createdAt
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Oleh:</span> ${escapeHtml(
            archive.createdBy || "N/A"
          )}
        </div>
        ${
          archive.lastModified
            ? `
        <div class="meta-item">
          <span class="meta-label">Diperbarui:</span> ${formatDate(
            archive.lastModified
          )}
        </div>
        <div class="meta-item">
          <span class="meta-label">Oleh:</span> ${escapeHtml(
            archive.modifiedBy || "N/A"
          )}
        </div>`
            : ""
        }
        <div class="meta-item">
          <span class="meta-label">Status:</span> <span class="status-badge status-${(
            archive.status || "Active"
          ).toLowerCase()}">${escapeHtml(archive.status || "Active")}</span>
        </div>
      </div>
      <div class="archive-details">
        <p><strong>Deskripsi:</strong> ${escapeHtml(
          archive.description || "Tidak ada deskripsi"
        )}</p>
        <p><strong>Lokasi:</strong> ${escapeHtml(archive.filePath || "N/A")}</p>
        ${
          archive.tags
            ? `<p><strong>Tags:</strong> ${escapeHtml(archive.tags)}</p>`
            : ""
        }
        ${
          archive.notes
            ? `<p><strong>Catatan:</strong> ${escapeHtml(archive.notes)}</p>`
            : ""
        }
        ${
          archive.category
            ? `<span class="badge category">${escapeHtml(
                archive.category
              )}</span>`
            : ""
        }
        ${
          archive.department
            ? `<span class="badge department">${escapeHtml(
                archive.department
              )}</span>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");
}

// Form Management Functions
function initializeFormSubmission() {
  const form = document.getElementById("archive-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
}

function initializeFileUpload() {
  const fileInput = document.getElementById("fileUpload");
  const fileNameInput = document.getElementById("fileName");
  const fileTypeSelect = document.getElementById("fileType");
  const filePathInput = document.getElementById("filePath");
  const fileSizeInput = document.getElementById("fileSizeKB");

  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        // Auto-fill form fields based on selected file
        if (!fileNameInput.value) {
          fileNameInput.value = file.name;
        }

        // Auto-detect file type
        const extension = file.name.split(".").pop().toLowerCase();
        const typeMapping = {
          pdf: "PDF",
          doc: "DOC",
          docx: "DOC",
          xls: "XLS",
          xlsx: "XLS",
          ppt: "PPT",
          pptx: "PPT",
          jpg: "IMG",
          jpeg: "IMG",
          png: "IMG",
          txt: "TXT",
        };

        if (typeMapping[extension] && !fileTypeSelect.value) {
          fileTypeSelect.value = typeMapping[extension];
        }

        // Set file size
        fileSizeInput.value = (file.size / 1024).toFixed(2);

        // Update file path to indicate upload
        filePathInput.value = `Upload: ${file.name}`;
        filePathInput.readOnly = true;

        showMessage(
          `File "${file.name}" siap untuk diunggah (${formatFileSize(
            file.size
          )})`,
          "success"
        );
      } else {
        // Reset when no file selected
        filePathInput.readOnly = false;
        filePathInput.value = "";
        filePathInput.placeholder =
          "Contoh: /server/documents/2024/ (akan diisi otomatis jika file diunggah)";
      }
    });
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const fileInput = document.getElementById("fileUpload");
  const hasFile = fileInput.files && fileInput.files.length > 0;

  // Basic validation
  const fileName = document.getElementById("fileName").value.trim();
  const fileType = document.getElementById("fileType").value;
  const filePath = document.getElementById("filePath").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!fileName || !fileType || !filePath || !description) {
    showMessage("Harap isi semua field yang wajib diisi (bertanda *)", "error");
    return;
  }

  const submitBtn = document.getElementById("submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = hasFile ? "📤 Mengunggah..." : "💾 Menyimpan...";
  submitBtn.disabled = true;

  if (editingId) {
    // For editing, use the original JSON endpoint
    handleJsonSubmit(editingId);
  } else if (hasFile) {
    // For new archive with file upload
    handleFileUploadSubmit();
  } else {
    // For new archive without file upload
    handleJsonSubmit(null);
  }

  function handleFileUploadSubmit() {
    const formData = new FormData();

    // Add file
    formData.append("file", fileInput.files[0]);

    // Add form fields
    formData.append("fileName", fileName);
    formData.append("fileType", fileType);
    formData.append("filePath", filePath);
    formData.append("description", description);
    formData.append("category", document.getElementById("category").value);
    formData.append("department", document.getElementById("department").value);
    formData.append(
      "fileSizeKB",
      document.getElementById("fileSizeKB").value || "0"
    );
    formData.append(
      "createdBy",
      document.getElementById("createdBy").value.trim()
    );
    formData.append("tags", document.getElementById("tags").value.trim());
    formData.append("notes", document.getElementById("notes").value.trim());

    fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    })
      .then(handleResponse)
      .catch(handleError)
      .finally(resetSubmitButton);
  }

  function handleJsonSubmit(id) {
    const jsonData = {
      fileName: fileName,
      fileType: fileType,
      filePath: filePath,
      description: description,
      category: document.getElementById("category").value,
      department: document.getElementById("department").value,
      fileSizeKB: parseFloat(document.getElementById("fileSizeKB").value) || 0,
      tags: document.getElementById("tags").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      status: document.getElementById("status").value || "Active",
    };

    if (id) {
      // For edit mode, use modifiedBy instead of createdBy
      jsonData.modifiedBy = document.getElementById("createdBy").value.trim();
    } else {
      // For create mode, use createdBy
      jsonData.createdBy = document.getElementById("createdBy").value.trim();
    }

    const url = id ? `${API_BASE}/${id}` : API_BASE;
    const method = id ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
      .then(handleResponse)
      .catch(handleError)
      .finally(resetSubmitButton);
  }

  function handleResponse(response) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json().then((data) => {
      const message = editingId
        ? "Arsip berhasil diperbarui!"
        : hasFile
        ? "File berhasil diunggah dan arsip ditambahkan!"
        : "Arsip berhasil ditambahkan!";
      showMessage(message, "success");
      resetForm();
      loadArchives();
      loadDashboardStats();
    });
  }

  function handleError(error) {
    console.error("Error saving archive:", error);
    const message = hasFile
      ? "Gagal mengunggah file. Silakan coba lagi."
      : "Gagal menyimpan arsip. Silakan coba lagi.";
    showMessage(message, "error");
  }

  function resetSubmitButton() {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function editArchive(id) {
  const archive = archives.find((a) => a.id === id);
  if (!archive) {
    showMessage("Arsip tidak ditemukan", "error");
    return;
  }

  // Switch to add section for editing
  showSection("add");

  // Fill form with archive data
  document.getElementById("archive-id").value = archive.id;
  document.getElementById("fileName").value = archive.fileName || "";
  document.getElementById("fileType").value = archive.fileType || "";
  document.getElementById("filePath").value = archive.filePath || "";
  document.getElementById("description").value = archive.description || "";
  document.getElementById("category").value = archive.category || "";
  document.getElementById("department").value = archive.department || "";
  document.getElementById("fileSizeKB").value = archive.fileSizeKB || "";
  document.getElementById("createdBy").value = archive.createdBy || "";
  document.getElementById("tags").value = archive.tags || "";
  document.getElementById("notes").value = archive.notes || "";
  document.getElementById("status").value = archive.status || "Active";

  // Show and populate update info
  const updateInfo = document.getElementById("last-update-info");
  const createdDate = document.getElementById("created-date");
  const createdByDisplay = document.getElementById("created-by-display");
  const modifiedInfo = document.getElementById("modified-info");
  const modifiedDate = document.getElementById("modified-date");

  updateInfo.style.display = "block";
  createdDate.textContent = formatDate(
    archive.createdDate || archive.createdAt
  );
  createdByDisplay.textContent = archive.createdBy || "N/A";

  if (archive.lastModified) {
    modifiedInfo.style.display = "block";
    modifiedDate.textContent = formatDate(archive.lastModified);
  } else {
    modifiedInfo.style.display = "none";
  }

  // Update form title and button
  document.getElementById("form-title").textContent = "✏️ Edit Arsip";
  document.getElementById("submit-btn").textContent = "💾 Update Arsip";
  document.getElementById("cancel-btn").style.display = "inline-block";

  editingId = id;
}

function deleteArchive(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus arsip ini?")) {
    return;
  }

  fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      showMessage("Arsip berhasil dihapus!", "success");
      loadArchives();
      loadDashboardStats();
    })
    .catch((error) => {
      console.error("Error deleting archive:", error);
      showMessage("Gagal menghapus arsip. Silakan coba lagi.", "error");
    });
}

function cancelEdit() {
  resetForm();
}

function resetForm() {
  document.getElementById("archive-form").reset();
  document.getElementById("archive-id").value = "";
  document.getElementById("status").value = "Active"; // Reset status to default
  document.getElementById("form-title").textContent = "➕ Tambah Arsip Baru";
  document.getElementById("submit-btn").textContent = "💾 Simpan Arsip";

  // Hide update info when adding new archive
  const updateInfo = document.getElementById("last-update-info");
  if (updateInfo) {
    updateInfo.style.display = "none";
  }
  document.getElementById("cancel-btn").style.display = "none";
  editingId = null;

  // Reset file upload specific elements
  const filePathInput = document.getElementById("filePath");
  if (filePathInput) {
    filePathInput.readOnly = false;
    filePathInput.placeholder =
      "Contoh: /server/documents/2024/ (akan diisi otomatis jika file diunggah)";
  }

  // Clear any success messages
  const messageDiv = document.getElementById("message");
  if (messageDiv) {
    messageDiv.innerHTML = "";
  }
}

// Helper function untuk menampilkan informasi pembuat secara terpusat
function getCreatorInfo(archive) {
  return `
    <div class="meta-item">
      <span class="meta-label">Dibuat:</span> ${formatDate(
        archive.createdDate || archive.createdAt
      )}
    </div>
    <div class="meta-item">
      <span class="meta-label">Oleh:</span> ${escapeHtml(
        archive.createdBy || "N/A"
      )}
    </div>
    ${
      archive.lastModified
        ? `
    <div class="meta-item">
      <span class="meta-label">Diperbarui:</span> ${formatDate(
        archive.lastModified
      )}
    </div>`
        : ""
    }`;
}

// Utility Functions
function showMessage(message, type) {
  const messageDiv = document.getElementById("message");
  if (!messageDiv) return;

  messageDiv.innerHTML = `<div class="${type}">${escapeHtml(message)}</div>`;

  // Auto hide success messages after 3 seconds
  if (type === "success") {
    setTimeout(() => {
      messageDiv.innerHTML = "";
    }, 3000);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  if (!text) return "";

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function downloadFile(filePath, fileName) {
  try {
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    link.style.display = "none";

    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage(`Mengunduh file: ${fileName}`, "success");
  } catch (error) {
    console.error("Error downloading file:", error);
    showMessage("Gagal mengunduh file. Silakan coba lagi.", "error");
  }
}

// Event Listeners for Search
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchArchives();
      }
    });
  }
});
