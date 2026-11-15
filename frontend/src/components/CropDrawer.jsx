import React, { useState } from 'react';
import { Sprout, Layers, Calendar, Droplets, Info, ArrowDown, MapPin } from 'lucide-react';
import CropCard from './CropCard';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

const LOCAL_CROP_NAMES = {
    'chickpea': 'Chickpea (Chana / Bengal Gram)',
    'mustard': 'Indian Mustard (Sarson / Rai)',
    'groundnut': 'Groundnut (Mungfali / Peanut)',
    'peanut': 'Groundnut (Mungfali / Peanut)',
    'lentil': 'Lentil (Masoor Dal)',
    'pigeon pea': 'Pigeon Pea (Arhar / Toor Dal)',
    'garlic': 'Garlic (Lahsun)',
    'cowpea': 'Cowpea (Lobia / Chawli)',
    'black-eyed pea': 'Black-Eyed Pea (White Lobia)',
    'eggplant': 'Eggplant (Baingan)',
    'indian beech': 'Indian Beech (Karanja - Soil Restorer)',
    'coral tree': 'Coral Tree (Parijat / Murungai - N-Fixer)',
    'siyambala': 'Tamarind (Imli / Siyambala - Hardy Tree)',
};

function getFarmerFriendlyCropName(name, coordinates) {
    if (!name) return 'Crop';
    const isSouthAsia = coordinates && coordinates.lat >= 5 && coordinates.lat <= 38 && coordinates.lon >= 65 && coordinates.lon <= 98;
    if (isSouthAsia) {
        const lower = name.toLowerCase();
        for (const [key, val] of Object.entries(LOCAL_CROP_NAMES)) {
            if (lower.includes(key)) return val;
        }
    }
    return name;
}

function getScheduleCropImage(item, crops = []) {
    if (item.image) return item.image;
    const match = crops.find(
        (c) =>
            c.id === item.crop_id ||
            (c.scientificName &&
                item.scientific_name &&
                c.scientificName.toLowerCase() === item.scientific_name.toLowerCase()) ||
            (c.name && item.crop_name && c.name.toLowerCase().includes(item.crop_name.toLowerCase()))
    );
    if (match?.image) return match.image;
    return FALLBACK_IMAGE;
}

function getHandoverBenefit(current) {
    if (current.nitrogen_role === 'fixer') {
        return 'Fixes +45 kg/ha of biological nitrogen in the root zone, significantly reducing chemical fertilizer requirements for the next crop.';
    }
    if (current.root_depth_class === 'deep') {
        return 'Deep taproots break up dense subsoil horizons, improving capillary infiltration and aeration for subsequent rotations.';
    }
    if (current.is_cover_crop) {
        return 'Dense canopy architecture suppresses weed seedbanks and limits evaporative moisture depletion from topsoil.';
    }
    if (current.nitrogen_role === 'light_feeder') {
        return 'Low nutrient extraction rate maintains baseline moisture and nutrient reserves for upcoming plantings.';
    }
    return 'Incorporates organic biomass residue, building active soil humus and biological activity.';
}

export default function CropDrawer({
    isOpen,
    onClose,
    locationName = '',
    isLoading = false,
    coordinates,
    crops = [],
    strategies = null,
    soilTerrain = null,
}) {
    const [viewMode, setViewMode] = useState('crops'); // 'crops' | 'rotation'
    const [activeStrategy, setActiveStrategy] = useState('soil_regenerative');

    const currentStrategyData = strategies ? strategies[activeStrategy] : null;
    const schedule = currentStrategyData?.schedule || [];
    const placeTitle = locationName ? `${locationName} · ` : '';

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
                className={`fixed top-4 right-4 bottom-4 z-40 flex w-[94vw] flex-col overflow-hidden rounded-[34px] border border-white/20 bg-neutral-950/45 shadow-[0_25px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[50vw] sm:min-w-[460px] sm:max-w-[720px] ${
                    isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'
                }`}
            >
                {/* Top Header */}
                <div className="border-b border-white/10 px-6 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                                <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
                                    Agricultural Decision Support Advisory
                                </span>
                            </div>
                            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-white">
                                {viewMode === 'crops'
                                    ? `Best Crops for Your Land (${crops.length})`
                                    : '3-Year Crop Rotation Guide'}
                            </h2>
                            {coordinates && (
                                <p className="mt-0.5 text-xs text-white/60">
                                    {placeTitle}{coordinates.lat.toFixed(2)}°N, {coordinates.lon.toFixed(2)}°E
                                    {soilTerrain && (
                                        <span className="ml-2 border-l border-white/15 pl-2 text-emerald-300 font-medium">
                                            Loam Soil (pH {soilTerrain.ph?.toFixed(1) || '6.5'} · {soilTerrain.clay_pct?.toFixed(0) || '25'}% Clay)
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
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-semibold transition ${
                                viewMode === 'crops'
                                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 shadow-sm'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Sprout size={14} />
                            <span>Recommended Crops ({crops.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('rotation')}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-semibold transition ${
                                viewMode === 'rotation'
                                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 shadow-sm'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Layers size={14} />
                            <span>3-Year Rotation Plan</span>
                        </button>
                    </div>

                    {/* Secondary Strategy Pills (Only shown in rotation view) */}
                    {viewMode === 'rotation' && (
                        <div className="mt-3 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveStrategy('soil_regenerative')}
                                className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition text-center ${
                                    activeStrategy === 'soil_regenerative'
                                        ? 'border border-emerald-500/40 bg-emerald-500/25 text-emerald-300 shadow-sm'
                                        : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                                }`}
                                title="Restores natural soil nutrients and cuts chemical fertilizer bills"
                            >
                                Soil-Regenerative Plan
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveStrategy('water_resilient')}
                                className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition text-center ${
                                    activeStrategy === 'water_resilient'
                                        ? 'border border-sky-500/40 bg-sky-500/25 text-sky-300 shadow-sm'
                                        : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                                }`}
                                title="Survives dry winters with minimum watering"
                            >
                                Water-Resilient Plan
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveStrategy('current_baseline')}
                                className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition text-center ${
                                    activeStrategy === 'current_baseline'
                                        ? 'border border-amber-500/40 bg-amber-500/25 text-amber-300 shadow-sm'
                                        : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
                                }`}
                                title="Standard cash crop rotation"
                            >
                                Baseline Commercial Plan
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="relative flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {isLoading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mb-3" />
                            <p className="text-sm font-semibold text-emerald-300">
                                Analyzing satellite telemetry & crops for {locationName || 'location'}...
                            </p>
                            <p className="text-xs text-white/50 mt-1">Screening FAO EcoCrop biophysical database</p>
                        </div>
                    )}

                    {viewMode === 'crops' ? (
                        /* Single-Season Crop Card Grid */
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-200/90 flex items-center gap-2">
                                <Info size={14} className="text-emerald-400 shrink-0" />
                                <span>
                                    <strong>Agronomic Profile:</strong> These {crops.length} crops are calibrated to seasonal thermal windows, soil profile, and regional agricultural demand in {locationName || 'your area'}.
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {crops.map((crop) => (
                                    <CropCard key={crop.id} crop={crop} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Multi-Year Rotation Flow Chart */
                        currentStrategyData ? (
                            <div className="space-y-6">
                                {/* Dynamic Farm Health Scorecard */}
                                {currentStrategyData.soil_stewardship && (() => {
                                    const steward = currentStrategyData.soil_stewardship || {};
                                    const scoreVal = Math.round(steward.composite_stewardship_score ?? 82);
                                    const scoreVerdict = scoreVal >= 80 ? 'Excellent' : scoreVal >= 65 ? 'Good' : 'Moderate';
                                    const fitPct = Math.round((currentStrategyData.mean_biophysical_fit ?? 0.85) * 100);
                                    const droughtPct = Math.round((currentStrategyData.mean_drought_resilience ?? 0.80) * 100);
                                    const coverPct = Math.round(steward.living_cover_ratio ?? 90);
                                    const nBal = Math.round(steward.biological_n_balance ?? 65);
                                    const rootDiv = Math.round(steward.taxonomic_root_diversity ?? 60);

                                    return (
                                        <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-4 backdrop-blur-md">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                <div>
                                                    <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                                                        Soil Stewardship & Agro-Ecosystem Index
                                                    </span>
                                                    <div className="text-2xl font-black text-emerald-400">
                                                        {scoreVal} <span className="text-sm font-medium text-white/50">/ 100 ({scoreVerdict})</span>
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-white/70">
                                                    <div>Biophysical Fit: <strong className="text-emerald-300">{fitPct}%</strong></div>
                                                    <div>Drought Safety: <strong className="text-sky-300">{droughtPct}%</strong></div>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-2.5">
                                                    <span className="text-white/60">Soil Cover Index</span>
                                                    <div className="mt-0.5 text-sm font-bold text-emerald-300">
                                                        {coverPct}%
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-2.5">
                                                    <span className="text-white/60">Biological Nitrogen</span>
                                                    <div className="mt-0.5 text-sm font-bold text-emerald-300">
                                                        {nBal}/100
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-sky-500/20 bg-sky-950/30 p-2.5">
                                                    <span className="text-white/60">Root Diversity</span>
                                                    <div className="mt-0.5 text-sm font-bold text-sky-300">
                                                        {rootDiv}/100
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Visual 36-Month Timeline Bar */}
                                <div className="rounded-2xl border border-white/15 bg-neutral-900/60 p-4 backdrop-blur-md">
                                    <div className="flex items-center justify-between text-xs text-white/70">
                                        <span className="font-bold tracking-wider uppercase text-[11px] text-white/60">
                                            36-Month Agronomic Succession Calendar
                                        </span>
                                        <span className="text-emerald-400 font-semibold">Continuous Soil Cover</span>
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
                                                    title={`${getFarmerFriendlyCropName(item.crop_name, coordinates)}: ${item.cycle_months} mo (${item.sow_label} → ${item.harvest_label})`}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Month & Season Markers */}
                                    <div className="mt-1.5 flex justify-between text-[10px] text-white/50">
                                        <span>Year 1 (Monsoon / Post-Monsoon)</span>
                                        <span>Year 2 (Legume Succession)</span>
                                        <span>Year 3 (Harvest & Stewardship)</span>
                                    </div>
                                </div>

                                {/* Connected Flow Chart Sequence */}
                                <div>
                                    <h3 className="mb-3 text-xs font-bold tracking-wider text-emerald-300 uppercase flex items-center gap-1.5">
                                        <span>Sowing Sequence & Succession Dynamics</span>
                                    </h3>

                                    <div className="relative pl-6 space-y-4">
                                        {/* Connected Vertical Spine */}
                                        <div className="absolute top-4 bottom-4 left-3 w-0.5 bg-gradient-to-b from-emerald-400 via-sky-400 to-amber-400 opacity-30" />

                                        {schedule.map((item, idx) => {
                                            const image = getScheduleCropImage(item, crops);
                                            const isLast = idx === schedule.length - 1;
                                            const benefit = getHandoverBenefit(item);
                                            const friendlyName = getFarmerFriendlyCropName(item.crop_name, coordinates);

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
                                                                    alt={friendlyName}
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = FALLBACK_IMAGE;
                                                                    }}
                                                                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                                
                                                                {/* Year Badge */}
                                                                <span className="absolute top-2 left-2 rounded-lg border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                                                                    Year {item.year_num}
                                                                </span>

                                                                {/* Fit Badge */}
                                                                <span className="absolute bottom-2 right-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md">
                                                                    {(item.biophysical_fit * 100).toFixed(0)}% Match
                                                                </span>
                                                            </div>

                                                            {/* Crop Details & Parameters */}
                                                            <div className="flex-1 min-w-0">
                                                                <div>
                                                                    <h4 className="font-bold text-white text-base leading-snug">
                                                                        {friendlyName}
                                                                    </h4>
                                                                    <p className="text-xs italic text-white/50 truncate">
                                                                        {item.scientific_name || item.family}
                                                                    </p>
                                                                </div>

                                                                {/* Planting Window */}
                                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                                                                    <Calendar size={12} className="text-emerald-400" />
                                                                    <span>{item.sow_label} → {item.harvest_label} · {item.cycle_months} Mo Window</span>
                                                                </div>

                                                                {/* Helpful Agronomic Parameters Badges */}
                                                                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                                                                    {item.nitrogen_role === 'fixer' && (
                                                                        <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-300">
                                                                            Adds Natural Nitrogen (+45 kg/ha)
                                                                        </span>
                                                                    )}
                                                                    {item.nitrogen_role === 'heavy_feeder' && (
                                                                        <span className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-medium text-amber-300">
                                                                            High-Yielding Cash Crop
                                                                        </span>
                                                                    )}
                                                                    {item.nitrogen_role === 'light_feeder' && (
                                                                        <span className="rounded-lg border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 font-medium text-teal-300">
                                                                            Light Feeder / Soil Preserving
                                                                        </span>
                                                                    )}

                                                                    <span className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 font-medium text-sky-300">
                                                                        {item.root_depth_class === 'deep' ? 'Deep Taproot (Drought Hardy)' : 'Medium Root Depth'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Handover Flow Connector Arrow to Next Crop */}
                                                    {!isLast && (
                                                        <div className="my-2 ml-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-300">
                                                            <ArrowDown size={13} className="text-emerald-400 shrink-0" />
                                                            <span className="text-[11px] font-medium leading-relaxed">
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
