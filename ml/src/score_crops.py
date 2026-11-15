import argparse
import calendar
import json
import math
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

FAMILY_SYNONYMS = {
    "Leguminosae": "Fabaceae",
    "Papilionaceae": "Fabaceae",
    "Cruciferae": "Brassicaceae",
    "Gramineae": "Poaceae",
    "Compositae": "Asteraceae",
    "Umbelliferae": "Apiaceae",
    "Labiatae": "Lamiaceae",
}


def normalize_family(raw_fam: str) -> str:
    if not raw_fam or str(raw_fam).lower() in ("nan", "none", "unknown"):
        return "Unknown"
    leaf = str(raw_fam).split(":")[-1].strip().title()
    return FAMILY_SYNONYMS.get(leaf, leaf)


def trapezoid_score(val: float, vmin: float, vopmn: float, vopmx: float, vmax: float) -> float:
    if val is None or math.isnan(val):
        return 0.5
    if val < vmin or val > vmax:
        return 0.0
    if vopmn <= val <= vopmx:
        return 1.0
    if val < vopmn:
        return max(0.0, (val - vmin) / max(1e-6, (vopmn - vmin)))
    return max(0.0, (vmax - val) / max(1e-6, (vmax - vopmx)))


def load_soil_terrain(soil_path: Path | None, lat: float, lon: float) -> dict:
    candidates = []
    if soil_path is not None:
        candidates.append(soil_path)
    candidates.extend([
        Path(f"data/processed/soil_terrain_{lat}_{lon}.json"),
        Path(f"data/processed/soil_{lat}_{lon}.json"),
    ])

    for p in candidates:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                raw = json.load(f)
            return {
                "ph": float(raw.get("ph", raw.get("phh2o", 6.5))),
                "clay_pct": float(raw.get("clay_pct", raw.get("clay", 25.0))),
                "sand_pct": float(raw.get("sand_pct", raw.get("sand", 40.0))),
                "silt_pct": float(raw.get("silt_pct", raw.get("silt", 35.0))),
                "soc_g_kg": float(raw.get("soc_g_kg", raw.get("soc", 15.0))),
                "nitrogen_g_kg": float(raw.get("nitrogen_g_kg", raw.get("nitrogen", 1.4))),
                "elevation_m": float(raw.get("elevation_m", raw.get("elevation", 80.0))),
                "slope_pct": float(raw.get("slope_pct", raw.get("slope", 1.5))),
                "source": str(p),
            }

    return {
        "ph": 6.5,
        "clay_pct": 25.0,
        "sand_pct": 40.0,
        "silt_pct": 35.0,
        "soc_g_kg": 15.0,
        "nitrogen_g_kg": 1.4,
        "elevation_m": 80.0,
        "slope_pct": 1.5,
        "source": "neutral_global_fallback",
    }


def load_crops_catalog(crops_path: Path | None) -> pd.DataFrame:
    candidates = []
    if crops_path is not None:
        candidates.append(crops_path)
    candidates.extend([
        Path("data/processed/crops_prepared.csv"),
        Path("data/crops_prepared.csv"),
        Path("crops_prepared.csv"),
    ])

    for p in candidates:
        if p.exists():
            df = pd.read_csv(p)
            if "crop_id" in df.columns and "sow_tmin" in df.columns:
                df["family"] = df["family"].astype(str).map(normalize_family)
                return df

    from prepare_crops import build_prepared_crops
    df = build_prepared_crops()
    out_default = Path("data/processed/crops_prepared.csv")
    out_default.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_default, index=False)
    df["family"] = df["family"].astype(str).map(normalize_family)
    return df


def load_monthly_diurnal_stats(out_dir: Path, lat: float, lon: float) -> dict[int, dict]:
    m_path = out_dir / f"monthly_{lat}_{lon}.csv"
    defaults = {m: {"tmin_offset": 4.5, "tmax_offset": 5.0, "hot_days_40": 0.0} for m in range(1, 13)}
    if not m_path.exists():
        return defaults

    m_df = pd.read_csv(m_path)
    if "month" not in m_df.columns or "temp_mean" not in m_df.columns:
        return defaults

    for m_num, grp in m_df.groupby("month"):
        m_int = int(m_num)
        tmin_off = float((grp["temp_mean"] - grp["tmin_mean"]).mean()) if "tmin_mean" in grp.columns else 4.5
        tmax_off = float((grp["tmax_mean"] - grp["temp_mean"]).mean()) if "tmax_mean" in grp.columns else 5.0
        hot40 = float(grp["hot_days_40"].mean()) if "hot_days_40" in grp.columns else 0.0
        defaults[m_int] = {
            "tmin_offset": max(0.0, tmin_off) if not math.isnan(tmin_off) else 4.5,
            "tmax_offset": max(0.0, tmax_off) if not math.isnan(tmax_off) else 5.0,
            "hot_days_40": hot40 if not math.isnan(hot40) else 0.0,
        }
    return defaults


def load_teleconnections_and_skill(out_dir: Path, lat: float, lon: float) -> dict:
    nino34 = None
    dmi = None
    idx_path = Path("data/raw/indices.csv")
    if idx_path.exists():
        ix = pd.read_csv(idx_path)
        if "nino34" in ix.columns and ix["nino34"].notna().any():
            nino34 = float(ix["nino34"].dropna().iloc[-1])
        if "dmi" in ix.columns and ix["dmi"].notna().any():
            dmi = float(ix["dmi"].dropna().iloc[-1])

    enso_label = "Unavailable"
    if nino34 is not None:
        if nino34 >= 0.5:
            enso_label = f"El Nino (Nino3.4 = {nino34:+.2f}°C)"
        elif nino34 <= -0.5:
            enso_label = f"La Nina (Nino3.4 = {nino34:+.2f}°C)"
        else:
            enso_label = f"Neutral (Nino3.4 = {nino34:+.2f}°C)"

    iod_label = "Unavailable"
    if dmi is not None:
        if dmi >= 0.4:
            iod_label = f"Positive IOD (DMI = {dmi:+.2f}°C)"
        elif dmi <= -0.4:
            iod_label = f"Negative IOD (DMI = {dmi:+.2f}°C)"
        else:
            iod_label = f"Neutral (DMI = {dmi:+.2f}°C)"

    active_anomaly = bool(
        (nino34 is not None and abs(nino34) >= 0.5) or (dmi is not None and abs(dmi) >= 0.4)
    )

    skill_summary = {}
    skill_path = out_dir / f"skill_{lat}_{lon}.csv"
    if skill_path.exists():
        sk = pd.read_csv(skill_path)
        if {"var", "use_lgbm"}.issubset(sk.columns):
            for v, grp in sk.groupby("var"):
                skill_summary[str(v)] = f"{int(grp['use_lgbm'].sum())}/{len(grp)} leads via LightGBM"

    return {
        "nino34": nino34,
        "dmi": dmi,
        "enso_phase": enso_label,
        "iod_phase": iod_label,
        "active_teleconnection": active_anomaly,
        "forecast_skill": skill_summary or {"status": "skill file not found"},
    }


def build_36_month_timeline(
    forecast_path: Path,
    diurnal_stats: dict[int, dict],
    delta_temp: float = 0.0,
    delta_rain_pct: float = 0.0,
) -> list[dict]:
    if not forecast_path.exists():
        raise FileNotFoundError(
            f"Forecast file not found: {forecast_path}. Run forecast_model.py first."
        )

    df = pd.read_csv(forecast_path)
    df["target_date"] = pd.to_datetime(df["target_date"])
    df = df.sort_values(["target_date", "variable"]).drop_duplicates(
        subset=["target_date", "variable"], keep="first"
    )

    dates = sorted(df["target_date"].unique())[:12]
    if len(dates) < 12:
        raise ValueError(f"Expected 12 forecast months in {forecast_path}, found {len(dates)}.")

    base_12 = []
    for dt in dates:
        sub = df[df["target_date"] == dt].set_index("variable")
        cal_m = int(pd.Timestamp(dt).month)
        d_stat = diurnal_stats.get(cal_m, {"tmin_offset": 4.5, "tmax_offset": 5.0, "hot_days_40": 0.0})

        def _val(var: str, col: str, default: float) -> float:
            if var in sub.index and col in sub.columns and pd.notna(sub.loc[var, col]):
                return float(sub.loc[var, col])
            return default

        t_pt = _val("temp_mean", "point", 15.0)
        t_base = _val("temp_mean", "baseline", t_pt)
        r_pt = max(0.0, _val("rain_mm", "point", 60.0))
        r_base = max(0.0, _val("rain_mm", "baseline", r_pt))
        r_lo = max(0.0, _val("rain_mm", "lo10", r_pt * 0.7))
        sw_pt = float(np.clip(_val("soilw_root", "point", 0.55), 0.05, 1.0))
        sw_base = float(np.clip(_val("soilw_root", "baseline", sw_pt), 0.05, 1.0))
        sw_lo = float(np.clip(_val("soilw_root", "lo10", sw_pt * 0.85), 0.05, 1.0))

        base_12.append({
            "cal_month": cal_m,
            "cal_year": int(pd.Timestamp(dt).year),
            "temp_pt": t_pt,
            "temp_base": t_base,
            "rain_pt": r_pt,
            "rain_base": r_base,
            "rain_lo10": r_lo,
            "soilw_pt": sw_pt,
            "soilw_base": sw_base,
            "soilw_lo10": sw_lo,
            "tmin_offset": d_stat["tmin_offset"],
            "tmax_offset": d_stat["tmax_offset"],
            "hot_days_40": d_stat["hot_days_40"],
        })

    timeline = []
    yr_blend = {0: 1.0, 1: 0.35, 2: 0.0, 3: 0.0}
    for t in range(38):
        b = base_12[t % 12]
        yr_idx = t // 12
        w_pt = yr_blend[yr_idx]

        t_nominal = w_pt * b["temp_pt"] + (1.0 - w_pt) * b["temp_base"]
        r_nominal = w_pt * b["rain_pt"] + (1.0 - w_pt) * b["rain_base"]
        sw_nominal = w_pt * b["soilw_pt"] + (1.0 - w_pt) * b["soilw_base"]

        t_shift = delta_temp if yr_idx >= 1 else 0.0
        r_mult = (1.0 + delta_rain_pct / 100.0) if yr_idx >= 1 else 1.0
        sw_shift = (delta_rain_pct / 100.0) * 0.12 if yr_idx >= 1 else 0.0

        t_final = t_nominal + t_shift
        r_final = max(0.0, r_nominal * r_mult)
        r_lo_final = max(0.0, (w_pt * b["rain_lo10"] + (1.0 - w_pt) * (b["rain_base"] * 0.72)) * r_mult)

        timeline.append({
            "t": t,
            "year_num": yr_idx + 1,
            "cal_month": b["cal_month"],
            "cal_year": b["cal_year"] + yr_idx,
            "temp": t_final,
            "tmin_est": t_final - b["tmin_offset"],
            "tmax_est": t_final + b["tmax_offset"],
            "rain": r_final,
            "rain_lo10": r_lo_final,
            "soilw": float(np.clip(sw_nominal + sw_shift, 0.05, 1.0)),
            "soilw_lo10": float(np.clip(b["soilw_lo10"] + sw_shift, 0.05, 1.0)),
        })
    return timeline


def evaluate_crop_window(
    crop: pd.Series,
    start_t: int,
    timeline: list[dict],
    soil: dict,
    irrigation: str,
) -> tuple[float, float]:
    c_len = int(crop["cycle_months"])
    if start_t + c_len > len(timeline):
        return 0.0, 0.0

    window = timeline[start_t : start_t + c_len]
    sow_slot = window[0]

    if not (float(crop["sow_tmin"]) <= sow_slot["temp"] <= float(crop["sow_tmax"])):
        return 0.0, 0.0

    req_soilw = float(crop["min_sowing_soilw"])
    eff_sow_soilw = (
        0.85 if irrigation == "irrigated"
        else (min(1.0, sow_slot["soilw"] + 0.08) if irrigation == "limited_supplemental" else sow_slot["soilw"])
    )
    if eff_sow_soilw < req_soilw:
        return 0.0, 0.0

    temps = [m["temp"] for m in window]

    if bool(crop["vernalization_required"]):
        juv_temps = temps[1 : min(6, len(temps))]
        if sum(1 for tv in juv_temps if tv <= 8.5) < 2:
            return 0.0, 0.0

    if bool(crop.get("cool_season_cover", False)):
        if sum(1 for tv in temps if tv <= 9.5) < 2:
            return 0.0, 0.0

    if float(np.mean(temps[-2:])) < float(crop["harvest_tmin"]):
        return 0.0, 0.0

    if min(m["tmin_est"] for m in window) < float(crop["tmin"]) - 2.0:
        return 0.0, 0.0
    if max(m["tmax_est"] for m in window) > float(crop["tmax"]) + 2.0:
        return 0.0, 0.0

    t_mean = float(np.mean(temps))
    t_score = trapezoid_score(
        t_mean, float(crop["tmin"]), float(crop["topmn"]), float(crop["topmx"]), float(crop["tmax"])
    )

    rain_sum = sum(m["rain"] for m in window)
    rain_lo10_sum = sum(m["rain_lo10"] for m in window)
    if irrigation == "irrigated":
        eff_rain = max(rain_sum, float(crop["ropmn"]) * (c_len / 12.0))
    elif irrigation == "limited_supplemental":
        eff_rain = rain_sum + 90.0 * (c_len / 12.0)
    else:
        eff_rain = rain_sum

    ann_rain_eq = eff_rain * (12.0 / c_len)
    ann_rain_lo10_eq = rain_lo10_sum * (12.0 / c_len)

    ann_rain_upper_eq = eff_rain * (12.0 / max(c_len, 6))
    r_eff_for_score = (
        ann_rain_eq
        if ann_rain_eq <= float(crop["ropmx"])
        else max(float(crop["ropmx"]), ann_rain_upper_eq)
    )

    r_score = trapezoid_score(
        r_eff_for_score, float(crop["rmin"]), float(crop["ropmn"]), float(crop["ropmx"]), float(crop["rmax"])
    )
    drought_res = trapezoid_score(
        ann_rain_lo10_eq, float(crop["rmin"]), float(crop["ropmn"]), float(crop["ropmx"]), float(crop["rmax"])
    )
    ph_score = trapezoid_score(
        soil["ph"], float(crop["phmin"]), float(crop["phopmn"]), float(crop["phopmx"]), float(crop["phmax"])
    )

    edaphic_mod = 1.0
    mean_soilw = float(np.mean([m["soilw"] for m in window]))
    if not bool(crop["waterlogging_ok"]) and soil["clay_pct"] > 45.0 and mean_soilw > 0.78:
        edaphic_mod *= 0.85
    if bool(crop["waterlogging_ok"]) and soil["sand_pct"] > 65.0 and irrigation == "rainfed":
        edaphic_mod *= 0.70
    if soil["slope_pct"] > 8.0 and crop["root_depth_class"] == "shallow" and not bool(crop["is_cover_crop"]):
        edaphic_mod *= 0.88

    fit = edaphic_mod * (0.42 * t_score + 0.38 * r_score + 0.20 * ph_score)
    return round(float(np.clip(fit, 0.0, 1.0)), 4), round(float(np.clip(drought_res, 0.0, 1.0)), 4)


def compute_soil_stewardship_index(events: list[dict], horizon: int = 36) -> dict:
    if not events:
        return {
            "living_cover_ratio": 0.0,
            "biological_n_balance": 0.0,
            "root_residue_input": 0.0,
            "taxonomic_root_diversity": 0.0,
            "composite_stewardship_score": 0.0,
        }

    covered_months = sum(min(e["end_t"], horizon) - e["start_t"] for e in events)
    living_cover = min(100.0, (covered_months / horizon) * 100.0)

    fixer_months = sum(
        (min(e["end_t"], horizon) - e["start_t"])
        for e in events if e["nitrogen_role"] == "fixer"
    )
    fixer_share = fixer_months / max(1, covered_months)
    if fixer_share <= 0.35:
        n_balance = 35.0 + (fixer_share / 0.35) * 65.0
    elif fixer_share <= 0.55:
        n_balance = 100.0 - ((fixer_share - 0.35) / 0.20) * 15.0
    else:
        n_balance = max(40.0, 85.0 - ((fixer_share - 0.55) / 0.45) * 45.0)

    residue_pts = 0.0
    for e in events:
        dur = min(e["end_t"], horizon) - e["start_t"]
        w = 1.0 + (0.65 if e["is_cover_crop"] else 0.0) + (
            0.35 if e["root_depth_class"] == "deep" else (0.15 if e["root_depth_class"] == "medium" else 0.0)
        )
        residue_pts += dur * w
    root_residue = min(100.0, (residue_pts / (horizon * 1.45)) * 100.0)

    fam_counts = Counter(e["family"] for e in events)
    n_ev = len(events)
    if n_ev <= 1 or len(fam_counts) <= 1:
        shannon_norm = 0.0
    else:
        h = -sum((c / n_ev) * math.log(c / n_ev) for c in fam_counts.values())
        shannon_norm = min(1.0, h / math.log(min(4, n_ev)))

    root_transitions = sum(
        1 for i in range(1, n_ev)
        if events[i]["root_depth_class"] != events[i - 1]["root_depth_class"]
    )
    trans_ratio = root_transitions / max(1, n_ev - 1) if n_ev > 1 else 0.0
    diversity = (0.65 * shannon_norm + 0.35 * trans_ratio) * 100.0

    composite = 0.30 * living_cover + 0.25 * n_balance + 0.25 * root_residue + 0.20 * diversity
    return {
        "living_cover_ratio": round(living_cover, 1),
        "biological_n_balance": round(n_balance, 1),
        "root_residue_input": round(root_residue, 1),
        "taxonomic_root_diversity": round(diversity, 1),
        "composite_stewardship_score": round(composite, 1),
    }


def optimize_rotation_beam(
    crops_df: pd.DataFrame,
    timeline: list[dict],
    soil: dict,
    irrigation: str,
    strategy: str,
    active_teleconnection: bool = False,
    horizon: int = 36,
    beam_width: int = 60,
) -> dict:
    eval_cache: dict[tuple[int, int], tuple[float, float]] = {}
    for idx, crop in crops_df.iterrows():
        for t in range(horizon):
            fit, dr = evaluate_crop_window(crop, t, timeline, soil, irrigation)
            if fit > 0.05:
                eval_cache[(idx, t)] = (fit, dr)

    beam = [(0.0, 0, [])]
    completed = []

    while beam:
        next_beam = []
        for cum_score, t, events in beam:
            if t >= horizon:
                completed.append((cum_score, events))
                continue

            consec_idle = (t - events[-1]["end_t"]) if events else t
            idle_pen = -0.05 if consec_idle == 0 else (-0.14 if strategy == "current_baseline" else -0.10)
            if consec_idle >= 3:
                idle_pen -= 0.35
            next_beam.append((cum_score + idle_pen, t + 1, events))

            for idx, crop in crops_df.iterrows():
                if (idx, t) not in eval_cache:
                    continue
                c_len = int(crop["cycle_months"])
                if t + c_len > horizon + 2:
                    continue

                is_cover = bool(crop["is_cover_crop"])
                if strategy == "current_baseline" and is_cover:
                    continue
                if is_cover and events and events[-1]["is_cover_crop"]:
                    continue

                fit, drought_res = eval_cache[(idx, t)]
                adj = 0.0

                for prev in reversed(events):
                    months_since = t - prev["end_t"]
                    if crop["genus"] == prev["genus"] and months_since < 36:
                        adj -= 0.75
                    elif crop["family"] == prev["family"] and months_since < 36 and crop["family"] != "Poaceae":
                        adj -= 0.45 if not is_cover else 0.25

                if events:
                    last = events[-1]
                    if crop["family"] == last["family"]:
                        adj -= 0.04 if last["genus"] == "Avena" else 0.22
                    if crop["nitrogen_role"] == "heavy_feeder" and last["nitrogen_role"] == "fixer":
                        adj += 0.12
                    if crop["root_depth_class"] != last["root_depth_class"]:
                        adj += 0.06
                    if crop["family"] != last["family"]:
                        adj += 0.10

                if strategy == "soil_regenerative":
                    if is_cover:
                        adj += 0.18
                    if crop["nitrogen_role"] == "fixer":
                        adj += 0.10
                    if crop["root_depth_class"] == "deep":
                        adj += 0.06
                elif strategy == "water_resilient":
                    dr_weight = 0.36 if active_teleconnection else 0.28
                    adj += dr_weight * (drought_res - fit)
                    if float(crop["ropmn"]) <= 550.0:
                        adj += 0.14
                    if float(crop["ropmn"]) >= 1000.0:
                        adj -= 0.16
                    if crop["root_depth_class"] == "deep":
                        adj += 0.08
                    if is_cover:
                        adj += 0.06

                eff_months = min(t + c_len, horizon) - t
                harvest_bonus = 0.38 if not is_cover else 0.18
                step_gain = eff_months * (fit + adj) + harvest_bonus
                sow_slot = timeline[t]
                end_slot = timeline[min(t + c_len, len(timeline) - 1)]

                ev = {
                    "crop_id": str(crop["crop_id"]),
                    "crop_name": str(crop["crop_name"]),
                    "scientific_name": str(crop["scientific_name"]),
                    "genus": str(crop["genus"]),
                    "family": str(crop["family"]),
                    "nitrogen_role": str(crop["nitrogen_role"]),
                    "root_depth_class": str(crop["root_depth_class"]),
                    "is_cover_crop": is_cover,
                    "start_t": t,
                    "end_t": t + c_len,
                    "cycle_months": c_len,
                    "year_num": (t // 12) + 1,
                    "sow_label": f"{calendar.month_abbr[sow_slot['cal_month']]} {sow_slot['cal_year']}",
                    "harvest_label": f"{calendar.month_abbr[end_slot['cal_month']]} {end_slot['cal_year']}",
                    "biophysical_fit": fit,
                    "drought_resilience": drought_res,
                }
                next_beam.append((cum_score + step_gain, t + c_len, events + [ev]))

        next_beam.sort(key=lambda x: x[0], reverse=True)
        beam = next_beam[:beam_width]

    completed.sort(key=lambda x: x[0], reverse=True)
    _, best_events = completed[0] if completed else (0.0, [])

    if best_events:
        weights = [min(e["end_t"], horizon) - e["start_t"] for e in best_events]
        mean_fit = float(np.average([e["biophysical_fit"] for e in best_events], weights=weights))
        mean_drought = float(np.average([e["drought_resilience"] for e in best_events], weights=weights))
    else:
        mean_fit, mean_drought = 0.0, 0.0

    stewardship = compute_soil_stewardship_index(best_events, horizon=horizon)

    return {
        "strategy": strategy,
        "mean_biophysical_fit": round(mean_fit, 3),
        "mean_drought_resilience": round(mean_drought, 3),
        "soil_stewardship": stewardship,
        "schedule": best_events,
    }


def export_monthly_crop_scores(
    crops_df: pd.DataFrame,
    timeline: list[dict],
    soil: dict,
    irrigation: str,
) -> pd.DataFrame:
    rows = []
    for _, crop in crops_df.iterrows():
        for t in range(12):
            fit, dr = evaluate_crop_window(crop, t, timeline, soil, irrigation)
            if fit > 0.0:
                m_num = timeline[t]["cal_month"]
                rows.append({
                    "crop_id": crop["crop_id"],
                    "crop_name": crop["crop_name"],
                    "scientific_name": crop["scientific_name"],
                    "family": crop["family"],
                    "sow_month_num": m_num,
                    "sow_month": calendar.month_abbr[m_num],
                    "cycle_months": int(crop["cycle_months"]),
                    "is_cover_crop": bool(crop["is_cover_crop"]),
                    "biophysical_fit": fit,
                    "drought_resilience": dr,
                })
    return pd.DataFrame(rows).sort_values(["sow_month_num", "biophysical_fit"], ascending=[True, False])


def main() -> None:
    parser = argparse.ArgumentParser(description="Global Climate-Gated 3-Year Crop Rotation Optimizer")
    parser.add_argument("--lat", type=float, required=True, help="Latitude")
    parser.add_argument("--lon", type=float, required=True, help="Longitude")
    parser.add_argument(
        "--irrigation",
        type=str,
        default="limited_supplemental",
        choices=["rainfed", "limited_supplemental", "irrigated"],
        help="Water management regime",
    )
    parser.add_argument("--delta-temp", type=float, default=0.0, help="Year 2-3 warming perturbation (°C)")
    parser.add_argument("--delta-rain-pct", type=float, default=0.0, help="Year 2-3 rainfall perturbation (%%)")
    parser.add_argument("--soil", type=Path, default=None, help="Path to soil_terrain JSON")
    parser.add_argument("--crops", type=Path, default=None, help="Path to crops_prepared.csv")
    parser.add_argument("--forecast", type=Path, default=None, help="Path to forecast_{lat}_{lon}.csv")
    parser.add_argument("--out-dir", type=Path, default=Path("data/processed"), help="Output directory")
    args = parser.parse_args()

    forecast_path = args.forecast or (args.out_dir / f"forecast_{args.lat}_{args.lon}.csv")
    soil = load_soil_terrain(args.soil, args.lat, args.lon)
    crops_df = load_crops_catalog(args.crops)
    diurnal_stats = load_monthly_diurnal_stats(args.out_dir, args.lat, args.lon)
    drivers = load_teleconnections_and_skill(args.out_dir, args.lat, args.lon)
    timeline = build_36_month_timeline(forecast_path, diurnal_stats, args.delta_temp, args.delta_rain_pct)

    strategies = {}
    for strat in ("current_baseline", "soil_regenerative", "water_resilient"):
        strategies[strat] = optimize_rotation_beam(
            crops_df,
            timeline,
            soil,
            args.irrigation,
            strategy=strat,
            active_teleconnection=drivers["active_teleconnection"],
        )

    scores_df = export_monthly_crop_scores(crops_df, timeline, soil, args.irrigation)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    json_out = args.out_dir / f"rotation_recommendations_{args.lat}_{args.lon}.json"
    csv_out = args.out_dir / f"crop_scores_{args.lat}_{args.lon}.csv"

    report = {
        "coordinates": {"lat": args.lat, "lon": args.lon},
        "catalog_species_evaluated": int(len(crops_df)),
        "climate_drivers_and_skill": drivers,
        "scenario": {
            "irrigation": args.irrigation,
            "delta_temp_c": args.delta_temp,
            "delta_rain_pct": args.delta_rain_pct,
        },
        "soil_terrain": soil,
        "year1_monthly_outlook": timeline[:12],
        "strategies": strategies,
    }
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    scores_df.to_csv(csv_out, index=False)

    print(f"\n=== Crop Rotation Recommendations ({args.lat}°N, {args.lon}°E | {args.irrigation}) ===")
    print(f"Catalog Evaluated: {len(crops_df)} global rotational crop profiles")
    print(f"Ocean Teleconnections: ENSO = {drivers['enso_phase']} | IOD = {drivers['iod_phase']}")
    print(f"Forecast Skill: {drivers['forecast_skill']}")
    print(
        f"Soil ({soil['source']}): pH {soil['ph']:.1f} | "
        f"Clay {soil['clay_pct']:.1f}% / Sand {soil['sand_pct']:.1f}% | "
        f"SOC {soil['soc_g_kg']:.1f} g/kg | Slope {soil['slope_pct']:.1f}%"
    )

    y1 = timeline[:12]
    print(
        f"Year 1 Outlook: Mean Temp {np.mean([m['temp'] for m in y1]):.2f}°C "
        f"({min(m['temp'] for m in y1):.1f}–{max(m['temp'] for m in y1):.1f}°C) | "
        f"Annual Rain {sum(m['rain'] for m in y1):.1f} mm | "
        f"Mean Root SoilW {np.mean([m['soilw'] for m in y1]):.2f}"
    )

    labels = {
        "current_baseline": "Current Baseline (Emergent Biophysical)",
        "soil_regenerative": "Soil-Regenerative",
        "water_resilient": "Water-Resilient",
    }
    for key, title in labels.items():
        res = strategies[key]
        st = res["soil_stewardship"]
        print(
            f"\n--- Strategy: {title} "
            f"(Fit: {res['mean_biophysical_fit']:.3f} | "
            f"Drought: {res['mean_drought_resilience']:.3f} | "
            f"Stewardship: {st['composite_stewardship_score']:.1f}/100) ---"
        )
        print(
            f"    Stewardship Breakdown -> Cover: {st['living_cover_ratio']:.0f}% | "
            f"N-Balance: {st['biological_n_balance']:.0f}/100 | "
            f"Root/Residue: {st['root_residue_input']:.0f}/100 | "
            f"Diversity: {st['taxonomic_root_diversity']:.0f}/100"
        )
        for ev in res["schedule"]:
            tag = " [Cover]" if ev["is_cover_crop"] else ""
            print(
                f"  Y{ev['year_num']} [{ev['sow_label']} -> {ev['harvest_label']}, {ev['cycle_months']}m]: "
                f"{ev['crop_name']}{tag} ({ev['family']}, fit={ev['biophysical_fit']:.2f})"
            )

    print(f"\nSaved JSON report -> {json_out}")
    print(f"Saved crop scores -> {csv_out}")


if __name__ == "__main__":
    main()
