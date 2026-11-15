import React, { useState, useMemo } from 'react';
import CropCard from './CropCard';

export default function CropDrawer({
    isOpen,
    onClose,
    coordinates,
    crops = [],
    strategies = null,
    soilTerrain = null,
    totalDatabaseCrops = 2071,
    totalViableCrops = null,
}) {
    const [activeTab, setActiveTab] = useState('recommended');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFamily, setSelectedFamily] = useState('ALL');

    const strategyKeys = {
        regenerative: 'soil_regenerative',
        water: 'water_resilient',
        baseline: 'current_baseline',
    };

    const currentStrategy =
        activeTab !== 'recommended' && strategies
            ? strategies[strategyKeys[activeTab]]
            : null;

    // Filtered crops based on search query and family filter
    const filteredCrops = useMemo(() => {
        return crops.filter((crop) => {
            const matchesQuery =
                !searchQuery ||
                crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                crop.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (crop.family && crop.family.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesFamily =
                selectedFamily === 'ALL' ||
                (crop.family && crop.family.toUpperCase() === selectedFamily.toUpperCase());

            return matchesQuery && matchesFamily;
        });
    }, [crops, searchQuery, selectedFamily]);

    // Available families in current result
    const availableFamilies = useMemo(() => {
        const set = new Set();
        crops.forEach((c) => {
            if (c.family && c.family !== 'Other') set.add(c.family);
        });
        return Array.from(set).slice(0, 6);
    }, [crops]);

    return (
        <>
            {/* Click-Outside Backdrop */}
            <div
                onClick={onClose}
                className={`ecocrop-backdrop ${isOpen ? 'open' : 'closed'}`}
            />

            {/* Floating Frosted Glass Drawer Panel */}
            <aside
                aria-hidden={!isOpen}
                className={`ecocrop-drawer ${isOpen ? 'open' : 'closed'}`}
            >
                {/* Header */}
                <div className="border-b border-white/10 px-6 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                                <span className="text-[11px] font-medium tracking-wider text-emerald-400 uppercase">
                                    FAO EcoCrop Global Database ({totalDatabaseCrops.toLocaleString()} Species)
                                </span>
                            </div>
                            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-white">
                                {activeTab === 'recommended'
                                    ? `Agro-Feasibility (${crops.length} Analyzed)`
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
                                    {totalViableCrops !== null && (
                                        <span className="ml-2 border-l border-white/15 pl-2 text-emerald-400">
                                            {totalViableCrops} Viable Species
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
                            <svg width="16" height="16" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                            <span>EcoCrop Recommendations ({crops.length})</span>
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

                    {/* Search & Family Filter Bar (For Recommended tab) */}
                    {activeTab === 'recommended' && (
                        <div className="mt-3 space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search 2,000+ EcoCrop species by common or scientific name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 pl-9 text-xs text-white placeholder-white/40 focus:border-emerald-400/50 focus:outline-none"
                                />
                                <svg
                                    width="14"
                                    height="14"
                                    style={{ width: '14px', height: '14px' }}
                                    className="absolute top-2.5 left-3 h-3.5 w-3.5 text-white/40"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-2 right-2.5 text-xs text-white/40 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Family Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <span className="text-white/40">Family:</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFamily('ALL')}
                                    className={`rounded-lg px-2 py-0.5 transition ${
                                        selectedFamily === 'ALL'
                                            ? 'bg-white/20 text-white font-medium'
                                            : 'text-white/50 hover:text-white'
                                    }`}
                                >
                                    All
                                </button>
                                {availableFamilies.map((fam) => (
                                    <button
                                        key={fam}
                                        type="button"
                                        onClick={() => setSelectedFamily(fam)}
                                        className={`rounded-lg px-2 py-0.5 transition ${
                                            selectedFamily === fam
                                                ? 'bg-emerald-500/25 text-emerald-300 font-medium'
                                                : 'text-white/50 hover:text-white'
                                        }`}
                                    >
                                        {fam}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {activeTab === 'recommended' ? (
                        filteredCrops.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {filteredCrops.map((crop) => (
                                    <CropCard key={crop.id} crop={crop} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-48 flex-col items-center justify-center text-center text-white/50">
                                <p>No crops matching "{searchQuery}" in this climate.</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedFamily('ALL');
                                    }}
                                    className="mt-2 text-xs text-emerald-400 underline"
                                >
                                    Reset filters
                                </button>
                            </div>
                        )
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
                            <p>Optimizing multi-year rotation...</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
