const API_BASE_URL = "http://localhost:3000";
const RESOURCES_ENDPOINT = `${API_BASE_URL}/resources`;
const resourceForm = document.getElementById("resourceForm");
const resourceTableBody = document.getElementById("resourceTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortField = document.getElementById("sortField");
const sortDirection = document.getElementById("sortDirection");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const paginationNav = document.getElementById("pagination");
const logoutBtn = document.getElementById("logoutBtn");
const addResourceBtn = document.getElementById("addResourceBtn");
const totalResourcesValue = document.getElementById("totalResourcesValue");
const availableResourcesValue = document.getElementById("availableResourcesValue");
const averagePriceValue = document.getElementById("averagePriceValue");
const hiddenResourcesValue = document.getElementById("hiddenResourcesValue");
const editConfirmModal = document.getElementById("editConfirmModal");
const closeEditModalBtn = document.getElementById("closeEditModal");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const confirmEditBtn = document.getElementById("confirmEditBtn");
const editModalBody = document.getElementById("editModalBody");
const themeToggle = document.getElementById("themeToggle");
const THEME_STORAGE_KEY = "shophub_dark_mode";

let resources = [];
let editResourceId = null;
let currentPage = 1;
const pageSize = 6;
let pendingEditResource = null;

const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
};

const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.right = "1rem";
  toast.style.bottom = "1rem";
  toast.style.padding = "1rem 1.25rem";
  toast.style.backgroundColor = type === "error" ? "rgba(185, 28, 28, 0.95)" : "rgba(15, 23, 42, 0.92)";
  toast.style.color = "white";
  toast.style.borderRadius = "1rem";
  toast.style.boxShadow = "0 12px 30px rgba(0,0,0,0.2)";
  toast.style.zIndex = 1100;
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
  toast.style.transform = "translateY(12px)";

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    toast.addEventListener("transitionend", () => {
      toast.remove();
    });
  }, 2200);
};

const getBadgeClass = (status) => {
  if (status === "Sold Out") return "bg-danger";
  if (status === "Coming Soon") return "bg-warning text-dark";
  return "bg-success";
};

const applyTheme = (isDark) => {
  if (isDark) {
    document.body.classList.add("dark-mode");
    if (themeToggle) themeToggle.textContent = "Light Mode";
  } else {
    document.body.classList.remove("dark-mode");
    if (themeToggle) themeToggle.textContent = "Dark Mode";
  }
};

const loadTheme = () => {
  const enabled = localStorage.getItem(THEME_STORAGE_KEY) === "true";
  applyTheme(enabled);
};

const toggleTheme = () => {
  const enabled = !document.body.classList.contains("dark-mode");
  localStorage.setItem(THEME_STORAGE_KEY, enabled);
  applyTheme(enabled);
};

const sortResources = (list) => {
  const field = sortField?.value || "name";
  const direction = sortDirection?.value === "desc" ? -1 : 1;

  return [...list].sort((a, b) => {
    const first = (a[field] || "").toString().toLowerCase();
    const second = (b[field] || "").toString().toLowerCase();
    if (first < second) return -1 * direction;
    if (first > second) return 1 * direction;
    return 0;
  });
};

const getFilteredResources = () => {
  const query = searchInput?.value.trim().toLowerCase() || "";
  const status = statusFilter?.value;

  return resources.filter((resource) => {
    const matchesQuery =
      !query ||
      resource.name.toLowerCase().includes(query) ||
      resource.category.toLowerCase().includes(query) ||
      resource.type.toLowerCase().includes(query) ||
      resource.description.toLowerCase().includes(query);
    const matchesStatus = status === "All" || resource.status === status;
    return matchesQuery && matchesStatus;
  });
};

const renderResources = (resourceList = []) => {
  if (!resourceTableBody) return;
  resourceTableBody.innerHTML = "";

  if (!resourceList.length) {
    resourceTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          No resources match your filters.
        </td>
      </tr>
    `;
    return;
  }

  resourceTableBody.innerHTML = resourceList
    .map((resource) => {
      return `
        <tr>
          <td>${resource.name}</td>
          <td>${resource.category}</td>
          <td>${resource.type}</td>
          <td>$${Number(resource.price || 0).toFixed(2)}</td>
          <td><span class="badge ${getBadgeClass(resource.status)}">${resource.status}</span></td>
          <td>${resource.date || "—"}</td>
          <td>${resource.hidden ? "Yes" : "No"}</td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-outline-secondary me-1 edit-resource" data-id="${resource.id}">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-danger delete-resource" data-id="${resource.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
};

const renderPagination = (totalItems) => {
  if (!paginationNav) return;

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const buttons = [];

  for (let page = 1; page <= pageCount; page += 1) {
    buttons.push(`
      <li class="page-item ${page === currentPage ? "active" : ""}">
        <button class="page-link" type="button" data-page="${page}">${page}</button>
      </li>
    `);
  }

  paginationNav.innerHTML = buttons.join("");
};

const updateTable = () => {
  const filtered = getFilteredResources();
  const filteredSorted = sortResources(filtered);
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const pageItems = filteredSorted.slice(start, start + pageSize);

  renderResources(pageItems);
  renderPagination(filteredSorted.length);
};

const updateStats = () => {
  const total = resources.length;
  const available = resources.filter((item) => item.status === "Available").length;
  const hidden = resources.filter((item) => item.hidden).length;
  const averagePrice = total
    ? resources.reduce((sum, item) => sum + Number(item.price || 0), 0) / total
    : 0;

  if (totalResourcesValue) totalResourcesValue.textContent = total;
  if (availableResourcesValue) availableResourcesValue.textContent = `${available}`;
  if (averagePriceValue) averagePriceValue.textContent = `$${averagePrice.toFixed(2)}`;
  if (hiddenResourcesValue) hiddenResourcesValue.textContent = `${hidden}`;
};

const hideEditModal = () => {
  if (!editConfirmModal) return;
  editConfirmModal.classList.remove("show");
  editConfirmModal.style.display = "none";
};

const openEditModal = (resource) => {
  pendingEditResource = resource;
  if (editModalBody) {
    editModalBody.textContent = `Edit ${resource.name}?`;
  }
  if (editConfirmModal) {
    editConfirmModal.classList.add("show");
    editConfirmModal.style.display = "block";
  }
};

const resetForm = () => {
  if (!resourceForm) return;
  resourceForm.reset();
  editResourceId = null;
  pendingEditResource = null;
};

const fillForm = (resource) => {
  document.getElementById("resourceName").value = resource.name || "";
  document.getElementById("resourceCategory").value = resource.category || "";
  document.getElementById("resourceType").value = resource.type || "";
  document.getElementById("resourceStatus").value = resource.status || "";
  document.getElementById("resourcePrice").value = resource.price || "";
  document.getElementById("resourceDate").value = resource.date || "";
  document.getElementById("resourceHidden").checked = !!resource.hidden;
  document.getElementById("resourceDescription").value = resource.description || "";
  editResourceId = resource.id;
};

const validateResource = () => {
  if (!resourceForm) return false;

  const name = document.getElementById("resourceName").value.trim();
  const category = document.getElementById("resourceCategory").value;
  const type = document.getElementById("resourceType").value.trim();
  const status = document.getElementById("resourceStatus").value;
  const price = Number(document.getElementById("resourcePrice").value);
  const date = document.getElementById("resourceDate").value;
  const description = document.getElementById("resourceDescription").value.trim();

  if (!name || !category || !type || !status || Number.isNaN(price) || price < 0 || !date || description.length < 10) {
    showToast("Please complete all required fields before saving.", "error");
    return false;
  }

  return true;
};

const getPayload = () => ({
  name: document.getElementById("resourceName").value.trim(),
  category: document.getElementById("resourceCategory").value,
  type: document.getElementById("resourceType").value.trim(),
  status: document.getElementById("resourceStatus").value,
  price: Number(document.getElementById("resourcePrice").value),
  date: document.getElementById("resourceDate").value,
  hidden: document.getElementById("resourceHidden").checked,
  description: document.getElementById("resourceDescription").value.trim()
});

resourceForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateResource()) return;

  const payload = getPayload();
  const endpoint = editResourceId ? `${RESOURCES_ENDPOINT}/${editResourceId}` : RESOURCES_ENDPOINT;
  const method = editResourceId ? "PUT" : "POST";

  try {
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Unable to save resource.");

    await fetchResources();
    resetForm();
    showToast(`Resource ${editResourceId ? "updated" : "created"} successfully.`);
  } catch (error) {
    showToast(error.message, "error");
  }
});

resourceTableBody?.addEventListener("click", async (event) => {
  const editButton = event.target.closest(".edit-resource");
  const deleteButton = event.target.closest(".delete-resource");

  if (editButton) {
    const resourceId = Number(editButton.dataset.id);
    const resource = resources.find((item) => Number(item.id) === resourceId);
    if (resource) openEditModal(resource);
    return;
  }

  if (deleteButton) {
    const resourceId = Number(deleteButton.dataset.id);
    if (!confirm("Delete this resource?")) return;

    try {
      const response = await fetch(`${RESOURCES_ENDPOINT}/${resourceId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete resource.");

      await fetchResources();
      resetForm();
      showToast("Resource deleted.");
    } catch (error) {
      showToast(error.message, "error");
    }
  }
});

searchInput?.addEventListener("input", debounce(() => {
  currentPage = 1;
  updateTable();
}, 250));

statusFilter?.addEventListener("change", () => {
  currentPage = 1;
  updateTable();
});

sortField?.addEventListener("change", () => updateTable());
sortDirection?.addEventListener("change", () => updateTable());

paginationNav?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");
  if (!button) return;
  currentPage = Number(button.dataset.page);
  updateTable();
});

exportCsvBtn?.addEventListener("click", () => {
  const rows = [
    ["Name", "Category", "Type", "Price", "Status", "Date", "Hidden", "Description"],
    ...getFilteredResources().map((resource) => [
      resource.name,
      resource.category,
      resource.type,
      resource.price,
      resource.status,
      resource.date,
      resource.hidden ? "Yes" : "No",
      resource.description.replace(/\n/g, " ")
    ])
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "resources.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

exportJsonBtn?.addEventListener("click", () => {
  const payload = JSON.stringify(getFilteredResources(), null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "resources.json");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

addResourceBtn?.addEventListener("click", () => {
  resetForm();
  resourceForm?.scrollIntoView({ behavior: "smooth", block: "start" });
});

logoutBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

closeEditModalBtn?.addEventListener("click", hideEditModal);
cancelEditBtn?.addEventListener("click", hideEditModal);
confirmEditBtn?.addEventListener("click", () => {
  if (!pendingEditResource) return;
  fillForm(pendingEditResource);
  hideEditModal();
  showToast("Edit mode enabled. Update fields and save.");
});

themeToggle?.addEventListener("click", toggleTheme);

const fetchResources = async () => {
  try {
    const response = await fetch(RESOURCES_ENDPOINT);
    if (!response.ok) throw new Error("Unable to load resources.");

    resources = await response.json();
    updateStats();
    updateTable();
  } catch (error) {
    showToast(error.message, "error");
  }
};

loadTheme();
fetchResources();
