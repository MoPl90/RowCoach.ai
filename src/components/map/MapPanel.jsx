import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import { useLang } from '../../context/LangContext';
import { useTheme, TILES } from '../../context/ThemeContext';

const MapPanel = forwardRef(function MapPanel({ hidden, onHide, onShow }, ref) {
  const { t } = useLang();
  const { resolvedTheme } = useTheme();
  const mapContainerRef = useRef(null);
  const [showMsg, setShowMsg] = useState(true);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const map = useRef(null);
  const tLine = useRef(null);
  const pMark = useRef(null);
  const tLayer = useRef(null);
  const mapOk = useRef(false);
  const tPts = useRef([]); // own copy for polyline — source of truth

  useImperativeHandle(ref, () => ({
    updMap(lat, lon) {
      if (!mapOk.current) initMap(lat, lon);
      tPts.current.push([lat, lon]);
      tLine.current.setLatLngs(tPts.current);
      pMark.current.setLatLng([lat, lon]);
      if (tPts.current.length > 2) {
        map.current.fitBounds(tLine.current.getBounds().pad(0.2), { animate: false, maxZoom: 17 });
      } else {
        map.current.setView([lat, lon], 16, { animate: false });
      }
    },
    resetTrack() {
      tPts.current = [];
      if (tLine.current) tLine.current.setLatLngs([]);
    },
  }));

  function initMap(lat, lon) {
    if (mapOk.current) return;
    mapOk.current = true;
    setShowMsg(false);

    map.current = L.map(mapContainerRef.current, {
      zoomControl: false, attributionControl: false, dragging: false,
      scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false,
      boxZoom: false, keyboard: false, tap: false,
    }).setView([lat, lon], 16);

    tLayer.current = L.tileLayer(TILES[resolvedTheme], { maxZoom: 19 }).addTo(map.current);
    tLine.current = L.polyline([], { color: '#ffffff', weight: 2, opacity: 0.7 }).addTo(map.current);
    pMark.current = L.circleMarker([lat, lon], {
      radius: 4, color: '#fff', fillColor: '#fff', fillOpacity: 1, weight: 0,
    }).addTo(map.current);

    setTimeout(() => map.current?.invalidateSize(), 200);
  }

  // Swap tile layer on theme change
  useEffect(() => {
    if (!mapOk.current || !map.current) return;
    const old = tLayer.current;
    tLayer.current = L.tileLayer(TILES[resolvedTheme], { maxZoom: 19 }).addTo(map.current);
    map.current.removeLayer(old);
  }, [resolvedTheme]);

  // Invalidate map size after transition when restored
  useEffect(() => {
    if (!hidden && mapOk.current && map.current) {
      setTimeout(() => map.current?.invalidateSize(), 380);
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
