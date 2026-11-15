import React, { useState } from 'react';
import CropCard from './CropCard';

export default function CropDrawer({
    isOpen,
    onClose,
    coordinates,
    crops = [],
    strategies = null,
    soilTerrain = null,
}) {
    const [viewMode, setViewMode] = useState('crops'); // 'crops' | 'rotation'
    const [activeStrategy, setActiveStrategy] = useState('soil_regenerative'); // 'soil_regenerative' | 'water_resilient' | 'current_baseline'

    const currentStrategyData = strategies ? strategies[activeStrategy] : null;

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
                className={`fixed top-4 right-4 bottom-4 z-40 flex w-[92vw] flex-col overflow-hidden rounded-[34px] border border-white/20 bg-neutral-950/40 shadow-[0_25px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[48vw] sm:min-w-[440px] sm:max-w-[700px] ${
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
                                    : '3-Year Crop Rotation Plan'}
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
                            <span>3-Year Crop Rotation</span>
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
                                        ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
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
                                        ? 'border border-sky-500/30 bg-sky-500/20 text-sky-300'
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
                                        ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
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
                        /* Multi-Year Rotation View */
                        currentStrategyData ? (
                            <div className="space-y-5">
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

                                {/* 36-Month Planting Sequence */}
                                <div>
                                    <h3 className="mb-3 text-xs font-semibold tracking-wider text-white/60 uppercase">
                                        36-Month Planting Sequence
                                    </h3>
                                    <div className="space-y-2.5">
                                        {currentStrategyData.schedule?.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/50 p-3.5 backdrop-blur-md transition hover:border-white/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xs font-bold text-white">
                                                        Y{item.year_num}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-white">
                                                                {item.crop_name}
                                                            </span>
                                                            {item.is_cover_crop && (
                                                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                                                                    Cover Crop
                                                                </span>
                                                            )}
                                                            {item.nitrogen_role === 'fixer' && (
                                                                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                                                                    N-Fixer
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-white/50">
                                                            {item.sow_label} → {item.harvest_label} · {item.cycle_months} months
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                                                        {(item.biophysical_fit * 100).toFixed(0)}% Fit
                                                    </span>
                                                    <div className="mt-1 text-[11px] text-white/40">
                                                        {item.root_depth_class} roots
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
