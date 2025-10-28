'use client';

import type { SpeciesAccumulationPoint } from '@/lib/stats/advanced-stats';

interface SpeciesAccumulationChartProps {
  data: SpeciesAccumulationPoint[];
}

export function SpeciesAccumulationChart({ data }: SpeciesAccumulationChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Species Accumulation</h2>
        <p className="text-gray-500">No data yet</p>
      </div>
    );
  }

  const maxSpecies = Math.max(...data.map(d => d.cumulativeSpecies));
  const chartHeight = 200;

  // Sample data points for display (show max 30 points)
  const samplingRate = Math.max(1, Math.floor(data.length / 30));
  const sampledData = data.filter((_, i) => i % samplingRate === 0 || i === data.length - 1);

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-2">Species Accumulation</h2>
      <p className="text-sm text-gray-500 mb-6">Your discovery timeline over time</p>

      {/* Chart */}
      <div className="relative" style={{ height: chartHeight + 40 }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxSpecies}</span>
          <span>{Math.floor(maxSpecies / 2)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full">
          <svg className="w-full" style={{ height: chartHeight }}>
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Area under curve */}
            <path
              d={`
                M 0 ${chartHeight}
                ${sampledData.map((point, i) => {
                  const xPercent = (i / (sampledData.length - 1));
                  const y = chartHeight - (point.cumulativeSpecies / maxSpecies) * chartHeight;
                  return `L ${xPercent * 100} ${y}`;
                }).join(' ')}
                L 100 ${chartHeight}
                Z
              `}
              fill="url(#areaGradient)"
              viewBox="0 0 100 ${chartHeight}"
              preserveAspectRatio="none"
            />

            {/* Line */}
            <polyline
              points={sampledData.map((point, i) => {
                const xPercent = (i / (sampledData.length - 1));
                const y = chartHeight - (point.cumulativeSpecies / maxSpecies) * chartHeight;
                return `${xPercent * 100},${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgb(34, 197, 94)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              viewBox="0 0 100 ${chartHeight}"
              preserveAspectRatio="none"
            />

            {/* Data points */}
            {sampledData.map((point, i) => {
              const xPercent = (i / (sampledData.length - 1));
              const y = chartHeight - (point.cumulativeSpecies / maxSpecies) * chartHeight;
              return (
                <circle
                  key={i}
                  cx={xPercent * 100}
                  cy={y}
                  r="3"
                  fill="rgb(34, 197, 94)"
                  className="hover:r-5 transition-all"
                >
                  <title>{`${point.date}: ${point.cumulativeSpecies} species`}</title>
                </circle>
              );
            })}
          </svg>

          {/* X-axis */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{sampledData[0]?.date.split('-')[0]}</span>
            <span>Timeline</span>
            <span>{sampledData[sampledData.length - 1]?.date.split('-')[0]}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500">Current Total</div>
          <div className="text-2xl font-bold text-green-600">
            {data[data.length - 1]?.cumulativeSpecies || 0}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Days Observing</div>
          <div className="text-2xl font-bold text-blue-600">{data.length}</div>
        </div>
      </div>
    </div>
  );
}
