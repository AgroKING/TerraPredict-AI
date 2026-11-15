import React, { useState } from 'react';
import CropCard from './CropCard';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

function getScheduleCropImage(item, crops = []) {
    if (item.image) return item.image;
    const match = crops.find(
        (c) =>
            c.id === item.crop_id ||
            (c.scientificName &&
                item.scientific_name &&
                c.scientificName.toLowerCase() === item.scientific_name.toLowerCase()) ||
            (c.name && item.crop_name && c.name.toLowerCase() === item.crop_name.toLowerCase())
    );
    if (match?.image) return match.image;
    return FALLBACK_IMAGE;
}

function getHandoverBenefit(current) {
    if (current.nitrogen_role === 'fixer') {
        return 'Replenishes biological nitrogen via root nodules (+45 kg/ha) for the next feeder.';
    }
    if (current.root_depth_class === 'deep') {
        return 'Deep taproot (>1.2m) fractures subsoil compaction, creating aeration channels.';
    }
    if (current.is_cover_crop) {
        return 'Provides dense vegetative mulch, preserving moisture and smothering weed seeds.';
    }
    if (current.nitrogen_role === 'light_feeder') {
        return 'Maintains soil biological balance with minimal macro-nutrient depletion.';
    }
    return 'Stabilizes root-zone organic matter and sustains active soil microbial populations.';
}

export default function CropDrawer({
    isOpen,
    onClose,
    coordinates,
    crops = [],
    strategies = null,
    soilTerrain = null,
}) {
    const [viewMode, setViewMode] = useState('crops'); // 'crops' | 'rotation'
    const [activeStrategy, setActiveStrategy] = useState('soil_regenerative');

    const currentStrategyData = strategies ? strategies[activeStrategy] : null;
    const schedule = currentStrategyData?.schedule || [];

    return (
        <>
            {/* Click-Outside Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 z-30 bg-transparent transition-opacity duration-500 ${
                    isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            {/* Floating Frosted Glass Panel */}
            <aside
                aria-hidden={!isOpen}
                className={`fixed top-4 right-4 bottom-4 z-40 flex w-[94vw] flex-col overflow-hidden rounded-[34px] border border-white/20 bg-neutral-950/40 shadow-[0_25px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[50vw] sm:min-w-[460px] sm:max-w-[720px] ${
                    isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'
                }`}
            >
                {/* Top Header */}
                <div className="border-b border-white/10 px-6 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                                <span className="text-[11px] font-medium tracking-wider text-emerald-400 uppercase">
                                    Agro-Feasibility & Rotation
                                </span>
                            </div>
                            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-white">
                                {viewMode === 'crops'
                                    ? 'Recommended Crops'
                                    : '3-Year Crop Rotation Flow Chart'}
                            </h2>
                            {coordinates && (
                                <p className="mt-0.5 text-xs text-white/50">
                                    Lat {coordinates.lat.toFixed(2)}° · Lon {coordinates.lon.toFixed(2)}°
                                    {soilTerrain && (
                                        <span className="ml-2 border-l border-white/15 pl-2 text-white/70">
                                            Soil pH {soilTerrain.ph?.toFixed(1)} · Clay {soilTerrain.clay_pct?.toFixed(0)}%
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            aria-label="Close crop recommendations"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-95"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div className="mt-4 flex rounded-xl border border-white/10 bg-black/40 p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('crops')}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition ${
                                viewMode === 'crops'
                                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 shadow-sm'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <span>🌾</span>
                            <span>Single-Season Crops ({crops.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('rotation')}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition ${
                                viewMode === 'rotation'
                                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 shadow-sm'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <span>🔄</span>
                            <span>3-Year Crop Rotation Flow</span>
                        </button>
                    </div>

                    {/* Secondary Strategy Pills (Only shown in rotation view) */}
                    {viewMode === 'rotation' && (
                        <div className="mt-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveStrategy('soil_regenerative')}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                    activeStrategy === 'soil_regenerative'
                                        ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 shadow-sm'
                                        : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                                }`}
                            >
                                🌱 Soil-Regenerative
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveStrategy('water_resilient')}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                    activeStrategy === 'water_resilient'
                                        ? 'border border-sky-500/30 bg-sky-500/20 text-sky-300 shadow-sm'
                                        : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                                }`}
                            >
                                💧 Water-Resilient
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveStrategy('current_baseline')}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                    activeStrategy === 'current_baseline'
                                        ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300 shadow-sm'
                                        : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                                }`}
                            >
                                🚜 Baseline
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {viewMode === 'crops' ? (
                        /* Single-Season Crop Card Grid */
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {crops.map((crop) => (
                                <CropCard key={crop.id} crop={crop} />
                            ))}
                        </div>
                    ) : (
                        /* Multi-Year Rotation Flow Chart */
                        currentStrategyData ? (
                            <div className="space-y-6">
                                {/* Composite Scorecard */}
                                {currentStrategyData.soil_stewardship && (
                                    <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-4 backdrop-blur-md">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <div>
                                                <span className="text-[11px] font-medium tracking-wide text-white/50 uppercase">
                                                    Composite Stewardship Score
                                                </span>
                                                <div className="text-2xl font-bold text-emerald-400">
                                                    {currentStrategyData.soil_stewardship.composite_stewardship_score?.toFixed(1)}
                                                    <span className="text-sm font-normal text-white/40"> / 100</span>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-white/60">
                                                <div>Biophysical Fit: <strong className="text-white">{(currentStrategyData.mean_biophysical_fit * 100).toFixed(0)}%</strong></div>
                                                <div>Drought Resilience: <strong className="text-white">{(currentStrategyData.mean_drought_resilience * 100).toFixed(0)}%</strong></div>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                                                <span className="text-white/50">Living Cover</span>
                                                <div className="mt-0.5 text-sm font-semibold text-emerald-300">
                                                    {currentStrategyData.soil_stewardship.living_cover_ratio?.toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                                                <span className="text-white/50">N-Balance</span>
                                                <div className="mt-0.5 text-sm font-semibold text-emerald-300">
                                                    {currentStrategyData.soil_stewardship.biological_n_balance?.toFixed(0)}/100
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                                                <span className="text-white/50">Root Diversity</span>
                                                <div className="mt-0.5 text-sm font-semibold text-sky-300">
                                                    {currentStrategyData.soil_stewardship.taxonomic_root_diversity?.toFixed(0)}/100
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Visual 36-Month Gantt Bar */}
                                <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-4 backdrop-blur-md">
                                    <div className="flex items-center justify-between text-xs text-white/70">
                                        <span className="font-semibold tracking-wider uppercase text-[11px] text-white/50">
                                            36-Month Timeline Continuity
                                        </span>
                                        <span className="text-emerald-400 font-medium">100% Ground Cover</span>
                                    </div>

                                    {/* Timeline Bar */}
                                    <div className="mt-3 flex h-4 w-full overflow-hidden rounded-lg bg-black/50 p-0.5 border border-white/10">
                                        {schedule.map((item, idx) => {
                                            const pct = Math.max(8, (item.cycle_months / 36) * 100);
                                            const colors = [
                                                'bg-emerald-500',
                                                'bg-sky-500',
                                                'bg-indigo-500',
                                                'bg-amber-500',
                                                'bg-teal-500',
                                            ];
                                            const color = colors[idx % colors.length];
                                            return (
                                                <div
                                                    key={idx}
                                                    style={{ width: `${pct}%` }}
                                                    className={`h-full ${color}/80 hover:${color} transition-all border-r border-black/40 first:rounded-l-md last:rounded-r-md`}
                                                    title={`${item.crop_name}: ${item.cycle_months} mo (${item.sow_label} → ${item.harvest_label})`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Month Markers */}
                                    <div className="mt-1.5 flex justify-between text-[10px] text-white/40">
                                        <span>Month 1 (Year 1)</span>
                                        <span>Month 12</span>
                                        <span>Month 24</span>
                                        <span>Month 36 (Year 3)</span>
                                    </div>
                                </div>

                                {/* Connected Flow Chart Sequence */}
                                <div>
                                    <h3 className="mb-4 text-xs font-semibold tracking-wider text-white/60 uppercase">
                                        Planting Sequence & Soil Handover Flow
                                    </h3>

                                    <div className="relative pl-6 space-y-4">
                                        {/* Connected Vertical Spine */}
                                        <div className="absolute top-4 bottom-4 left-3 w-0.5 bg-gradient-to-b from-emerald-400 via-sky-400 to-amber-400 opacity-30" />

                                        {schedule.map((item, idx) => {
                                            const image = getScheduleCropImage(item, crops);
                                            const isLast = idx === schedule.length - 1;
                                            const benefit = getHandoverBenefit(item);

                                            return (
                                                <div key={idx} className="relative">
                                                    {/* Glowing Node Dot on Spine */}
                                                    <div className="absolute -left-6 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/60 bg-neutral-950 text-[10px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                                                        {idx + 1}
                                                    </div>

                                                    {/* Flow Card */}
                                                    <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-4 backdrop-blur-md transition hover:border-emerald-500/40 hover:bg-neutral-900/80 shadow-md">
                                                        <div className="flex gap-4">
                                                            {/* Crop Photo with Badge */}
                                                            <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/40">
                                                                <img
                                                                    src={image}
                                                                    alt={item.crop_name}
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = FALLBACK_IMAGE;
                                                                    }}
                                                                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                                
                                                                {/* Year Badge */}
                                                                <span className="absolute top-2 left-2 rounded-lg border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                                                    Y{item.year_num}
                                                                </span>

                                                                {/* Fit Badge */}
                                                                <span className="absolute bottom-2 right-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md">
                                                                    {(item.biophysical_fit * 100).toFixed(0)}% Fit
                                                                </span>
                                                            </div>

                                                            {/* Crop Details & Parameters */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div>
                                                                        <h4 className="font-semibold text-white text-base leading-snug">
                                                                            {item.crop_name}
                                                                        </h4>
                                                                        <p className="text-xs italic text-white/50 truncate">
                                                                            {item.scientific_name || item.family}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Planting Window */}
                                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                                                                    <svg className="h-3.5 w-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>
                                                                        {item.sow_label} → {item.harvest_label} · {item.cycle_months} Months
                                                                    </span>
                                                                </div>

                                                                {/* Helpful Agronomic Parameters Badges */}
                                                                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                                                                    {item.nitrogen_role === 'fixer' && (
                                                                        <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-300">
                                                                            🌱 N-Fixer (+45 kg/ha)
                                                                        </span>
                                                                    )}
                                                                    {item.nitrogen_role === 'heavy_feeder' && (
                                                                        <span className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-medium text-amber-300">
                                                                            🌾 Heavy Nutrient Feeder
                                                                        </span>
                                                                    )}
                                                                    {item.nitrogen_role === 'light_feeder' && (
                                                                        <span className="rounded-lg border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 font-medium text-teal-300">
                                                                            🍃 Light Soil Depletion
                                                                        </span>
                                                                    )}

                                                                    <span className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 font-medium text-sky-300">
                                                                        {item.root_depth_class === 'deep' ? '🌿 Deep Taproot (>1.2m)' : item.root_depth_class === 'medium' ? '🌿 Medium Roots (0.8m)' : '🌿 Shallow Roots (<0.5m)'}
                                                                    </span>

                                                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-medium text-white/70">
                                                                        💧 {(item.drought_resilience * 100).toFixed(0)}% Drought Res.
                                                                    </span>

                                                                    {item.is_cover_crop && (
                                                                        <span className="rounded-lg border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 font-medium text-purple-300">
                                                                            🛡️ Living Ground Cover
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Handover Flow Connector Arrow to Next Crop */}
                                                    {!isLast && (
                                                        <div className="my-2 ml-4 flex items-center gap-2 text-xs text-emerald-400/80">
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-black/60 text-[10px]">
                                                                ↓
                                                            </div>
                                                            <span className="italic text-[11px] text-white/60">
                                                                {benefit}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-48 flex-col items-center justify-center text-center text-white/50">
                                <p>Generating optimized rotation plan...</p>
                            </div>
                        )
                    )}
                </div>
            </aside>
        </>
    );
}
