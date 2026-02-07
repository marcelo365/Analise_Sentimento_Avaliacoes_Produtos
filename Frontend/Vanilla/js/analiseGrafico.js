/* =======================
   DADOS (backend)
======================= */

let excelData = [];
let metricsData = null;
let distributionData = null;
let perClassData = null;
let confusionData = null;
let confidenceByClassData = null;
let topWordsData = null;
let topWordsChart = null;

/* =======================
   PRÉ-VISUALIZAÇÃO + FILTRO
======================= */

let currentPage = 1;
const rowsPerPage = 5;

const tableBody = document.getElementById("excelPreviewTable");
const pageInfo = document.getElementById("pageInfo");
const confidenceInput = document.getElementById("confidenceFilter");
const sentimentFilter = document.getElementById("sentimentFilter");
const textInput = document.getElementById("textFilter");

const nextBtn = document.getElementById("nextPage");
const prevBtn = document.getElementById("prevPage");

/* =======================
   FILTRO DE DADOS
======================= */

function getFilteredData() {
  const minConfidence = confidenceInput
    ? Number(confidenceInput.value) || 0
    : 0;
  const sentiment = sentimentFilter ? sentimentFilter.value : "ALL";
  const textFilter = textInput ? textInput.value.toLowerCase() : "";

  return excelData.filter((r) => {
    const okConfidence = r.confidence >= minConfidence;
    const okSentiment = sentiment === "ALL" || r.pred === sentiment;
    const okText = r.text.toLowerCase().includes(textFilter);

    return okConfidence && okSentiment && okText;
  });
}

function renderTable() {
  if (!excelData || !tableBody || !pageInfo) return;

  const filtered = getFilteredData();
  const start = (currentPage - 1) * rowsPerPage;
  const pageData = filtered.slice(start, start + rowsPerPage);

  tableBody.innerHTML = "";

  pageData.forEach((row) => {
    tableBody.innerHTML += `
      <tr>
        <td class="border px-3 py-2">${row.text}</td>
        <td class="border px-3 py-2 font-semibold">${row.pred}</td>
        <td class="border px-3 py-2 text-center">${row.confidence.toFixed(2)}%</td>
      </tr>
    `;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
}

/* =======================
   EVENTOS DE FILTRO E PAGINAÇÃO
======================= */

if (nextBtn) {
  nextBtn.onclick = () => {
    const totalPages = Math.ceil(getFilteredData().length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };
}

if (prevBtn) {
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };
}

if (confidenceInput) {
  confidenceInput.oninput = () => {
    currentPage = 1;
    renderTable();
  };
}

if (sentimentFilter) {
  sentimentFilter.onchange = () => {
    currentPage = 1;
    renderTable();
  };
}

if (textInput) {
  textInput.oninput = () => {
    currentPage = 1;
    renderTable();
  };
}

/* =======================
   GRÁFICOS DISTRIBUIÇÃO
======================= */

function renderDistributionCharts() {
  if (!excelData) return;

  const counts = { Positiva: 0, Negativa: 0, Neutra: 0 };
  excelData.forEach((r) => {
    if (counts[r.pred] !== undefined) counts[r.pred]++;
  });

  const pie = document.getElementById("distributionChart");
  if (pie) {
    new Chart(pie, {
      type: "pie",
      data: {
        labels: Object.keys(counts),
        datasets: [{ data: Object.values(counts) }],
      },
    });
  }

  const bar = document.getElementById("predictionVsTrueChart");
  if (bar) {
    new Chart(bar, {
      type: "bar",
      data: {
        labels: Object.keys(counts),
        datasets: [{ label: "Predições", data: Object.values(counts) }],
      },
    });
  }

  const container = document.getElementById("distributionValues");
  if (container) {
    container.innerHTML = Object.entries(counts)
      .map(([k, v]) => `<div><b>${k}</b>: ${v}</div>`)
      .join("");
  }
}

/* =======================
   NOVOS GRÁFICOS DESEMPENHO
======================= */

function renderConfidenceByClassChart() {
  if (!confidenceByClassData) return;
  const el = document.getElementById("confidenceByClassChart");
  if (!el) return;

  const labels = confidenceByClassData.map((d) => d.class);
  const values = confidenceByClassData.map((d) => d.avg_confidence);

  new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Confiança Média (%)", data: values }],
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } } },
  });
}

function renderPrecisionRecallBarChart() {
  if (!perClassData) return;
  const el = document.getElementById("precisionRecallBarChart");
  if (!el) return;

  const labels = perClassData.map((d) => d.class);
  new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Precisão", data: perClassData.map((d) => d.precision) },
        { label: "Recall", data: perClassData.map((d) => d.recall) },
        { label: "F1", data: perClassData.map((d) => d.f1) },
      ],
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } } },
  });
}

/* =======================
   PRECISION-RECALL CURVE
======================= */

let prCurveChart = null;

function renderPrecisionRecallCurveChart(prCurvesData) {
  if (!prCurvesData) return;
  const canvas = document.getElementById("precisionRecallCurveChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (prCurveChart) prCurveChart.destroy();

  const datasets = Object.entries(prCurvesData).map(([label, data], idx) => ({
    label: `${label} (AP=${data.ap})`,
    data: data.recall.map((r, i) => ({ x: r, y: data.precision[i] })),
    borderColor: ["#1f77b4", "#ff7f0e", "#2ca02c"][idx % 3],
    backgroundColor: "transparent",
    tension: 0.2,
    borderWidth: 2,
    pointRadius: 0,
  }));

  prCurveChart = new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Precision–Recall Curve" },
        legend: { position: "bottom" },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 1,
          title: { display: true, text: "Recall" },
        },
        y: { min: 0, max: 1, title: { display: true, text: "Precision" } },
      },
    },
  });
}

/* =======================
   MÉTRICAS POR CLASSE
======================= */

function renderPerClassMetrics() {
  if (!perClassData) return;
  const chartEl = document.getElementById("perClassMetricsChart");
  if (chartEl) {
    new Chart(chartEl, {
      type: "bar",
      data: {
        labels: perClassData.map((d) => d.class),
        datasets: [
          { label: "Precisão", data: perClassData.map((d) => d.precision) },
          { label: "Recall", data: perClassData.map((d) => d.recall) },
          { label: "F1", data: perClassData.map((d) => d.f1) },
        ],
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } },
    });
  }

  const table = document.getElementById("perClassMetricsTable");
  if (table) {
    table.innerHTML = perClassData
      .map(
        (d) => `
      <tr>
        <td class="border px-3 py-2">${d.class}</td>
        <td class="border px-3 py-2">${d.precision.toFixed(1)}%</td>
        <td class="border px-3 py-2">${d.recall.toFixed(1)}%</td>
        <td class="border px-3 py-2">${d.f1.toFixed(1)}%</td>
      </tr>
    `,
      )
      .join("");
  }
}

/* =======================
   MATRIZ DE CONFUSÃO
======================= */

function renderConfusionMatrix() {
  if (!confusionData) return;

  const matrixBody = document.getElementById("confusionMatrixContainer");
  const statsTable = document.getElementById("confusionStatsTable");
  const headerRow = document.getElementById("cmHeader");
  if (!matrixBody || !statsTable || !headerRow) return;

  matrixBody.innerHTML = "";
  statsTable.innerHTML = "";
  headerRow.innerHTML = "";

  const labels = confusionData.labels;
  const matrix = confusionData.matrix;

  headerRow.innerHTML =
    "<th class='border px-3 py-2 bg-blue-200'>Real \\ Prev</th>";
  labels.forEach(
    (l) =>
      (headerRow.innerHTML += `<th class="border px-3 py-2 bg-blue-200">${l}</th>`),
  );

  const maxVal = Math.max(...matrix.flat());

  matrix.forEach((row, i) => {
    let tr = `<tr><th class="border px-3 py-2 bg-blue-100">${labels[i]}</th>`;
    row.forEach((val) => {
      const alpha = 0.15 + (val / maxVal) * 0.7;
      tr += `<td class="border px-3 py-2 font-semibold" style="background: rgba(37,99,235,${alpha})">${val}</td>`;
    });
    tr += "</tr>";
    matrixBody.innerHTML += tr;
  });

  labels.forEach((cls, idx) => {
    const tp = matrix[idx][idx];
    const fn = matrix[idx].reduce((s, v, i) => (i !== idx ? s + v : s), 0);
    const fp = matrix.reduce((s, row, i) => (i !== idx ? s + row[idx] : s), 0);
    const tn = matrix.reduce(
      (s, row, i) =>
        s +
        row.reduce((ss, val, j) => (i !== idx && j !== idx ? ss + val : ss), 0),
      0,
    );

    statsTable.innerHTML += `
      <tr>
        <td class="border px-3 py-2">${cls}</td>
        <td class="border px-3 py-2">${tp}</td>
        <td class="border px-3 py-2">${fp}</td>
        <td class="border px-3 py-2">${fn}</td>
        <td class="border px-3 py-2">${tn}</td>
      </tr>`;
  });
}

/* =======================
   TOP PALAVRAS IMPORTANTES
======================= */

function renderTopWordsChart() {
  if (!topWordsData) return;

  const canvas = document.getElementById("topWordsChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (topWordsChart) topWordsChart.destroy();

  const datasets = [];
  const labelsSet = new Set();

  // recolher todas palavras únicas
  Object.values(topWordsData).forEach((arr) => {
    arr.forEach((w) => labelsSet.add(w.word));
  });

  const labels = Array.from(labelsSet);

  const colors = {
    Positiva: "#16a34a",
    Negativa: "#dc2626",
    Neutra: "#2563eb",
  };

  Object.entries(topWordsData).forEach(([sentiment, words]) => {
    const map = {};
    words.forEach((w) => (map[w.word] = w.count));

    datasets.push({
      label: sentiment,
      data: labels.map((l) => map[l] || 0),
      backgroundColor: colors[sentiment] || "#888",
    });
  });

  topWordsChart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Top Palavras por Sentimento",
        },
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Frequência" },
        },
      },
    },
  });
}

/* =======================
   INIT DASHBOARD
======================= */

/* =======================
   INIT DASHBOARD
======================= */

function initDashboard() {
  renderTable();
  renderDistributionCharts();
  renderConfidenceByClassChart();
  renderPrecisionRecallBarChart();
  renderTopWordsChart();

  // ===== Verifica se há métricas por classe e matriz de confusão =====
  const perClassCard = document
    .querySelector("#metricas")
    ?.closest(".bg-white");
  const confusionCard = document
    .querySelector("#confusao")
    ?.closest(".bg-white");
  const precisionRecallDiv = document.getElementById("precisionRecallBarChart")?.parentNode;
  const precisionCurveDiv = document.getElementById("precisionRecallCurveChart")?.parentNode;


  const hasLabels =
    perClassData &&
    perClassData.length > 0 &&
    confusionData &&
    confusionData.labels &&
    confusionData.labels.length > 0;

  if (!hasLabels) {
    if (perClassCard) perClassCard.style.display = "none";
    if (confusionCard) confusionCard.style.display = "none";

  } else {
    // Renderiza normalmente se houver labels
    renderPerClassMetrics();
    renderConfusionMatrix();
  }

  if (!hasLabels) {
    if (precisionRecallDiv) precisionRecallDiv.style.display = "none";
    if (precisionCurveDiv) precisionCurveDiv.style.display = "none";
  } else {
    if (precisionRecallDiv) precisionRecallDiv.style.display = "block";
    if (precisionCurveDiv) precisionCurveDiv.style.display = "block";
  }

  // ===== Precision-Recall Curve =====
  if (metricsData && metricsData.pr_curves) {
    renderPrecisionRecallCurveChart(
      metricsData.pr_curves || window.prCurvesData,
    );
  } else if (window.prCurvesData) {
    renderPrecisionRecallCurveChart(window.prCurvesData);
  }
}

/* =======================
   FETCH BACKEND
======================= */

document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5000/last-results")
    .then((res) => {
      if (!res.ok) throw new Error("Nenhum dado disponível");
      return res.json();
    })
    .then((data) => {
      excelData = data.preview;
      metricsData = data.metrics;
      distributionData = data.distribution;
      perClassData = data.per_class_metrics;
      confusionData = data.confusion_matrix;
      confidenceByClassData = data.confidence_by_class;
      window.prCurvesData = data.pr_curves;
      topWordsData = data.top_words;

      initDashboard();
    })
    .catch((err) => console.warn(err.message));
});
