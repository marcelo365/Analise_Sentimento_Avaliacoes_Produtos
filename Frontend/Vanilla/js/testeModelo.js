/*************************************
 * ELEMENTOS DO DOM
 *************************************/
const inputText = document.getElementById("inputText");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultSection = document.getElementById("resultSection");
const errorBox = document.getElementById("errorBox");

const resultText = document.getElementById("resultText");
const resultSentiment = document.getElementById("resultSentiment");
const resultConfidence = document.getElementById("resultConfidence");

const mAccuracy = document.getElementById("mAccuracy");
const mPrecision = document.getElementById("mPrecision");
const mRecall = document.getElementById("mRecall");
const mF1 = document.getElementById("mF1");

const fileUpload = document.getElementById("fileUpload");

/*************************************
 * UTILITÁRIOS
 *************************************/
function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

/*************************************
 * INPUT ÚNICO - CHAMADA API
 *************************************/
analyzeBtn.addEventListener("click", async () => {
  hideError();
  const text = inputText.value.trim();

  if (!text) {
    showError("⚠️ Por favor, insira uma frase para análise.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error("Erro na requisição à API");

    const data = await response.json();

    resultText.textContent = data.text;
    resultSentiment.textContent = data.predicted;
    resultConfidence.textContent = data.confidence + "%";

    resultSentiment.className = "text-2xl font-bold";
    if (data.predicted === "Positiva") resultSentiment.classList.add("text-green-600");
    else if (data.predicted === "Negativa") resultSentiment.classList.add("text-red-600");
    else resultSentiment.classList.add("text-gray-600");

    resultSection.classList.remove("hidden");
    mAccuracy.textContent = "";
    mPrecision.textContent = "";
    mRecall.textContent = "";
    mF1.textContent = "";

  } catch (err) {
    showError("❌ Não foi possível conectar à API.");
    console.error(err);
  }
});

/*************************************
 * UPLOAD DE FICHEIRO + PRÉ-VISUALIZAÇÃO
 *************************************/

// Container da tabela de pré-visualização
let previewTableContainer = null;
let previewTableBody = null;
let previewCurrentPage = 1;
const previewRowsPerPage = 5;

// Cria tabela de pré-visualização dinamicamente
function createPreviewTable(container) {
  container.innerHTML = `
    <div class="overflow-x-auto mt-4">
      <table class="min-w-full border text-sm bg-gray-50">
        <thead class="bg-gray-100">
          <tr>
            <th class="border px-3 py-2">Texto</th>
            <th class="border px-3 py-2">Predição</th>
            <th class="border px-3 py-2">Confiança (%)</th>
          </tr>
        </thead>
        <tbody id="previewTableBody"></tbody>
      </table>
      <div class="flex justify-between items-center mt-2">
        <button id="prevPreviewPage" class="px-3 py-1 bg-gray-200 rounded">◀</button>
        <span id="previewPageInfo" class="text-sm text-gray-600"></span>
        <button id="nextPreviewPage" class="px-3 py-1 bg-gray-200 rounded">▶</button>
      </div>
    </div>
  `;
  previewTableBody = document.getElementById("previewTableBody");

  document.getElementById("prevPreviewPage").onclick = () => {
    if (previewCurrentPage > 1) {
      previewCurrentPage--;
      renderPreviewTable(previewTableData);
    }
  };
  document.getElementById("nextPreviewPage").onclick = () => {
    const totalPages = Math.ceil(previewTableData.length / previewRowsPerPage);
    if (previewCurrentPage < totalPages) {
      previewCurrentPage++;
      renderPreviewTable(previewTableData);
    }
  };
}

// Renderiza tabela de pré-visualização
let previewTableData = [];
function renderPreviewTable(data) {
  if (!previewTableBody) return;

  const start = (previewCurrentPage - 1) * previewRowsPerPage;
  const pageData = data.slice(start, start + previewRowsPerPage);

  previewTableBody.innerHTML = pageData.map(row => `
    <tr>
      <td class="border px-3 py-2">${row.text}</td>
      <td class="border px-3 py-2 font-semibold">${row.pred}</td>
      <td class="border px-3 py-2 text-center">${row.confidence.toFixed(2)}%</td>
    </tr>
  `).join("");

  const totalPages = Math.max(1, Math.ceil(data.length / previewRowsPerPage));
  document.getElementById("previewPageInfo").textContent = `Página ${previewCurrentPage} de ${totalPages}`;
}

// Listener do upload
fileUpload.addEventListener("change", async (e) => {
  e.preventDefault();
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
    showError("❌ Formato inválido. Use CSV ou XLSX.");
    return;
  }

  hideError();

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:5000/predict-file", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Erro ao processar ficheiro");

    const data = await response.json();

    // Atualiza métricas globais
    mAccuracy.textContent = data.metrics.accuracy;
    mPrecision.textContent = data.metrics.precision;
    mRecall.textContent = data.metrics.recall;
    mF1.textContent = data.metrics.f1;

    // Mostra resultado geral
    resultSection.classList.remove("hidden");

    // Limpa resultado de frase única
    resultText.textContent = "";
    resultSentiment.textContent = "";
    resultConfidence.textContent = "";

    // Pré-visualização
    previewTableData = data.preview;
    previewCurrentPage = 1;

    // Cria container da tabela se ainda não existir
    if (!previewTableContainer) {
      previewTableContainer = document.createElement("div");
      previewTableContainer.className = "bg-white rounded-lg shadow-md p-6 mt-4";
      fileUpload.closest("div").appendChild(previewTableContainer);
      createPreviewTable(previewTableContainer);
    }

    renderPreviewTable(previewTableData);

  } catch (err) {
    showError("❌ Erro ao enviar ficheiro para a API.");
    console.error(err);
  }
});

