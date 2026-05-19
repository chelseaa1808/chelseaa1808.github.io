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

  const initiallyActiveButton =
    filterButtons.find((button) => button.classList.contains("active")) ||
    filterButtons[0];

  if (initiallyActiveButton) {
    setFilter(initiallyActiveButton.dataset.filter || "all");
  }

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

  function setChartMessage(elementId, message) {
    const target = document.getElementById(elementId);
    if (!target) return;
    target.innerHTML = `<p style="padding:0.5rem;color:#475569;">${message}</p>`;
  }

  async function renderModulePreviews() {
    if (!document.getElementById("module-chart-mod1")) {
      return;
    }

    if (typeof Plotly === "undefined") {
      [
        "module-chart-mod1",
        "module-chart-mod2",
        "module-chart-mod3",
        "module-chart-mod4",
        "module-chart-mod5",
        "module-chart-mod6",
        "module-chart-final"
      ].forEach((id) => setChartMessage(id, "Interactive chart library failed to load."));
      return;
    }

    let data;
    try {
      const response = await fetch("assets/module-preview-data.json");
      data = await response.json();
    } catch (error) {
      [
        "module-chart-mod1",
        "module-chart-mod2",
        "module-chart-mod3",
        "module-chart-mod4",
        "module-chart-mod5",
        "module-chart-mod6",
        "module-chart-final"
      ].forEach((id) => setChartMessage(id, "Unable to load module preview data."));
      return;
    }

    const baseLayout = {
      margin: { t: 16, r: 12, b: 36, l: 42 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      showlegend: true,
      legend: { orientation: "h", y: -0.24 },
      font: { family: "Segoe UI, Tahoma, sans-serif", size: 11, color: "#334155" }
    };
    const config = { displaylogo: false, responsive: true };

    Plotly.react(
      "module-chart-mod1",
      [
        {
          x: data.mod1.dates,
          y: data.mod1.actual,
          type: "scatter",
          mode: "lines",
          name: "Actual",
          line: { color: "#1d4ed8", width: 2 }
        },
        {
          x: data.mod1.dates,
          y: data.mod1.fit,
          type: "scatter",
          mode: "lines",
          name: "Model Fit",
          line: { color: "#7c3aed", width: 2, dash: "dot" }
        }
      ],
      {
        ...baseLayout,
        yaxis: { title: "Revenue (thousands)" }
      },
      config
    );

    Plotly.react(
      "module-chart-mod2",
      [
        {
          x: data.mod2.quarters,
          y: data.mod2.commissionByQuarter,
          type: "bar",
          marker: { color: "#2563eb" },
          name: "Commission"
        }
      ],
      {
        ...baseLayout,
        yaxis: { title: "Commission ($)" }
      },
      config
    );

    Plotly.react(
      "module-chart-mod3",
      [
        {
          x: data.mod3.scenarioNames,
          y: data.mod3.scenarioNPV,
          type: "bar",
          marker: { color: ["#2563eb", "#0f766e", "#dc2626"] },
          name: "NPV"
        }
      ],
      {
        ...baseLayout,
        yaxis: { title: "NPV ($)" }
      },
      config
    );

    const mod4Series = Object.entries(data.mod4.cumulativeGrowth || {}).map(
      ([ticker, values]) => ({
        x: data.mod4.months,
        y: values,
        type: "scatter",
        mode: "lines",
        name: ticker
      })
    );
    Plotly.react(
      "module-chart-mod4",
      mod4Series,
      {
        ...baseLayout,
        xaxis: { title: "Month Index" },
        yaxis: { title: "Growth of $1" }
      },
      config
    );

    Plotly.react(
      "module-chart-mod5",
      [
        {
          x: data.mod5.periods,
          y: data.mod5.cashflows,
          type: "bar",
          name: "Cash Flow",
          marker: { color: "#2563eb" }
        },
        {
          x: data.mod5.periods,
          y: data.mod5.cumulativeCashflow,
          type: "scatter",
          mode: "lines+markers",
          name: "Cumulative CF",
          yaxis: "y2",
          line: { color: "#7c3aed", width: 2 }
        }
      ],
      {
        ...baseLayout,
        yaxis: { title: "Cash Flow" },
        yaxis2: { title: "Cumulative", overlaying: "y", side: "right" }
      },
      config
    );

    Plotly.react(
      "module-chart-mod6",
      [
        {
          x: data.mod6.terminalStockPrice,
          y: data.mod6.buyStock,
          type: "scatter",
          mode: "lines",
          name: "Buy Stock",
          line: { color: "#1d4ed8" }
        },
        {
          x: data.mod6.terminalStockPrice,
          y: data.mod6.buyCall,
          type: "scatter",
          mode: "lines",
          name: "Buy Call",
          line: { color: "#0f766e" }
        },
        {
          x: data.mod6.terminalStockPrice,
          y: data.mod6.buyPut,
          type: "scatter",
          mode: "lines",
          name: "Buy Put",
          line: { color: "#dc2626" }
        }
      ],
      {
        ...baseLayout,
        xaxis: { title: "Terminal Stock Price" },
        yaxis: { title: "Profit" }
      },
      config
    );

    Plotly.react(
      "module-chart-final",
      [
        {
          x: data.finalProject.frontier.standardDeviation,
          y: data.finalProject.frontier.expectedReturn,
          text: data.finalProject.frontier.portfolioNames,
          mode: "lines+markers",
          type: "scatter",
          line: { color: "#1d4ed8", width: 2 },
          marker: { size: 8, color: "#1e3a8a" },
          hovertemplate:
            "%{text}<br>Std Dev: %{x:.2%}<br>Expected Return: %{y:.2%}<extra></extra>"
        }
      ],
      {
        ...baseLayout,
        xaxis: { title: "Portfolio Risk (Std Dev)", tickformat: ",.0%" },
        yaxis: { title: "Expected Return", tickformat: ",.0%" }
      },
      config
    );
  }

  renderModulePreviews();
});
