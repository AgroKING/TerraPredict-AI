import React, { useEffect, useRef, useState, useCallback } from 'react';
import CropDrawer from './data/components/CropDrawer';
import { MOCK_CROPS } from './data/mockCrops';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as THREE from 'three';
import './index.css';

import {
  Search,
  MapPin,
  Plus,
  Minus,
  LocateFixed,
  Compass,
  X,
  Loader2,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  CloudRain,
  Sprout,
  Waves,
  Mountain,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

// --------------------------------------------------
// MAP & NASA GIBS SPECTRAL OVERLAY CONFIGURATION
// --------------------------------------------------

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

const SPECTRAL_GRADIENT =
  'linear-gradient(90deg, #1e3a8a 0%, #06b6d4 25%, #22c55e 50%, #eab308 75%, #ef4444 100%)';

const SPECTRAL_LAYERS = [
  {
    id: 'temperature',
    name: 'Land Surface Temp',
    dataset: 'MODIS Terra / ECOSTRESS',
    icon: Thermometer,
    unit: '-20°C to 45°C',
    gradient: SPECTRAL_GRADIENT,
    buildUrl: (date) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
    maxzoom: 7,
  },
  {
    id: 'soil-moisture',
    name: 'Soil Moisture',
    dataset: 'NASA SMAP L4',
    icon: Droplets,
    unit: '0.05 to 0.50 m³/m³',
    gradient: 'linear-gradient(90deg, #92400e, #f59e0b, #38bdf8, #1d4ed8)',
    buildUrl: (date) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    maxzoom: 6,
  },
  {
    id: 'rainfall',
    name: 'Precipitation & Rain',
    dataset: 'NASA GPM IMERG',
    icon: CloudRain,
    unit: '0 to 50+ mm/day',
    gradient: 'linear-gradient(90deg, #0f172a, #0284c7, #38bdf8, #a855f7, #f43f5e)',
    buildUrl: (date) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    maxzoom: 6,
  },
  {
    id: 'vegetation',
    name: 'Vegetation Stress (NDVI)',
    dataset: 'MODIS / Landsat',
    icon: Sprout,
    unit: 'Stressed (-0.1) → Lush (0.9)',
    gradient: 'linear-gradient(90deg, #78350f, #d97706, #bef264, #15803d)',
    buildUrl: (date) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    maxzoom: 9,
  },
  {
    id: 'water-trends',
    name: 'Long-Term Water Trends',
    dataset: 'GRACE / GRACE-FO',
    icon: Waves,
    unit: 'Deficit (-30cm) → Surplus (+30cm)',
    gradient: 'linear-gradient(90deg, #991b1b, #f97316, #f8fafc, #0ea5e9, #1e3a8a)',
    buildUrl: () =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Land/default/2024-01-01/GoogleMapsCompatible_Level4/{z}/{y}/{x}.png`,
    maxzoom: 4,
  },
  {
    id: 'elevation',
    name: 'Terrain & Elevation',
    dataset: 'NASA SRTM DEM',
    icon: Mountain,
    unit: '0m → 6,000m+',
    gradient: 'linear-gradient(90deg, #065f46, #65a30d, #ca8a04, #9ca3af, #ffffff)',
    buildUrl: () =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SRTM_Color_Index/default/2000-02-11/GoogleMapsCompatible_Level12/{z}/{y}/{x}.png`,
    maxzoom: 12,
  },
];

const DESTINATIONS = [
  { name: 'Rourkela', lng: 84.8536, lat: 22.2604, zoom: 6 },
  { name: 'Tokyo', lng: 139.6503, lat: 35.6762, zoom: 6 },
  { name: 'Paris', lng: 2.3522, lat: 48.8566, zoom: 6 },
  { name: 'New York', lng: -74.006, lat: 40.7128, zoom: 6 },
  { name: 'Himalayas', lng: 86.9, lat: 28.0, zoom: 5 },
];

// --------------------------------------------------
// DATE HELPERS
// --------------------------------------------------

function getMaxSatelliteDate() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().split('T')[0];
}

// --------------------------------------------------
// SUN CORONA TEXTURE
// --------------------------------------------------

function createSunTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.15, 'rgba(255, 248, 220, 0.95)');
  gradient.addColorStop(0.35, 'rgba(255, 195, 75, 0.55)');
  gradient.addColorStop(0.65, 'rgba(255, 120, 10, 0.15)');
  gradient.addColorStop(1.0, 'rgba(255, 80, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --------------------------------------------------
// MAIN APP
// --------------------------------------------------

export default function App() {
  const containerRef = useRef(null);
  const spaceCanvasRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const requestRef = useRef(null);
  const detailsSectionRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  // Search state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  // Map UI state
  const [labelsOn, setLabelsOn] = useState(true);
  const [hoverCoords, setHoverCoords] = useState(null);

  // Selected Date & Farm Location
  const maxDate = getMaxSatelliteDate();
  const [selectedDate, setSelectedDate] = useState(maxDate);

  const [selectedLocation, setSelectedLocation] = useState({
    lat: 22.2604,
    lng: 84.8536,
    name: 'Rourkela, Odisha',
  });

  // Left Spectral Overlay Dashboard State
  const [activeSpectralId, setActiveSpectralId] = useState('temperature');
  const [overlayOpacity, setOverlayOpacity] = useState(0.75);

  // Right Telemetry & Prediction Drawer State
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [siteTelemetry, setSiteTelemetry] = useState(null);

  // Crop Recommendations Drawer State
  const [isCropDrawerOpen, setIsCropDrawerOpen] = useState(false);

  const activeSpectral = SPECTRAL_LAYERS.find((l) => l.id === activeSpectralId) || null;

  // Open the crop recommendations drawer (closes telemetry drawer so panels don't stack)
  const handleOpenCrops = () => {
    setDrawerOpen(false);
    setIsCropDrawerOpen(true);
  };

  // ------------------------------------------------
  // BACKEND API CALL: FETCH COLLECTED & PREDICTED DATA
  // ------------------------------------------------

  const fetchSiteTelemetry = useCallback(async (lat, lng, date, placeName = '') => {
    setTelemetryLoading(true);
    setDrawerOpen(true);

    try {
      const response = await fetch('/api/site-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, date }),
      });

      if (!response.ok) throw new Error('Backend unavailable');
      const data = await response.json();
      setSiteTelemetry(data);
    } catch {
      // Fallback telemetry preview until backend is connected
      const isTropical = Math.abs(lat) < 25;
      setSiteTelemetry({
        location: placeName || `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
        date,
        metrics: [
          {
            label: 'Surface Temp',
            source: 'MODIS / ECOSTRESS',
            value: isTropical ? '31.4 °C' : '19.8 °C',
            spectralColor: isTropical ? '#f97316' : '#22c55e',
          },
          {
            label: 'Heat Stress Risk',
            source: 'NASA POWER',
            value: isTropical ? 'Moderate (0.62)' : 'Low (0.21)',
            spectralColor: isTropical ? '#eab308' : '#06b6d4',
          },
          {
            label: 'Soil Moisture',
            source: 'SMAP L4',
            value: '0.28 m³/m³',
            spectralColor: '#22c55e',
          },
          {
            label: 'Rainfall Anomaly',
            source: 'GPM IMERG',
            value: '+14.2 mm/wk',
            spectralColor: '#06b6d4',
          },
          {
            label: 'Extreme Precip Risk',
            source: 'GPM / POWER',
            value: 'Low (12%)',
            spectralColor: '#22c55e',
          },
          {
            label: 'Evapotranspiration',
            source: 'ECOSTRESS',
            value: '4.2 mm/day',
            spectralColor: '#eab308',
          },
          {
            label: 'Frost Risk',
            source: 'NASA POWER',
            value: Math.abs(lat) > 35 ? 'Moderate (38%)' : 'Negligible (1%)',
            spectralColor: Math.abs(lat) > 35 ? '#3b82f6' : '#22c55e',
          },
          {
            label: 'Vegetation Stress',
            source: 'MODIS NDVI',
            value: '0.68 NDVI',
            spectralColor: '#22c55e',
          },
          {
            label: 'Groundwater Trend',
            source: 'GRACE-FO',
            value: '-1.4 cm eq.',
            spectralColor: '#eab308',
          },
          {
            label: 'Elevation',
            source: 'SRTM DEM',
            value: '218 m',
            spectralColor: '#06b6d4',
          },
        ],
      });
    } finally {
      setTelemetryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    fetchSiteTelemetry(
      selectedLocation.lat,
      selectedLocation.lng,
      selectedDate,
      selectedLocation.name
    );
  }, [selectedLocation, selectedDate, mapReady, fetchSiteTelemetry]);

  // ------------------------------------------------
  // INITIALIZE THREE.JS SPACE + MAPLIBRE GLOBE
  // ------------------------------------------------

  useEffect(() => {
    if (!containerRef.current || !spaceCanvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({
      canvas: spaceCanvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020308, 1);

    // 3D Spherical Starfield
    const starCount = 4500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#dbe9ff'),
      new THREE.Color('#fff2d6'),
      new THREE.Color('#b8d4ff'),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 800 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const color = palette[Math.floor(Math.random() * palette.length)];
      const brightness = 0.45 + Math.random() * 0.55;
      starColors[i * 3] = color.r * brightness;
      starColors[i * 3 + 1] = color.g * brightness;
      starColors[i * 3 + 2] = color.b * brightness;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.8,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    scene.add(new THREE.Points(starGeometry, starMaterial));

    // 3D Sun & Corona Sprite
    const sunTexture = createSunTexture();
    const sunMaterial = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    const sunSprite = new THREE.Sprite(sunMaterial);
    const sunLng = THREE.MathUtils.degToRad(-65);
    const sunLat = THREE.MathUtils.degToRad(-5);
    const sunDist = 900;

    sunSprite.position.set(
      -sunDist * Math.cos(sunLat) * Math.sin(sunLng),
      sunDist * Math.sin(sunLat),
      -sunDist * Math.cos(sunLat) * Math.cos(sunLng)
    );
    sunSprite.scale.set(260, 260, 1);
    scene.add(sunSprite);

    // Initialize MapLibre Globe
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Imagery © Esri | NASA GIBS',
          },
          labels: {
            type: 'raster',
            tiles: [
              `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`,
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Labels © Esri',
          },
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite',
            paint: { 'raster-opacity': 1 },
          },
          {
            id: 'labels',
            type: 'raster',
            source: 'labels',
            paint: { 'raster-opacity': 0.9 },
          },
        ],
      },
      canvasContextAttributes: { alpha: true },
      center: [84.8536, 22.2604],
      zoom: 1.65,
      minZoom: 0.8,
      maxZoom: 18,
      attributionControl: true,
    });

    mapRef.current = map;

    const syncSpaceWithMap = () => {
      const center = map.getCenter();
      const bearing = map.getBearing();
      const pitch = map.getPitch();

      const yaw = THREE.MathUtils.degToRad(center.lng);
      const latPitch = THREE.MathUtils.degToRad(-center.lat);
      const roll = THREE.MathUtils.degToRad(bearing);
      const tilt = THREE.MathUtils.degToRad(-pitch * 0.45);

      camera.rotation.set(latPitch + tilt, yaw, roll, 'YXZ');
      renderer.render(scene, camera);
    };

    syncSpaceWithMap();
    map.on('move', syncSpaceWithMap);
    map.on('render', syncSpaceWithMap);

    map.on('style.load', () => {
      map.setProjection({ type: 'globe' });
      map.setSky({
        'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
      });
    });

    map.on('load', () => {
      setMapReady(true);
      syncSpaceWithMap();
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      addMarker(lng, lat);
      setSelectedLocation({
        lat,
        lng,
        name: `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
      });
    });

    map.on('mousemove', (e) => {
      setHoverCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    map.on('mouseout', () => setHoverCoords(null));

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      map.resize();
      syncSpaceWithMap();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markerRef.current?.remove();
      requestRef.current?.abort();
      map.remove();
      mapRef.current = null;
      starGeometry.dispose();
      starMaterial.dispose();
      sunTexture.dispose();
      sunMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // ------------------------------------------------
  // DYNAMIC NASA SPECTRAL LAYER WRAPPING ON GLOBE
  // ------------------------------------------------

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const layerId = 'nasa-spectral-layer';
    const sourceId = 'nasa-spectral-source';

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (!activeSpectral) return;

    map.addSource(sourceId, {
      type: 'raster',
      tiles: [activeSpectral.buildUrl(selectedDate)],
      tileSize: 256,
      maxzoom: activeSpectral.maxzoom,
    });

    const beforeLayer = map.getLayer('labels') ? 'labels' : undefined;

    map.addLayer(
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': overlayOpacity,
          'raster-fade-duration': 300,
        },
      },
      beforeLayer
    );
  }, [activeSpectral, selectedDate, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer('nasa-spectral-layer')) {
      map.setPaintProperty('nasa-spectral-layer', 'raster-opacity', overlayOpacity);
    }
  }, [overlayOpacity, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer('labels')) {
      map.setLayoutProperty('labels', 'visibility', labelsOn ? 'visible' : 'none');
    }
  }, [labelsOn, mapReady]);

  // ------------------------------------------------
  // MARKER & FLY TO LOCATION
  // ------------------------------------------------

  const addMarker = (lng, lat) => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();
    const element = document.createElement('div');
    element.className = 'earth-pin';

    markerRef.current = new maplibregl.Marker({ element, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);
  };

  const flyTo = (lng, lat, zoom = 6, placeName = '') => {
    const map = mapRef.current;
    if (!map) return;

    setSuggestions([]);
    setError('');
    map.stop();

    map.flyTo({
      center: [lng, lat],
      zoom,
      pitch: 25,
      bearing: 0,
      duration: 2800,
      essential: true,
    });

    addMarker(lng, lat);
    setSelectedLocation({
      lat,
      lng,
      name: placeName || `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
    });
  };

  // ------------------------------------------------
  // GEOCODING SEARCH
  // ------------------------------------------------

  const searchPlaces = async (value) => {
    const text = value.trim();
    if (text.length < 3) {
      setSuggestions([]);
      setError('');
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setSearching(true);
    setError('');

    try {
      const url =
        'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({
          format: 'jsonv2',
          limit: '5',
          addressdetails: '1',
          q: text,
        });

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`Search HTTP ${response.status}`);
      const data = await response.json();

      setSuggestions(data);
      setActiveIndex(-1);
      if (!data.length) setError('No places found. Try another search.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Search failed. Check your internet connection.');
      }
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  };

  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) {
      setSuggestions([]);
      setError('');
      return;
    }
    const timer = setTimeout(() => searchPlaces(text), 650);
    return () => clearTimeout(timer);
  }, [query]);

  const selectPlace = (place) => {
    const lng = Number(place.lon);
    const lat = Number(place.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    const shortName = place.display_name.split(',').slice(0, 2).join(',');
    setQuery(shortName);
    setSuggestions([]);
    setError('');
    flyTo(lng, lat, 7, shortName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      selectPlace(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    } else if (query.trim().length >= 3) {
      searchPlaces(query);
    }
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
    if (e.key === 'Escape') setSuggestions([]);
  };

  // ------------------------------------------------
  // MAP CONTROLS
  // ------------------------------------------------

  const zoomIn = () => mapRef.current?.zoomIn({ duration: 500 });
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 500 });

  const resetView = () => {
    mapRef.current?.flyTo({
      center: [84.8536, 22.2604],
      zoom: 1.65,
      pitch: 0,
      bearing: 0,
      duration: 2000,
    });
    markerRef.current?.remove();
    setQuery('');
    setSuggestions([]);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => flyTo(pos.coords.longitude, pos.coords.latitude, 8, 'My Farm Location'),
      () => setError('Location access denied or unavailable.')
    );
  };

  const scrollToAbout = () => {
    detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <div className="page-wrapper">
      {/* HERO 3D GLOBE VIEWPORT (100vh) */}
      <main className="earth-app">
        <canvas ref={spaceCanvasRef} className="space-canvas" />
        <div ref={containerRef} className="map-container" />

        {!mapReady && (
          <div className="loading-screen">
            <Loader2 className="spin" size={35} />
            <p>Initializing NASA Earth Observation Globe...</p>
          </div>
        )}

        {/* TOP-LEFT: SEARCH & QUICK DESTINATIONS */}
        <div className="search-panel">
          <form onSubmit={handleSubmit} className="search-form">
            <MapPin className="search-pin" size={19} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search any city, address or landmark"
              aria-label="Search places"
            />
            {searching && <Loader2 className="spin" size={19} />}
            {query && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setError('');
                  markerRef.current?.remove();
                }}
              >
                <X size={18} />
              </button>
            )}
            <button type="submit" className="search-btn">
              <Search size={20} />
            </button>
          </form>

          {suggestions.length > 0 && (
            <div className="suggestion-list">
              {suggestions.map((place, index) => (
                <button
                  key={place.place_id}
                  className={
                    index === activeIndex ? 'suggestion active' : 'suggestion'
                  }
                  onClick={() => selectPlace(place)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <MapPin size={16} />
                  <span>
                    <strong>{place.display_name.split(',')[0]}</strong>
                    <small>{place.display_name}</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {!query && (
            <div className="quick-destinations">
              {DESTINATIONS.map((place) => (
                <button
                  key={place.name}
                  onClick={() => {
                    setQuery(place.name);
                    setSuggestions([]);
                    flyTo(place.lng, place.lat, place.zoom, place.name);
                  }}
                >
                  {place.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TOP-CENTER: OBSERVATION DATE PICKER */}
        <div className="date-picker-bar">
          <Calendar size={17} className="date-icon" />
          <label htmlFor="obs-date">Observation Date</label>
          <input
            id="obs-date"
            type="date"
            value={selectedDate}
            max={maxDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          />
        </div>

        {/* LEFT: SPECTRAL OVERLAYS DASHBOARD */}
        <aside className="spectral-dashboard">
          <div className="spectral-header">
            <Layers size={17} />
            <h3>Spectral Overlays</h3>
          </div>
          <p className="spectral-sub">Wrap NASA datasets around the globe</p>

          <div className="spectral-list">
            {SPECTRAL_LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeSpectralId === layer.id;
              return (
                <button
                  key={layer.id}
                  className={`spectral-item ${isActive ? 'active' : ''}`}
                  onClick={() =>
                    setActiveSpectralId(isActive ? null : layer.id)
                  }
                >
                  <div className="spectral-item-top">
                    <Icon size={16} />
                    <span>{layer.name}</span>
                  </div>
                  <small>{layer.dataset}</small>
                </button>
              );
            })}
          </div>

          {activeSpectral && (
            <div className="spectral-legend">
              <div className="legend-row">
                <span>Layer Opacity</span>
                <span>{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="1"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              />
              <div
                className="legend-bar"
                style={{ background: activeSpectral.gradient }}
              />
              <div className="legend-scale">{activeSpectral.unit}</div>
            </div>
          )}
        </aside>

        {/* RIGHT: MAP TOOLBAR */}
        <div className="map-toolbar">
          <button onClick={resetView} title="Reset globe">
            <Compass size={20} />
          </button>
          <button onClick={zoomIn} title="Zoom in">
            <Plus size={20} />
          </button>
          <button onClick={zoomOut} title="Zoom out">
            <Minus size={20} />
          </button>
          <button onClick={locateMe} title="My location">
            <LocateFixed size={20} />
          </button>
          <button
            onClick={() => setLabelsOn((v) => !v)}
            className={labelsOn ? 'selected' : ''}
            title="Toggle labels"
          >
            <MapPin size={20} />
          </button>
        </div>

        {/* RIGHT EDGE: TELEMETRY & PREDICTIONS DRAWER TOGGLE */}
        <button
          className={`drawer-toggle-btn ${drawerOpen ? 'open' : ''}`}
          style={{ display: isCropDrawerOpen ? 'none' : undefined }}
          onClick={() => setDrawerOpen((v) => !v)}
          title="Toggle Site Telemetry & Predictions"
        >
          {drawerOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          <span>Data</span>
        </button>

        {/* RIGHT: TRANSPARENT SITE TELEMETRY & PREDICTIONS DRAWER */}
        <aside className={`crop-drawer ${drawerOpen ? 'open' : ''}`}>
          <div className="drawer-header">
            <div>
              <span className="drawer-badge">
                <Sparkles size={13} /> NASA TELEMETRY & PREDICTIONS
              </span>
              <h3>{selectedLocation.name}</h3>
              <p className="drawer-coords">
                {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}° ·{' '}
                <strong>{selectedDate}</strong>
              </p>
            </div>
            <button
              className="drawer-close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* TOP SPECTRAL LEGEND */}
          <div className="drawer-spectral-legend">
            <div className="drawer-legend-title">Spectral Intensity Scale</div>
            <div
              className="drawer-legend-bar"
              style={{ background: SPECTRAL_GRADIENT }}
            />
            <div className="drawer-legend-labels">
              <span>Low / Cold</span>
              <span>Optimal</span>
              <span>High / Stress</span>
            </div>
          </div>

          {telemetryLoading ? (
            <div className="drawer-loading">
              <Loader2 className="spin" size={26} />
              <p>Collecting satellite observations...</p>
            </div>
          ) : (
            siteTelemetry && (
              <>
                {/* HORIZONTALLY LISTED DATA ROWS WITH SPECTRAL-COLORED VALUES */}
                <div className="telemetry-list">
                  {siteTelemetry.metrics.map((item, idx) => (
                    <div key={idx} className="telemetry-row">
                      <div className="telemetry-info">
                        <span className="telemetry-label">{item.label}</span>
                        <small className="telemetry-source">{item.source}</small>
                      </div>
                      <strong
                        className="telemetry-value"
                        style={{
                          color: item.spectralColor,
                          textShadow: `0 0 12px ${item.spectralColor}55`,
                        }}
                      >
                        {item.value}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* BOTTOM CTA: OPEN CROP RECOMMENDATIONS DRAWER */}
                <button
                  type="button"
                  className="recommend-route-btn"
                  onClick={handleOpenCrops}
                >
                  <span>Tap to get recommended crops</span>
                  <ArrowRight size={17} />
                </button>
              </>
            )
          )}
        </aside>

        {/* CROP RECOMMENDATIONS DRAWER */}
        <CropDrawer
          isOpen={isCropDrawerOpen}
          onClose={() => setIsCropDrawerOpen(false)}
          coordinates={{ lat: selectedLocation.lat, lon: selectedLocation.lng }}
          crops={siteTelemetry?.crops?.length ? siteTelemetry.crops : MOCK_CROPS}
          strategies={siteTelemetry?.strategies}
          soilTerrain={siteTelemetry?.soil_terrain}
        />

        {/* BOTTOM-LEFT: LIVE COORDINATES */}
        <div className="coordinates">
          {hoverCoords
            ? `${hoverCoords.lat.toFixed(4)}°, ${hoverCoords.lng.toFixed(4)}°`
            : `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lng.toFixed(4)}°`}
        </div>

        {/* BOTTOM-CENTER: SCROLL TO LEARN ABOUT PROJECT */}
        <button className="scroll-cue" onClick={scrollToAbout}>
          <span>Scroll to learn about project</span>
          <ChevronDown size={18} />
        </button>

        {/* BOTTOM-RIGHT: BRANDING */}
        <div className="earth-title">
          <span>●</span> TERRAPREDICT AI
        </div>
      </main>

      {/* BELOW-THE-FOLD: PROJECT & NASA DATASETS OVERVIEW */}
      <section ref={detailsSectionRef} className="about-section">
        <div className="about-container">
          <span className="about-eyebrow">EARTH OBSERVATION FOR RESILIENT AGRICULTURE</span>
          <h2>Data-Driven Crop Rotation Powered by NASA Satellites</h2>
          <p className="about-lead">
            TerraPredict AI helps farmers explore multi-season crop-rotation strategies
            that restore soil health, reduce heat and water stress, and adapt to
            long-term climate variability. Select any location on the globe and choose
            an observation date to query historical and near-real-time satellite
            indicators.
          </p>

          <div className="dataset-grid">
            <div className="dataset-card">
              <h4>SMAP & GRACE-FO</h4>
              <p>
                Surface and root-zone soil moisture paired with terrestrial water
                storage anomalies to evaluate drought resilience and irrigation
                demand.
              </p>
            </div>
            <div className="dataset-card">
              <h4>ECOSTRESS & MODIS</h4>
              <p>
                Land surface temperature, evapotranspiration rates, and NDVI
                vegetation stress indices to detect crop heat stress early.
              </p>
            </div>
            <div className="dataset-card">
              <h4>GPM & NASA POWER</h4>
              <p>
                High-resolution rainfall patterns, extreme precipitation risks,
                solar radiation, and frost windows tailored to local coordinates.
              </p>
            </div>
            <div className="dataset-card">
              <h4>Landsat & SRTM Elevation</h4>
              <p>
                Field-scale spectral reflectance and digital elevation models to
                account for slope runoff, drainage, and microclimates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}