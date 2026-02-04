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

    if (!response.ok) {
      throw new Error("Erro na requisição à API");
    }

    const data = await response.json();

    // Atualiza UI com resultado da frase
    resultText.textContent = data.text;
    resultSentiment.textContent = data.predicted;
    resultConfidence.textContent = data.confidence + "%";

    resultSentiment.className = "text-2xl font-bold";
    if (data.predicted === "Positiva") {
      resultSentiment.classList.add("text-green-600");
    } else if (data.predicted === "Negativa") {
      resultSentiment.classList.add("text-red-600");
    } else {
      resultSentiment.classList.add("text-gray-600");
    }

    // Mostra resultado, mas não métricas
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
 * UPLOAD DE FICHEIRO (placeholder)
 *************************************/
document.getElementById("fileUpload").addEventListener("change", async (e) => {
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

    if (!response.ok) {
      throw new Error("Erro ao processar ficheiro");
    }

    const data = await response.json();

    console.log(data);
    // 🔹 MÉTRICAS REAIS DO MODELO
    mAccuracy.textContent = data.metrics.accuracy;
    mPrecision.textContent = data.metrics.precision;
    mRecall.textContent = data.metrics.recall;
    mF1.textContent = data.metrics.f1;

    // 🔹 Mostrar secção de resultados
    resultSection.classList.remove("hidden");

    // 🔹 Limpar resultado de frase única
    resultText.textContent = "";
    resultSentiment.textContent = "";
    resultConfidence.textContent = "";

    console.log("Ficheiro salvo em:", data.saved_file);

  } catch (err) {
    showError("❌ Erro ao enviar ficheiro para a API.");
    console.error(err);
  }
});
