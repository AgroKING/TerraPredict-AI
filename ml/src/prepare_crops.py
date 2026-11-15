import re
from pathlib import Path
import numpy as np
import pandas as pd

RAW_ECOCROP_PATH = Path("data/raw/ecocrop.csv")
OUT_CROPS_PATH = Path("data/processed/crops_prepared.csv")

ECOCROP_NUM_COLS = [
    "TMIN", "TOPMN", "TOPMX", "TMAX",
    "RMIN", "ROPMN", "ROPMX", "RMAX",
    "PHMIN", "PHOPMN", "PHOPMX", "PHMAX",
    "GMIN", "GMAX",
]

ALLOWED_CAT_TOKENS = (
    "cereal", "pseudocereal", "pulse", "legume", "oil", "root", "tuber", "fibre", "fiber", "sugar",
)

ALLOWED_FIELD_VEGETABLES = {
    "solanum tuberosum", "solanum lycopersicum", "allium cepa", "allium sativum",
    "brassica oleracea", "brassica rapa", "daucus carota", "cucurbita pepo",
    "cucurbita moschata", "cucumis sativus", "citrullus lanatus", "abelmoschus esculentus",
    "solanum melongena", "capsicum annuum", "phaseolus coccineus",
}

ANNUALIZED_PERENNIAL_CROPS = {
    "ipomoea batatas", "colocasia esculenta", "cajanus cajan", "gossypium hirsutum",
    "gossypium barbadense", "solanum melongena", "capsicum annuum", "capsicum frutescens",
    "ricinus communis", "zingiber officinale", "curcuma longa", "abelmoschus esculentus",
}

BLOCKED_HABIT_TOKENS = (
    "tree", "shrub", "subshrub", "woody", "palm", "bamboo", "liana", "fern", "aquatic", "epiphyte",
)

BLOCKED_TEXT_TOKENS = (
    "weed", "noxious", "invasive", "ornamental", "timber", "fuelwood", "hedge",
    "turf", "lawn", "pasture", "fodder", "vetiver", "beech", "sedge", "reed",
    "gum", "resin", "latex", "dye", "poison", "toxic", "narcotic", "pesticide",
    "bitter yam", "bulbous barley", "coleus potato", "wild ",
)

BLOCKED_GENERA = {
    "cyperus", "striga", "orobanche", "parthenium", "echinochloa", "imperata",
    "cynodon", "leptochloa", "chrysopogon", "macroptilium", "millettia", "pongamia",
    "gliricidia", "leucaena", "sesbania", "acacia", "eucalyptus", "prosopis",
    "chromolaena", "lantana", "panicum", "brachiaria", "basella", "apium",
    "foeniculum", "plectranthus", "coleus", "dioscorea", "manihot",
}

BLOCKED_SPECIES = {
    "hordeum bulbosum", "triticum monococcum", "triticum spelta",
}

FAMILY_SYNONYMS = {
    "Leguminosae": "Fabaceae",
    "Papilionaceae": "Fabaceae",
    "Cruciferae": "Brassicaceae",
    "Gramineae": "Poaceae",
    "Compositae": "Asteraceae",
    "Umbelliferae": "Apiaceae",
    "Labiatae": "Lamiaceae",
    "Palmae": "Arecaceae",
    "Guttiferae": "Clusiaceae",
}

GENUS_TO_FAMILY = {
    "triticum": "Poaceae", "hordeum": "Poaceae", "avena": "Poaceae", "secale": "Poaceae",
    "oryza": "Poaceae", "zea": "Poaceae", "sorghum": "Poaceae", "pennisetum": "Poaceae",
    "eleusine": "Poaceae", "setaria": "Poaceae", "eragrostis": "Poaceae", "triticosecale": "Poaceae",
    "fagopyrum": "Polygonaceae", "chenopodium": "Amaranthaceae", "amaranthus": "Amaranthaceae",
    "beta": "Amaranthaceae", "spinacia": "Amaranthaceae", "vicia": "Fabaceae", "pisum": "Fabaceae",
    "cicer": "Fabaceae", "cajanus": "Fabaceae", "vigna": "Fabaceae", "lens": "Fabaceae",
    "glycine": "Fabaceae", "arachis": "Fabaceae", "phaseolus": "Fabaceae", "lupinus": "Fabaceae",
    "trifolium": "Fabaceae", "medicago": "Fabaceae", "crotalaria": "Fabaceae", "mucuna": "Fabaceae",
    "lablab": "Fabaceae", "cyamopsis": "Fabaceae", "brassica": "Brassicaceae", "sinapis": "Brassicaceae",
    "raphanus": "Brassicaceae", "camelina": "Brassicaceae", "eruca": "Brassicaceae",
    "linum": "Linaceae", "helianthus": "Asteraceae", "carthamus": "Asteraceae", "guizotia": "Asteraceae",
    "sesamum": "Pedaliaceae", "ricinus": "Euphorbiaceae", "gossypium": "Malvaceae",
    "abelmoschus": "Malvaceae", "corchorus": "Malvaceae", "hibiscus": "Malvaceae",
    "solanum": "Solanaceae", "capsicum": "Solanaceae", "ipomoea": "Convolvulaceae",
    "colocasia": "Araceae", "allium": "Amaryllidaceae", "daucus": "Apiaceae",
    "coriandrum": "Apiaceae", "cuminum": "Apiaceae", "cucurbita": "Cucurbitaceae",
    "cucumis": "Cucurbitaceae", "citrullus": "Cucurbitaceae", "momordica": "Cucurbitaceae",
    "zingiber": "Zingiberaceae", "curcuma": "Zingiberaceae",
}

SPECIES_AGRONOMIC_OVERRIDES = {
    "triticum aestivum": {"crop_id": "spring_wheat", "crop_name": "Spring Wheat", "nitrogen_role": "heavy_feeder", "root_depth_class": "medium", "min_sowing_soilw": 0.45},
    "hordeum vulgare": {"crop_id": "spring_barley", "crop_name": "Spring Barley", "nitrogen_role": "heavy_feeder", "root_depth_class": "medium", "min_sowing_soilw": 0.42},
    "avena sativa": {"crop_id": "spring_oats", "crop_name": "Spring Oats", "nitrogen_role": "light_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.42},
    "brassica napus": {"crop_id": "spring_osr", "crop_name": "Spring Oilseed Rape", "nitrogen_role": "heavy_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.50},
    "vicia faba": {"crop_id": "spring_field_beans", "crop_name": "Spring Field Beans", "nitrogen_role": "fixer", "root_depth_class": "deep", "min_sowing_soilw": 0.48},
    "pisum sativum": {"crop_id": "spring_field_pea", "crop_name": "Spring Combining Pea", "nitrogen_role": "fixer", "root_depth_class": "shallow", "min_sowing_soilw": 0.45},
    "oryza sativa": {"crop_id": "paddy_rice", "crop_name": "Paddy Rice", "cycle_months": 4, "nitrogen_role": "heavy_feeder", "root_depth_class": "shallow", "waterlogging_ok": True, "min_sowing_soilw": 0.58},
    "zea mays": {"crop_id": "grain_maize", "crop_name": "Grain Maize", "nitrogen_role": "heavy_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.48},
    "sorghum bicolor": {"crop_id": "sorghum", "crop_name": "Sorghum (Jowar)", "nitrogen_role": "light_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.40},
    "pennisetum glaucum": {"crop_id": "pearl_millet", "crop_name": "Pearl Millet (Bajra)", "nitrogen_role": "light_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.38},
    "eleusine coracana": {"crop_id": "finger_millet", "crop_name": "Finger Millet (Ragi)", "nitrogen_role": "light_feeder", "root_depth_class": "medium", "min_sowing_soilw": 0.42},
    "cicer arietinum": {"crop_id": "chickpea", "crop_name": "Chickpea (Gram)", "nitrogen_role": "fixer", "root_depth_class": "deep", "min_sowing_soilw": 0.40},
    "cajanus cajan": {"crop_id": "pigeon_pea", "crop_name": "Pigeon Pea (Arhar)", "cycle_months": 6, "nitrogen_role": "fixer", "root_depth_class": "deep", "min_sowing_soilw": 0.46},
    "vigna radiata": {"crop_id": "mung_bean", "crop_name": "Mung Bean (Moong)", "cycle_months": 3, "nitrogen_role": "fixer", "root_depth_class": "shallow", "min_sowing_soilw": 0.42},
    "vigna mungo": {"crop_id": "black_gram", "crop_name": "Black Gram (Urad)", "cycle_months": 3, "nitrogen_role": "fixer", "root_depth_class": "shallow", "min_sowing_soilw": 0.44},
    "lens culinaris": {"crop_id": "lentil", "crop_name": "Lentil (Masoor)", "nitrogen_role": "fixer", "root_depth_class": "shallow", "min_sowing_soilw": 0.40},
    "glycine max": {"crop_id": "soybean", "crop_name": "Soybean", "nitrogen_role": "fixer", "root_depth_class": "medium", "min_sowing_soilw": 0.48},
    "arachis hypogaea": {"crop_id": "groundnut", "crop_name": "Groundnut (Peanut)", "nitrogen_role": "fixer", "root_depth_class": "shallow", "min_sowing_soilw": 0.46},
    "phaseolus vulgaris": {"crop_id": "common_bean", "crop_name": "Common Bean", "nitrogen_role": "fixer", "root_depth_class": "shallow", "min_sowing_soilw": 0.44},
    "vigna unguiculata": {"crop_id": "cowpea", "crop_name": "Cowpea", "nitrogen_role": "fixer", "root_depth_class": "deep", "min_sowing_soilw": 0.40},
    "brassica juncea": {"crop_id": "indian_mustard", "crop_name": "Indian Mustard", "nitrogen_role": "heavy_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.44},
    "sesamum indicum": {"crop_id": "sesame", "crop_name": "Sesame", "nitrogen_role": "light_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.40},
    "helianthus annuus": {"crop_id": "sunflower", "crop_name": "Sunflower", "nitrogen_role": "heavy_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.44},
    "linum usitatissimum": {"crop_id": "spring_linseed", "crop_name": "Linseed (Flax)", "nitrogen_role": "light_feeder", "root_depth_class": "shallow", "min_sowing_soilw": 0.42},
    "gossypium hirsutum": {"crop_id": "upland_cotton", "crop_name": "Upland Cotton", "cycle_months": 6, "nitrogen_role": "heavy_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.46},
    "ipomoea batatas": {"crop_id": "sweet_potato", "crop_name": "Sweet Potato", "cycle_months": 4, "nitrogen_role": "light_feeder", "root_depth_class": "shallow", "min_sowing_soilw": 0.46},
    "solanum tuberosum": {"crop_id": "potato", "crop_name": "Potato", "nitrogen_role": "heavy_feeder", "root_depth_class": "shallow", "min_sowing_soilw": 0.50},
    "beta vulgaris": {"crop_id": "sugar_beet", "crop_name": "Sugar Beet", "nitrogen_role": "heavy_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.50},
    "chenopodium quinoa": {"crop_id": "quinoa", "crop_name": "Quinoa", "nitrogen_role": "light_feeder", "root_depth_class": "deep", "min_sowing_soilw": 0.38},
}

VERNALIZING_AND_COVER_ECOTYPES = [
    ("winter_wheat", "Winter Wheat", "Triticum aestivum", "Poaceae", 10, 6.5, 16.5, True, 13.5, False, -12.0, 10.0, 20.0, 28.0, 350.0, 500.0, 900.0, 1400.0, "heavy_feeder", "medium", False, False, 0.45),
    ("winter_barley", "Winter Barley", "Hordeum vulgare", "Poaceae", 10, 6.5, 16.5, True, 13.5, False, -10.0, 10.0, 20.0, 28.0, 320.0, 480.0, 880.0, 1350.0, "heavy_feeder", "medium", False, False, 0.44),
    ("winter_oats", "Winter Oats", "Avena sativa", "Poaceae", 10, 6.5, 16.0, True, 13.5, False, -8.0, 10.0, 19.0, 27.0, 380.0, 520.0, 950.0, 1400.0, "light_feeder", "deep", False, False, 0.44),
    ("winter_rye_grain", "Winter Rye (Grain)", "Secale cereale", "Poaceae", 10, 6.0, 16.5, True, 13.5, False, -15.0, 9.0, 19.0, 27.0, 300.0, 450.0, 850.0, 1300.0, "heavy_feeder", "deep", False, False, 0.40),
    ("winter_osr", "Winter Oilseed Rape", "Brassica napus", "Brassicaceae", 11, 11.5, 20.5, True, 13.5, False, -10.0, 10.0, 20.0, 27.0, 400.0, 550.0, 950.0, 1400.0, "heavy_feeder", "deep", False, False, 0.52),
    ("winter_field_beans", "Winter Field Beans", "Vicia faba", "Fabaceae", 10, 6.5, 14.5, True, 13.5, False, -8.0, 9.0, 19.0, 26.0, 400.0, 550.0, 950.0, 1400.0, "fixer", "deep", False, False, 0.48),
    ("winter_field_pea", "Winter Field Pea", "Pisum sativum", "Fabaceae", 9, 6.5, 14.5, True, 13.5, False, -7.0, 9.0, 18.0, 25.0, 350.0, 480.0, 850.0, 1300.0, "fixer", "shallow", False, False, 0.46),
    ("rye_vetch_cover", "Winter Rye & Vetch Cover", "Secale cereale", "Poaceae", 5, 7.0, 16.0, False, 4.0, True, -12.0, 5.0, 16.0, 25.0, 250.0, 400.0, 900.0, 1400.0, "fixer", "deep", True, True, 0.42),
    ("mustard_biofumigant_cover", "Mustard Biofumigant Cover", "Sinapis alba", "Brassicaceae", 3, 9.0, 20.0, False, 5.0, True, -4.0, 8.0, 18.0, 26.0, 220.0, 350.0, 800.0, 1300.0, "light_feeder", "deep", False, True, 0.44),
    ("buckwheat_phacelia_cover", "Buckwheat & Phacelia Catch Cover", "Fagopyrum esculentum", "Polygonaceae", 3, 12.0, 26.0, False, 10.0, False, 5.0, 14.0, 24.0, 32.0, 200.0, 350.0, 800.0, 1300.0, "light_feeder", "shallow", False, True, 0.40),
    ("crimson_clover_cover", "Crimson Clover Cover", "Trifolium incarnatum", "Fabaceae", 5, 8.0, 18.0, False, 5.0, True, -8.0, 7.0, 18.0, 26.0, 280.0, 420.0, 850.0, 1300.0, "fixer", "medium", False, True, 0.44),
    ("sunn_hemp_cover", "Sunn Hemp Tropical Cover", "Crotalaria juncea", "Fabaceae", 3, 20.0, 35.0, False, 18.0, False, 14.0, 22.0, 32.0, 38.0, 300.0, 500.0, 1200.0, 2000.0, "fixer", "deep", False, True, 0.45),
]


def clean_family_name(raw_fam: str) -> str:
    if not raw_fam or str(raw_fam).lower() in ("nan", "none", "unknown"):
        return "Unknown"
    leaf = str(raw_fam).split(":")[-1].strip().title()
    return FAMILY_SYNONYMS.get(leaf, leaf)


def load_raw_ecocrop(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"FAO EcoCrop database not found at {path}")
    for enc in ("utf-8", "cp1252", "latin1"):
        try:
            df = pd.read_csv(path, encoding=enc)
            df.columns = [c.strip().upper() for c in df.columns]
            for col in ECOCROP_NUM_COLS:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
            sci_col = "SCIENTIFICNAME" if "SCIENTIFICNAME" in df.columns else "SCI_NAME"
            df["SCI_CLEAN"] = df[sci_col].astype(str).str.strip()
            df["SCI_LOWER"] = df["SCI_CLEAN"].str.lower()
            return df
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Unable to decode {path} with utf-8, cp1252, or latin1.")


def _resolve_family(row: pd.Series | None, sci_name: str, fallback: str = "Unknown") -> str:
    if row is not None:
        for col in ("FAMILY", "FAMNAME", "FAM"):
            if col in row and pd.notna(row[col]):
                cleaned = clean_family_name(str(row[col]))
                if cleaned != "Unknown":
                    return cleaned
    genus = sci_name.split()[0].lower()
    return GENUS_TO_FAMILY.get(genus, fallback)


def _is_true_rotational_crop(row: pd.Series) -> bool:
    for col in ("TMIN", "TOPMN", "TOPMX", "TMAX", "RMIN", "ROPMN", "ROPMX", "RMAX"):
        if col not in row or pd.isna(row[col]):
            return False

    sci_low = row["SCI_LOWER"]
    genus = sci_low.split()[0] if sci_low else ""
    if not genus or genus in BLOCKED_GENERA or sci_low in BLOCKED_SPECIES:
        return False

    habi = str(row.get("HABI", row.get("LIFEFORM", ""))).lower()
    if any(tok in habi for tok in BLOCKED_HABIT_TOKENS):
        return False

    lifespan = str(row.get("LIFESPAN", "")).lower()
    if "perennial" in lifespan and sci_low not in ANNUALIZED_PERENNIAL_CROPS:
        return False

    gmax = float(row["GMAX"]) if "GMAX" in row and pd.notna(row["GMAX"]) else 150.0
    if not (75.0 <= gmax <= 260.0):
        return False

    cat = str(row.get("CAT", row.get("CATEGORY", ""))).lower()
    use = str(row.get("USE", row.get("USES", ""))).lower()
    com = str(row.get("COMNAME", row.get("COMMON_NAME", ""))).lower()
    combined_meta = f"{cat} {use} {com}"

    if any(tok in combined_meta for tok in BLOCKED_TEXT_TOKENS):
        return False

    if sci_low in ALLOWED_FIELD_VEGETABLES or sci_low in SPECIES_AGRONOMIC_OVERRIDES:
        return True

    return any(tok in cat for tok in ALLOWED_CAT_TOKENS)


def build_prepared_crops(raw_path: Path = RAW_ECOCROP_PATH) -> pd.DataFrame:
    raw_df = load_raw_ecocrop(raw_path)
    raw_df["_completeness"] = raw_df[ECOCROP_NUM_COLS].notna().sum(axis=1)
    raw_df = raw_df.sort_values("_completeness", ascending=False).drop_duplicates(subset=["SCI_LOWER"], keep="first")
    eco_lookup = raw_df.set_index("SCI_LOWER")

    records = []
    seen_ids = set()

    viable_df = raw_df[raw_df.apply(_is_true_rotational_crop, axis=1)]
    for _, row in viable_df.iterrows():
        sci = row["SCI_CLEAN"]
        sci_low = row["SCI_LOWER"]
        if not sci or sci_low in ("nan", "none"):
            continue

        fam = _resolve_family(row, sci)
        cat = str(row.get("CAT", row.get("CATEGORY", ""))).strip().lower()
        com_raw = str(row.get("COMNAME", row.get("COMMON_NAME", ""))).strip()
        common_name = com_raw.split(",")[0].strip().title() if com_raw and com_raw.lower() != "nan" else sci

        tmin, topmn, topmx, tmax = float(row["TMIN"]), float(row["TOPMN"]), float(row["TOPMX"]), float(row["TMAX"])
        rmin, ropmn, ropmx, rmax = float(row["RMIN"]), float(row["ROPMN"]), float(row["ROPMX"]), float(row["RMAX"])
        gmin = float(row["GMIN"]) if pd.notna(row.get("GMIN")) else 90.0
        gmax = float(row["GMAX"]) if pd.notna(row.get("GMAX")) else 150.0

        cycle_months = int(max(3, min(8, round((0.5 * (gmin + gmax)) / 30.0))))
        sow_tmin = round(max(5.0, tmin + 0.30 * (topmn - tmin)), 1)
        sow_tmax = round(min(36.0, topmx + 0.15 * (tmax - topmx)), 1)
        harvest_tmin = round(max(10.0, tmin + 0.45 * (topmn - tmin)), 1)

        fam_low = fam.lower()
        if "fabaceae" in fam_low or "pulse" in cat or "legume" in cat:
            n_role = "fixer"
        elif any(k in cat for k in ("root", "tuber", "cereal", "oil", "fibre", "fiber", "vegetable")):
            n_role = "heavy_feeder"
        else:
            n_role = "light_feeder"

        if any(k in cat for k in ("root", "tuber", "vegetable")):
            root_cls = "shallow"
        elif ropmn <= 500.0 or "oil" in cat or "fibre" in cat:
            root_cls = "deep"
        else:
            root_cls = "medium"

        water_ok = bool(ropmn >= 1100.0 and rmax >= 2800.0)
        min_soilw = round(float(np.clip(0.36 + (ropmn / 3500.0) * 0.32, 0.38, 0.62)), 2)

        ovr = SPECIES_AGRONOMIC_OVERRIDES.get(sci_low, {})
        crop_id = ovr.get("crop_id", re.sub(r"[^a-z0-9]+", "_", sci_low).strip("_"))
        if crop_id in seen_ids:
            continue
        seen_ids.add(crop_id)

        records.append({
            "crop_id": crop_id,
            "crop_name": ovr.get("crop_name", common_name),
            "scientific_name": sci,
            "genus": sci.split()[0],
            "family": fam,
            "cycle_months": int(ovr.get("cycle_months", cycle_months)),
            "sow_tmin": float(ovr.get("sow_tmin", sow_tmin)),
            "sow_tmax": float(ovr.get("sow_tmax", sow_tmax)),
            "vernalization_required": False,
            "harvest_tmin": float(ovr.get("harvest_tmin", harvest_tmin)),
            "cool_season_cover": False,
            "tmin": tmin,
            "topmn": topmn,
            "topmx": topmx,
            "tmax": tmax,
            "rmin": rmin,
            "ropmn": ropmn,
            "ropmx": ropmx,
            "rmax": rmax,
            "phmin": float(row["PHMIN"]) if pd.notna(row.get("PHMIN")) else 5.5,
            "phopmn": float(row["PHOPMN"]) if pd.notna(row.get("PHOPMN")) else 6.0,
            "phopmx": float(row["PHOPMX"]) if pd.notna(row.get("PHOPMX")) else 7.5,
            "phmax": float(row["PHMAX"]) if pd.notna(row.get("PHMAX")) else 8.2,
            "gmin": gmin,
            "gmax": gmax,
            "nitrogen_role": ovr.get("nitrogen_role", n_role),
            "root_depth_class": ovr.get("root_depth_class", root_cls),
            "waterlogging_ok": bool(ovr.get("waterlogging_ok", water_ok)),
            "is_cover_crop": False,
            "min_sowing_soilw": float(ovr.get("min_sowing_soilw", min_soilw)),
        })

    for meta in VERNALIZING_AND_COVER_ECOTYPES:
        (
            crop_id, crop_name, sci_name, fam_fb, cycle_months,
            sow_tmin, sow_tmax, vern_req, harvest_tmin, cool_cover,
            tmin, topmn, topmx, tmax, rmin, ropmn, ropmx, rmax,
            n_role, root_cls, water_ok, is_cover, min_soilw,
        ) = meta
        if crop_id in seen_ids:
            continue
        seen_ids.add(crop_id)

        eco_r = eco_lookup.loc[sci_name.lower()] if sci_name.lower() in eco_lookup.index else None
        fam = _resolve_family(eco_r, sci_name, fam_fb)
        phmin = float(eco_r["PHMIN"]) if (eco_r is not None and pd.notna(eco_r.get("PHMIN"))) else 5.5
        phopmn = float(eco_r["PHOPMN"]) if (eco_r is not None and pd.notna(eco_r.get("PHOPMN"))) else 6.0
        phopmx = float(eco_r["PHOPMX"]) if (eco_r is not None and pd.notna(eco_r.get("PHOPMX"))) else 7.5
        phmax = float(eco_r["PHMAX"]) if (eco_r is not None and pd.notna(eco_r.get("PHMAX"))) else 8.2

        records.append({
            "crop_id": crop_id,
            "crop_name": crop_name,
            "scientific_name": sci_name,
            "genus": sci_name.split()[0],
            "family": fam,
            "cycle_months": int(cycle_months),
            "sow_tmin": float(sow_tmin),
            "sow_tmax": float(sow_tmax),
            "vernalization_required": bool(vern_req),
            "harvest_tmin": float(harvest_tmin),
            "cool_season_cover": bool(cool_cover),
            "tmin": float(tmin),
            "topmn": float(topmn),
            "topmx": float(topmx),
            "tmax": float(tmax),
            "rmin": float(rmin),
            "ropmn": float(ropmn),
            "ropmx": float(ropmx),
            "rmax": float(rmax),
            "phmin": phmin,
            "phopmn": phopmn,
            "phopmx": phopmx,
            "phmax": phmax,
            "gmin": float(cycle_months * 30 - 15),
            "gmax": float(cycle_months * 30 + 15),
            "nitrogen_role": n_role,
            "root_depth_class": root_cls,
            "waterlogging_ok": bool(water_ok),
            "is_cover_crop": bool(is_cover),
            "min_sowing_soilw": float(min_soilw),
        })

    return pd.DataFrame(records)


def main() -> None:
    df = build_prepared_crops()
    OUT_CROPS_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_CROPS_PATH, index=False)
    print(f"Prepared {len(df)} filtered rotational crop profiles -> {OUT_CROPS_PATH}")


if __name__ == "__main__":
    main()
