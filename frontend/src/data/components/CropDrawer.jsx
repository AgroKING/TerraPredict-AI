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
    const [activeTab, setActiveTab] = useState('recommended');

    const strategyKeys = {
        regenerative: 'soil_regenerative',
        water: 'water_resilient',
        baseline: 'current_baseline',
    };

    const currentStrategy =
        activeTab !== 'recommended' && strategies
            ? strategies[strategyKeys[activeTab]]
            : null;

    return (
        <>
            {/* Click-Outside Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 z-30 bg-transparent transition-opacity duration-500 ${
                    isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            {/* Floating Frosted Glass Drawer Panel */}
            <aside
                aria-hidden={!isOpen}
                className={`fixed top-4 right-4 bottom-4 z-40 flex w-[92vw] flex-col overflow-hidden rounded-[34px] border border-white/20 bg-neutral-950/40 shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[48vw] sm:min-w-[440px] sm:max-w-[720px] ${
                    isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'
                }`}
            >
                {/* Header */}
                <div className="border-b border-white/10 px-6 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                                <span className="text-[11px] font-medium tracking-wider text-white/60 uppercase">
                                    Agro-Climatic Intelligence
                                </span>
                            </div>
                            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-white">
                                {activeTab === 'recommended'
                                    ? 'Recommended Crops'
                                    : '3-Year Crop Rotation Plan'}
                            </h2>
                            {coordinates && (
                                <p className="mt-0.5 text-xs text-white/50">
                                    Lat {coordinates.lat.toFixed(2)}° · Lon {coordinates.lon.toFixed(2)}°
                                    {soilTerrain && (
                                        <span className="ml-2 border-l border-white/15 pl-2 text-emerald-400/80">
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

                    {/* Mode Navigation Tabs */}
                    <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button
                            type="button"
                            onClick={() => setActiveTab('recommended')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
                                activeTab === 'recommended'
                                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <span>🌾</span>
                            <span>Top Crops</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('regenerative')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
                                activeTab === 'regenerative'
                                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <span>🌱</span>
                            <span>Soil-Regenerative</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('water')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
                                activeTab === 'water'
                                    ? 'bg-sky-500/20 text-sky-300 shadow-sm border border-sky-500/30'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <span>💧</span>
                            <span>Water-Resilient</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('baseline')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition ${
                                activeTab === 'baseline'
                                    ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <span>🚜</span>
                            <span>Baseline</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {activeTab === 'recommended' ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {crops.map((crop) => (
                                <CropCard key={crop.id} crop={crop} />
                            ))}
                        </div>
                    ) : currentStrategy ? (
                        <div className="space-y-5">
                            {/* Stewardship Scorecard */}
                            {currentStrategy.soil_stewardship && (
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <div>
                                            <span className="text-[11px] font-medium text-white/50 uppercase">
                                                Composite Stewardship Score
                                            </span>
                                            <div className="text-2xl font-bold text-emerald-400">
                                                {currentStrategy.soil_stewardship.composite_stewardship_score?.toFixed(1)}
                                                <span className="text-sm font-normal text-white/40"> / 100</span>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-white/60">
                                            <div>Fit: <strong className="text-white">{(currentStrategy.mean_biophysical_fit * 100).toFixed(0)}%</strong></div>
                                            <div>Drought Res: <strong className="text-white">{(currentStrategy.mean_drought_resilience * 100).toFixed(0)}%</strong></div>
                                        </div>
                                    </div>

                                    {/* Breakdown metrics */}
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="rounded-xl border border-white/5 bg-white/5 p-2">
                                            <span className="text-white/50">Living Cover</span>
                                            <div className="mt-0.5 font-semibold text-emerald-300">
                                                {currentStrategy.soil_stewardship.living_cover_ratio?.toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/5 bg-white/5 p-2">
                                            <span className="text-white/50">N-Balance</span>
                                            <div className="mt-0.5 font-semibold text-emerald-300">
                                                {currentStrategy.soil_stewardship.biological_n_balance?.toFixed(0)}/100
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/5 bg-white/5 p-2">
                                            <span className="text-white/50">Diversity</span>
                                            <div className="mt-0.5 font-semibold text-sky-300">
                                                {currentStrategy.soil_stewardship.taxonomic_root_diversity?.toFixed(0)}/100
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3-Year Rotation Timeline */}
                            <div>
                                <h3 className="mb-3 text-sm font-semibold tracking-wide text-white/70 uppercase">
                                    36-Month Planting Sequence
                                </h3>
                                <div className="space-y-3">
                                    {currentStrategy.schedule?.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/60 p-3.5 transition hover:border-white/20"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xs font-bold text-white">
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
                                                    {item.family}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-48 flex-col items-center justify-center text-center text-white/50">
                            <p>Loading multi-year crop rotation optimization...</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
