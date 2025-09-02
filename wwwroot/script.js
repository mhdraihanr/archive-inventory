// API Configuration
const API_BASE = "/api/archives";

// Global Variables
let archives = [];
let editingId = null;
let allArchives = [];
let currentPage = 1;
const itemsPerPage = 10;

// Toast notification system
function showToast(type, title, message, duration = 5000) {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
        <div class="toast-progress"></div>
    `;

  toastContainer.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    removeToast(toast);
  }, duration);

  return toast;
}

function removeToast(toast) {
  if (toast && toast.parentElement) {
    toast.classList.add("removing");
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }
}

// Template Management
function createArchiveItemFromTemplate(archive) {
  const template = document.getElementById("archive-item-template");
  const clone = template.content.cloneNode(true);

  // Set data attribute
  const archiveItem = clone.querySelector(".archive-item");
  archiveItem.setAttribute("data-archive-id", archive.id);

  // Fill in the data
  clone.querySelector(".archive-title").textContent = archive.fileName;
  clone.querySelector(".desc-value").textContent =
    archive.description || "Tidak ada deskripsi";
  clone.querySelector(".dept-value").textContent =
    archive.department || "Tidak ada departemen";
  clone.querySelector(".created-value").textContent = formatDate(
    archive.createdDate || archive.createdAt
  );
  clone.querySelector(".file-type-value").textContent =
    archive.fileType || "N/A";
  clone.querySelector(".file-size-value").textContent = formatFileSize(
    (archive.fileSizeKB || 0) * 1024
  );
  clone.querySelector(".file-path-value").textContent =
    archive.filePath || "N/A";

  // Status badge
  const statusBadge = clone.querySelector(".status-badge");
  statusBadge.textContent = archive.status || "Active";
  statusBadge.className = `status-badge status-${(
    archive.status || "Active"
  ).toLowerCase()}`;

  // Category badge
  const categoryBadge = clone.querySelector(".badge.category");
  categoryBadge.textContent = archive.category || "Tidak ada kategori";

  // Handle optional fields
  if (archive.lastModified) {
    const modifiedElement = clone.querySelector(".modified");
    modifiedElement.style.display = "block";
    modifiedElement.querySelector(
      ".modified-value"
    ).textContent = `${formatDate(archive.lastModified)} oleh ${
      archive.modifiedBy || "N/A"
    }`;
  }

  if (archive.tags) {
    const tagsElement = clone.querySelector(".tags");
    tagsElement.style.display = "block";
    tagsElement.querySelector(".tags-value").textContent = archive.tags;
  }

  if (archive.notes) {
    const notesElement = clone.querySelector(".notes");
    notesElement.style.display = "block";
    notesElement.querySelector(".notes-value").textContent = archive.notes;
  }

  // Set up action buttons
  const downloadBtn = clone.querySelector(".btn-download");
  const editBtn = clone.querySelector(".btn-edit");
  const deleteBtn = clone.querySelector(".btn-delete");

  if (archive.filePath && archive.filePath.startsWith("/uploads/")) {
    downloadBtn.onclick = () =>
      downloadFile(archive.filePath, archive.fileName);
  } else {
    downloadBtn.style.display = "none";
  }

  editBtn.onclick = () => editArchive(archive.id);
  deleteBtn.onclick = () => deleteArchive(archive.id);

  // Hide edit and delete buttons only in dashboard
  const currentSection = document.querySelector(".section.active");
  if (currentSection && currentSection.id === "dashboard-section") {
    editBtn.style.display = "none";
    deleteBtn.style.display = "none";
  }

  return clone;
}

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
  container.innerHTML = "";

  if (recentArchives.length === 0) {
    container.innerHTML =
      '<p class="no-results">Belum ada arsip yang tersedia</p>';
    return;
  }

  recentArchives.forEach((archive) => {
    const archiveElement = createArchiveItemFromTemplate(archive);
    
    // Hide edit and delete buttons in dashboard
    const editBtn = archiveElement.querySelector(".btn-edit");
    const deleteBtn = archiveElement.querySelector(".btn-delete");
    if (editBtn) editBtn.style.display = "none";
    if (deleteBtn) deleteBtn.style.display = "none";
    
    container.appendChild(archiveElement);
  });
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
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML =
      '<div class="no-results"><p>Tidak ada hasil yang ditemukan</p></div>';
    return;
  }

  results.forEach((archive) => {
    const archiveElement = createArchiveItemFromTemplate(archive);
    container.appendChild(archiveElement);
  });
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

  // Clear container
  container.innerHTML = "";

  // Create archive items using template
  archivesToDisplay.forEach((archive) => {
    const archiveElement = createArchiveItemFromTemplate(archive);
    container.appendChild(archiveElement);
  });
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
      const title = editingId ? "Arsip Diperbarui" : "Arsip Ditambahkan";
      const message = editingId
        ? "Arsip berhasil diperbarui!"
        : hasFile
        ? "File berhasil diunggah dan arsip ditambahkan!"
        : "Arsip berhasil ditambahkan!";

      // Show toast notification
      showToast("success", title, message);

      // Also show old message for compatibility
      showMessage(message, "success");
      resetForm();
      loadArchives();
      loadDashboardStats();
    });
  }

  function handleError(error) {
    console.error("Error saving archive:", error);
    const title = "Gagal Menyimpan";
    const message = hasFile
      ? "Gagal mengunggah file. Silakan coba lagi."
      : "Gagal menyimpan arsip. Silakan coba lagi.";

    // Show toast notification
    showToast("error", title, message);

    // Also show old message for compatibility
    showMessage(message, "error");
  }

  function resetSubmitButton() {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

let currentEditingArchiveId = null;

function editArchive(id) {
  const archive =
    archives.find((a) => a.id === id) || allArchives.find((a) => a.id === id);
  if (!archive) {
    showMessage("Arsip tidak ditemukan", "error");
    return;
  }

  // Navigate to edit form page
  showSection("edit");

  // Show edit navigation item
  const editNavItem = document.getElementById("edit-nav-item");
  if (editNavItem) {
    editNavItem.style.display = "block";
  }

  // Populate edit form with archive data
  populateEditForm(archive);

  currentEditingArchiveId = id;
}

function populateEditForm(archive) {
  // Populate all form fields with archive data
  document.getElementById("editArchiveId").value = archive.id || "";
  document.getElementById("editFileName").value = archive.fileName || "";
  document.getElementById("editFileType").value = archive.fileType || "";
  document.getElementById("editFilePath").value = archive.filePath || "";
  document.getElementById("editDescription").value = archive.description || "";
  document.getElementById("editCategory").value = archive.category || "";
  document.getElementById("editDepartment").value = archive.department || "";
  document.getElementById("editFileSizeKB").value = archive.fileSizeKB || "";
  document.getElementById("editCreatedBy").value = archive.createdBy || "";
  document.getElementById("editTags").value = archive.tags || "";
  document.getElementById("editNotes").value = archive.notes || "";
  document.getElementById("editStatus").value = archive.status || "Active";

  // Show creation and modification info if available
  const updateInfo = document.getElementById("edit-last-update-info");
  if (updateInfo) {
    updateInfo.style.display = "block";

    // Set creation info
    const createdDate = document.getElementById("edit-created-date");
    const createdBy = document.getElementById("edit-created-by-display");
    if (createdDate) createdDate.textContent = formatDate(archive.createdAt);
    if (createdBy) createdBy.textContent = archive.createdBy || "N/A";

    // Set modification info if available
    if (archive.updatedAt) {
      const modifiedInfo = document.getElementById("edit-modified-info");
      const modifiedDate = document.getElementById("edit-modified-date");
      const modifiedBy = document.getElementById("edit-modified-by-display");

      if (modifiedInfo) modifiedInfo.style.display = "block";
      if (modifiedDate)
        modifiedDate.textContent = formatDate(archive.updatedAt);
      if (modifiedBy) modifiedBy.textContent = archive.updatedBy || "N/A";
    }
  }
}

function cancelEditForm() {
  // Hide edit navigation item
  const editNavItem = document.getElementById("edit-nav-item");
  if (editNavItem) {
    editNavItem.style.display = "none";
  }

  // Navigate back to list or dashboard
  showSection("list");

  // Clear current editing ID
  currentEditingArchiveId = null;

  // Reset form
  const editForm = document.getElementById("editArchiveForm");
  if (editForm) {
    editForm.reset();
  }

  // Hide update info
  const updateInfo = document.getElementById("edit-last-update-info");
  if (updateInfo) {
    updateInfo.style.display = "none";
  }
}

function editArchiveOriginal(id) {
  const archive =
    archives.find((a) => a.id === id) || allArchives.find((a) => a.id === id);
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
  const createdByValue = archive.createdBy || "";
  document.getElementById("createdBy").value = createdByValue;
  document.getElementById("tags").value = archive.tags || "";
  document.getElementById("notes").value = archive.notes || "";
  document.getElementById("status").value = archive.status || "Active";

  // Show and populate update info
  const updateInfo = document.getElementById("last-update-info");
  const createdDate = document.getElementById("created-date");
  const createdByDisplay = document.getElementById("created-by-display");
  const modifiedInfo = document.getElementById("modified-info");
  const modifiedDate = document.getElementById("modified-date");
  const modifiedByDisplay = document.getElementById("modified-by-display");

  updateInfo.style.display = "block";
  createdDate.textContent = formatDate(
    archive.createdDate || archive.createdAt
  );
  createdByDisplay.textContent = createdByValue || "N/A";

  if (archive.lastModified) {
    modifiedInfo.style.display = "block";
    modifiedDate.textContent = formatDate(archive.lastModified);
    modifiedByDisplay.textContent = archive.modifiedBy || "N/A";
  } else {
    modifiedInfo.style.display = "none";
  }

  // Update form title and button
  document.getElementById("form-title").textContent = "✏️ Edit Arsip";
  document.getElementById("submit-btn").textContent = "💾 Update Arsip";
  document.getElementById("cancel-btn").style.display = "inline-block";

  editingId = id;
}

function saveInlineEdit() {
  if (!currentEditingArchiveId) {
    showMessage("Tidak ada data yang sedang diedit", "error");
    return;
  }

  // Show status update
  showStatusUpdate("Menyimpan perubahan...");

  // Get form data
  const formData = {
    fileName: document.getElementById("edit-fileName").value.trim(),
    fileType: document.getElementById("edit-fileType").value,
    description: document.getElementById("edit-description").value.trim(),
    category: document.getElementById("edit-category").value,
    department: document.getElementById("edit-department").value,
    tags: document.getElementById("edit-tags").value.trim(),
    status: document.getElementById("edit-status").value,
    notes: document.getElementById("edit-notes").value.trim(),
    modifiedBy: "Admin", // You can make this dynamic based on current user
  };

  // Validate required fields
  if (!formData.fileName || !formData.description) {
    showMessage("Nama file dan deskripsi harus diisi", "error");
    showStatusUpdate("Gagal menyimpan: Data tidak lengkap");
    return;
  }

  // Send update request
  fetch(`${API_BASE}/${currentEditingArchiveId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      showMessage("Arsip berhasil diperbarui!", "success");
      showStatusUpdate("Data berhasil diperbaharui!");

      // Update the archive item with new data
      updateArchiveItemDisplay(currentEditingArchiveId, data);

      // Close the inline edit form after a short delay
      setTimeout(() => {
        cancelInlineEdit();
        loadArchives(); // Refresh the list
        loadDashboardStats(); // Update dashboard stats
      }, 1500);
    })
    .catch((error) => {
      console.error("Error updating archive:", error);
      showMessage("Gagal memperbarui arsip. Silakan coba lagi.", "error");
      showStatusUpdate("Gagal menyimpan perubahan");
    });
}

function cancelInlineEdit() {
  // Remove all inline edit forms
  const editForms = document.querySelectorAll(".inline-edit-form");
  editForms.forEach((form) => form.remove());

  // Remove editing class from all archive items
  const editingItems = document.querySelectorAll(".archive-item.editing");
  editingItems.forEach((item) => item.classList.remove("editing"));

  // Hide status update
  hideStatusUpdate();

  currentEditingArchiveId = null;
}

function showStatusUpdate(message) {
  const statusUpdate = document.getElementById("status-update");
  const statusMessage = document.querySelector(".status-message");

  if (statusUpdate && statusMessage) {
    statusMessage.innerHTML = `✅ <strong>Status:</strong> ${message}`;
    statusUpdate.style.display = "block";
  }
}

function hideStatusUpdate() {
  const statusUpdate = document.getElementById("status-update");
  if (statusUpdate) {
    statusUpdate.style.display = "none";
  }
}

function updateArchiveItemDisplay(id, updatedData) {
  const archiveItem = document.querySelector(`[data-archive-id="${id}"]`);
  if (!archiveItem) return;

  // Update the title
  const titleElement = archiveItem.querySelector(".archive-title");
  if (titleElement) {
    titleElement.textContent = updatedData.fileName || "N/A";
  }

  // Update meta information
  const metaItems = archiveItem.querySelectorAll(".meta-item");
  metaItems.forEach((item) => {
    const label = item.querySelector(".meta-label");
    if (!label) return;

    const labelText = label.textContent;
    const valueElement = label.nextSibling;

    switch (labelText) {
      case "Tipe:":
        if (valueElement)
          valueElement.textContent = ` ${updatedData.fileType || "N/A"}`;
        break;
      case "Status:":
        const statusBadge = item.querySelector(".status-badge");
        if (statusBadge) {
          statusBadge.textContent = updatedData.status || "Active";
          statusBadge.className = `status-badge status-${(
            updatedData.status || "Active"
          ).toLowerCase()}`;
        }
        break;
    }
  });

  // Update description
  const descElement = archiveItem.querySelector(".archive-details p");
  if (descElement && descElement.innerHTML.includes("Deskripsi:")) {
    descElement.innerHTML = `<strong>Deskripsi:</strong> ${escapeHtml(
      updatedData.description || "Tidak ada deskripsi"
    )}`;
  }

  // Update tags if present
  const tagsElement = archiveItem.querySelector(
    ".archive-details p:nth-of-type(3)"
  );
  if (
    tagsElement &&
    tagsElement.innerHTML.includes("Tags:") &&
    updatedData.tags
  ) {
    tagsElement.innerHTML = `<strong>Tags:</strong> ${escapeHtml(
      updatedData.tags
    )}`;
  }

  // Update badges
  const categoryBadge = archiveItem.querySelector(".badge.category");
  if (categoryBadge && updatedData.category) {
    categoryBadge.textContent = updatedData.category;
  }

  const departmentBadge = archiveItem.querySelector(".badge.department");
  if (departmentBadge && updatedData.department) {
    departmentBadge.textContent = updatedData.department;
  }
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

      // Show toast notification
      showToast("success", "Arsip Dihapus", "Arsip berhasil dihapus!");

      // Also show old message for compatibility
      showMessage("Arsip berhasil dihapus!", "success");
      loadArchives();
      loadDashboardStats();
    })
    .catch((error) => {
      console.error("Error deleting archive:", error);

      // Show toast notification
      showToast(
        "error",
        "Gagal Menghapus",
        "Gagal menghapus arsip. Silakan coba lagi."
      );

      // Also show old message for compatibility
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

  // Reset created-by-display
  const createdByDisplay = document.getElementById("created-by-display");
  if (createdByDisplay) {
    createdByDisplay.textContent = "N/A";
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

  // Cancel any inline editing
  cancelInlineEdit();

  // Hide status update
  hideStatusUpdate();
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

  // Initialize edit form submission
  initializeEditFormSubmission();
});

// Initialize Edit Form Submission
function initializeEditFormSubmission() {
  const editForm = document.getElementById("editArchiveForm");
  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitEditForm();
    });
  }
}

// Submit Edit Form
function submitEditForm() {
  const archiveId = document.getElementById("editArchiveId").value;

  if (!archiveId || !currentEditingArchiveId) {
    showMessage("ID arsip tidak valid", "error");
    return;
  }

  // Collect form data
  const formData = {
    fileName: document.getElementById("editFileName").value,
    fileType: document.getElementById("editFileType").value,
    filePath: document.getElementById("editFilePath").value,
    description: document.getElementById("editDescription").value,
    category: document.getElementById("editCategory").value,
    department: document.getElementById("editDepartment").value,
    fileSizeKB:
      parseFloat(document.getElementById("editFileSizeKB").value) || 0,
    createdBy: document.getElementById("editCreatedBy").value,
    tags: document.getElementById("editTags").value,
    notes: document.getElementById("editNotes").value,
    status: document.getElementById("editStatus").value,
  };

  // Validate required fields
  if (!formData.fileName || !formData.description) {
    showMessage("Nama file dan deskripsi harus diisi", "error");
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById("edit-submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "⏳ Menyimpan...";
  submitBtn.disabled = true;

  // Send update request
  fetch(`${API_BASE}/${currentEditingArchiveId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Show toast notification
      showToast("success", "Arsip Diperbarui", "Arsip berhasil diperbarui!");

      // Also show old message for compatibility
      showMessage("Arsip berhasil diperbarui!", "success");

      // Show success status
      const statusUpdate = document.getElementById("edit-status-update");
      if (statusUpdate) {
        statusUpdate.style.display = "block";
        const statusMessage = statusUpdate.querySelector(".status-message");
        if (statusMessage) {
          statusMessage.innerHTML =
            "✅ <strong>Status:</strong> Data berhasil diperbaharui!";
        }
      }

      // Hide edit navigation item immediately
      const editNavItem = document.getElementById("edit-nav-item");
      if (editNavItem) {
        editNavItem.style.display = "none";
      }

      // Navigate back to list after a short delay
      setTimeout(() => {
        cancelEditForm();
        showSection("list");
        loadArchives(); // Refresh the list
        loadDashboardStats(); // Update dashboard stats
      }, 1500);
    })
    .catch((error) => {
      console.error("Error updating archive:", error);

      // Show toast notification
      showToast(
        "error",
        "Gagal Memperbarui",
        "Gagal memperbarui arsip. Silakan coba lagi."
      );

      // Also show old message for compatibility
      showMessage("Gagal memperbarui arsip. Silakan coba lagi.", "error");
    })
    .finally(() => {
      // Reset button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
}
