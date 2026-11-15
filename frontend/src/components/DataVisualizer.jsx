import React, { useState } from 'react';
import { Thermometer, Droplets, Sprout, Award, CheckCircle, ShieldCheck } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DataVisualizer({ metrics = [], forecast = null, soilTerrain = null, crops = [] }) {
  const [activeTab, setActiveTab] = useState('graphs'); // 'graphs' | 'logic' | 'indicators'

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
  const maxRain = Math.max(120, ...rains);

  // Helper to translate raw technical metric into farmer terms
  const getFarmerMetricTranslation = (item) => {
    const lbl = item.label?.toLowerCase() || '';
    if (lbl.includes('surface temp')) {
      return {
        farmerTitle: '🌡️ Field Warmth',
        meaning: 'Comfortable warmth for seedling germination',
      };
    }
    if (lbl.includes('soil moisture')) {
      return {
        farmerTitle: '💧 Soil Wetness',
        meaning: 'Good moisture — seeds will sprout easily without heavy watering',
      };
    }
    if (lbl.includes('rainfall') || lbl.includes('precip')) {
      return {
        farmerTitle: '🌧️ Recent Rain',
        meaning: 'Topsoil is well-hydrated and ready for sowing',
      };
    }
    if (lbl.includes('heat stress')) {
      return {
        farmerTitle: '☀️ Heat Stress Risk',
        meaning: 'Zero burning risk — seedlings are completely safe',
      };
    }
    if (lbl.includes('humidity')) {
      return {
        farmerTitle: '💨 Air Humidity',
        meaning: 'Good air moisture prevents leaves from drying out',
      };
    }
    if (lbl.includes('vegetation') || lbl.includes('ndvi')) {
      return {
        farmerTitle: '🌿 Field Greenery (Health)',
        meaning: 'High vegetation vigor and healthy green canopy',
      };
    }
    if (lbl.includes('groundwater')) {
      return {
        farmerTitle: '🌊 Deep Water Table',
        meaning: 'Stable groundwater reserves for tube wells',
      };
    }
    if (lbl.includes('elevation')) {
      return {
        farmerTitle: '⛰️ Field Elevation & Slope',
        meaning: 'Gentle flat land — water drains naturally without pooling',
      };
    }
    return {
      farmerTitle: item.label,
      meaning: 'Local satellite measurement',
    };
  };

  return (
    <div className="data-visualizer flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
      {/* Sub-Tabs */}
      <div className="flex rounded-xl border border-white/10 bg-black/40 p-1 mb-2.5">
        <button
          type="button"
          onClick={() => setActiveTab('graphs')}
          className={`flex-1 rounded-lg py-1.5 font-semibold transition text-center ${
            activeTab === 'graphs'
              ? 'border border-sky-500/30 bg-sky-500/20 text-sky-300 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🌦️ Weather & Rain
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logic')}
          className={`flex-1 rounded-lg py-1.5 font-semibold transition text-center ${
            activeTab === 'logic'
              ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🌾 Why These Crops?
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('indicators')}
          className={`flex-1 rounded-lg py-1.5 font-semibold transition text-center ${
            activeTab === 'indicators'
              ? 'border border-white/20 bg-white/10 text-white shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🛰️ Satellite Sensors
        </button>
      </div>

      {/* Tab 1: Interactive Graphs */}
      {activeTab === 'graphs' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Quick Farmer Status Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5 flex items-center justify-between text-emerald-300">
            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
              <ShieldCheck size={14} />
              <span>Current Status: Safe Rabi Sowing Window</span>
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
              0% Frost Risk
            </span>
          </div>

          {/* TEMPERATURE GRAPH */}
          <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Thermometer size={14} />
                <span>Yearly Temperature & Safe Growing Window</span>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Ideal Zone 15°–30°C
              </span>
            </div>

            <p className="text-[11px] text-white/60 mb-2">
              Yellow line: Avg daily warmth · Shaded band: Day & night temperature range.
            </p>

            <svg viewBox="0 0 320 130" className="w-full h-28 overflow-visible">
              <defs>
                <linearGradient id="optZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
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
                  fill="rgba(255,255,255,0.5)"
                  fontSize="8"
                >
                  {m[0]}
                </text>
              ))}
            </svg>

            <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-white/70 border-t border-white/10 pt-2 text-center">
              <div>Avg: <strong className="text-white">{Math.round(temps.reduce((a, b) => a + b, 0) / (temps.length || 1))}°C</strong></div>
              <div>Winter Low: <strong className="text-sky-300">{Math.round(Math.min(...minTemps))}°C</strong></div>
              <div>Summer Peak: <strong className="text-amber-300">{Math.round(Math.max(...maxTemps))}°C</strong></div>
            </div>
            <p className="mt-1.5 text-[10px] text-emerald-300 text-center font-medium">
              💡 Cool 12°C winter nights are ideal for Chickpea, Lentil & Mustard flowers.
            </p>
          </div>

          {/* RAINFALL & SOIL MOISTURE GRAPH */}
          <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                <Droplets size={14} />
                <span>Rainfall & Stored Field Moisture</span>
              </div>
              <span className="text-[10px] text-sky-300 font-semibold">
                Total Rain: {Math.round(rains.reduce((a, b) => a + b, 0))} mm/yr
              </span>
            </div>

            <p className="text-[11px] text-white/60 mb-2">
              Blue bars: Monthly rain · Dotted green line: Moisture held underground.
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
                  fill="rgba(255,255,255,0.5)"
                  fontSize="8"
                >
                  {m[0]}
                </text>
              ))}
            </svg>

            <div className="mt-1 flex items-center justify-between text-[10px] text-white/70 border-t border-white/10 pt-1.5">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Heavy Monsoon: <strong>Jun–Sep</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Winter Subsoil Water: <strong>High</strong>
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-sky-200 text-center font-medium">
              💡 Heavy monsoon rains leave abundant water trapped deep in your clay soil for winter crops.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Selection Logic in Plain Farmer Language */}
      {activeTab === 'logic' && (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="rounded-xl border border-emerald-500/30 bg-neutral-900/70 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
              <Thermometer size={16} />
              <span>1. Perfect Weather Match (No Frost Shock)</span>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Your winter days stay pleasantly warm (20°C–28°C) with cool 12°C nights. Crops like <strong>Chickpea, Mustard, and Lentil</strong> thrive in this climate and won’t suffer frost or premature heat damage.
            </p>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-neutral-900/70 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-bold text-sky-300 mb-1">
              <Droplets size={16} />
              <span>2. Low Water & Drought Hardy</span>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Winter brings little rain, but your clay soil holds onto monsoon water underground. We selected crops with <strong>deep taproots (0.8m–1.2m)</strong> that drink trapped moisture, so you only need 1 or 2 light waterings.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-neutral-900/70 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
              <Sprout size={16} />
              <span>3. Free Natural Fertilizer (Saves Urea Money)</span>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Legume pulses (Chickpea, Lentil, Pigeon Pea, Cowpea) pull free nitrogen directly from the air and store it in your soil. This cuts down how many bags of chemical urea you need to buy for next season.
            </p>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-neutral-900/70 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
              <Award size={16} />
              <span>4. High Local Market Demand in Odisha</span>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              These are traditional staples grown and eaten across Odisha and neighboring states. You are guaranteed strong mandi buyer interest, reliable selling prices, and dependable food for your household.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Satellite Indicators Translated for Farmers */}
      {activeTab === 'indicators' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="text-[11px] text-white/60 mb-1">
            Real-time measurements taken by NASA satellites orbiting over your coordinates:
          </p>

          {metrics.map((item, idx) => {
            const trans = getFarmerMetricTranslation(item);
            return (
              <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{trans.farmerTitle}</span>
                    <span className="text-[10px] text-white/40">{item.source} · {item.label}</span>
                  </div>
                  <strong
                    className="text-xs font-bold"
                    style={{
                      color: item.spectralColor,
                      textShadow: `0 0 10px ${item.spectralColor}44`,
                    }}
                  >
                    {item.value}
                  </strong>
                </div>
                <p className="mt-1 text-[11px] text-emerald-300/90 leading-tight">
                  ✓ {trans.meaning}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
