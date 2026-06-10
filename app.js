

document.addEventListener("DOMContentLoaded", () => {
  const cartIcon = document.querySelector(".cart-icon");
  const searchInput = document.getElementById("site-search");
  const themeToggle = document.getElementById("themeToggle");
  const newsletterForm = document.querySelector(".newsletter-form");
  const productsGrid = document.getElementById("productsGrid");
  const resourceList = document.getElementById("resourceList");
  const resourceStatus = document.getElementById("resourceStatus");
  const resourceForm = document.getElementById("resourceForm");
  const resourceFormMessage = document.getElementById("resourceFormMessage");
  const resourceSearch = document.getElementById("resource-search");
  const resourceCategoryFilter = document.getElementById("resource-category-filter");
  const resourceStatusFilter = document.getElementById("resource-status-filter");
  const STORAGE_KEY = "shophub_cart_count";
  const THEME_STORAGE_KEY = "shophub_dark_mode";
  const API_URL = "http://localhost:3000/products";
  const RESOURCE_API = "http://localhost:3000/resources";

  let products = [];
  let resources = [];
  let cartCount = parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;

  const debounce = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
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
    const isDark = !document.body.classList.contains("dark-mode");
    localStorage.setItem(THEME_STORAGE_KEY, isDark);
    applyTheme(isDark);
  };

  const setCartCount = (count) => {
    cartCount = count;
    localStorage.setItem(STORAGE_KEY, count);
    if (cartIcon) {
      cartIcon.textContent = `🛒 (${count})`;
    }
  };

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.right = "1rem";
    toast.style.bottom = "1rem";
    toast.style.padding = "1rem 1.25rem";
    toast.style.backgroundColor = "rgba(15, 23, 42, 0.92)";
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

    window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(12px)";
      toast.addEventListener("transitionend", () => {
        toast.remove();
      });
    }, 2200);
  };

  const renderProducts = (productList) => {
    if (!productsGrid) return;

    if (!productList || productList.length === 0) {
      productsGrid.innerHTML = `
        <div class="text-center text-muted py-5">
          No products are available right now. Please try again later.
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = productList
      .map((product) => {
        const discountBadge = product.discount
          ? `<div class="discount-badge" aria-label="${product.discount} percent off">-${product.discount}%</div>`
          : "";

        const stars = "⭐".repeat(product.rating || 4);
        return `
          <article class="product-card" aria-labelledby="product-${product.id}">
            <div class="product-image" aria-hidden="true">
              ${product.icon || "📦"}
              ${discountBadge}
            </div>
            <div class="product-info">
              <h3 id="product-${product.id}" class="product-title">${product.name}</h3>
              <div class="product-rating" aria-label="${product.rating || 4} out of 5 stars, ${product.reviews || 0} reviews">
                ${stars} (${product.reviews || 0} reviews)
              </div>
              <div class="product-price">
                <span class="current-price">$${product.price.toFixed(2)}</span>
                ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ""}
              </div>
              <button class="add-to-cart-btn btn" type="button" data-product-id="${product.id}">Add to Cart</button>
            </div>
          </article>
        `;
      })
      .join("");

    const addToCartButtons = productsGrid.querySelectorAll(".add-to-cart-btn");
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-product-id");
        const product = products.find((item) => String(item.id) === productId);
        const productName = product ? product.name : "Product";

        setCartCount(cartCount + 1);
        showToast(`Added ${productName} to cart.`);
      });
    });
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to load product data.");
      }
      products = await response.json();
      renderProducts(products);
    } catch (error) {
      if (productsGrid) {
        productsGrid.innerHTML = `
          <div class="text-center text-danger py-5">
            Unable to load products. Please ensure the JSON Server is running.
          </div>
        `;
      }
      showToast(error.message);
    }
  };

  const filterProducts = (query) => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      renderProducts(products);
      return;
    }

    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(normalized)
    );

    renderProducts(filtered);
  };

  const setResourceStatus = (message, isError = false) => {
    if (!resourceStatus) return;
    resourceStatus.textContent = message;
    resourceStatus.style.color = isError ? "#b91c1c" : "#334155";
  };

  const renderResources = (list) => {
    if (!resourceList) return;

    if (!list || list.length === 0) {
      resourceList.innerHTML = `
        <div class="text-center text-muted py-5">
          No matching resources were found.
        </div>
      `;
      return;
    }

    resourceList.innerHTML = list
      .map((resource) => {
        return `
          <article class="resource-card" aria-labelledby="resource-${resource.id}">
            <h4 id="resource-${resource.id}">${resource.name}</h4>
            <p>${resource.description}</p>
            <div class="resource-meta">
              <span><strong>Category:</strong> ${resource.category}</span>
              <span><strong>Type:</strong> ${resource.type}</span>
              <span><strong>Status:</strong> ${resource.status}</span>
              <span><strong>Date:</strong> ${resource.date}</span>
              <span><strong>Price:</strong> $${parseFloat(resource.price).toFixed(2)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const getFilteredResources = () => {
    const query = resourceSearch?.value.trim().toLowerCase() || "";
    const category = resourceCategoryFilter?.value;
    const status = resourceStatusFilter?.value;

    return resources.filter((resource) => {
      const matchesQuery =
        !query ||
        resource.name.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.type.toLowerCase().includes(query);
      const matchesCategory = !category || resource.category === category;
      const matchesStatus = !status || resource.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  };

  const updateResourcePanel = () => {
    renderResources(getFilteredResources());
  };

  const resetFormErrors = () => {
    if (!resourceForm) return;
    resourceForm.querySelectorAll(".error-text").forEach((span) => {
      span.textContent = "";
    });
  };

  const setResourceFormMessage = (message, success = true) => {
    if (!resourceFormMessage) return;
    resourceFormMessage.textContent = message;
    resourceFormMessage.style.color = success ? "#166534" : "#b91c1c";
  };

  const validateResourceForm = () => {
    if (!resourceForm) return false;
    resetFormErrors();

    let isValid = true;
    const values = {
      name: resourceForm.name.value.trim(),
      category: resourceForm.category.value,
      type: resourceForm.type.value.trim(),
      status: resourceForm.status.value,
      price: resourceForm.price.value,
      date: resourceForm.date.value,
      description: resourceForm.description.value.trim(),
    };

    if (!values.name) {
      resourceForm.querySelector("#resourceName + .error-text").textContent = "Name is required.";
      isValid = false;
    }

    if (!values.category) {
      resourceForm.querySelector("#resourceCategory + .error-text").textContent = "Category is required.";
      isValid = false;
    }

    if (!values.type) {
      resourceForm.querySelector("#resourceType + .error-text").textContent = "Type is required.";
      isValid = false;
    }

    if (!values.status) {
      resourceForm.querySelector("#resourceStatusField + .error-text").textContent = "Status is required.";
      isValid = false;
    }

    const priceNumber = parseFloat(values.price);
    if (!values.price || Number.isNaN(priceNumber) || priceNumber < 0) {
      resourceForm.querySelector("#resourcePrice + .error-text").textContent = "Enter a valid price.";
      isValid = false;
    }

    if (!values.date) {
      resourceForm.querySelector("#resourceDate + .error-text").textContent = "Available date is required.";
      isValid = false;
    }

    if (!values.description || values.description.length < 10) {
      resourceForm.querySelector("#resourceDescription + .error-text").textContent = "Description must be at least 10 characters.";
      isValid = false;
    }

    return isValid;
  };

  const loadResources = async () => {
    setResourceStatus("Loading resources...");
    if (!resourceList) return;

    try {
      const response = await fetch(RESOURCE_API);
      if (!response.ok) {
        throw new Error("Failed to load resources from the server.");
      }
      resources = await response.json();
      renderResources(resources);
      setResourceStatus(`Showing ${resources.length} resources.`);
    } catch (error) {
      setResourceStatus("Unable to load resources. Check that JSON Server is running.", true);
      resourceList.innerHTML = `
        <div class="text-center text-danger py-5">
          Could not reach JSON Server. Please start it and refresh the page.
        </div>
      `;
      showToast(error.message);
    }
  };

  if (cartIcon) {
    setCartCount(cartCount);
  }

  if (searchInput) {
    searchInput.addEventListener("input", debounce((event) => {
      filterProducts(event.target.value);
    }, 250));
  }

  if (resourceSearch) {
    resourceSearch.addEventListener("input", debounce(updateResourcePanel, 250));
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const emailInput = newsletterForm.querySelector("input[type='email']");
      if (!emailInput || !emailInput.value.trim()) {
        showToast("Please enter a valid email address.");
        return;
      }

      showToast("Thanks! Your subscription is confirmed.");
      newsletterForm.reset();
    });
  }

  if (resourceCategoryFilter) {
    resourceCategoryFilter.addEventListener("change", updateResourcePanel);
  }

  if (resourceStatusFilter) {
    resourceStatusFilter.addEventListener("change", updateResourcePanel);
  }

  if (resourceForm) {
    resourceForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setResourceFormMessage("");

      if (!validateResourceForm()) {
        setResourceFormMessage("Please fix the highlighted fields.", false);
        return;
      }

      const payload = {
        name: resourceForm.name.value.trim(),
        category: resourceForm.category.value,
        type: resourceForm.type.value.trim(),
        status: resourceForm.status.value,
        price: parseFloat(resourceForm.price.value),
        date: resourceForm.date.value,
        description: resourceForm.description.value.trim(),
      };

      try {
        const response = await fetch(RESOURCE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to submit the new resource.");
        }

        const created = await response.json();
        resources.unshift(created);
        updateResourcePanel();
        resourceForm.reset();
        setResourceFormMessage("Resource submitted successfully.", true);
      } catch (error) {
        setResourceFormMessage("Unable to submit resource. Please try again later.", false);
        showToast(error.message);
      }
    });
  }

  loadTheme();
  loadProducts();
  loadResources();
});
