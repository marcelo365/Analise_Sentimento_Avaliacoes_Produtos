import { TrendingUp, Target, Activity, Zap } from 'lucide-react';
import { Metrics } from '@/app/utils/sentimentModel';

interface MetricsPanelProps {
  metrics: Metrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const metricItems = [
    {
      label: 'Acurácia',
      value: metrics.accuracy,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Precisão',
      value: metrics.precision,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Recall',
      value: metrics.recall,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'F1-Score',
      value: metrics.f1Score,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Métricas de Desempenho</h3>
      <div className="space-y-4">
        {metricItems.map((item) => {
          const Icon = item.icon;
          const percentage = Math.round(item.value * 100);
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`${item.bgColor} p-2 rounded-lg`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${item.color.replace('text-', 'bg-')}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
