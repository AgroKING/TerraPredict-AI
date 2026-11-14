import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

// --------------------------------------------------
// MAP CONFIGURATION
// --------------------------------------------------

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

const MAP_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
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
};

const DESTINATIONS = [
  { name: 'Rourkela', lng: 84.8536, lat: 22.2604, zoom: 11 },
  { name: 'Tokyo', lng: 139.6503, lat: 35.6762, zoom: 11 },
  { name: 'Paris', lng: 2.3522, lat: 48.8566, zoom: 12 },
  { name: 'New York', lng: -74.006, lat: 40.7128, zoom: 12 },
  { name: 'Himalayas', lng: 86.9, lat: 28.0, zoom: 8 },
];

// Helper: Generate soft radial glow texture for the Sun & Corona
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

  const [mapReady, setMapReady] = useState(false);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const [labelsOn, setLabelsOn] = useState(true);
  const [coordinates, setCoordinates] = useState(null);

  // ------------------------------------------------
  // INITIALIZE THREE.JS SPACE + MAPLIBRE GLOBE
  // ------------------------------------------------

  useEffect(() => {
    if (!containerRef.current || !spaceCanvasRef.current) return;

    // 1. Setup Three.js Scene, Camera & Renderer
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

    // 2. Create 3D Spherical Starfield
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
      // Distribute stars uniformly on a large celestial sphere
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
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(starColors, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      size: 1.8,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 3. Create 3D Sun & Corona Sprite in Celestial Coordinates
    const sunTexture = createSunTexture();
    const sunMaterial = new THREE.SpriteMaterial({
      map: sunTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    const sunSprite = new THREE.Sprite(sunMaterial);
    // Position the sun in space relative to initial view (Rourkela [84.8, 22.2])
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

    // 4. Initialize MapLibre Globe
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      canvasContextAttributes: {
        alpha: true,
      },
      center: [84.8536, 22.2604],
      zoom: 1.5,
      minZoom: 0.8,
      maxZoom: 18,
      attributionControl: true,
    });

    mapRef.current = map;

    // Sync Three.js Camera with MapLibre Globe Rotation, Pitch & Bearing
    const syncSpaceWithMap = () => {
      const center = map.getCenter();
      const bearing = map.getBearing();
      const pitch = map.getPitch();

      // Dragging Earth left (lng increases) -> stars sweep right
      // Dragging Earth down (lat increases) -> stars sweep down
      // Rotating map clockwise (bearing increases) -> stars rotate counter-clockwise
      const yaw = THREE.MathUtils.degToRad(center.lng);
      const latPitch = THREE.MathUtils.degToRad(-center.lat);
      const roll = THREE.MathUtils.degToRad(bearing);
      const tilt = THREE.MathUtils.degToRad(-pitch * 0.45);

      camera.rotation.set(latPitch + tilt, yaw, roll, 'YXZ');
      renderer.render(scene, camera);
    };

    // Initial render
    syncSpaceWithMap();

    map.on('move', syncSpaceWithMap);
    map.on('render', syncSpaceWithMap);

    map.on('error', (e) => {
      console.error('MAPLIBRE ERROR:', e.error);
    });

    map.on('style.load', () => {
      map.setProjection({ type: 'globe' });

      // MapLibre GL v5 Atmosphere / Sky Glow
      map.setSky({
        'atmosphere-blend': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          5, 1,
          7, 0,
        ],
      });
    });

    map.on('load', () => {
      setMapReady(true);
      syncSpaceWithMap();
    });

    map.on('mousemove', (e) => {
      setCoordinates({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
      });
    });

    map.on('mouseout', () => {
      setCoordinates(null);
    });

    // Handle Window & Container Resize
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

      if (requestRef.current) {
        requestRef.current.abort();
      }

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
  // LABEL TOGGLE
  // ------------------------------------------------

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (map.getLayer('labels')) {
      map.setLayoutProperty(
        'labels',
        'visibility',
        labelsOn ? 'visible' : 'none'
      );
    }
  }, [labelsOn, mapReady]);

  // ------------------------------------------------
  // MARKER
  // ------------------------------------------------

  const addMarker = (lng, lat) => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();

    const element = document.createElement('div');
    element.className = 'earth-pin';

    markerRef.current = new maplibregl.Marker({
      element,
      anchor: 'center',
    })
      .setLngLat([lng, lat])
      .addTo(map);
  };

  // ------------------------------------------------
  // FLY TO LOCATION
  // ------------------------------------------------

  const flyTo = (lng, lat, zoom = 12, bbox = null) => {
    const map = mapRef.current;
    if (!map) return;

    setSuggestions([]);
    setError('');
    map.stop();

    if (bbox && bbox.length === 4) {
      const [south, north, west, east] = bbox.map(Number);

      if ([south, north, west, east].every(Number.isFinite)) {
        map.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          {
            padding: 100,
            maxZoom: 15,
            duration: 3500,
          }
        );

        addMarker(lng, lat);
        return;
      }
    }

    map.flyTo({
      center: [lng, lat],
      zoom,
      pitch: 45,
      bearing: -15,
      duration: 3500,
      essential: true,
    });

    addMarker(lng, lat);
  };

  // ------------------------------------------------
  // SEARCH API
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

      if (!response.ok) {
        throw new Error(`Search HTTP ${response.status}`);
      }

      const data = await response.json();

      setSuggestions(data);
      setActiveIndex(-1);

      if (!data.length) {
        setError('No places found. Try another search.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setError('Search failed. Check your internet connection.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setSearching(false);
      }
    }
  };

  // ------------------------------------------------
  // DEBOUNCED SEARCH
  // ------------------------------------------------

  useEffect(() => {
    const text = query.trim();

    if (text.length < 3) {
      setSuggestions([]);
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces(text);
    }, 700);

    return () => clearTimeout(timer);
  }, [query]);

  // ------------------------------------------------
  // SELECT SEARCH RESULT
  // ------------------------------------------------

  const selectPlace = (place) => {
    const lng = Number(place.lon);
    const lat = Number(place.lat);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    setQuery(place.display_name.split(',').slice(0, 2).join(','));
    setSuggestions([]);
    setError('');

    flyTo(lng, lat, 12, place.boundingbox);
  };

  // ------------------------------------------------
  // SEARCH SUBMIT
  // ------------------------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    if (suggestions.length > 0) {
      selectPlace(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    } else if (query.trim().length >= 3) {
      searchPlaces(query);
    }
  };

  // ------------------------------------------------
  // KEYBOARD NAVIGATION
  // ------------------------------------------------

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

    if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  // ------------------------------------------------
  // MAP CONTROLS
  // ------------------------------------------------

  const zoomIn = () => {
    mapRef.current?.zoomIn({ duration: 500 });
  };

  const zoomOut = () => {
    mapRef.current?.zoomOut({ duration: 500 });
  };

  const resetView = () => {
    mapRef.current?.flyTo({
      center: [84.8536, 22.2604],
      zoom: 1.5,
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
      (position) => {
        flyTo(
          position.coords.longitude,
          position.coords.latitude,
          13
        );
      },
      () => {
        setError('Location access denied or unavailable.');
      }
    );
  };

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <main className="earth-app">
      {/* THREE.JS SYNCED 3D SPACE & SUN CANVAS */}
      <canvas ref={spaceCanvasRef} className="space-canvas" />

      {/* MAPLIBRE GLOBE */}
      <div ref={containerRef} className="map-container" />

      {/* LOADING */}
      {!mapReady && (
        <div className="loading-screen">
          <Loader2 className="spin" size={35} />
          <p>Loading Planet Earth...</p>
        </div>
      )}

      {/* SEARCH PANEL */}
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
            <Search size={21} />
          </button>
        </form>

        {/* SEARCH RESULTS */}
        {suggestions.length > 0 && (
          <div className="suggestion-list">
            {suggestions.map((place, index) => (
              <button
                key={place.place_id}
                className={
                  index === activeIndex
                    ? 'suggestion active'
                    : 'suggestion'
                }
                onClick={() => selectPlace(place)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <MapPin size={16} />
                <span>
                  <strong>
                    {place.display_name.split(',')[0]}
                  </strong>
                  <small>{place.display_name}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {/* QUICK DESTINATIONS */}
        {!query && (
          <div className="quick-destinations">
            {DESTINATIONS.map((place) => (
              <button
                key={place.name}
                onClick={() => {
                  setQuery(place.name);
                  setSuggestions([]);
                  flyTo(place.lng, place.lat, place.zoom);
                }}
              >
                {place.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MAP TOOLBAR */}
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

      {/* COORDINATES */}
      <div className="coordinates">
        {coordinates
          ? `${coordinates.lat.toFixed(4)}°, ${coordinates.lng.toFixed(4)}°`
          : 'Explore Planet Earth'}
      </div>

      {/* ATTRIBUTION */}
      <div className="earth-title">
        <span>●</span> TERRAPREDICT AI
      </div>
    </main>
  );
}