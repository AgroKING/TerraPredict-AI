import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, 'data', 'crop_images_cache.json');

// Curated high-res Unsplash imagery for major staples
const CURATED_IMAGES = {
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  barley: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80',
  oats: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  rye: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  sorghum: 'https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&w=800&q=80',
  millet: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80',
  chickpea: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80',
  lentil: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  pea: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=800&q=80',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80',
  mustard: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  rapeseed: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  sunflower: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  beet: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80',
  cotton: 'https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?auto=format&fit=crop&w=800&q=80',
  clover: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&q=80',
  vetch: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
  garlic: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80',
  onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  cassava: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&q=80',
  yam: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
  sweet_potato: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
  pigeon_pea: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80',
  cowpea: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
};

// In-memory cache loaded from JSON file
let imageCache = new Map();
let cacheDirty = false;

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (v) imageCache.set(k.toLowerCase(), v);
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
      obj[k] = v;
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

// Clean botanical names (remove author citations, varieties, quotes)
function cleanScientificName(raw) {
  if (!raw) return '';
  return raw
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+var\..*$/i, '')
    .replace(/\s+subsp\..*$/i, '')
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

  // 1. In-memory persistent cache lookup
  if (sciKey && imageCache.has(sciKey)) return imageCache.get(sciKey);
  if (commonKey && imageCache.has(commonKey)) return imageCache.get(commonKey);
  if (cropId && imageCache.has(cropId)) return imageCache.get(cropId);

  // 2. Curated matching by keywords
  for (const [key, url] of Object.entries(CURATED_IMAGES)) {
    if (key !== 'default' && (cropId.includes(key) || commonKey.includes(key))) {
      imageCache.set(cropId, url);
      if (sciKey) imageCache.set(sciKey, url);
      cacheDirty = true;
      return url;
    }
  }

  // 3. Query Wikipedia by scientific name first
  let resolvedUrl = null;
  if (sciName) {
    resolvedUrl = await fetchWikipediaImage(sciName);
  }

  // 4. If not found, query Wikipedia by clean common name
  if (!resolvedUrl && commonName && commonName.toLowerCase() !== sciName.toLowerCase()) {
    resolvedUrl = await fetchWikipediaImage(commonName);
  }

  // 5. Fallback if Wikipedia has no image
  if (!resolvedUrl) {
    resolvedUrl = CURATED_IMAGES.default;
  }

  // Store in cache
  if (resolvedUrl && resolvedUrl !== CURATED_IMAGES.default) {
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
