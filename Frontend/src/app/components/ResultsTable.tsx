import { SentimentResult } from '@/app/utils/sentimentModel';
import { Smile, Meh, Frown } from 'lucide-react';

interface ResultsTableProps {
  results: SentimentResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positiva':
        return <Smile className="w-5 h-5 text-green-600" />;
      case 'Neutra':
        return <Meh className="w-5 h-5 text-gray-600" />;
      case 'Negativa':
        return <Frown className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positiva':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Neutra':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Negativa':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frase
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confiança
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                  {result.text}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getSentimentColor(result.predicted)}`}>
                    {getSentimentIcon(result.predicted)}
                    <span className="text-sm font-medium">{result.predicted}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
