"""FastAPI ML Inference Service for TerraPredict-AI.
Exposes /predict and /health endpoints connecting NASA POWER telemetry,
agronomic biophysical scoring, and 3-year beam-search rotation optimization.
"""

import calendar
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from prepare_crops import build_prepared_crops
from score_crops import (
    compute_soil_stewardship_index,
    evaluate_crop_window,
    export_monthly_crop_scores,
    load_crops_catalog,
    load_soil_terrain,
    optimize_rotation_beam,
)

app = FastAPI(title="TerraPredict-AI ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Curated crop imagery for high-fidelity UI rendering
CROP_IMAGE_MAP: Dict[str, str] = {
    "wheat": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
    "barley": "https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80",
    "oats": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    "rye": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    "maize": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
    "sorghum": "https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&w=800&q=80",
    "millet": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    "rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80",
    "chickpea": "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80",
    "lentil": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    "pea": "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=800&q=80",
    "soybean": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80",
    "mustard": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    "rapeseed": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    "sunflower": "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80",
    "potato": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
    "beet": "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80",
    "cotton": "https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?auto=format&fit=crop&w=800&q=80",
    "clover": "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&q=80",
    "vetch": "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80",
    "cover": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    "default": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
}


def get_crop_image(crop_id: str) -> str:
    crop_lower = crop_id.lower()
    for key, url in CROP_IMAGE_MAP.items():
        if key in crop_lower:
            return url
    return CROP_IMAGE_MAP["default"]


class LocationPayload(BaseModel):
    lat: float
    lon: float


class DailySeriesPayload(BaseModel):
    dates: Optional[List[str]] = None
    precipitation: Optional[List[Optional[float]]] = None
    soil_moisture: Optional[List[Optional[float]]] = None
    temp_avg: Optional[List[Optional[float]]] = None
    temp_max: Optional[List[Optional[float]]] = None
    temp_min: Optional[List[Optional[float]]] = None
    humidity: Optional[List[Optional[float]]] = None
    surface_temp: Optional[List[Optional[float]]] = None


class PredictRequest(BaseModel):
    location: LocationPayload
    date_range: Optional[Dict[str, str]] = None
    daily: Optional[DailySeriesPayload] = None
    irrigation: Optional[str] = "limited_supplemental"
    delta_temp: Optional[float] = 0.0
    delta_rain_pct: Optional[float] = 0.0


# Cache prepared crops in memory
CROPS_CATALOG = load_crops_catalog(None)


def construct_synthetic_or_observed_timeline(
    lat: float,
    lon: float,
    daily: Optional[DailySeriesPayload],
    start_year: int = 2026,
    start_month: int = 1,
    delta_temp: float = 0.0,
    delta_rain_pct: float = 0.0,
) -> List[Dict[str, Any]]:
    """Builds a robust 38-month agro-climatic timeline.
    If daily observations are supplied, uses them to calibrate baseline temperature,
    annual precipitation, and root-zone soil wetness; otherwise applies latitude-based climatology.
    """
    # Check if a forecast file already exists on disk
    forecast_path = Path(f"data/processed/forecast_{lat}_{lon}.csv")
    if forecast_path.exists():
        try:
            from score_crops import build_36_month_timeline
            return build_36_month_timeline(forecast_path, delta_temp, delta_rain_pct)
        except Exception:
            pass

    # Extract calibrators from recent daily observations if available
    obs_temp_mean = None
    obs_soilw_mean = None
    obs_rain_rate = None

    if daily and daily.temp_avg:
        valid_temps = [t for t in daily.temp_avg if t is not None]
        if valid_temps:
            obs_temp_mean = float(np.mean(valid_temps))

    if daily and daily.soil_moisture:
        valid_sm = [s for s in daily.soil_moisture if s is not None]
        if valid_sm:
            obs_soilw_mean = float(np.mean(valid_sm))

    if daily and daily.precipitation:
        valid_rain = [r for r in daily.precipitation if r is not None]
        if valid_rain:
            obs_rain_rate = float(np.mean(valid_rain)) * 30.4  # approx mm/month

    # Baseline sinusoidal temperature curve according to latitude
    abs_lat = abs(lat)
    is_northern = lat >= 0
    t_base = 30.0 - 0.5 * abs_lat
    if obs_temp_mean is not None:
        t_base = obs_temp_mean

    t_amp = min(14.0, max(3.0, 0.35 * abs_lat))

    # Baseline precipitation and soil moisture
    r_base = obs_rain_rate if obs_rain_rate is not None else (110.0 if abs_lat < 23.5 else 65.0)
    sw_base = obs_soilw_mean if obs_soilw_mean is not None else 0.42

    timeline = []
    for t in range(38):
        cal_month = ((start_month - 1 + t) % 12) + 1
        year_idx = (start_month - 1 + t) // 12
        cal_year = start_year + year_idx

        # Seasonality phase: peak warm in July (month 7) in NH, Jan (month 1) in SH
        phase = (cal_month - (7 if is_northern else 1)) / 12.0 * 2.0 * math.pi
        month_temp = t_base + t_amp * math.cos(phase)

        # Monsoonal / seasonal rainfall variation
        rain_phase = (cal_month - (8 if is_northern else 2)) / 12.0 * 2.0 * math.pi
        rain_factor = max(0.2, 1.0 + 0.8 * math.cos(rain_phase))
        month_rain = r_base * rain_factor

        month_soilw = float(np.clip(sw_base + 0.15 * math.cos(rain_phase), 0.08, 0.95))

        # Year 2-3 perturbations
        t_shift = delta_temp if year_idx >= 1 else 0.0
        r_mult = (1.0 + delta_rain_pct / 100.0) if year_idx >= 1 else 1.0
        sw_shift = (delta_rain_pct / 100.0) * 0.12 if year_idx >= 1 else 0.0

        timeline.append({
            "t": t,
            "year_num": year_idx + 1,
            "cal_month": cal_month,
            "cal_year": cal_year,
            "temp": round(float(month_temp + t_shift), 2),
            "rain": round(float(max(0.0, month_rain * r_mult)), 1),
            "rain_lo10": round(float(max(0.0, month_rain * r_mult * 0.72)), 1),
            "soilw": round(float(np.clip(month_soilw + sw_shift, 0.05, 1.0)), 3),
            "soilw_lo10": round(float(np.clip((month_soilw + sw_shift) * 0.85, 0.05, 1.0)), 3),
        })

    return timeline


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "TerraPredict-AI ML Service",
        "crops_catalog_count": len(CROPS_CATALOG),
    }


@app.post("/predict")
def predict_crops(req: PredictRequest):
    lat = req.location.lat
    lon = req.location.lon
    irrigation = req.irrigation or "limited_supplemental"

    # 1. Soil and terrain profile
    soil = load_soil_terrain(None, lat, lon)

    # 2. Build 36-month timeline calibrated with satellite daily telemetry
    timeline = construct_synthetic_or_observed_timeline(
        lat=lat,
        lon=lon,
        daily=req.daily,
        delta_temp=req.delta_temp or 0.0,
        delta_rain_pct=req.delta_rain_pct or 0.0,
    )

    # 3. Compute 3-Year Crop Rotation Strategies via beam search
    strategies = {}
    for strat_key in ("soil_regenerative", "water_resilient", "current_baseline"):
        strategies[strat_key] = optimize_rotation_beam(
            CROPS_CATALOG, timeline, soil, irrigation, strategy=strat_key
        )

    # 4. Compute single-season biophysical feasibility across all crops
    scores_df = export_monthly_crop_scores(CROPS_CATALOG, timeline, soil, irrigation)

    # Aggregate best score per unique crop
    best_crops = (
        scores_df.sort_values("biophysical_fit", ascending=False)
        .drop_duplicates(subset=["crop_id"])
        .head(10)
    )

    formatted_crops = []
    for _, row in best_crops.iterrows():
        crop_id = str(row["crop_id"])
        crop_match = CROPS_CATALOG[CROPS_CATALOG["crop_id"] == crop_id]
        if crop_match.empty:
            continue
        c_info = crop_match.iloc[0]

        fit_pct = int(round(float(row["biophysical_fit"]) * 100))
        drought_res = float(row["drought_resilience"])
        cycle_m = int(c_info["cycle_months"])
        ropmn = float(c_info["ropmn"])
        topmn = float(c_info["topmn"])
        topmx = float(c_info["topmx"])
        n_role = str(c_info["nitrogen_role"]).replace("_", " ").title()

        n_impact = (
            "+45 kg/ha (Net soil gain)"
            if "fixer" in n_role.lower()
            else "-35 kg/ha (Follow with legume)"
            if "heavy" in n_role.lower()
            else "-15 kg/ha"
        )

        formatted_crops.append({
            "id": crop_id,
            "name": str(c_info["crop_name"]),
            "scientificName": str(c_info["scientific_name"]),
            "image": get_crop_image(crop_id),
            "feasibilityScore": fit_pct,
            "confidence": round(drought_res, 2),
            "metrics": {
                "waterNeed": f"{int(ropmn)} mm",
                "growthCycle": f"{cycle_m * 30} Days ({cycle_m} mo)",
                "soilTemp": f"{int(topmn)}°C – {int(topmx)}°C",
            },
            "expandedDetails": {
                "rotationBenefit": (
                    "Fixes atmospheric nitrogen via root nodules and replenishes topsoil fertility."
                    if "fixer" in n_role.lower()
                    else "High biomass residue preserves root-zone soil wetness and prevents erosion."
                    if bool(c_info["is_cover_crop"])
                    else "Deep rooting structure loosens compacted subsoil layers and improves drainage."
                ),
                "nitrogenImpact": f"{n_role}: {n_impact}",
                "sowingWindow": f"{row['sow_month']} (Month {int(row['sow_month_num'])})",
            },
        })

    # 5. Extract 12-month climate outlook for the forecast card
    forecast_timeline = timeline[:12]
    forecast_dates = [
        f"{m['cal_year']}-{m['cal_month']:02d}-01" for m in forecast_timeline
    ]
    forecast_predicted = [m["temp"] for m in forecast_timeline]

    return {
        "success": True,
        "location": {"lat": lat, "lon": lon},
        "soil_terrain": soil,
        "forecast": {
            "dates": forecast_dates,
            "predicted": forecast_predicted,
            "monthly_outlook": forecast_timeline,
        },
        "crops": formatted_crops,
        "strategies": strategies,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
