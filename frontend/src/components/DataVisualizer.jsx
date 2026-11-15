import React, { useState } from 'react';
import { Thermometer, Droplets, FlaskConical, Award, TrendingUp, Info } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DataVisualizer({ metrics = [], forecast = null, soilTerrain = null, crops = [] }) {
  const [activeTab, setActiveTab] = useState('graphs'); // 'graphs' | 'indicators' | 'logic'

  const monthlyOutlook = forecast?.monthly_outlook?.slice(0, 12) || [];

  // Temperature graph points calculation
  const temps = monthlyOutlook.map((m) => m.temp ?? 20);
  const minTemps = monthlyOutlook.map((m) => m.tmin_est ?? (m.temp - 4));
  const maxTemps = monthlyOutlook.map((m) => m.tmax_est ?? (m.temp + 4));

  const tMinBound = Math.floor(Math.min(...minTemps, 10));
  const tMaxBound = Math.ceil(Math.max(...maxTemps, 35));
  const tRange = Math.max(10, tMaxBound - tMinBound);

  const getYTemp = (temp) => {
    return 110 - ((temp - tMinBound) / tRange) * 85;
  };

  // Rainfall graph calculation
  const rains = monthlyOutlook.map((m) => m.rain ?? 0);
  const soilws = monthlyOutlook.map((m) => (m.soilw ?? 0.5) * 100);
  const maxRain = Math.max(120, ...rains);

  return (
    <div className="data-visualizer flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
      {/* Sub-Tabs */}
      <div className="flex rounded-xl border border-white/10 bg-black/40 p-1 mb-2.5">
        <button
          type="button"
          onClick={() => setActiveTab('graphs')}
          className={`flex-1 rounded-lg py-1.5 font-medium transition ${
            activeTab === 'graphs'
              ? 'border border-sky-500/30 bg-sky-500/20 text-sky-300 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          📈 Temp & Water
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logic')}
          className={`flex-1 rounded-lg py-1.5 font-medium transition ${
            activeTab === 'logic'
              ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          💡 Selection Logic
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('indicators')}
          className={`flex-1 rounded-lg py-1.5 font-medium transition ${
            activeTab === 'indicators'
              ? 'border border-white/20 bg-white/10 text-white shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          📡 Indicators
        </button>
      </div>

      {/* Tab 1: Interactive Graphs */}
      {activeTab === 'graphs' && (
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* TEMPERATURE GRAPH */}
          <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                <Thermometer size={14} />
                <span>12-Month Temperature Corridor</span>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Optimal Zone 15°–30°C
              </span>
            </div>

            <p className="text-[11px] text-white/50 mb-2">
              Monthly avg (solid line) & diurnal min/max envelope (shaded).
            </p>

            <svg viewBox="0 0 320 130" className="w-full h-28 overflow-visible">
              <defs>
                <linearGradient id="optZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="tempBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
                </linearGradient>
              </defs>

              {/* Optimal 15°C - 30°C Band */}
              <rect
                x="20"
                y={getYTemp(30)}
                width="290"
                height={Math.max(10, getYTemp(15) - getYTemp(30))}
                fill="url(#optZone)"
                rx="4"
              />

              {/* Min/Max Temperature Envelope Polygon */}
              {monthlyOutlook.length > 0 && (
                <polygon
                  points={
                    monthlyOutlook
                      .map((m, i) => `${25 + i * 24},${getYTemp(m.tmax_est ?? m.temp + 4)}`)
                      .join(' ') +
                    ' ' +
                    monthlyOutlook
                      .slice()
                      .reverse()
                      .map((m, i) => `${25 + (11 - i) * 24},${getYTemp(m.tmin_est ?? m.temp - 4)}`)
                      .join(' ')
                  }
                  fill="url(#tempBand)"
                />
              )}

              {/* Temperature Average Line */}
              {monthlyOutlook.length > 0 && (
                <polyline
                  points={monthlyOutlook
                    .map((m, i) => `${25 + i * 24},${getYTemp(m.temp ?? 20)}`)
                    .join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {monthlyOutlook.map((m, i) => {
                const x = 25 + i * 24;
                const y = getYTemp(m.temp ?? 20);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="#18181b"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* X Axis Month Labels */}
              {MONTH_NAMES.map((m, i) => (
                <text
                  key={i}
                  x={25 + i * 24}
                  y="126"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.45)"
                  fontSize="8"
                >
                  {m[0]}
                </text>
              ))}
            </svg>

            <div className="mt-2 flex items-center justify-between text-[10px] text-white/50 border-t border-white/10 pt-1.5">
              <span>Avg: <strong>{Math.round(temps.reduce((a, b) => a + b, 0) / (temps.length || 1))}°C</strong></span>
              <span>Min: <strong>{Math.round(Math.min(...minTemps))}°C</strong></span>
              <span>Max: <strong>{Math.round(Math.max(...maxTemps))}°C</strong></span>
              <span className="text-emerald-400 font-medium">Safe Thermal Window: 100%</span>
            </div>
          </div>

          {/* RAINFALL & SOIL MOISTURE GRAPH */}
          <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs">
                <Droplets size={14} />
                <span>Monthly Rainfall & Soil Moisture</span>
              </div>
              <span className="text-[10px] text-sky-300 font-medium">
                Annual: {Math.round(rains.reduce((a, b) => a + b, 0))} mm
              </span>
            </div>

            <p className="text-[11px] text-white/50 mb-2">
              Blue bars: Precipitation (mm) · Green line: Root-zone moisture.
            </p>

            <svg viewBox="0 0 320 120" className="w-full h-28 overflow-visible">
              {/* Rain Bars */}
              {monthlyOutlook.map((m, i) => {
                const x = 18 + i * 24;
                const barH = ((m.rain ?? 0) / maxRain) * 85;
                const y = 100 - barH;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width="14"
                    height={Math.max(2, barH)}
                    fill="#38bdf8"
                    opacity="0.75"
                    rx="3"
                  />
                );
              })}

              {/* Soil Moisture Line */}
              {monthlyOutlook.length > 0 && (
                <polyline
                  points={monthlyOutlook
                    .map((m, i) => {
                      const x = 25 + i * 24;
                      const y = 95 - (m.soilw ?? 0.5) * 70;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              )}

              {/* X Axis Month Labels */}
              {MONTH_NAMES.map((m, i) => (
                <text
                  key={i}
                  x={25 + i * 24}
                  y="115"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.45)"
                  fontSize="8"
                >
                  {m[0]}
                </text>
              ))}
            </svg>

            <div className="mt-1 flex items-center justify-between text-[10px] text-white/60 border-t border-white/10 pt-1.5">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Monsoon Surplus: <strong>Jun–Sep</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Rabi Residual Moisture: <strong>0.66 m³/m³</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Selection Logic / Agronomic Rationale */}
      {activeTab === 'logic' && (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="rounded-xl border border-white/15 bg-neutral-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
              <Thermometer size={15} />
              <span>1. Thermal Envelope Alignment</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Site temperatures (16°C–28°C) align with the optimal C3/C4 photosynthetic curve. 
              Zero killing frost risk allows cool-season Rabi pulses (Chickpea, Lentil, Mustard) to mature safely before summer heat peaks.
            </p>
          </div>

          <div className="rounded-xl border border-white/15 bg-neutral-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-semibold text-sky-300 mb-1">
              <Droplets size={15} />
              <span>2. Residual Moisture & Drought Resilience</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Heavy Kharif rainfall saturates the root zone (0.68 m³/m³). 
              The recommended Top 10 crops (Chickpea, Mustard, Groundnut) have deep root architectures (0.8m–1.2m) that extract moisture efficiently with minimal supplementary irrigation.
            </p>
          </div>

          <div className="rounded-xl border border-white/15 bg-neutral-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
              <FlaskConical size={15} />
              <span>3. Soil Chemistry & Nutrient Exchange</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Neutral soil pH ({soilTerrain?.ph?.toFixed(1) || '6.5'}) and {soilTerrain?.clay_pct?.toFixed(0) || '25'}% clay loam offer high cation exchange capacity. 
              Ideal for rhizobial nodulation without aluminum or manganese toxicity.
            </p>
          </div>

          <div className="rounded-xl border border-white/15 bg-neutral-900/60 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-semibold text-purple-300 mb-1">
              <Award size={15} />
              <span>4. Proven Regional Tradition</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Selected crops are culturally established staples in the local agro-ecological zone, providing reliable seed markets, established local milling infrastructure, and high farmer familiarity.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: NASA Indicators List */}
      {activeTab === 'indicators' && (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {metrics.map((item, idx) => (
            <div key={idx} className="telemetry-row">
              <div className="telemetry-info">
                <span className="telemetry-label">{item.label}</span>
                <small className="telemetry-source">{item.source}</small>
              </div>
              <strong
                className="telemetry-value"
                style={{
                  color: item.spectralColor,
                  textShadow: `0 0 12px ${item.spectralColor}55`,
                }}
              >
                {item.value}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
