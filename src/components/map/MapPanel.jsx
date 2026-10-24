import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useLang } from '../../context/LangContext';
import { useTheme } from '../../context/ThemeContext';

// OpenFreeMap vector styles: no key needed, and layers can be hidden/recoloured
const STYLES = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};
const TRACK_COLOR = { dark: '#ffffff', light: '#222222' };

// Stock styles are near-greyscale; subtle colour makes water, green and roads stand out
const PAINT = {
  dark: {
    background: ['background-color', '#141414'],
    water: ['fill-color', '#1f4766'],
    waterway: ['line-color', '#1f4766'],
    landuse_residential: ['fill-color', '#1a1a1a'],
    landcover_wood: ['fill-color', '#1c2b1f'],
    landuse_park: ['fill-color', '#1c2b1f'],
    building: ['fill-color', '#222222'],
    highway_path: ['line-color', '#333333'],
    highway_minor: ['line-color', '#3a3a3a'],
    highway_major_inner: ['line-color', '#4a4a4a'],
    highway_major_subtle: ['line-color', '#4a4a4a'],
    highway_motorway_inner: ['line-color', '#555555'],
    highway_motorway_subtle: ['line-color', '#555555'],
  },
  light: {
    water: ['fill-color', '#a9cbe0'],
    waterway: ['line-color', '#a9cbe0'],
    park: ['fill-color', '#d5e6d0'],
    landcover_wood: ['fill-color', '#d5e6d0'],
    landuse_residential: ['fill-color', '#e8e8e3'],
    building: ['fill-color', '#deded9'],
    highway_minor: ['line-color', '#d0d0d0'],
    highway_major_casing: ['line-color', '#bdbdbd'],
    highway_motorway_casing: ['line-color', '#bdbdbd'],
  },
};

// Labels, POIs and transit are clutter on a small track map
const HIDE_LAYER = /^(railway|aeroway|poi|transit)/;

function trackGeo(pts) {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: pts } };
}

function posGeo(pts) {
  const p = pts[pts.length - 1];
  return { type: 'FeatureCollection', features: p ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: p } }] : [] };
}

const MapPanel = forwardRef(function MapPanel({ hidden, onHide, onShow }, ref) {
  const { t } = useLang();
  const { resolvedTheme } = useTheme();
  const mapContainerRef = useRef(null);
  const [showMsg, setShowMsg] = useState(true);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const map = useRef(null);
  const mapOk = useRef(false);
  const styleReady = useRef(false);
  const themeRef = useRef(resolvedTheme);
  const tPts = useRef([]); // own copy for track line — source of truth, as [lon, lat]

  useImperativeHandle(ref, () => ({
    updMap(lat, lon) {
      if (!mapOk.current) initMap();
      tPts.current.push([lon, lat]);
      draw();
    },
    resetTrack() {
      tPts.current = [];
      draw();
    },
  }));

  // Push track + position into the map; no-op until the style has loaded
  function draw() {
    const m = map.current;
    if (!m || !styleReady.current) return;
    const pts = tPts.current;
    m.getSource('track').setData(trackGeo(pts));
    m.getSource('pos').setData(posGeo(pts));
    if (pts.length > 2) {
      const lons = pts.map(p => p[0]);
      const lats = pts.map(p => p[1]);
      m.fitBounds(
        [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
        { padding: 20, maxZoom: 17, animate: false },
      );
    } else if (pts.length) {
      m.jumpTo({ center: pts[pts.length - 1], zoom: 16 });
    }
  }

  // Runs on every style load (initial + theme switch), since setStyle drops custom layers
  function setupStyle() {
    const m = map.current;
    const theme = themeRef.current;
    for (const layer of m.getStyle().layers) {
      if (layer.type === 'symbol' || HIDE_LAYER.test(layer.id)) {
        m.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
    for (const [id, [prop, val]] of Object.entries(PAINT[theme])) {
      if (m.getLayer(id)) m.setPaintProperty(id, prop, val);
    }
    m.addSource('track', { type: 'geojson', data: trackGeo([]) });
    m.addSource('pos', { type: 'geojson', data: posGeo([]) });
    m.addLayer({ id: 'track', type: 'line', source: 'track',
      paint: { 'line-color': TRACK_COLOR[theme], 'line-width': 2, 'line-opacity': 0.8 } });
    m.addLayer({ id: 'pos', type: 'circle', source: 'pos',
      paint: { 'circle-radius': 4, 'circle-color': TRACK_COLOR[theme] } });
    styleReady.current = true;
    draw();
  }

  // Map library is loaded on first GPS fix so it doesn't weigh on app startup
  async function initMap() {
    if (mapOk.current) return;
    mapOk.current = true;
    setShowMsg(false);

    const [{ Map: MapLibreMap, setWorkerUrl }, { default: workerUrl }] = await Promise.all([
      import('maplibre-gl'),
      // MapLibre 6 can't locate its worker after bundling; let Vite bundle it and pass the URL
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]);
    setWorkerUrl(workerUrl);
    map.current = new MapLibreMap({
      container: mapContainerRef.current,
      style: STYLES[themeRef.current],
      interactive: false,
      attributionControl: { compact: false },
    });
    map.current.on('style.load', setupStyle);
  }

  // Swap style on theme change
  useEffect(() => {
    themeRef.current = resolvedTheme;
    if (!map.current) return;
    styleReady.current = false;
    map.current.setStyle(STYLES[resolvedTheme]);
  }, [resolvedTheme]);

  // Resize map after transition when restored
  useEffect(() => {
    if (!hidden && map.current) {
      setTimeout(() => map.current?.resize(), 380);
    }
  }, [hidden]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    if (!hidden && Math.abs(dx) > Math.abs(dy) && dx < -60) {
      onHide?.();
    }
  }

  const msgLines = t('mapMsg').split('\n');

  return (
    <div
      className={`panel panel-left${hidden ? ' map-hidden' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button className="map-restore" onClick={onShow} aria-label="Show map">&#8250;</button>
      <button className="map-collapse" onClick={onHide} aria-label="Hide map">&#8249;</button>
      {showMsg && !hidden && (
        <div className="map-msg">
          <div className="map-msg-txt">{msgLines[0]}<br />{msgLines[1]}</div>
        </div>
      )}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
});

export default MapPanel;
