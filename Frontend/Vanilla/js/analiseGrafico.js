/* =======================
   DADOS (backend)
======================= */

let excelData = [];
let metricsData = null;
let distributionData = null;
let perClassData = null;
let confusionData = null;

// =======================
// PRÉ-VISUALIZAÇÃO
// =======================

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
   GRÁFICOS
======================= */

function renderDistributionCharts() {
  // usar os labels reais do backend
  const counts = { Positiva: 0, Negativa: 0, Neutra: 0 };

  excelData.forEach(r => {
    if (counts[r.pred] !== undefined) {
      counts[r.pred]++;
    }
  });

  // Gráfico pizza
  new Chart(document.getElementById("distributionChart"), {
    type: "pie",
    data: {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts) }]
    }
  });

  // Gráfico barras
  new Chart(document.getElementById("predictionVsTrueChart"), {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [
        {
          label: "Predições",
          data: Object.values(counts)
        }
      ]
    }
  });

  // Resumo
  const container = document.getElementById("distributionValues");
  container.innerHTML = Object.entries(counts)
    .map(([k, v]) => `<div><b>${k}</b>: ${v}</div>`)
    .join("");
}


function renderAccuracyChart() {
  new Chart(document.getElementById("accuracyChart"), {
    type: "doughnut",
    data: {
      labels: ["Accuracy", "Erro"],
      datasets: [
        {
          data: [metricsData.accuracy, 100 - metricsData.accuracy]
        }
      ]
    }
  });
}

function renderPrecisionRecallCurve() {
  const labels = perClassData.map(d => d.class);
  const precision = perClassData.map(d => d.precision);
  const recall = perClassData.map(d => d.recall);

  new Chart(document.getElementById("precisionRecallCurve"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Precisão",
          data: precision,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Recall",
          data: recall,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}


function renderPerClassMetrics() {
  const labels = perClassData.map(d => d.class);
  const precision = perClassData.map(d => d.precision);
  const recall = perClassData.map(d => d.recall);
  const f1 = perClassData.map(d => d.f1);

  new Chart(document.getElementById("perClassMetricsChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Precisão", data: precision },
        { label: "Recall", data: recall },
        { label: "F1", data: f1 }
      ]
    }
  });

  const table = document.getElementById("perClassMetricsTable");
  table.innerHTML = labels
    .map(
      (l, i) => `
      <tr>
        <td class="border px-3 py-2">${l}</td>
        <td class="border px-3 py-2">${precision[i].toFixed(1)}%</td>
        <td class="border px-3 py-2">${recall[i].toFixed(1)}%</td>
        <td class="border px-3 py-2">${f1[i].toFixed(1)}%</td>
      </tr>
    `
    )
    .join("");
}

function renderConfusionMatrix() {
  const matrixBody = document.getElementById("confusionMatrixContainer");
  const statsTable = document.getElementById("confusionStatsTable");
  const headerRow = document.getElementById("cmHeader");

  matrixBody.innerHTML = "";
  statsTable.innerHTML = "";
  headerRow.innerHTML = "";

  const labels = confusionData.labels;
  const matrix = confusionData.matrix;

  // ===== HEADER DA MATRIZ =====
  headerRow.innerHTML = "<th class='border px-3 py-2 bg-blue-200'>Real \\ Prev</th>";
  labels.forEach(l => {
    headerRow.innerHTML += `<th class="border px-3 py-2 bg-blue-200">${l}</th>`;
  });

  // ===== MAX para escala de cor =====
  const maxVal = Math.max(...matrix.flat());

  // ===== MATRIZ AZUL =====
  matrix.forEach((row, i) => {
    let tr = `<tr><th class="border px-3 py-2 bg-blue-100">${labels[i]}</th>`;

    row.forEach((val, j) => {
      const intensity = val / maxVal;
      const alpha = 0.15 + intensity * 0.7;

      tr += `
        <td class="border px-3 py-2 font-semibold"
            style="background: rgba(37,99,235,${alpha})">
          ${val}
        </td>
      `;
    });

    tr += "</tr>";
    matrixBody.innerHTML += tr;
  });

  // ===== TABELA TP FP FN TN =====
  labels.forEach((cls, idx) => {

    const tp = matrix[idx][idx];

    const fn = matrix[idx].reduce((s,v,i)=> i!==idx ? s+v : s, 0);

    const fp = matrix.reduce((s,row,i)=> i!==idx ? s+row[idx] : s, 0);

    const tn = matrix.reduce((s,row,i)=>
      s + row.reduce((ss,val,j)=>
        (i!==idx && j!==idx) ? ss+val : ss, 0)
    ,0);

    statsTable.innerHTML += `
      <tr>
        <td class="border px-3 py-2 font-medium">${cls}</td>
        <td class="border px-3 py-2">${tp}</td>
        <td class="border px-3 py-2">${fp}</td>
        <td class="border px-3 py-2">${fn}</td>
        <td class="border px-3 py-2">${tn}</td>
      </tr>
    `;
  });
}


/* =======================
   INICIALIZAÇÃO
======================= */

function initDashboard() {
  renderTable();
  renderDistributionCharts();
  renderAccuracyChart();
  renderPrecisionRecallCurve();
  renderPerClassMetrics();
  renderConfusionMatrix();
}

// =======================
// FETCH BACKEND
// =======================

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

      initDashboard();
    })
    .catch(err => {
      console.warn(err.message);
    });
});
