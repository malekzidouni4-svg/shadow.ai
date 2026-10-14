import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart2, TrendingUp, PieChart as PieIcon, Layers } from 'lucide-react';
import { Language, translations } from '../translations';

export interface ChartData {
  type?: 'bar' | 'line' | 'pie' | 'area';
  title?: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
}

interface ChartRendererProps {
  chartData: ChartData;
  lang?: Language;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData, lang = 'ar' }) => {
  const t = translations[lang];

  const [activeType, setActiveType] = useState<'bar' | 'line' | 'pie' | 'area'>(
    chartData.type || 'bar'
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = chartData.data || [];
  if (items.length === 0) return null;

  const maxValue = Math.max(...items.map((d) => d.value), 1);
  const totalValue = items.reduce((acc, d) => acc + d.value, 0) || 1;

  const colors = [
    '#38bdf8', // sky-400
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#8b5cf6', // purple-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
  ];

  return (
    <div className="my-4 p-4 rounded-3xl ios-glass border border-sky-400/25 shadow-2xl space-y-4 text-slate-100">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-sm font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              {chartData.title || t.chartInteractive}
            </h4>
            <span className="text-[10px] text-sky-300/80 font-mono">
              {t.chartTotal}: {totalValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Chart Type Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <button
            onClick={() => setActiveType('bar')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeType === 'bar' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={t.barChart}
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveType('line')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeType === 'line' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={t.lineChart}
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveType('area')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeType === 'area' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={t.areaChart}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveType('pie')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeType === 'pie' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={t.pieChart}
          >
            <PieIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Chart Canvas */}
      <div className="relative pt-2 pb-1 min-h-[160px] flex items-end">
        {/* Bar Chart Mode */}
        {activeType === 'bar' && (
          <div className="w-full flex items-end justify-around gap-2 h-44 px-2">
            {items.map((item, idx) => {
              const heightPercent = Math.max((item.value / maxValue) * 100, 6);
              const color = item.color || colors[idx % colors.length];
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-1 px-2 py-1 rounded-lg bg-slate-900 border border-sky-400/40 text-[11px] font-mono text-white shadow-xl z-10 pointer-events-none"
                    >
                      {item.label}: <strong className="text-sky-400">{item.value.toLocaleString()}</strong>
                    </motion.div>
                  )}

                  {/* Value on top of bar */}
                  <span className="text-[10px] text-slate-400 font-mono mb-1 group-hover:text-sky-300 transition-colors">
                    {item.value}
                  </span>

                  {/* Animated Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25, delay: idx * 0.05 }}
                    style={{ backgroundColor: color }}
                    className="w-full max-w-[48px] rounded-t-xl transition-all shadow-lg hover:brightness-125"
                  />

                  {/* Label */}
                  <span className="text-[10px] text-slate-400 truncate max-w-[56px] text-center mt-2 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Line / Area Chart Mode */}
        {(activeType === 'line' || activeType === 'area') && (
          <div className="w-full h-44 relative">
            <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

              {/* Path calculation */}
              {(() => {
                const count = items.length;
                const points = items.map((item, i) => {
                  const x = count === 1 ? 250 : (i / (count - 1)) * 460 + 20;
                  const y = 140 - (item.value / maxValue) * 115;
                  return { x, y, item };
                });

                const lineD = points.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
                  ''
                );

                const areaD = `${lineD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                return (
                  <>
                    {activeType === 'area' && (
                      <path d={areaD} fill="url(#areaGradient)" />
                    )}
                    <path
                      d={lineD}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((pt, idx) => (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredIndex === idx ? 6 : 4}
                          fill="#38bdf8"
                          stroke="#081224"
                          strokeWidth="2.5"
                          className="transition-all hover:scale-125"
                        />
                        <text
                          x={pt.x}
                          y="158"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9.5"
                          fontFamily="sans-serif"
                        >
                          {pt.item.label}
                        </text>
                        {hoveredIndex === idx && (
                          <text
                            x={pt.x}
                            y={pt.y - 10}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {pt.item.value}
                          </text>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {/* Pie Chart Mode */}
        {activeType === 'pie' && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-4 h-auto py-2">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  return items.map((item, idx) => {
                    const percent = item.value / totalValue;
                    const strokeDasharray = `${percent * 283} 283`;
                    const strokeDashoffset = -accumulatedPercent * 283;
                    accumulatedPercent += percent;
                    const color = item.color || colors[idx % colors.length];

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="10"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all hover:opacity-80 cursor-pointer"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-medium">100%</span>
                <span className="text-xs font-bold text-sky-400 font-mono">{t.pieChart}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-2">
              {items.map((item, idx) => {
                const percent = Math.round((item.value / totalValue) * 100);
                const color = item.color || colors[idx % colors.length];
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="truncate max-w-[120px]">{item.label}:</span>
                    <strong className="font-mono text-sky-300">{item.value} ({percent}%)</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
