import { useRef } from 'react';

function haversine(a1, o1, a2, o2) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dA = r(a2 - a1), dO = r(o2 - o1);
  const h = Math.sin(dA / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const MIN_STEP = 4;     // m — never count steps smaller than this
const MAX_SPEED = 10;   // m/s — faster implied speed is a GPS glitch, not a boat
const MAX_REJECTS = 3;  // consecutive glitches before re-anchoring

export function useGPS({ onDistUpdate, onSpdUpdate, onGpsGot, onRaw, mapRef }) {
  const gpsId = useRef(null);
  const lastGps = useRef(null);
  const rejects = useRef(0);
  // gHist stores {t, lat, lon} of recent fixes; speed = straight-line displacement over the window
  const gHist = useRef([]);
  const tPts = useRef([]);

  function onPos(p) {
    const { latitude: lat, longitude: lon, accuracy: acc, speed: gs } = p.coords;
    onRaw?.(lat, lon, acc, gs);

    onGpsGot();

    if (acc > 30) return;

    mapRef.current?.updMap(lat, lon);

    // lastGps is the last *counted* position: small steps accumulate until the
    // boat has clearly moved beyond GPS jitter, instead of being discarded.
    if (!lastGps.current) {
      lastGps.current = { lat, lon, t: p.timestamp };
    } else {
      const d = haversine(lastGps.current.lat, lastGps.current.lon, lat, lon);
      const dt = (p.timestamp - lastGps.current.t) / 1000;
      if (d >= Math.max(MIN_STEP, 2 * acc)) {
        if (dt > 0 && d / dt <= MAX_SPEED) {
          onDistUpdate(d);
          lastGps.current = { lat, lon, t: p.timestamp };
          rejects.current = 0;
        } else if (++rejects.current >= MAX_REJECTS) {
          // Persistent "jumps" mean the anchor itself was bad: re-anchor without counting
          lastGps.current = { lat, lon, t: p.timestamp };
          rejects.current = 0;
        }
      }
    }
    tPts.current.push([lat, lon]);

    const now = p.timestamp;
    gHist.current.push({ t: now, lat, lon });
    while (gHist.current.length > 1 && now - gHist.current[0].t > 12000) gHist.current.shift();

    let spd = null;
    if (gHist.current.length >= 2) {
      const f = gHist.current[0], l = gHist.current[gHist.current.length - 1];
      const dt = (l.t - f.t) / 1000;
      if (dt > 2) spd = haversine(f.lat, f.lon, l.lat, l.lon) / dt;
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
    rejects.current = 0;
  }

  function resetGPS() {
    gpsOff();
    gHist.current = [];
    tPts.current = [];
  }

  return { gpsOn, gpsOff, resetGPS, tPts };
}
