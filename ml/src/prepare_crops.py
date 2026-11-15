from pathlib import Path
import pandas as pd

RAW_ECOCROP_PATH = Path("data/raw/ecocrop.csv")
OUT_CROPS_PATH = Path("data/processed/crops_prepared.csv")

# Format per crop_id:
# (
#   crop_name, scientific_name, family_fallback,
#   cycle_months, sow_tmin, sow_tmax, vernalization_required, harvest_tmin, cool_season_cover,
#   tmin_ovr, topmn_ovr, topmx_ovr, tmax_ovr,
#   rmin_ovr, ropmn_ovr, ropmx_ovr, rmax_ovr,
#   nitrogen_role, root_depth_class, waterlogging_ok, is_cover_crop, min_sowing_soilw
# )
GLOBAL_ECOTYPE_CATALOG = {
    # --- Temperate / Mediterranean Winter & Spring Cereals ---
    "winter_wheat": (
        "Winter Wheat", "Triticum aestivum", "Poaceae",
        10, 6.5, 16.5, True, 13.5, False,
        -12.0, 10.0, 20.0, 28.0,
        350.0, 500.0, 900.0, 1400.0,
        "heavy_feeder", "medium", False, False, 0.45,
    ),
    "spring_wheat": (
        "Spring Wheat", "Triticum aestivum", "Poaceae",
        5, 6.5, 14.5, False, 14.0, False,
        2.0, 13.0, 22.0, 30.0,
        350.0, 500.0, 900.0, 1300.0,
        "heavy_feeder", "medium", False, False, 0.45,
    ),
    "winter_barley": (
        "Winter Barley", "Hordeum vulgare", "Poaceae",
        10, 6.5, 16.5, True, 13.5, False,
        -10.0, 10.0, 20.0, 28.0,
        320.0, 480.0, 880.0, 1350.0,
        "heavy_feeder", "medium", False, False, 0.44,
    ),
    "spring_barley": (
        "Spring Barley", "Hordeum vulgare", "Poaceae",
        5, 6.5, 14.5, False, 14.0, False,
        2.0, 12.0, 20.0, 28.0,
        300.0, 450.0, 850.0, 1300.0,
        "heavy_feeder", "medium", False, False, 0.42,
    ),
    "winter_oats": (
        "Winter Oats", "Avena sativa", "Poaceae",
        10, 6.5, 16.0, True, 13.5, False,
        -8.0, 10.0, 19.0, 27.0,
        380.0, 520.0, 950.0, 1400.0,
        "light_feeder", "deep", False, False, 0.44,
    ),
    "spring_oats": (
        "Spring Oats", "Avena sativa", "Poaceae",
        5, 6.5, 14.5, False, 14.0, False,
        2.0, 11.0, 19.0, 27.0,
        350.0, 500.0, 950.0, 1400.0,
        "light_feeder", "deep", False, False, 0.42,
    ),
    "winter_rye_grain": (
        "Winter Rye (Grain)", "Secale cereale", "Poaceae",
        10, 6.0, 16.5, True, 13.5, False,
        -15.0, 9.0, 19.0, 27.0,
        300.0, 450.0, 850.0, 1300.0,
        "heavy_feeder", "deep", False, False, 0.40,
    ),

    # --- Temperate Oilseeds & Broadleaf Break Crops ---
    "winter_osr": (
        "Winter Oilseed Rape", "Brassica napus", "Brassicaceae",
        11, 11.5, 20.5, True, 13.5, False,
        -10.0, 10.0, 20.0, 27.0,
        400.0, 550.0, 950.0, 1400.0,
        "heavy_feeder", "deep", False, False, 0.52,
    ),
    "spring_osr": (
        "Spring Oilseed Rape", "Brassica napus", "Brassicaceae",
        5, 7.0, 15.0, False, 14.0, False,
        3.0, 12.0, 21.0, 28.0,
        350.0, 480.0, 850.0, 1300.0,
        "heavy_feeder", "deep", False, False, 0.50,
    ),
    "spring_linseed": (
        "Spring Linseed (Flax)", "Linum usitatissimum", "Linaceae",
        4, 6.5, 14.5, False, 14.0, False,
        3.0, 12.0, 21.0, 28.0,
        250.0, 380.0, 700.0, 1100.0,
        "light_feeder", "shallow", False, False, 0.42,
    ),
    "sunflower": (
        "Sunflower", "Helianthus annuus", "Asteraceae",
        4, 12.0, 26.0, False, 16.0, False,
        6.0, 17.0, 27.0, 35.0,
        300.0, 450.0, 800.0, 1200.0,
        "heavy_feeder", "deep", False, False, 0.45,
    ),
    "sugar_beet": (
        "Sugar Beet", "Beta vulgaris", "Amaranthaceae",
        7, 7.0, 15.0, False, 12.0, False,
        2.0, 13.0, 22.0, 30.0,
        450.0, 600.0, 950.0, 1350.0,
        "heavy_feeder", "deep", False, False, 0.50,
    ),
    "potato": (
        "Potato", "Solanum tuberosum", "Solanaceae",
        4, 8.0, 18.0, False, 14.0, False,
        4.0, 14.0, 22.0, 29.0,
        450.0, 600.0, 1000.0, 1400.0,
        "heavy_feeder", "shallow", False, False, 0.52,
    ),

    # --- Temperate Legumes (Winter vs Spring) ---
    "winter_field_beans": (
        "Winter Field Beans", "Vicia faba", "Fabaceae",
        10, 6.5, 14.5, True, 13.5, False,
        -8.0, 9.0, 19.0, 26.0,
        400.0, 550.0, 950.0, 1400.0,
        "fixer", "deep", False, False, 0.48,
    ),
    "spring_field_beans": (
        "Spring Field Beans", "Vicia faba", "Fabaceae",
        5, 6.5, 14.5, False, 14.0, False,
        2.0, 10.0, 19.0, 26.0,
        350.0, 500.0, 900.0, 1350.0,
        "fixer", "deep", False, False, 0.48,
    ),
    "winter_field_pea": (
        "Winter Field Pea", "Pisum sativum", "Fabaceae",
        9, 6.5, 14.5, True, 13.5, False,
        -7.0, 9.0, 18.0, 25.0,
        350.0, 480.0, 850.0, 1300.0,
        "fixer", "shallow", False, False, 0.46,
    ),
    "spring_field_pea": (
        "Spring Combining Pea", "Pisum sativum", "Fabaceae",
        4, 6.5, 14.5, False, 14.0, False,
        2.0, 11.0, 19.0, 26.0,
        300.0, 420.0, 800.0, 1200.0,
        "fixer", "shallow", False, False, 0.45,
    ),

    # --- Cover Crops & Green Manures (Purpose-Differentiated) ---
    "rye_vetch_cover": (
        "Winter Rye & Vetch Cover", "Secale cereale", "Poaceae",
        5, 7.0, 16.0, False, 4.0, True,
        -12.0, 5.0, 16.0, 25.0,
        250.0, 400.0, 900.0, 1400.0,
        "fixer", "deep", True, True, 0.42,
    ),
    "mustard_biofumigant_cover": (
        "Mustard Biofumigant Cover", "Sinapis alba", "Brassicaceae",
        3, 9.0, 20.0, False, 5.0, True,
        -4.0, 8.0, 18.0, 26.0,
        220.0, 350.0, 800.0, 1300.0,
        "light_feeder", "deep", False, True, 0.44,
    ),
    "buckwheat_phacelia_cover": (
        "Buckwheat & Phacelia Catch Cover", "Fagopyrum esculentum", "Polygonaceae",
        3, 12.0, 26.0, False, 10.0, False,
        5.0, 14.0, 24.0, 32.0,
        200.0, 350.0, 800.0, 1300.0,
        "light_feeder", "shallow", False, True, 0.40,
    ),
    "crimson_clover_cover": (
        "Crimson Clover Cover", "Trifolium incarnatum", "Fabaceae",
        5, 8.0, 18.0, False, 5.0, True,
        -8.0, 7.0, 18.0, 26.0,
        280.0, 420.0, 850.0, 1300.0,
        "fixer", "medium", False, True, 0.44,
    ),
    "sunn_hemp_cover": (
        "Sunn Hemp Tropical Cover", "Crotalaria juncea", "Fabaceae",
        3, 20.0, 35.0, False, 18.0, False,
        14.0, 22.0, 32.0, 38.0,
        300.0, 500.0, 1200.0, 2000.0,
        "fixer", "deep", False, True, 0.45,
    ),

    # --- Tropical & Subtropical Cereals, Pulses & Oilseeds ---
    "paddy_rice": (
        "Paddy Rice", "Oryza sativa", "Poaceae",
        4, 22.0, 35.0, False, 22.0, False,
        15.0, 24.0, 33.0, 40.0,
        900.0, 1200.0, 2500.0, 4000.0,
        "heavy_feeder", "shallow", True, False, 0.68,
    ),
    "upland_rice": (
        "Upland Rice", "Oryza sativa", "Poaceae",
        4, 21.0, 34.0, False, 21.0, False,
        15.0, 23.0, 32.0, 38.0,
        650.0, 900.0, 1800.0, 2800.0,
        "heavy_feeder", "medium", False, False, 0.55,
    ),
    "grain_maize": (
        "Grain Maize", "Zea mays", "Poaceae",
        4, 15.0, 32.0, False, 17.0, False,
        10.0, 20.0, 30.0, 37.0,
        450.0, 600.0, 1100.0, 1700.0,
        "heavy_feeder", "deep", False, False, 0.50,
    ),
    "sorghum": (
        "Sorghum (Jowar)", "Sorghum bicolor", "Poaceae",
        4, 18.0, 35.0, False, 18.0, False,
        12.0, 22.0, 32.0, 40.0,
        300.0, 450.0, 850.0, 1300.0,
        "light_feeder", "deep", False, False, 0.42,
    ),
    "pearl_millet": (
        "Pearl Millet (Bajra)", "Pennisetum glaucum", "Poaceae",
        3, 20.0, 36.0, False, 20.0, False,
        14.0, 24.0, 34.0, 42.0,
        200.0, 320.0, 700.0, 1100.0,
        "light_feeder", "deep", False, False, 0.38,
    ),
    "chickpea": (
        "Chickpea (Gram)", "Cicer arietinum", "Fabaceae",
        4, 15.0, 28.0, False, 17.0, False,
        7.0, 17.0, 26.0, 34.0,
        150.0, 280.0, 650.0, 1050.0,
        "fixer", "deep", False, False, 0.42,
    ),
    "pigeon_pea": (
        "Pigeon Pea (Arhar)", "Cajanus cajan", "Fabaceae",
        6, 20.0, 34.0, False, 18.0, False,
        12.0, 22.0, 31.0, 38.0,
        450.0, 650.0, 1200.0, 1800.0,
        "fixer", "deep", False, False, 0.48,
    ),
    "mung_bean": (
        "Mung Bean (Moong)", "Vigna radiata", "Fabaceae",
        3, 20.0, 35.0, False, 20.0, False,
        14.0, 23.0, 32.0, 39.0,
        250.0, 400.0, 850.0, 1300.0,
        "fixer", "shallow", False, False, 0.42,
    ),
    "black_gram": (
        "Black Gram (Urad)", "Vigna mungo", "Fabaceae",
        3, 20.0, 35.0, False, 20.0, False,
        14.0, 23.0, 32.0, 39.0,
        280.0, 450.0, 900.0, 1400.0,
        "fixer", "shallow", False, False, 0.44,
    ),
    "lentil": (
        "Lentil (Masoor)", "Lens culinaris", "Fabaceae",
        4, 10.0, 24.0, False, 15.0, False,
        4.0, 14.0, 23.0, 31.0,
        180.0, 300.0, 650.0, 1000.0,
        "fixer", "shallow", False, False, 0.40,
    ),
    "soybean": (
        "Soybean", "Glycine max", "Fabaceae",
        4, 16.0, 32.0, False, 17.0, False,
        10.0, 20.0, 29.0, 36.0,
        450.0, 600.0, 1100.0, 1600.0,
        "fixer", "medium", False, False, 0.50,
    ),
    "groundnut": (
        "Groundnut (Peanut)", "Arachis hypogaea", "Fabaceae",
        4, 20.0, 34.0, False, 20.0, False,
        14.0, 23.0, 32.0, 38.0,
        400.0, 550.0, 1050.0, 1500.0,
        "fixer", "shallow", False, False, 0.48,
    ),
    "indian_mustard": (
        "Indian Mustard", "Brassica juncea", "Brassicaceae",
        4, 14.0, 28.0, False, 16.0, False,
        6.0, 16.0, 25.0, 33.0,
        150.0, 280.0, 650.0, 1100.0,
        "heavy_feeder", "deep", False, False, 0.44,
    ),
}

ECOCROP_NUM_COLS = [
    "TMIN", "TOPMN", "TOPMX", "TMAX",
    "RMIN", "ROPMN", "ROPMX", "RMAX",
    "PHMIN", "PHOPMN", "PHOPMX", "PHMAX",
    "GMIN", "GMAX",
]


def load_raw_ecocrop(path: Path) -> pd.DataFrame:
    if not path.exists():
        print(f"[WARN] {path} not found; using catalog physiological bounds.")
        return pd.DataFrame()
    for enc in ("utf-8", "cp1252", "latin1"):
        try:
            df = pd.read_csv(path, encoding=enc)
            df.columns = [c.strip().upper() for c in df.columns]
            for col in ECOCROP_NUM_COLS:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
            if "SCIENTIFICNAME" in df.columns:
                df["SCI_CLEAN"] = df["SCIENTIFICNAME"].astype(str).str.strip().str.lower()
            return df
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Unable to decode {path} with utf-8, cp1252, or latin1.")


def _pick_val(row: pd.Series | None, col: str, fallback: float) -> float:
    if row is not None and col in row and pd.notna(row[col]):
        return float(row[col])
    return float(fallback)


def _clean_family(fam_str: str) -> str:
    if not isinstance(fam_str, str) or fam_str.lower() == "nan" or not fam_str.strip():
        return "Other"
    parts = fam_str.split(":")
    last = parts[-1].strip()
    low = last.lower()
    if "leguminosae" in low or "fabaceae" in low:
        return "Fabaceae"
    if "gramineae" in low or "poaceae" in low:
        return "Poaceae"
    if "cruciferae" in low or "brassicaceae" in low:
        return "Brassicaceae"
    if "compositae" in low or "asteraceae" in low:
        return "Asteraceae"
    if "solanaceae" in low:
        return "Solanaceae"
    return last


def _clean_crop_name(sci: str, com: str) -> str:
    if isinstance(com, str) and com.strip() and com.lower() != "nan":
        candidates = [c.strip() for c in com.split(",") if c.strip()]
        if candidates:
            keywords = [
                "wheat", "corn", "maize", "rice", "bean", "pea", "barley", "oat", "millet",
                "sorghum", "potato", "tomato", "pepper", "cabbage", "carrot", "onion",
                "garlic", "soybean", "mustard", "sunflower", "cotton", "cassava", "yam",
                "sweet potato", "clover", "vetch", "alfalfa", "okra", "spinach", "lettuce",
                "cucumber", "squash", "melon", "lentil", "chickpea", "apple", "grape",
                "banana", "mango", "citrus", "orange", "lemon", "coffee", "tea", "sugarcane",
                "canola", "flax", "sesame", "peanut", "groundnut", "rye"
            ]
            for c in candidates:
                c_low = c.lower()
                if any(k in c_low for k in keywords):
                    return c.title()
            return candidates[0].title()
    return sci


def build_prepared_crops() -> pd.DataFrame:
    raw_df = load_raw_ecocrop(RAW_ECOCROP_PATH)
    records = []
    seen_sci = set()
    seen_ids = set()

    for crop_id, meta in GLOBAL_ECOTYPE_CATALOG.items():
        (
            crop_name, sci_name, fam_fallback,
            cycle_months, sow_tmin, sow_tmax, vern_req, harvest_tmin, cool_cover,
            tmin_o, topmn_o, topmx_o, tmax_o,
            rmin_o, ropmn_o, ropmx_o, rmax_o,
            n_role, root_cls, water_ok, is_cover, min_soilw,
        ) = meta

        eco_row = None
        if not raw_df.empty and "SCI_CLEAN" in raw_df.columns:
            matches = raw_df[raw_df["SCI_CLEAN"] == sci_name.lower()]
            if not matches.empty:
                eco_row = matches.iloc[0]

        family = fam_fallback
        if eco_row is not None and "FAMNAME" in eco_row and pd.notna(eco_row["FAMNAME"]):
            family = _clean_family(str(eco_row["FAMNAME"]))
        elif eco_row is not None and "FAMILY" in eco_row and pd.notna(eco_row["FAMILY"]):
            fam_str = str(eco_row["FAMILY"]).strip()
            if fam_str and fam_str.lower() != "nan":
                family = fam_str

        genus = sci_name.split()[0]

        # For vernalizing winter ecotypes, use ecotype cold/vernalization overrides
        # while pulling pH and non-overridden bounds directly from EcoCrop.
        if vern_req or is_cover:
            tmin, topmn, topmx, tmax = tmin_o, topmn_o, topmx_o, tmax_o
            rmin, ropmn, ropmx, rmax = rmin_o, ropmn_o, ropmx_o, rmax_o
        else:
            tmin = _pick_val(eco_row, "TMIN", tmin_o)
            topmn = _pick_val(eco_row, "TOPMN", topmn_o)
            topmx = _pick_val(eco_row, "TOPMX", topmx_o)
            tmax = _pick_val(eco_row, "TMAX", tmax_o)
            rmin = _pick_val(eco_row, "RMIN", rmin_o)
            ropmn = _pick_val(eco_row, "ROPMN", ropmn_o)
            ropmx = _pick_val(eco_row, "ROPMX", ropmx_o)
            rmax = _pick_val(eco_row, "RMAX", rmax_o)

        phmin = _pick_val(eco_row, "PHMIN", 5.5)
        phopmn = _pick_val(eco_row, "PHOPMN", 6.0)
        phopmx = _pick_val(eco_row, "PHOPMX", 7.5)
        phmax = _pick_val(eco_row, "PHMAX", 8.2)
        gmin = _pick_val(eco_row, "GMIN", cycle_months * 30 - 15)
        gmax = _pick_val(eco_row, "GMAX", cycle_months * 30 + 15)

        records.append({
            "crop_id": crop_id,
            "crop_name": crop_name,
            "scientific_name": sci_name,
            "genus": genus,
            "family": family,
            "cycle_months": int(cycle_months),
            "sow_tmin": float(sow_tmin),
            "sow_tmax": float(sow_tmax),
            "vernalization_required": bool(vern_req),
            "harvest_tmin": float(harvest_tmin),
            "cool_season_cover": bool(cool_cover),
            "tmin": tmin,
            "topmn": topmn,
            "topmx": topmx,
            "tmax": tmax,
            "rmin": rmin,
            "ropmn": ropmn,
            "ropmx": ropmx,
            "rmax": rmax,
            "phmin": phmin,
            "phopmn": phopmn,
            "phopmx": phopmx,
            "phmax": phmax,
            "gmin": gmin,
            "gmax": gmax,
            "nitrogen_role": n_role,
            "root_depth_class": root_cls,
            "waterlogging_ok": bool(water_ok),
            "is_cover_crop": bool(is_cover),
            "min_sowing_soilw": float(min_soilw),
        })
        seen_sci.add(sci_name.lower())
        seen_ids.add(crop_id)

    # Ingest entire FAO EcoCrop database
    if not raw_df.empty:
        import re
        for _, row in raw_df.iterrows():
            sci = str(row.get("SCIENTIFICNAME", "")).strip()
            if not sci or sci.lower() == "nan" or sci.lower() in seen_sci:
                continue

            tmin = row.get("TMIN")
            topmn = row.get("TOPMN")
            topmx = row.get("TOPMX")
            tmax = row.get("TMAX")
            rmin = row.get("RMIN")
            ropmn = row.get("ROPMN")
            ropmx = row.get("ROPMX")
            rmax = row.get("RMAX")

            if pd.isna(tmin) or pd.isna(topmn) or pd.isna(topmx) or pd.isna(tmax):
                continue
            if pd.isna(rmin) or pd.isna(ropmn) or pd.isna(ropmx) or pd.isna(rmax):
                continue

            tmin, topmn, topmx, tmax = float(tmin), float(topmn), float(topmx), float(tmax)
            rmin, ropmn, ropmx, rmax = float(rmin), float(ropmn), float(ropmx), float(rmax)

            # Physiological consistency sanity
            if topmn < tmin: topmn = tmin
            if topmx < topmn: topmx = topmn
            if tmax < topmx: tmax = topmx
            if ropmn < rmin: ropmn = rmin
            if ropmx < ropmn: ropmx = ropmn
            if rmax < ropmx: rmax = ropmx

            phmin = float(row.get("PHMIN", 5.5)) if pd.notna(row.get("PHMIN")) else 5.5
            phopmn = float(row.get("PHOPMN", 6.0)) if pd.notna(row.get("PHOPMN")) else 6.0
            phopmx = float(row.get("PHOPMX", 7.5)) if pd.notna(row.get("PHOPMX")) else 7.5
            phmax = float(row.get("PHMAX", 8.2)) if pd.notna(row.get("PHMAX")) else 8.2

            gmin = float(row.get("GMIN", 90)) if pd.notna(row.get("GMIN")) and float(row.get("GMIN")) > 0 else 90.0
            gmax = float(row.get("GMAX", 150)) if pd.notna(row.get("GMAX")) and float(row.get("GMAX")) > 0 else 150.0

            cycle_months = max(2, min(12, int(round(((gmin + gmax) / 2.0) / 30.0))))
            family = _clean_family(str(row.get("FAMNAME", "")))
            genus = sci.split()[0]
            crop_name = _clean_crop_name(sci, str(row.get("COMNAME", "")))

            base_id = re.sub(r"[^a-z0-9]+", "_", sci.lower()).strip("_")
            crop_id = base_id
            suffix = 2
            while crop_id in seen_ids:
                crop_id = f"{base_id}_{suffix}"
                suffix += 1

            cat = str(row.get("CAT", "")).lower()
            is_cover = any(k in cat for k in ["forage", "pasture", "environmental", "cover"])
            n_role = "fixer" if family == "Fabaceae" else ("heavy_feeder" if family in ["Poaceae", "Solanaceae"] else "light_feeder")

            dep = str(row.get("DEP", "")).lower()
            root_cls = "shallow" if "shallow" in dep else ("deep" if "deep" in dep else "medium")

            dra = str(row.get("DRA", "")).lower()
            water_ok = "poorly" in dra or "saturated" in dra

            sow_tmin = max(0.0, topmn - 6.0)
            sow_tmax = min(40.0, topmx + 5.0)
            harvest_tmin = max(5.0, topmn - 3.0)

            records.append({
                "crop_id": crop_id,
                "crop_name": crop_name,
                "scientific_name": sci,
                "genus": genus,
                "family": family,
                "cycle_months": cycle_months,
                "sow_tmin": sow_tmin,
                "sow_tmax": sow_tmax,
                "vernalization_required": False,
                "harvest_tmin": harvest_tmin,
                "cool_season_cover": False,
                "tmin": tmin, "topmn": topmn, "topmx": topmx, "tmax": tmax,
                "rmin": rmin, "ropmn": ropmn, "ropmx": ropmx, "rmax": rmax,
                "phmin": phmin, "phopmn": phopmn, "phopmx": phopmx, "phmax": phmax,
                "gmin": gmin, "gmax": gmax,
                "nitrogen_role": n_role,
                "root_depth_class": root_cls,
                "waterlogging_ok": water_ok,
                "is_cover_crop": is_cover,
                "min_sowing_soilw": 0.40,
            })
            seen_sci.add(sci.lower())
            seen_ids.add(crop_id)

    return pd.DataFrame(records)


def main() -> None:
    df = build_prepared_crops()
    OUT_CROPS_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_CROPS_PATH, index=False)
    print(f"Prepared {len(df)} global crop ecotypes -> {OUT_CROPS_PATH}")


if __name__ == "__main__":
    main()
