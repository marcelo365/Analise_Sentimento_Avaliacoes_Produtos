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
 * MODELO (SIMULAÇÃO)
 * depois podes trocar por API real
 *************************************/
function analyzeSentiment(text) {
  const lower = text.toLowerCase();

  if (lower.includes("bom") || lower.includes("excelente") || lower.includes("ótimo")) {
    return { label: "Positiva", confidence: randomBetween(85, 97) };
  }

  if (lower.includes("péssimo") || lower.includes("mau") || lower.includes("horrível")) {
    return { label: "Negativa", confidence: randomBetween(80, 95) };
  }

  return { label: "Neutra", confidence: randomBetween(70, 90) };
}

/*************************************
 * MÉTRICAS (SIMULADAS)
 *************************************/
function getModelMetrics() {
  return {
    accuracy: randomBetween(85, 95),
    precision: randomBetween(80, 94),
    recall: randomBetween(78, 92),
    f1: randomBetween(80, 93)
  };
}

/*************************************
 * UTIL
 *************************************/
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

/*************************************
 * EVENTO PRINCIPAL
 *************************************/
analyzeBtn.addEventListener("click", () => {
  hideError();

  const text = inputText.value.trim();

  if (!text) {
    showError("⚠️ Por favor, insira uma frase para análise.");
    return;
  }

  // Analisa
  const prediction = analyzeSentiment(text);
  const metrics = getModelMetrics();

  // Atualiza UI
  resultText.textContent = text;
  resultSentiment.textContent = prediction.label;
  resultConfidence.textContent = prediction.confidence + "%";

  // Cor do sentimento
  resultSentiment.className = "text-2xl font-bold";
  if (prediction.label === "Positiva") {
    resultSentiment.classList.add("text-green-600");
  } else if (prediction.label === "Negativa") {
    resultSentiment.classList.add("text-red-600");
  } else {
    resultSentiment.classList.add("text-gray-600");
  }

  // Métricas
  mAccuracy.textContent = metrics.accuracy;
  mPrecision.textContent = metrics.precision;
  mRecall.textContent = metrics.recall;
  mF1.textContent = metrics.f1;

  // Mostrar secção
  resultSection.classList.remove("hidden");
});

/*************************************
 * UPLOAD DE FICHEIRO (placeholder)
 *************************************/
document.getElementById("fileUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
    showError("❌ Formato inválido. Use CSV ou XLSX.");
    return;
  }

  alert(`📂 Ficheiro "${file.name}" carregado com sucesso (processamento ainda não implementado).`);
});
