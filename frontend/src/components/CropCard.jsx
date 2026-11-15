import React, { useState } from 'react';
import { Droplets, Calendar, Sparkles, Sprout, CheckCircle2, Thermometer } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

export default function CropCard({ crop }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const score = crop?.feasibilityScore ?? 80;
    const getScoreColor = (s) => {
        if (s >= 90) return 'text-emerald-400 bg-emerald-500/15 border-emerald-400/40';
        if (s >= 80) return 'text-sky-400 bg-sky-500/15 border-sky-400/40';
        return 'text-amber-400 bg-amber-500/15 border-amber-400/40';
    };

    const metrics = crop?.metrics || {};
    const details = crop?.expandedDetails || {};

    // Determine friendly water & nitrogen highlights
    const isNitrogenFixer =
        details.nitrogenImpact?.includes('+') ||
        details.nitrogenImpact?.toLowerCase().includes('fixer') ||
        crop?.name?.toLowerCase().includes('chickpea') ||
        crop?.name?.toLowerCase().includes('lentil') ||
        crop?.name?.toLowerCase().includes('pea') ||
        crop?.name?.toLowerCase().includes('groundnut');

    const waterText = metrics.waterNeed || '400 mm';
    const isLowWater = waterText.includes('Low') || parseInt(waterText, 10) <= 450;

    return (
        <div
            onClick={() => setIsExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsExpanded((prev) => !prev);
                }
            }}
            className={`group cursor-pointer select-none rounded-[24px] border border-white/15 bg-neutral-950/60 p-4 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/40 hover:bg-neutral-950/75 ${
                isExpanded
                    ? 'col-span-full bg-neutral-950/85 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-emerald-400/30'
                    : 'shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
            }`}
        >
            {/* Top Photo Container */}
            <div
                className={`relative w-full overflow-hidden rounded-[18px] bg-neutral-900/60 transition-all duration-400 ${
                    isExpanded ? 'h-48' : 'h-34'
                }`}
            >
                <img
                    src={crop?.image || FALLBACK_IMAGE}
                    alt={crop?.name || 'Crop'}
                    onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                {/* Farmer Highlight Badge Top Left */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {isNitrogenFixer ? (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md shadow-sm">
                            <Sprout size={11} />
                            <span>Natural Fertilizer</span>
                        </span>
                    ) : isLowWater ? (
                        <span className="flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-950/80 px-2 py-0.5 text-[10px] font-semibold text-sky-300 backdrop-blur-md shadow-sm">
                            <Droplets size={11} />
                            <span>Low Water</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-950/80 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-md shadow-sm">
                            <Sparkles size={11} />
                            <span>High Cash Value</span>
                        </span>
                    )}
                </div>

                {/* Land Match Score Pill Top Right */}
                <span
                    className={`absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-tight backdrop-blur-md shadow-sm ${getScoreColor(
                        score
                    )}`}
                >
                    <CheckCircle2 size={12} />
                    <span>{score}% Match</span>
                </span>

                {/* Sowing Season tag bottom left of photo */}
                <span className="absolute bottom-2 left-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                    {details.sowingWindow?.includes('Rabi')
                        ? 'Winter Season'
                        : details.sowingWindow?.includes('Kharif')
                        ? 'Monsoon Season'
                        : 'Optimal Window'}
                </span>
            </div>

            {/* Farmer Friendly Name & Botanical Subtitle */}
            <div className="mt-3 text-center">
                <h3 className="text-base font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    {crop?.name || 'Crop Species'}
                </h3>
                {crop?.scientificName && (
                    <p className="text-[11px] italic text-white/40">{crop.scientificName}</p>
                )}
            </div>

            {/* Core Farmer Metrics in Plain Language */}
            <div className="mt-3 space-y-2 border-t border-white/10 pt-2.5 text-xs">
                <div className="flex items-center justify-between text-white/80">
                    <span className="flex items-center gap-1.5 text-white/50">
                        <Droplets size={13} className="text-sky-400" />
                        <span>Water Demand:</span>
                    </span>
                    <span className="font-semibold text-white">
                        {isLowWater ? 'Low' : 'Normal'} ({metrics.waterNeed?.split(' ')[0] || '400'} mm)
                    </span>
                </div>
                <div className="flex items-center justify-between text-white/80">
                    <span className="flex items-center gap-1.5 text-white/50">
                        <Calendar size={13} className="text-amber-400" />
                        <span>Growth Cycle:</span>
                    </span>
                    <span className="font-semibold text-white">
                        {metrics.growthCycle || '110 Days (~3.5 mo)'}
                    </span>
                </div>
            </div>

            {/* Smooth Expandable Farmer Details */}
            <div
                className={`grid transition-all duration-300 ease-out ${
                    isExpanded ? 'mt-3.5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/35 p-3 text-xs text-white/85">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-white/50">
                                <Thermometer size={13} className="text-orange-400" />
                                <span>Thermal Range</span>
                            </span>
                            <span className="font-medium text-white">
                                {metrics.soilTemp?.includes('°C') ? metrics.soilTemp : '15°C – 25°C'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-white/50">
                                <Calendar size={13} className="text-sky-400" />
                                <span>Sowing Window</span>
                            </span>
                            <span className="font-medium text-emerald-300">
                                {details.sowingWindow || 'Optimal Planting Window'}
                            </span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-emerald-400">
                                {isNitrogenFixer ? 'Soil Stewardship Benefit:' : 'Agronomic Benefit:'}
                            </span>
                            <p className="text-[11px] leading-relaxed text-white/75">
                                {details.nitrogenImpact ||
                                    (isNitrogenFixer
                                        ? 'Fixes atmospheric nitrogen into the root zone, improving soil health for subsequent rotations.'
                                        : 'Light soil feeder. Protects field structure with deep rooting profile.')}
                            </p>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-sky-400">
                                Agronomic Rationale:
                            </span>
                            <p className="text-[11px] leading-relaxed text-white/75">
                                {details.rotationBenefit ||
                                    'High agro-feasibility score calibrated to local thermal windows and moisture availability.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Tap Affordance */}
            <div className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-medium text-white/40 transition-colors group-hover:text-emerald-300">
                <span>{isExpanded ? 'Tap to collapse' : 'Tap for farmer tips & details'}</span>
                <svg
                    className={`h-3 w-3 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}
