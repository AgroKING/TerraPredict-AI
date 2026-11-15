import React, { useState } from 'react';
import {
  X,
  Layers,
  Satellite,
  Sprout,
  Compass,
  Cpu,
  Droplets,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Mountain,
  Sun,
  Activity,
  Award,
} from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'satellites' | 'scoring' | 'rotation' | 'guide'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Dark Frosted Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
      />

      {/* Main Modal Card */}
      <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] rounded-[32px] border border-white/20 bg-neutral-950/85 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="border-b border-white/10 px-6 py-5 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                Documentation & Scientific Methodology
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">
                How TerraPredict-AI Works
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 py-2.5 gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu size={14} />
            <span>1. System Architecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('satellites')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition whitespace-nowrap ${
              activeTab === 'satellites'
                ? 'border border-sky-500/40 bg-sky-500/20 text-sky-300 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Satellite size={14} />
            <span>2. NASA Satellite Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scoring')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition whitespace-nowrap ${
              activeTab === 'scoring'
                ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity size={14} />
            <span>3. Biophysical Screening</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rotation')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition whitespace-nowrap ${
              activeTab === 'rotation'
                ? 'border border-teal-500/40 bg-teal-500/20 text-teal-300 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sprout size={14} />
            <span>4. 3-Year Succession Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border border-purple-500/40 bg-purple-500/20 text-purple-300 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass size={14} />
            <span>5. Quick User Guide</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 [scrollbar-width:thin]">
          
          {/* TAB 1: SYSTEM ARCHITECTURE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white">End-to-End Precision Agronomy Pipeline</h3>
                <p className="mt-1 text-xs text-white/70 leading-relaxed">
                  TerraPredict-AI bridges NASA Earth Observation satellites, United Nations FAO biophysical databases, and beam-search algorithmic scheduling to provide localized, actionable farming guidance for any point on Earth.
                </p>
              </div>

              {/* 4-Stage Connected Workflow Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-400">
                      1
                    </span>
                    <Satellite size={16} className="text-sky-400" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Live Earth Observation Telemetry</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Queries NASA POWER API for real-time 60-day ground weather observations (soil moisture, rainfall anomalies, surface temperature, humidity, and heat stress days) at the exact coordinates selected by the user.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                      2
                    </span>
                    <Layers size={16} className="text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-sm text-white">FAO EcoCrop Biophysical Screening</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Evaluates 2,071+ crop species against the site’s thermal sowing gates, growing season length, moisture thresholds, and soil texture (pH, clay, sand, silt) to calculate single-season feasibility scores.
                  </p>
                </div>

                <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                      3
                    </span>
                    <Sprout size={16} className="text-teal-400" />
                  </div>
                  <h4 className="font-bold text-sm text-white">3-Year Succession Beam Search</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    An agronomic optimizer constructs continuous 36-month rotation sequences that maximize natural nitrogen fixation (+45 kg/ha), alternate root depths to break hardpan soil, and eliminate weed establishment.
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                      4
                    </span>
                    <CheckCircle2 size={16} className="text-amber-400" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Botanical Photography & Vernacular Delivery</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Dynamically queries Wikimedia Commons using authentic Latin botanical binomials for real field photographs, paired with plain-language vernacular names and actionable farmer advisories.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SATELLITE TELEMETRY */}
          {activeTab === 'satellites' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white">NASA Earth Observation Constellations</h3>
                <p className="mt-1 text-xs text-white/70 leading-relaxed">
                  TerraPredict-AI directly streams and computes indicators from specialized satellite missions orbiting the Earth:
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                    <Droplets size={16} />
                    <span>SMAP (Soil Moisture Active Passive · L4 Global Analysis)</span>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Operates an L-band radar/radiometer (1.4 GHz) that pierces cloud cover to measure volumetric soil moisture in the top 5 cm and root zone (0–100 cm). Our engine uses SMAP data to confirm seedbed establishment moisture before recommending sowing.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-sm mb-1">
                    <Thermometer size={16} />
                    <span>MODIS Terra & ECOSTRESS (Thermal Regimes & Heat Stress)</span>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Captures high-resolution Land Surface Temperature (LST) and daily thermal variance. Identifies critical frost risks during winter and extreme heat thresholds (≥ 35°C) that would cause pollen sterility or premature flower abortion.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                    <Activity size={16} />
                    <span>GPM IMERG (Global Precipitation Measurement)</span>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Combines microwave and infrared satellite observations to measure precipitation rates (mm/hr and total seasonal accumulation). Calculates seasonal water deficits against each crop’s transpiration requirements.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                    <Sprout size={16} />
                    <span>Landsat & MODIS (Normalized Difference Vegetation Index - NDVI)</span>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Analyzes red and near-infrared canopy reflectance to track photosynthetic activity and vegetative vigor, distinguishing lush crop coverage from drought-stressed vegetation or bare ground.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1">
                    <Mountain size={16} />
                    <span>GRACE-FO & SRTM (Deep Groundwater & Topographic Drainage)</span>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Measures gravitational terrestrial water storage anomalies to assess deep aquifer reserves, while 30-meter SRTM digital elevation modeling calculates natural drainage slope and erosion vulnerability.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BIOPHYSICAL SCORING */}
          {activeTab === 'scoring' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white">The FAO EcoCrop Biophysical Scoring Model</h3>
                <p className="mt-1 text-xs text-white/70 leading-relaxed">
                  Every crop feasibility score (from 68% to 96%) is computed through strict biophysical gating and thermal accumulation equations:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Gate 1</span>
                  <h4 className="font-bold text-sm text-white">Sowing Thermal Corridor</h4>
                  <p className="text-xs text-white/75 leading-relaxed">
                    A crop cannot be planted unless ambient temperature falls strictly between its minimum and maximum germination thresholds (<code className="text-emerald-300">sow_tmin ≤ T_mean ≤ sow_tmax</code>).
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Gate 2</span>
                  <h4 className="font-bold text-sm text-white">Seedbed Soil Moisture</h4>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Requires sufficient root-zone moisture (<code className="text-sky-300">soilw ≥ min_sowing_soilw</code>) based on recent rain and satellite SMAP telemetry, factoring in supplemental or rainfed irrigation.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Metric 3</span>
                  <h4 className="font-bold text-sm text-white">Thermal Growth Accumulation</h4>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Integrates temperature across the entire growth cycle (<code className="text-amber-300">topmn</code> to <code className="text-amber-300">topmx</code>). Scores penalize extreme cold chill days or heat burning during reproductive phases.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Metric 4</span>
                  <h4 className="font-bold text-sm text-white">Soil Texture & Chemical Fit</h4>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Compares soil pH, clay percentage, and drainage profile against species tolerances, ensuring root systems won't suffocate in heavy clay or starve in coarse sand.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <h4 className="font-bold text-xs text-emerald-300 uppercase tracking-wider mb-1">
                  Biophysics-First Composite Scoring Equation
                </h4>
                <p className="text-xs text-white/80 font-mono">
                  Score = (0.65 × Biophysical Fit) + (0.20 × Drought Resilience) + (0.15 × Regional Agricultural Affinity)
                </p>
                <p className="mt-1 text-[11px] text-white/60">
                  This guarantees that real climate physics and water availability define the recommendations, while cultural tradition acts solely as a positive secondary tie-breaker.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: 3-YEAR ROTATION ENGINE */}
          {activeTab === 'rotation' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white">Why 3-Year Rotation Beats Monoculture</h3>
                <p className="mt-1 text-xs text-white/70 leading-relaxed">
                  Planting the same crop season after season depletes specific nutrients, harbors soil-borne pests, and requires increasing chemical inputs. Our Multi-Objective Beam Search designs continuous 36-month rotation plans tailored to your land:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-1.5 text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto">
                    <Sprout size={16} />
                  </div>
                  <h4 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">Soil-Regenerative Plan</h4>
                  <p className="text-[11px] text-white/75 leading-relaxed">
                    Prioritizes nitrogen-fixing legumes (+45 kg N/ha) and high-biomass cover crops to restore organic carbon and cut synthetic fertilizer bills.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-500/30 bg-sky-950/30 p-4 space-y-1.5 text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 mx-auto">
                    <Droplets size={16} />
                  </div>
                  <h4 className="font-bold text-xs text-sky-300 uppercase tracking-wider">Water-Resilient Plan</h4>
                  <p className="text-[11px] text-white/75 leading-relaxed">
                    Selects drought-hardy species with deep root architectures (0.8m–1.5m) that survive dry winter spells with minimal supplemental irrigation.
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 space-y-1.5 text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mx-auto">
                    <Award size={16} />
                  </div>
                  <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider">Baseline Commercial Plan</h4>
                  <p className="text-[11px] text-white/75 leading-relaxed">
                    Focuses on high-demand market commodities and staple crops to maximize short-term cash yield while maintaining sustainable soil stewardship.
                  </p>
                </div>
              </div>

              {/* Agronomic Stewardship Principles */}
              <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 space-y-2">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  The Three Core Stewardship Pillars Evaluated:
                </h4>
                <ul className="space-y-2 text-xs text-white/75">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>100% Living Ground Cover:</strong> Eliminates fallow windows to prevent topsoil erosion from monsoon rains and scorching sun degradation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Root Architecture Alternation:</strong> Alternates deep taproots that break up hardpan clay subsoil with shallow fibrous rooters that bind topsoil.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Biological Nitrogen Cycling:</strong> Intersperses Fabaceae legumes that fix atmospheric N₂ to replenish depleted nutrients before demanding cash crops are sown.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: QUICK USER GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-white">How to Use the Platform in 3 Simple Steps</h3>
                <p className="mt-1 text-xs text-white/70 leading-relaxed">
                  TerraPredict-AI is designed to be intuitive, fast, and responsive for farmers, agronomists, and researchers:
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Select Any Farm or Coordinate</h4>
                    <p className="text-xs text-white/70 leading-relaxed mt-1">
                      Type any city, village, address, or landmark in the top search bar, choose a preset destination (e.g. Rourkela, Tokyo, Paris, New York), or click directly on any continent on the 3D globe.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Inspect Satellite Indicators & Overlays</h4>
                    <p className="text-xs text-white/70 leading-relaxed mt-1">
                      Choose an Observation Date in the top bar. Toggle between live NASA map layers on the left (Surface Warmth, Soil Wetness, Rainfall, Greenery) and review real-time soil and climate charts in the right Field Data drawer.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Explore Top Crops & 3-Year Rotation</h4>
                    <p className="text-xs text-white/70 leading-relaxed mt-1">
                      Click "View Crop Recommendations & Rotation Strategy". Explore your top 10 recommended crops with verified botanical photography, water requirements, and sowing windows, or toggle to the 3-Year Rotation Guide to interact with the 36-month succession Gantt calendar!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between shrink-0 bg-white/[0.02] text-xs">
          <span className="text-white/50">
            Powered by NASA Earth Data & FAO EcoCrop Global Agro-Database
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20 transition active:scale-95"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
