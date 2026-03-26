import { useRef } from 'react';

function haversine(a1, o1, a2, o2) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dA = r(a2 - a1), dO = r(o2 - o1);
  const h = Math.sin(dA / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function useGPS({ onDistUpdate, onSpdUpdate, onGpsGot, mapRef }) {
  const gpsId = useRef(null);
  const lastGps = useRef(null);
  // gHist stores {t, d} where d is cumulative distance at that point
  const gHist = useRef([]);
  const tPts = useRef([]);
  // cumulative dist ref — caller must keep it in sync via updateDistRef
  const distRef = useRef(0);

  function updateDistRef(v) {
    distRef.current = v;
  }

  function onPos(p) {
    const { latitude: lat, longitude: lon, accuracy: acc, speed: gs } = p.coords;

    mapRef.current?.updMap(lat, lon);
    onGpsGot();

    if (acc > 30) return;

    if (lastGps.current) {
      const d = haversine(lastGps.current.lat, lastGps.current.lon, lat, lon);
      if (d > 1.5 && d < 100) onDistUpdate(d);
    }
    lastGps.current = { lat, lon };
    tPts.current.push([lat, lon]);

    const now = Date.now();
    gHist.current.push({ t: now, d: distRef.current });
    while (gHist.current.length > 1 && now - gHist.current[0].t > 12000) gHist.current.shift();

    let spd = null;
    if (gHist.current.length >= 2) {
      const f = gHist.current[0], l = gHist.current[gHist.current.length - 1];
      const dt = (l.t - f.t) / 1000;
      if (dt > 2) spd = Math.max(0, (l.d - f.d) / dt);
    }
    if (gs != null && gs > 0.3) {
      spd = spd != null ? spd * 0.6 + gs * 0.4 : gs;
    }
    if (spd != null) onSpdUpdate(spd);
  }

  function gpsOn() {
    if (!navigator.geolocation || gpsId.current !== null) return;
    gpsId.current = navigator.geolocation.watchPosition(
      onPos,
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  function gpsOff() {
    if (gpsId.current !== null) {
      navigator.geolocation.clearWatch(gpsId.current);
      gpsId.current = null;
    }
    lastGps.current = null;
  }

  function resetGPS() {
    gpsOff();
    gHist.current = [];
    tPts.current = [];
    distRef.current = 0;
  }

  return { gpsOn, gpsOff, resetGPS, tPts, updateDistRef };
}
