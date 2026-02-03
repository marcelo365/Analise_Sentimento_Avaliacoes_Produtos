// ================== DADOS DE EXEMPLO ==================
const distributionData = [
  { name: 'Positiva', value: 42, percentage: 42, color: '#16a34a' },
  { name: 'Neutra', value: 28, percentage: 28, color: '#6b7280' },
  { name: 'Negativa', value: 30, percentage: 30, color: '#dc2626' }
];

const accuracyData = [
  { iteration: 1, accuracy: 72, precision: 70, recall: 68 },
  { iteration: 2, accuracy: 75, precision: 73, recall: 71 },
  { iteration: 3, accuracy: 78, precision: 76, recall: 75 },
  { iteration: 4, accuracy: 82, precision: 80, recall: 79 },
  { iteration: 5, accuracy: 85, precision: 83, recall: 82 },
  { iteration: 6, accuracy: 87, precision: 85, recall: 84 },
  { iteration: 7, accuracy: 88, precision: 86, recall: 86 },
  { iteration: 8, accuracy: 89, precision: 88, recall: 87 }
];

const correlationData = [
  { textLength: 'Curto (0-20)', positiva: 35, neutra: 25, negativa: 40 },
  { textLength: 'Médio (21-50)', positiva: 45, neutra: 30, negativa: 25 },
  { textLength: 'Longo (50+)', positiva: 50, neutra: 28, negativa: 22 }
];

const confusionMatrix = [
  [40, 2, 0],
  [5, 23, 0],
  [2, 3, 25]
];

const labels = ['Positiva', 'Neutra', 'Negativa'];

// ================== FILTROS DINÂMICOS ==================
const timeRangeSelect = document.getElementById('timeRange');
const metricSelect = document.getElementById('metric');

// Função para gerar dados de acordo com o intervalo selecionado
function getFilteredAccuracyData(range) {
  let data = accuracyData;
  if (range === 'last10') data = accuracyData.slice(-10);
  if (range === 'last20') data = accuracyData.slice(-20);
  return data;
}

// Atualiza os gráficos com base nos filtros
function updateCharts() {
  const selectedRange = timeRangeSelect.value;
  const selectedMetric = metricSelect.value;
  
  // 1. Distribuição não muda, mas se quiser, poderia filtrar resultados
  // (mantemos estático por enquanto)
  
  // 2. Desempenho ao longo do tempo
  const filteredData = getFilteredAccuracyData(selectedRange);
  accuracyChart.data.labels = filteredData.map(d => d.iteration);
  accuracyChart.data.datasets.forEach(ds => {
    if(ds.label.toLowerCase() === selectedMetric) {
      ds.hidden = false;
    } else {
      ds.hidden = true;
    }
    ds.data = filteredData.map(d => d[ds.label.toLowerCase()]);
  });
  accuracyChart.update();
}

// Event listeners
timeRangeSelect.addEventListener('change', updateCharts);
metricSelect.addEventListener('change', updateCharts);


// ================== DISTRIBUIÇÃO ==================
const ctxDistribution = document.getElementById('distributionChart').getContext('2d');
new Chart(ctxDistribution, {
  type: 'pie',
  data: {
    labels: distributionData.map(d => d.name),
    datasets: [{
      data: distributionData.map(d => d.value),
      backgroundColor: distributionData.map(d => d.color)
    }]
  },
  options: { responsive: true, maintainAspectRatio: false }
});

// Popula quadro de valores à direita
const distributionValuesContainer = document.getElementById('distributionValues');
distributionValuesContainer.innerHTML = '';
distributionData.forEach(d => {
  const div = document.createElement('div');
  div.className = 'flex items-center justify-between';
  div.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-4 h-4 rounded" style="background-color:${d.color}"></div>
      <span class="text-gray-700">${d.name}</span>
    </div>
    <div class="text-right">
      <span class="text-2xl font-bold text-gray-900">${d.value}</span>
      <span class="text-sm text-gray-600 ml-2">(${d.percentage}%)</span>
    </div>
  `;
  distributionValuesContainer.appendChild(div);
});

// ================== DESempenho AO LONGO DO TEMPO ==================
const ctxAccuracy = document.getElementById('accuracyChart').getContext('2d');
const accuracyChart = new Chart(ctxAccuracy, {
  type: 'line',
  data: {
    labels: accuracyData.map(d => d.iteration),
    datasets: [
      { label: 'Acurácia', data: accuracyData.map(d => d.accuracy), borderColor: '#3b82f6', fill: false, tension:0.2 },
      { label: 'Precisão', data: accuracyData.map(d => d.precision), borderColor: '#10b981', fill: false, tension:0.2 },
      { label: 'Recall', data: accuracyData.map(d => d.recall), borderColor: '#8b5cf6', fill: false, tension:0.2 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 100, title: { display:true, text:'Percentagem (%)' } },
      x: { title: { display:true, text:'Iteração' } }
    }
  }
});


// ================== ANÁLISE DE CORRELAÇÃO ==================
const ctxCorrelation = document.getElementById('correlationChart').getContext('2d');
new Chart(ctxCorrelation, {
  type: 'bar',
  data: {
    labels: correlationData.map(d => d.textLength),
    datasets: [
      { label: 'Positiva', data: correlationData.map(d => d.positiva), backgroundColor: '#16a34a' },
      { label: 'Neutra', data: correlationData.map(d => d.neutra), backgroundColor: '#6b7280' },
      { label: 'Negativa', data: correlationData.map(d => d.negativa), backgroundColor: '#dc2626' }
    ]
  },
  options: { responsive: true, maintainAspectRatio: false }
});

// ================== MATRIZ DE CONFUSÃO ==================
const container = document.getElementById('confusionMatrixContainer');
const maxValue = Math.max(...confusionMatrix.flat());
const getColorIntensity = (value) => {
  const intensity = Math.min((value / maxValue) * 100, 100);
  if(intensity > 70) return 'bg-blue-600 text-white';
  if(intensity > 40) return 'bg-blue-400 text-white';
  if(intensity > 20) return 'bg-blue-200 text-gray-800';
  return 'bg-blue-50 text-gray-800';
}

// Header
const headerDiv = document.createElement('div');
headerDiv.className = 'flex mb-2';
headerDiv.innerHTML = `
  <div class="w-32"></div>
  <div class="flex-1">
    <p class="text-xs text-center text-gray-600 mb-2 font-medium">PREVISTO</p>
    <div class="grid grid-cols-3 gap-2">
      ${labels.map(l => `<div class="text-xs font-medium text-center text-gray-700 px-2 py-1">${l}</div>`).join('')}
    </div>
  </div>
`;
container.appendChild(headerDiv);

// Body
const bodyDiv = document.createElement('div');
bodyDiv.className = 'flex';
bodyDiv.innerHTML = `
  <div class="w-32 flex flex-col justify-center">
    <p class="text-xs text-center text-gray-600 font-medium mb-2 transform -rotate-90 origin-center">REAL</p>
  </div>
  <div class="flex-1">
    ${confusionMatrix.map((row,rowIdx) => `
      <div class="flex items-center gap-2 mb-2">
        <div class="w-20 text-xs font-medium text-right text-gray-700 pr-2">${labels[rowIdx]}</div>
        <div class="flex-1 grid grid-cols-3 gap-2">
          ${row.map(value => `<div class="matrix-cell ${getColorIntensity(value)}">${value}</div>`).join('')}
        </div>
      </div>
    `).join('')}
  </div>
`;
container.appendChild(bodyDiv);

// Legend
const legendDiv = document.createElement('div');
legendDiv.className = 'mt-6 pt-4 border-t border-gray-200';
legendDiv.innerHTML = `<p class="text-xs text-gray-600 text-center">Valores mais altos na diagonal indicam melhor desempenho do modelo</p>`;
container.appendChild(legendDiv);
