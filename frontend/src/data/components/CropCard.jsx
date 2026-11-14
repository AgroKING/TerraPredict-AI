import React, { useState } from 'react';

export default function CropCard({ crop }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-emerald-400 bg-emerald-500/15 border-emerald-400/30';
        if (score >= 80) return 'text-sky-400 bg-sky-500/15 border-sky-400/30';
        return 'text-amber-400 bg-amber-500/15 border-amber-400/30';
    };

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
            className={`group cursor-pointer select-none rounded-[26px] border border-white/15 bg-neutral-950/60 p-4 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/30 hover:bg-neutral-950/70 ${isExpanded
                ? 'col-span-full bg-neutral-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/25'
                : 'shadow-[0_8px_30px_rgba(0,0,0,0.25)]'
                }`}
        >
            {/* Top Photo Container */}
            <div
                className={`relative w-full overflow-hidden rounded-[18px] bg-neutral-900/60 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'h-48' : 'h-32'
                    }`}
            >
                <img
                    src={crop.image}
                    alt={crop.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Feasibility Pill Badge */}
                <span
                    className={`absolute top-2.5 right-2.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight backdrop-blur-md ${getScoreColor(
                        crop.feasibilityScore
                    )}`}
                >
                    {crop.feasibilityScore}% Match
                </span>
            </div>

            {/* Centered Crop Name */}
            <div className="mt-3.5 text-center">
                <h3 className="text-base font-semibold tracking-tight text-white">
                    {crop.name}
                </h3>
                <p className="text-xs italic text-white/50">{crop.scientificName}</p>
            </div>

            {/* Core Metrics */}
            <div className="mt-3.5 space-y-1.5 border-t border-white/10 pt-3 text-xs">
                <div className="flex items-center justify-between text-white/75">
                    <span className="text-white/50">Feasibility Score</span>
                    <span className="font-medium text-white">{crop.feasibilityScore} / 100</span>
                </div>
                <div className="flex items-center justify-between text-white/75">
                    <span className="text-white/50">Water Req.</span>
                    <span className="font-medium text-white">{crop.metrics.waterNeed}</span>
                </div>
                <div className="flex items-center justify-between text-white/75">
                    <span className="text-white/50">Cycle</span>
                    <span className="font-medium text-white">{crop.metrics.growthCycle}</span>
                </div>
            </div>

            {/* Smooth Expandable Details */}
            <div
                className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/25 p-3.5 text-xs text-white/80">
                        <div className="flex justify-between">
                            <span className="text-white/50">Optimal Soil Temp</span>
                            <span className="font-medium text-white">{crop.metrics.soilTemp}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">Sowing Window</span>
                            <span className="font-medium text-white">{crop.expandedDetails.sowingWindow}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">Nitrogen Balance</span>
                            <span className="font-medium text-emerald-300">
                                {crop.expandedDetails.nitrogenImpact}
                            </span>
                        </div>
                        <p className="border-t border-white/10 pt-2 leading-relaxed text-white/70">
                            {crop.expandedDetails.rotationBenefit}
                        </p>
                    </div>
                </div>
            </div>

            {/* Subtle Tap Affordance */}
            <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-medium text-white/40 transition-colors group-hover:text-white/70">
                <span>{isExpanded ? 'Tap to collapse' : 'Tap to expand'}</span>
                <svg
                    className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
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