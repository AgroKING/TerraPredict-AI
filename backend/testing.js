import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const ML_URL = process.env.ML_URL || "http://localhost:8000/predict";
const NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
const POWER_PARAMS = [
  "T2M",
  "T2M_MAX",
  "T2M_MIN",
  "PRECTOTCORR",
  "ALLSKY_SFC_SW_DWN",
  "RH2M",
  "GWETROOT",
  "TS",
];
const HISTORY_START = "1981-01-01";
const CHUNK_YEARS = 15;
const POWER_MISSING = -999;
const NASA_TIMEOUT_MS = 90_000;
const INDEX_TIMEOUT_MS = 60_000;
const ML_TIMEOUT_MS = 600_000; // first request for a new site can take minutes
const INDEX_TTL_MS = 24 * 60 * 60 * 1000;
const IRRIGATION_OPTIONS = ["rainfed", "limited_supplemental", "irrigated"];

// NOAA PSL monthly indices. The second URL is an older location and may be stale.
const INDEX_SOURCES = {
  nino34: [
    "https://psl.noaa.gov/data/correlation/nina34.anom.data",
    "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/nino34.long.anom.data",
  ],
  dmi: ["https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data"],
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// ------------------------------------------------
// VALIDATION
// ------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function maxAllowedDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 3); // satellite data lag
  return d.toISOString().slice(0, 10);
}

function validateInput({ lat, lng, date }) {
  const errors = [];
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90)
    errors.push("lat must be a number between -90 and 90");
  if (
    typeof lng !== "number" ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  )
    errors.push("lng must be a number between -180 and 180");
  if (typeof date !== "string" || !ISO_DATE.test(date)) {
    errors.push("date must be in YYYY-MM-DD format");
  } else if (date < HISTORY_START) {
    errors.push(`date must be on or after ${HISTORY_START}`);
  } else if (date > maxAllowedDate()) {
    errors.push(`date must be on or before ${maxAllowedDate()}`);
  }
  return errors;
}

// ------------------------------------------------
// NASA POWER: full history, fetched in 15-year chunks
// ------------------------------------------------

function yearChunks(startIso, endIso) {
  const startY = Number(startIso.slice(0, 4));
  const endY = Number(endIso.slice(0, 4));
  const chunks = [];
  for (let y = startY; y <= endY; ) {
    const y1 = Math.min(y + CHUNK_YEARS - 1, endY);
    chunks.push({
      start: y === startY ? startIso : `${y}-01-01`,
      end: y1 === endY ? endIso : `${y1}-12-31`,
    });
    y = y1 + 1;
  }
  return chunks;
}

async function fetchPowerChunk(lat, lng, start, end) {
  const params = new URLSearchParams({
    parameters: POWER_PARAMS.join(","),
    community: "AG",
    longitude: String(lng),
    latitude: String(lat),
    start: start.replaceAll("-", ""),
    end: end.replaceAll("-", ""),
    format: "JSON",
  });
  const res = await fetch(`${NASA_POWER_URL}?${params}`, {
    signal: AbortSignal.timeout(NASA_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`NASA POWER HTTP ${res.status}`);
  const json = await res.json();
  return json.properties.parameter;
}

// Returns { dates: ["YYYY-MM-DD", ...], T2M: [...], PRECTOTCORR: [...], ... }
// with null for missing values. Python reads this directly.
async function fetchPowerHistory(lat, lng, endIso) {
  const merged = Object.fromEntries(POWER_PARAMS.map((p) => [p, {}]));
  for (const c of yearChunks(HISTORY_START, endIso)) {
    const param = await fetchPowerChunk(lat, lng, c.start, c.end);
    for (const p of POWER_PARAMS) Object.assign(merged[p], param[p] ?? {});
  }

  const keys = Object.keys(merged.T2M).sort();
  const daily = {
    dates: keys.map(
      (k) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`,
    ),
  };
  for (const p of POWER_PARAMS) {
    daily[p] = keys.map((k) => {
      const v = merged[p][k];
      return v === undefined || v === POWER_MISSING ? null : v;
    });
  }
  return daily;
}

// ------------------------------------------------
// TELEMETRY METRICS (last 60 days, for the panel)
// ------------------------------------------------

const lastValid = (arr) => {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return arr[i];
  return null;
};

function buildMetrics(daily) {
  const n = 60;
  const recent = Object.fromEntries(
    ["dates", ...POWER_PARAMS].map((k) => [k, daily[k].slice(-n)]),
  );
  const surfaceTemp = lastValid(recent.TS);
  const soilMoisture = lastValid(recent.GWETROOT);
  const rain7 = recent.PRECTOTCORR.slice(-7).filter((v) => v !== null);
  const hum7 = recent.RH2M.slice(-7).filter((v) => v !== null);
  const heatDays = recent.T2M_MAX.filter((v) => v !== null && v >= 35).length;

  const metrics = [];
  if (surfaceTemp !== null)
    metrics.push({
      label: "Surface Temp",
      source: "NASA POWER",
      value: `${surfaceTemp.toFixed(1)} °C`,
      status:
        surfaceTemp > 35 ? "risk" : surfaceTemp > 30 ? "moderate" : "good",
    });
  if (soilMoisture !== null)
    metrics.push({
      label: "Root-Zone Soil Wetness",
      source: "NASA POWER",
      value: `${soilMoisture.toFixed(2)} (0–1)`,
      status:
        soilMoisture < 0.2 ? "risk" : soilMoisture < 0.3 ? "moderate" : "good",
    });
  if (rain7.length)
    metrics.push({
      label: "Rainfall (7 days)",
      source: "NASA POWER",
      value: `${rain7.reduce((a, b) => a + b, 0).toFixed(1)} mm`,
      status: "info",
    });
  metrics.push({
    label: "Heat Stress Days",
    source: "NASA POWER",
    value: `${heatDays} of ${recent.dates.length} days ≥ 35 °C`,
    status: heatDays > 10 ? "risk" : heatDays > 3 ? "moderate" : "good",
  });
  if (hum7.length)
    metrics.push({
      label: "Humidity (7-day avg)",
      source: "NASA POWER",
      value: `${(hum7.reduce((a, b) => a + b, 0) / hum7.length).toFixed(0)} %`,
      status: "info",
    });
  return metrics;
}

// ------------------------------------------------
// NOAA CLIMATE INDICES (PSL standard format), cached
// ------------------------------------------------

// Parses: first line "y1 y2", then "year v1..v12" rows, then a missing-value line.
// Returns { "YYYY-MM": value } with missing values dropped.
function parsePsl(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const [y1, y2] = lines[0].split(/\s+/).map(Number);
  const out = {};
  let missing = null;
  for (const ln of lines.slice(1)) {
    const tok = ln.split(/\s+/);
    if (
      tok.length === 13 &&
      /^\d+$/.test(tok[0]) &&
      +tok[0] >= y1 &&
      +tok[0] <= y2
    ) {
      for (let mo = 1; mo <= 12; mo++) {
        const v = Number(tok[mo]);
        if (Number.isNaN(v)) continue;
        out[`${tok[0]}-${String(mo).padStart(2, "0")}`] = v;
      }
    } else if (tok.length === 1) {
      const m = Number(tok[0]);
      missing = Number.isNaN(m) ? null : m;
      break; // the rest is free text
    }
  }
  for (const k of Object.keys(out)) {
    if ((missing !== null && out[k] === missing) || out[k] < -90) delete out[k];
  }
  return out;
}

async function fetchFirstOk(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(INDEX_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn(`index HTTP ${res.status}: ${url}`);
        continue;
      }
      return await res.text();
    } catch (err) {
      console.warn(`index fetch failed: ${url} (${err.message})`);
    }
  }
  return null;
}

const indexCache = { data: null, fetchedAt: 0 };

async function getClimateIndices() {
  if (indexCache.data && Date.now() - indexCache.fetchedAt < INDEX_TTL_MS) {
    return indexCache.data;
  }
  const out = {};
  for (const [name, urls] of Object.entries(INDEX_SOURCES)) {
    const text = await fetchFirstOk(urls);
    if (!text) continue;
    try {
      out[name] = parsePsl(text);
    } catch (err) {
      console.warn(`could not parse ${name}: ${err.message}`);
    }
  }
  // Cache only successful results, so a temporary NOAA outage is retried next time.
  if (Object.keys(out).length) {
    indexCache.data = out;
    indexCache.fetchedAt = Date.now();
  }
  return out;
}

// ------------------------------------------------
// ML SERVICE
// ------------------------------------------------

async function callMl(payload) {
  const res = await fetch(ML_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(ML_TIMEOUT_MS),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(`ML HTTP ${res.status}: ${body.error ?? "no detail"}`);
  return body;
}

// ------------------------------------------------
// ROUTE: POST /api/site-telemetry
// Body: { lat, lng, date, irrigation?, delta_temp?, delta_rain_pct? }
// ------------------------------------------------

app.post("/api/site-telemetry", async (req, res) => {
  const { lat, lng, date, irrigation, delta_temp, delta_rain_pct } =
    req.body ?? {};

  const inputErrors = validateInput({ lat, lng, date });
  if (inputErrors.length) {
    return res.status(400).json({ success: false, errors: inputErrors });
  }

  // Step 1: NASA data. Nothing can be shown without it.
  let daily;
  try {
    daily = await fetchPowerHistory(lat, lng, date);
  } catch (err) {
    console.error("NASA POWER error:", err);
    return res.status(502).json({
      success: false,
      errors: { nasa: "Failed to fetch NASA POWER data" },
    });
  }

  const response = {
    success: true,
    location: `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
    date,
    metrics: buildMetrics(daily),
    forecast: null,
    crops: [],
    rotation: null,
    meta: null,
    errors: {},
  };

  // Step 2: NOAA indices and ML. Failure here keeps the NASA metrics.
  try {
    const indices = await getClimateIndices();
    const ml = await callMl({
      lat,
      lon: lng,
      date,
      irrigation: IRRIGATION_OPTIONS.includes(irrigation)
        ? irrigation
        : "limited_supplemental",
      delta_temp: typeof delta_temp === "number" ? delta_temp : 0,
      delta_rain_pct: typeof delta_rain_pct === "number" ? delta_rain_pct : 0,
      daily,
      indices,
    });
    response.forecast = ml.forecast;
    response.crops = ml.crops;
    response.rotation = ml.rotation;
    response.meta = ml.meta;
  } catch (err) {
    console.error("ML service error:", err);
    response.errors.ml = "Forecast service unavailable";
  }

  return res.json(response);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
