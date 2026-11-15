import React from 'react';
import CropCard from './CropCard';

export default function CropDrawer({ isOpen, onClose, coordinates, crops = [] }) {
    return (
        <>
            {/* Click-Outside Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 z-30 bg-transparent transition-opacity duration-500 ${
                    isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            {/* Floating Frosted Glass Panel (~46% width) */}
            <aside
                aria-hidden={!isOpen}
                className={`fixed top-4 right-4 bottom-4 z-40 flex w-[92vw] flex-col overflow-hidden rounded-[34px] border border-white/20 bg-neutral-950/20 shadow-[0_25px_70px_rgba(0,0,0,0.65)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[46vw] sm:min-w-[420px] sm:max-w-[680px] ${
                    isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'
                }`}
            >
                {/* Top Grabber & Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 pt-5 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                            <span className="text-[11px] font-medium tracking-wider text-white/50 uppercase">
                                Agro-Feasibility Analysis
                            </span>
                        </div>
                        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-white">
                            Recommended Crops
                        </h2>
                        {coordinates && (
                            <p className="mt-0.5 text-xs text-white/50">
                                Lat {coordinates.lat.toFixed(2)}° · Lon {coordinates.lon.toFixed(2)}°
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

                {/* Scrollable Card Grid */}
                <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {crops.map((crop) => (
                            <CropCard key={crop.id} crop={crop} />
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}
