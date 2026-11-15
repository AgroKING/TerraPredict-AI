import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, 'data', 'crop_images_cache.json');

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
const BAD_URLS = new Set([
  'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=800&q=80', // orange photo erroneously labeled as pea
  'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80', // orange tree photo erroneously labeled as barley
]);

function isAuthenticUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (BAD_URLS.has(url)) return false;
  // Prioritize verified Wikimedia / Wikipedia botanical photos over generic stock images
  return url.includes('wikimedia.org') || url.includes('wikipedia.org');
}

// In-memory cache loaded from JSON file
let imageCache = new Map();
let cacheDirty = false;

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (v && isAuthenticUrl(v)) {
          imageCache.set(k.toLowerCase(), v);
        }
      }
    }
  } catch (err) {
    console.warn('[ImageResolver] Failed to load cache file:', err.message);
  }
}

function saveCache() {
  if (!cacheDirty) return;
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = {};
    for (const [k, v] of imageCache.entries()) {
      if (v && isAuthenticUrl(v)) {
        obj[k] = v;
      }
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    cacheDirty = false;
  } catch (err) {
    console.warn('[ImageResolver] Failed to write cache file:', err.message);
  }
}

// Auto-save cache every 10 seconds if dirty
setInterval(saveCache, 10000).unref();

loadCache();

// Clean botanical names (remove author citations, varieties, subspecies, quotes)
function cleanScientificName(raw) {
  if (!raw) return '';
  return raw
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+ssp\..*$/i, '')
    .replace(/\s+subsp\..*$/i, '')
    .replace(/\s+var\..*$/i, '')
    .replace(/\s+sp\..*$/i, '')
    .replace(/\s+type$/i, '')
    .trim();
}

function cleanCommonName(raw) {
  if (!raw) return '';
  return raw
    .replace(/\(.*?\)/g, '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
}

async function fetchWikipediaImage(query) {
  if (!query) return null;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TerraPredict-AI/1.0 (bot; contact@terrapredict.ai)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

export async function resolveCropImage(crop) {
  const cropId = (crop.id || '').toLowerCase();
  const sciName = cleanScientificName(crop.scientificName);
  const sciKey = sciName.toLowerCase();
  const commonName = cleanCommonName(crop.name);
  const commonKey = commonName.toLowerCase();

  // 1. Check in-memory persistent cache for verified authentic botanical images
  if (sciKey && imageCache.has(sciKey) && isAuthenticUrl(imageCache.get(sciKey))) {
    return imageCache.get(sciKey);
  }
  if (commonKey && imageCache.has(commonKey) && isAuthenticUrl(imageCache.get(commonKey))) {
    return imageCache.get(commonKey);
  }
  if (cropId && imageCache.has(cropId) && isAuthenticUrl(imageCache.get(cropId))) {
    return imageCache.get(cropId);
  }

  // 2. Query Wikipedia by exact botanical scientific name (e.g. Vigna unguiculata)
  let resolvedUrl = null;
  if (sciName) {
    resolvedUrl = await fetchWikipediaImage(sciName);
  }

  // 3. If scientific name had no image, try common name (e.g. Cowpea)
  if (!resolvedUrl && commonName && commonName.toLowerCase() !== sciName.toLowerCase()) {
    resolvedUrl = await fetchWikipediaImage(commonName);
  }

  // 4. If still no image, try genus (e.g. Vigna)
  if (!resolvedUrl && sciName.includes(' ')) {
    const genus = sciName.split(' ')[0];
    if (genus.length > 2) {
      resolvedUrl = await fetchWikipediaImage(genus);
    }
  }

  // 5. Ultimate fallback if completely unavailable
  if (!resolvedUrl || BAD_URLS.has(resolvedUrl)) {
    resolvedUrl = DEFAULT_FALLBACK;
  }

  // Cache the valid URL
  if (resolvedUrl && resolvedUrl !== DEFAULT_FALLBACK && !BAD_URLS.has(resolvedUrl)) {
    if (sciKey) imageCache.set(sciKey, resolvedUrl);
    if (commonKey) imageCache.set(commonKey, resolvedUrl);
    if (cropId) imageCache.set(cropId, resolvedUrl);
    cacheDirty = true;
  }

  return resolvedUrl;
}

export async function enrichCropsWithImages(crops, concurrency = 10) {
  if (!Array.isArray(crops) || crops.length === 0) return crops;

  const results = [...crops];
  for (let i = 0; i < results.length; i += concurrency) {
    const chunk = results.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (crop) => {
        try {
          const img = await resolveCropImage(crop);
          if (img) crop.image = img;
        } catch (e) {
          console.warn('[ImageResolver] Error for crop:', crop.name, e.message);
        }
      })
    );
  }

  saveCache();
  return results;
}
