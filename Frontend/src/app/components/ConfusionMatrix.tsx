interface ConfusionMatrixProps {
  matrix: number[][];
}

export function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  const labels = ['Positiva', 'Neutra', 'Negativa'];
  
  const getColorIntensity = (value: number, max: number) => {
    const intensity = Math.min((value / max) * 100, 100);
    if (intensity > 70) return 'bg-blue-600 text-white';
    if (intensity > 40) return 'bg-blue-400 text-white';
    if (intensity > 20) return 'bg-blue-200 text-gray-800';
    return 'bg-blue-50 text-gray-800';
  };

  const maxValue = Math.max(...matrix.flat());

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-800">Matriz de Confusão</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header */}
          <div className="flex mb-2">
            <div className="w-32"></div>
            <div className="flex-1">
              <p className="text-xs text-center text-gray-600 mb-2 font-medium">PREVISTO</p>
              <div className="grid grid-cols-3 gap-2">
                {labels.map((label, idx) => (
                  <div key={idx} className="text-xs font-medium text-center text-gray-700 px-2 py-1">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Matrix Body */}
          <div className="flex">
            <div className="w-32 flex flex-col justify-center">
              <p className="text-xs text-center text-gray-600 font-medium mb-2 transform -rotate-90 origin-center">
                REAL
              </p>
            </div>
            <div className="flex-1">
              {matrix.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-2 mb-2">
                  <div className="w-20 text-xs font-medium text-right text-gray-700 pr-2">
                    {labels[rowIdx]}
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {row.map((value, colIdx) => (
                      <div
                        key={colIdx}
                        className={`
                          ${getColorIntensity(value, maxValue)}
                          rounded-lg p-4 text-center font-bold text-lg
                          transition-all hover:scale-105 cursor-pointer
                        `}
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Valores mais altos na diagonal indicam melhor desempenho do modelo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
