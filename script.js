document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  const cards = Array.from(document.querySelectorAll(".featured-project-card"));
  const expandAllButton = document.getElementById("expand-all");
  const collapseAllButton = document.getElementById("collapse-all");
  const detailSections = Array.from(
    document.querySelectorAll("#featured-projects .project-detail")
  );

  const previewModal = document.getElementById("artifact-preview-modal");
  const previewBody = document.getElementById("artifact-preview-body");
  const previewTitle = document.getElementById("artifact-preview-title");
  const previewClose = document.getElementById("artifact-preview-close");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

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

  function closeArtifactModal() {
    if (!previewModal) return;
    previewModal.hidden = true;
    previewBody.innerHTML = "";
  }

  function openArtifactModal(title) {
    if (!previewModal) return;
    previewTitle.textContent = title || "Artifact Preview";
    previewModal.hidden = false;
  }

  async function renderSpreadsheetPreview(fileUrl) {
    if (typeof XLSX === "undefined") {
      previewBody.innerHTML = "<p>Spreadsheet preview library unavailable.</p>";
      return;
    }
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetNames = workbook.SheetNames || [];
    if (!sheetNames.length) {
      previewBody.innerHTML = "<p>No sheets available in this workbook.</p>";
      return;
    }

    previewBody.innerHTML = `
      <div class="preview-grid">
        <aside class="preview-pane">
          <h4>Workbook Metadata</h4>
          <ul class="preview-meta-list">
            <li><strong>File:</strong> ${escapeHtml(fileUrl.split("/").pop())}</li>
            <li><strong>Sheets:</strong> ${sheetNames.length}</li>
            <li><strong>Type:</strong> Spreadsheet</li>
          </ul>
        </aside>
        <section class="preview-pane">
          <select class="preview-sheet-select" id="preview-sheet-select"></select>
          <div class="preview-table-wrapper" id="preview-table-wrapper"></div>
        </section>
      </div>
    `;

    const sheetSelect = document.getElementById("preview-sheet-select");
    const tableWrapper = document.getElementById("preview-table-wrapper");
    sheetSelect.innerHTML = sheetNames
      .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
      .join("");

    const renderSheet = (sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }).slice(0, 40);
      if (!rows.length) {
        tableWrapper.innerHTML = "<p>Sheet is empty.</p>";
        return;
      }
      const maxCols = Math.min(20, Math.max(...rows.map((row) => row.length)));
      const header = rows[0] || [];
      let html = "<table class='preview-table'><thead><tr>";
      for (let c = 0; c < maxCols; c += 1) {
        const label = header[c] || `Column ${c + 1}`;
        html += `<th>${escapeHtml(label)}</th>`;
      }
      html += "</tr></thead><tbody>";
      rows.slice(1).forEach((row) => {
        html += "<tr>";
        for (let c = 0; c < maxCols; c += 1) {
          html += `<td>${escapeHtml(row[c])}</td>`;
        }
        html += "</tr>";
      });
      html += "</tbody></table>";
      tableWrapper.innerHTML = html;
    };

    sheetSelect.addEventListener("change", () => renderSheet(sheetSelect.value));
    renderSheet(sheetNames[0]);
  }

  async function renderDocxPreview(fileUrl) {
    if (typeof mammoth === "undefined") {
      previewBody.innerHTML = "<p>DOCX preview library unavailable.</p>";
      return;
    }
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    previewBody.innerHTML = `
      <div class="preview-grid">
        <aside class="preview-pane">
          <h4>Document Metadata</h4>
          <ul class="preview-meta-list">
            <li><strong>File:</strong> ${escapeHtml(fileUrl.split("/").pop())}</li>
            <li><strong>Type:</strong> Word Document (DOCX)</li>
          </ul>
        </aside>
        <section class="preview-pane">${result.value || "<p>No preview content available.</p>"}</section>
      </div>
    `;
  }

  function csvTextToTable(csvText, maxRows = 22) {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length);
    if (!lines.length) return "<p>No tabular preview data found.</p>";
    const rows = lines.slice(0, maxRows).map((line) => line.split(","));
    const maxCols = Math.min(18, Math.max(...rows.map((row) => row.length)));
    let html = "<div class='preview-table-wrapper'><table class='preview-table'><tbody>";
    rows.forEach((row, idx) => {
      html += "<tr>";
      for (let c = 0; c < maxCols; c += 1) {
        const cell = escapeHtml(row[c]);
        html += idx === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`;
      }
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    return html;
  }

  async function renderTwbxPreview(fileUrl) {
    if (typeof JSZip === "undefined") {
      previewBody.innerHTML = "<p>ZIP preview library unavailable.</p>";
      return;
    }
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
    const fileList = entries
      .slice(0, 40)
      .map((name) => `<li>${escapeHtml(name)}</li>`)
      .join("");

    let csvPreview = "<p>No embedded CSV preview found.</p>";
    const csvEntryName = entries.find((name) => name.toLowerCase().endsWith(".csv"));
    if (csvEntryName) {
      const csvText = await zip.file(csvEntryName).async("text");
      csvPreview = csvTextToTable(csvText);
    }

    previewBody.innerHTML = `
      <div class="preview-grid">
        <aside class="preview-pane">
          <h4>Packaged Workbook Contents</h4>
          <ul class="preview-meta-list">
            <li><strong>File:</strong> ${escapeHtml(fileUrl.split("/").pop())}</li>
            <li><strong>Type:</strong> Tableau Packaged Workbook (.twbx)</li>
            <li><strong>Contained files:</strong> ${entries.length}</li>
          </ul>
          <div class="preview-code">${fileList || "No files listed."}</div>
        </aside>
        <section class="preview-pane">
          <h4>Embedded Dataset Preview</h4>
          ${csvPreview}
        </section>
      </div>
    `;
  }

  function renderBasicPreview(fileUrl, extension) {
    previewBody.innerHTML = `
      <div class="preview-pane">
        <h4>Preview Unavailable for ${escapeHtml(extension.toUpperCase())}</h4>
        <p>This artifact type does not support rich in-browser preview in this lightweight mode.</p>
        <ul class="preview-meta-list">
          <li><strong>File:</strong> ${escapeHtml(fileUrl.split("/").pop())}</li>
          <li><strong>Path:</strong> ${escapeHtml(fileUrl)}</li>
        </ul>
        <a href="${escapeHtml(fileUrl)}" class="resume-btn" download>Download File</a>
      </div>
    `;
  }

  async function renderArtifactPreview(link) {
    const href = link.getAttribute("href");
    if (!href) return;
    const absoluteUrl = new URL(href, window.location.href);
    const fileUrl = absoluteUrl.pathname.startsWith("/")
      ? absoluteUrl.pathname.slice(1)
      : absoluteUrl.pathname;
    const filename = fileUrl.split("/").pop() || "Artifact";
    const extension = (filename.split(".").pop() || "").toLowerCase();

    openArtifactModal(link.textContent?.trim() || filename);
    previewBody.innerHTML = "<p>Loading preview...</p>";

    try {
      if (["pdf"].includes(extension)) {
        previewBody.innerHTML = `<iframe class="artifact-preview-frame" src="${escapeHtml(fileUrl)}"></iframe>`;
      } else if (["mp4", "webm"].includes(extension)) {
        previewBody.innerHTML = `<video class="artifact-preview-video" controls src="${escapeHtml(fileUrl)}"></video>`;
      } else if (["html", "htm"].includes(extension)) {
        previewBody.innerHTML = `<iframe class="artifact-preview-frame" src="${escapeHtml(fileUrl)}"></iframe>`;
      } else if (["xlsx", "xlsm"].includes(extension)) {
        await renderSpreadsheetPreview(fileUrl);
      } else if (["docx"].includes(extension)) {
        await renderDocxPreview(fileUrl);
      } else if (["twbx"].includes(extension)) {
        await renderTwbxPreview(fileUrl);
      } else {
        renderBasicPreview(fileUrl, extension);
      }
    } catch (error) {
      previewBody.innerHTML = `<p>Preview failed to load. You can still download the file.</p><a href="${escapeHtml(fileUrl)}" class="resume-btn" download>Download File</a>`;
    }
  }

  function initDownloadPreviewButtons() {
    const downloadLinks = Array.from(
      document.querySelectorAll("a[download][data-preview='true']")
    );
    downloadLinks.forEach((link) => {
      if (link.dataset.previewAttached === "true") return;
      if (!link.getAttribute("href")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "file-preview-trigger";
      button.textContent = "Preview";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        renderArtifactPreview(link);
      });
      link.insertAdjacentElement("afterend", button);
      link.dataset.previewAttached = "true";
    });
  }

  if (previewClose) {
    previewClose.addEventListener("click", closeArtifactModal);
  }
  if (previewModal) {
    previewModal.addEventListener("click", (event) => {
      if (event.target === previewModal) closeArtifactModal();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && previewModal && !previewModal.hidden) {
      closeArtifactModal();
    }
  });

  async function renderModulePreviews() {
    if (!document.getElementById("module-chart-mod1")) return;

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
    } catch (_error) {
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
        { x: data.mod1.dates, y: data.mod1.actual, type: "scatter", mode: "lines", name: "Actual", line: { color: "#1d4ed8", width: 2 } },
        { x: data.mod1.dates, y: data.mod1.fit, type: "scatter", mode: "lines", name: "Model Fit", line: { color: "#7c3aed", width: 2, dash: "dot" } }
      ],
      { ...baseLayout, yaxis: { title: "Revenue (thousands)" } },
      config
    );

    Plotly.react(
      "module-chart-mod2",
      [{ x: data.mod2.quarters, y: data.mod2.commissionByQuarter, type: "bar", marker: { color: "#2563eb" }, name: "Commission" }],
      { ...baseLayout, yaxis: { title: "Commission ($)" } },
      config
    );

    Plotly.react(
      "module-chart-mod3",
      [{ x: data.mod3.scenarioNames, y: data.mod3.scenarioNPV, type: "bar", marker: { color: ["#2563eb", "#0f766e", "#dc2626"] }, name: "NPV" }],
      { ...baseLayout, yaxis: { title: "NPV ($)" } },
      config
    );

    const mod4Series = Object.entries(data.mod4.cumulativeGrowth || {}).map(([ticker, values]) => ({
      x: data.mod4.months,
      y: values,
      type: "scatter",
      mode: "lines",
      name: ticker
    }));
    Plotly.react(
      "module-chart-mod4",
      mod4Series,
      { ...baseLayout, xaxis: { title: "Month Index" }, yaxis: { title: "Growth of $1" } },
      config
    );

    Plotly.react(
      "module-chart-mod5",
      [
        { x: data.mod5.periods, y: data.mod5.cashflows, type: "bar", name: "Cash Flow", marker: { color: "#2563eb" } },
        { x: data.mod5.periods, y: data.mod5.cumulativeCashflow, type: "scatter", mode: "lines+markers", name: "Cumulative CF", yaxis: "y2", line: { color: "#7c3aed", width: 2 } }
      ],
      { ...baseLayout, yaxis: { title: "Cash Flow" }, yaxis2: { title: "Cumulative", overlaying: "y", side: "right" } },
      config
    );

    Plotly.react(
      "module-chart-mod6",
      [
        { x: data.mod6.terminalStockPrice, y: data.mod6.buyStock, type: "scatter", mode: "lines", name: "Buy Stock", line: { color: "#1d4ed8" } },
        { x: data.mod6.terminalStockPrice, y: data.mod6.buyCall, type: "scatter", mode: "lines", name: "Buy Call", line: { color: "#0f766e" } },
        { x: data.mod6.terminalStockPrice, y: data.mod6.buyPut, type: "scatter", mode: "lines", name: "Buy Put", line: { color: "#dc2626" } }
      ],
      { ...baseLayout, xaxis: { title: "Terminal Stock Price" }, yaxis: { title: "Profit" } },
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

  initDownloadPreviewButtons();
  renderModulePreviews();
});
