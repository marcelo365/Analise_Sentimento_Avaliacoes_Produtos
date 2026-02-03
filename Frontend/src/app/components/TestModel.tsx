import { useState } from 'react';
import { Upload, Send, FileText, AlertCircle, Smile, Meh, Frown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { analyzeSentiment, calculateMetrics, SentimentResult } from '@/app/utils/sentimentModel';
import { MetricsPanel } from '@/app/components/MetricsPanel';
import { ResultsTable } from '@/app/components/ResultsTable';

interface TestModelProps {
  onResultsUpdate: (results: SentimentResult[]) => void;
}

export function TestModel({ onResultsUpdate }: TestModelProps) {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextSubmit = () => {
    if (!inputText.trim()) {
      setError('Por favor, insira uma frase para análise');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const result = analyzeSentiment(inputText);
      const newResults = [result, ...results];
      setResults(newResults);
      onResultsUpdate(newResults);
      setInputText('');
      setIsLoading(false);
    }, 500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setIsLoading(true);
    setError(null);

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const texts: string[] = [];
        jsonData.forEach((row: any) => {
          if (Array.isArray(row) && row.length > 0) {
            const text = String(row[0]).trim();
            if (text && text.length > 0) {
              texts.push(text);
            }
          }
        });

        if (texts.length === 0) {
          setError('Nenhuma frase válida encontrada no ficheiro');
          setIsLoading(false);
          return;
        }

        setTimeout(() => {
          const newResults = texts.map(text => analyzeSentiment(text));
          setResults(newResults);
          onResultsUpdate(newResults);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        setError('Erro ao processar o ficheiro. Verifique o formato.');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Erro ao ler o ficheiro');
      setIsLoading(false);
    };

    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positiva':
        return <Smile className="w-12 h-12 text-green-600" />;
      case 'Neutra':
        return <Meh className="w-12 h-12 text-gray-600" />;
      case 'Negativa':
        return <Frown className="w-12 h-12 text-red-600" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positiva':
        return 'border-green-500 bg-green-50';
      case 'Neutra':
        return 'border-gray-500 bg-gray-50';
      case 'Negativa':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const metrics = calculateMetrics(results);
  const latestResult = results[0];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Text Input */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Entrada de Texto</h3>
          </div>
          <div className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma frase para análise de sentimento..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleTextSubmit}
              disabled={isLoading || !inputText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              {isLoading ? 'Analisando...' : 'Analisar Frase'}
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">Upload de Ficheiro</h3>
          </div>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Arraste ou clique para carregar
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Formatos: .xlsx, .csv
              </p>
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg cursor-pointer transition-colors"
              >
                Selecionar Ficheiro
              </label>
            </div>
            <p className="text-xs text-gray-500">
              * O ficheiro deve conter frases na primeira coluna
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {latestResult && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Latest Result Display */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-lg shadow-md p-8 border-l-4 ${getSentimentColor(latestResult.predicted)}`}>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Resultado da Classificação</h3>
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  {getSentimentIcon(latestResult.predicted)}
                </div>
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Frase analisada:</span>
                    <p className="text-gray-900 mt-1">{latestResult.text}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div>
                      <span className="text-sm text-gray-600">Sentimento:</span>
                      <p className="text-2xl font-bold text-gray-900">{latestResult.predicted}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Confiança:</span>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round(latestResult.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            {results.length > 1 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Histórico de Análises</h3>
                <ResultsTable results={results} />
              </div>
            )}
          </div>

          {/* Metrics Panel */}
          <div>
            <MetricsPanel metrics={metrics} />
          </div>
        </div>
      )}
    </div>
  );
}
