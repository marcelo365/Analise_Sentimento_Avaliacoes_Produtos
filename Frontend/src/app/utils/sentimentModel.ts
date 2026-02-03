// Modelo de IA simulado para análise de sentimento
export type SentimentClass = 'Positiva' | 'Neutra' | 'Negativa';

export interface SentimentResult {
  text: string;
  predicted: SentimentClass;
  confidence: number;
  actual?: SentimentClass;
}

export interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

// Palavras-chave para classificação simulada
const positiveWords = [
  'bom', 'ótimo', 'excelente', 'maravilhoso', 'fantástico', 'adorei', 'incrível',
  'feliz', 'alegre', 'perfeito', 'amor', 'amo', 'melhor', 'sucesso', 'vitória',
  'good', 'great', 'excellent', 'amazing', 'love', 'best', 'happy', 'perfect'
];

const negativeWords = [
  'ruim', 'péssimo', 'horrível', 'terrível', 'odeio', 'detesto', 'triste',
  'mal', 'pior', 'problema', 'defeito', 'falha', 'erro', 'decepção',
  'bad', 'terrible', 'horrible', 'hate', 'worst', 'sad', 'disappointed', 'fail'
];

export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  let predicted: SentimentClass;
  let confidence: number;
  
  if (positiveCount > negativeCount) {
    predicted = 'Positiva';
    confidence = Math.min(0.65 + (positiveCount * 0.1), 0.98);
  } else if (negativeCount > positiveCount) {
    predicted = 'Negativa';
    confidence = Math.min(0.65 + (negativeCount * 0.1), 0.98);
  } else {
    predicted = 'Neutra';
    confidence = 0.55 + Math.random() * 0.15;
  }
  
  return {
    text,
    predicted,
    confidence: Math.round(confidence * 100) / 100
  };
}

export function calculateMetrics(results: SentimentResult[]): Metrics {
  const resultsWithActual = results.filter(r => r.actual);
  
  if (resultsWithActual.length === 0) {
    // Métricas simuladas quando não há dados reais
    return {
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.86,
      f1Score: 0.855
    };
  }
  
  const correct = resultsWithActual.filter(r => r.predicted === r.actual).length;
  const accuracy = correct / resultsWithActual.length;
  
  // Cálculo simplificado de métricas por classe
  const classes: SentimentClass[] = ['Positiva', 'Neutra', 'Negativa'];
  let totalPrecision = 0;
  let totalRecall = 0;
  
  classes.forEach(cls => {
    const truePositive = resultsWithActual.filter(r => r.predicted === cls && r.actual === cls).length;
    const falsePositive = resultsWithActual.filter(r => r.predicted === cls && r.actual !== cls).length;
    const falseNegative = resultsWithActual.filter(r => r.predicted !== cls && r.actual === cls).length;
    
    const precision = truePositive + falsePositive > 0 ? truePositive / (truePositive + falsePositive) : 0;
    const recall = truePositive + falseNegative > 0 ? truePositive / (truePositive + falseNegative) : 0;
    
    totalPrecision += precision;
    totalRecall += recall;
  });
  
  const avgPrecision = totalPrecision / classes.length;
  const avgRecall = totalRecall / classes.length;
  const f1Score = avgPrecision + avgRecall > 0 ? (2 * avgPrecision * avgRecall) / (avgPrecision + avgRecall) : 0;
  
  return {
    accuracy: Math.round(accuracy * 100) / 100,
    precision: Math.round(avgPrecision * 100) / 100,
    recall: Math.round(avgRecall * 100) / 100,
    f1Score: Math.round(f1Score * 100) / 100
  };
}

export function generateConfusionMatrix(results: SentimentResult[]): number[][] {
  const classes: SentimentClass[] = ['Positiva', 'Neutra', 'Negativa'];
  const matrix: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  
  const resultsWithActual = results.filter(r => r.actual);
  
  if (resultsWithActual.length === 0) {
    // Matriz simulada
    return [
      [85, 10, 5],
      [8, 78, 14],
      [6, 12, 82]
    ];
  }
  
  resultsWithActual.forEach(result => {
    const actualIdx = classes.indexOf(result.actual!);
    const predictedIdx = classes.indexOf(result.predicted);
    matrix[actualIdx][predictedIdx]++;
  });
  
  return matrix;
}
