/* =======================
   DADOS (backend)
======================= */

let excelData = [];
let metricsData = null;
let distributionData = null;
let perClassData = null;
let confusionData = null;
let confidenceByClassData = null;

/* =======================
   PRÉ-VISUALIZAÇÃO + FILTRO
======================= */

let currentPage = 1;
const rowsPerPage = 5;

const tableBody = document.getElementById("excelPreviewTable");
const pageInfo = document.getElementById("pageInfo");
const confidenceInput = document.getElementById("confidenceFilter");

function getFilteredData() {
  const minConfidence = Number(confidenceInput.value) || 0;
  return excelData.filter(r => r.confidence >= minConfidence);
}

function renderTable() {
  if (!excelData) return;

  const filtered = getFilteredData();
  const start = (currentPage - 1) * rowsPerPage;
  const pageData = filtered.slice(start, start + rowsPerPage);

  tableBody.innerHTML = "";

  pageData.forEach(row => {
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

document.getElementById("nextPage").onclick = () => {
  const totalPages = Math.ceil(getFilteredData().length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
};

document.getElementById("prevPage").onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
};

confidenceInput.oninput = () => {
  currentPage = 1;
  renderTable();
};

/* =======================
   GRÁFICOS DISTRIBUIÇÃO
======================= */

function renderDistributionCharts() {
  if (!excelData) return;

  const counts = { Positiva: 0, Negativa: 0, Neutra: 0 };

  excelData.forEach(r => {
    if (counts[r.pred] !== undefined) counts[r.pred]++;
  });

  new Chart(document.getElementById("distributionChart"), {
    type: "pie",
    data: {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts) }]
    }
  });

  new Chart(document.getElementById("predictionVsTrueChart"), {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Predições",
        data: Object.values(counts)
      }]
    }
  });

  const container = document.getElementById("distributionValues");
  container.innerHTML = Object.entries(counts)
    .map(([k,v]) => `<div><b>${k}</b>: ${v}</div>`)
    .join("");
}

/* =======================
   NOVOS GRÁFICOS DESEMPENHO
======================= */

function renderConfidenceByClassChart() {
  if (!confidenceByClassData) return;

  const labels = confidenceByClassData.map(d => d.class);
  const values = confidenceByClassData.map(d => d.avg_confidence);

  new Chart(document.getElementById("confidenceByClassChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Confiança Média (%)",
        data: values
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function renderPrecisionRecallBarChart() {
  if (!perClassData) return;

  const labels = perClassData.map(d => d.class);
  const precision = perClassData.map(d => d.precision);
  const recall = perClassData.map(d => d.recall);
  const f1 = perClassData.map(d => d.f1);

  new Chart(document.getElementById("precisionRecallBarChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Precisão", data: precision },
        { label: "Recall", data: recall },
        { label: "F1", data: f1 }
      ]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

/* =======================
   PRECISION-RECALL CURVE
======================= */

let prCurveChart = null;

function renderPrecisionRecallCurveChart(prCurvesData) {
  if (!prCurvesData) return;

  const ctx = document.getElementById("precisionRecallCurveChart").getContext("2d");

  if (prCurveChart) prCurveChart.destroy();

  const datasets = Object.entries(prCurvesData).map(([label, data], idx) => ({
    label: `${label} (AP=${data.ap})`,
    data: data.recall.map((r, i) => ({ x: r, y: data.precision[i] })),
    borderColor: ["#1f77b4","#ff7f0e","#2ca02c"][idx % 3],
    backgroundColor: "transparent",
    tension: 0.2
  }));

  prCurveChart = new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Precision–Recall Curve" },
        legend: { position: "bottom" }
      },
      scales: {
        x: { type: "linear", title: { display: true, text: "Recall" }, min: 0, max: 1 },
        y: { title: { display: true, text: "Precision" }, min: 0, max: 1 }
      }
    }
  });
}

/* =======================
   MÉTRICAS POR CLASSE
======================= */

function renderPerClassMetrics() {
  if (!perClassData) return;

  const labels = perClassData.map(d => d.class);
  const precision = perClassData.map(d => d.precision);
  const recall = perClassData.map(d => d.recall);
  const f1 = perClassData.map(d => d.f1);

  // ===== GRÁFICO =====
  new Chart(document.getElementById("perClassMetricsChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Precisão", data: precision },
        { label: "Recall", data: recall },
        { label: "F1", data: f1 }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });

  // ===== TABELA =====
  const table = document.getElementById("perClassMetricsTable");

  table.innerHTML = perClassData.map(d => `
    <tr>
      <td class="border px-3 py-2">${d.class}</td>
      <td class="border px-3 py-2">${d.precision.toFixed(1)}%</td>
      <td class="border px-3 py-2">${d.recall.toFixed(1)}%</td>
      <td class="border px-3 py-2">${d.f1.toFixed(1)}%</td>
    </tr>
  `).join("");
}

/* =======================
   MATRIZ DE CONFUSÃO
======================= */

function renderConfusionMatrix() {
  if (!confusionData) return;

  const matrixBody = document.getElementById("confusionMatrixContainer");
  const statsTable = document.getElementById("confusionStatsTable");
  const headerRow = document.getElementById("cmHeader");

  matrixBody.innerHTML = "";
  statsTable.innerHTML = "";
  headerRow.innerHTML = "";

  const labels = confusionData.labels;
  const matrix = confusionData.matrix;

  headerRow.innerHTML =
    "<th class='border px-3 py-2 bg-blue-200'>Real \\ Prev</th>";

  labels.forEach(l => {
    headerRow.innerHTML +=
      `<th class="border px-3 py-2 bg-blue-200">${l}</th>`;
  });

  const maxVal = Math.max(...matrix.flat());

  matrix.forEach((row, i) => {
    let tr = `<tr><th class="border px-3 py-2 bg-blue-100">${labels[i]}</th>`;

    row.forEach(val => {
      const alpha = 0.15 + (val / maxVal) * 0.7;

      tr += `
        <td class="border px-3 py-2 font-semibold"
            style="background: rgba(37,99,235,${alpha})">
          ${val}
        </td>`;
    });

    tr += "</tr>";
    matrixBody.innerHTML += tr;
  });

  labels.forEach((cls, idx) => {
    const tp = matrix[idx][idx];
    const fn = matrix[idx].reduce((s,v,i)=> i!==idx? s+v:s,0);
    const fp = matrix.reduce((s,row,i)=> i!==idx? s+row[idx]:s,0);
    const tn = matrix.reduce((s,row,i)=>
      s + row.reduce((ss,val,j)=>
        (i!==idx && j!==idx ? ss+val : ss),0),0);

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
   INIT DASHBOARD
======================= */

function initDashboard() {
  renderTable();
  renderDistributionCharts();
  renderConfidenceByClassChart();
  renderPrecisionRecallBarChart();
  renderPerClassMetrics();
  renderConfusionMatrix();

  // Novo gráfico Precision-Recall Curve
  if (metricsData && metricsData.pr_curves) {
    renderPrecisionRecallCurveChart(metricsData.pr_curves || window.prCurvesData);
  } else if (window.prCurvesData) {
    renderPrecisionRecallCurveChart(window.prCurvesData);
  }
}

/* =======================
   FETCH BACKEND
======================= */

document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:5000/last-results")
    .then(res => {
      if (!res.ok) throw new Error("Nenhum dado disponível");
      return res.json();
    })
    .then(data => {
      excelData = data.preview;
      metricsData = data.metrics;
      distributionData = data.distribution;
      perClassData = data.per_class_metrics;
      confusionData = data.confusion_matrix;
      confidenceByClassData = data.confidence_by_class;
      window.prCurvesData = data.pr_curves; 

      initDashboard();
    })
    .catch(err => console.warn(err.message));
});
