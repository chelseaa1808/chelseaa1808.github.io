document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  const cards = Array.from(document.querySelectorAll(".featured-project-card"));
  const expandAllButton = document.getElementById("expand-all");
  const collapseAllButton = document.getElementById("collapse-all");
  const detailSections = Array.from(
    document.querySelectorAll("#featured-projects .project-detail")
  );

  function setFilter(nextFilter) {
    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === nextFilter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    cards.forEach((card) => {
      const matches = nextFilter === "all" || card.dataset.category === nextFilter;
      card.classList.toggle("hidden", !matches);
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter || "all");
    });
  });

  if (expandAllButton) {
    expandAllButton.addEventListener("click", () => {
      detailSections.forEach((detail) => {
        detail.open = true;
      });
    });
  }

  if (collapseAllButton) {
    collapseAllButton.addEventListener("click", () => {
      detailSections.forEach((detail) => {
        detail.open = false;
      });
    });
  }
});
