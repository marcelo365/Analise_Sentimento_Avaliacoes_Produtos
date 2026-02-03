import { useState } from 'react';
import { Brain, TestTube, BarChart3 } from 'lucide-react';
import { SentimentResult } from '@/app/utils/sentimentModel';
import { TestModel } from '@/app/components/TestModel';
import { ChartsAnalysis } from '@/app/components/ChartsAnalysis';

type TabType = 'test' | 'charts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('test');
  const [results, setResults] = useState<SentimentResult[]>([]);

  const handleResultsUpdate = (newResults: SentimentResult[]) => {
    setResults(newResults);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard de Análise de Sentimento
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Teste e visualize os resultados do modelo de IA em tempo real
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('test')}
              className={`
                flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'test'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <TestTube className="w-5 h-5" />
              Teste do Modelo
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`
                flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'charts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <BarChart3 className="w-5 h-5" />
              Gráficos & Análises
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'test' ? (
          <TestModel onResultsUpdate={handleResultsUpdate} />
        ) : (
          <ChartsAnalysis results={results} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Dashboard de Análise de Sentimento - Modelo de IA para Classificação de Texto
          </p>
        </div>
      </footer>
    </div>
  );
}
