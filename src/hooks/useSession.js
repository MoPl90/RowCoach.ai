import { useState, useRef, useCallback, useEffect } from 'react';
import { useMotionSensor } from './useMotionSensor';
import { useGPS } from './useGPS';
import { useWakeLock } from './useWakeLock';

export function useSession({ mapRef, sensFillRef }) {
  // ── State ──
  const [app, setApp] = useState('idle');
  const [sRate, setSRate] = useState(0);
  const [sCount, setSCount] = useState(0);
  const [tDist, setTDist] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [curSpd, setCurSpd] = useState(0);
  const [sOk, setSok] = useState(false);
  const [sOn, setSOn] = useState(false);
  const [gpsPermOk, setGpsPermOk] = useState(false);
  const [gpsGot, setGpsGot] = useState(false);

  // ── Refs ──
  const runStart = useRef(null);
  const pauseAccum = useRef(0);
  const tickId = useRef(null);
  const decayId = useRef(null);
  const recent = useRef([]);
  const recentStrokeTimes = useRef([]);
  const appRef = useRef('idle');
  const tDistRef = useRef(0);

  function updateApp(val) {
    appRef.current = val;
    setApp(val);
  }

  function updateTDist(delta) {
    tDistRef.current += delta;
    setTDist(tDistRef.current);
    gpsUpdateDistRef(tDistRef.current);
  }

  const { wlOn, wlOff } = useWakeLock();

  // Re-acquire wake lock when tab becomes visible while running
  useEffect(() => {
    function handleVis() {
      if (document.visibilityState === 'visible' && appRef.current === 'running') wlOn();
    }
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  // ── Stroke ──
  const stroke = useCallback((now) => {
    if (appRef.current !== 'running') return;
    const last = recentStrokeTimes.current[recentStrokeTimes.current.length - 1] ?? 0;
    if (now - last < 1200) return;

    recent.current.push(now);
    if (recent.current.length > 8) recent.current.shift();
    recentStrokeTimes.current.push(now);
    if (recentStrokeTimes.current.length > 6) recentStrokeTimes.current.shift();

    setSCount(c => c + 1);

    const flash = document.getElementById('flash');
    if (flash) { flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), 80); }

    if (recent.current.length >= 2) {
      let s = 0;
      for (let i = 1; i < recent.current.length; i++) s += recent.current[i] - recent.current[i - 1];
      setSRate(Math.min(Math.round(60000 / (s / (recent.current.length - 1))), 60));
    }

    clearTimeout(decayId.current);
    decayId.current = setTimeout(() => setSRate(0), 5000);
  }, []);

  // ── Motion sensor ──
  const { sensStart, setSens, currentStrokeSamples, prevStrokeSamples, strokePeak, sOn: sOnRef } = useMotionSensor({
    onStroke: stroke,
    sensFillRef,
  });

  function activateSensor(hasPerm) {
    if (sOnRef.current) return;
    sensStart(hasPerm);
    setSOn(true);
  }

  // ── GPS callbacks ──
  function onDistUpdate(delta) {
    if (appRef.current !== 'running') return;
    updateTDist(delta);
  }

  // Speed comes pre-smoothed from useGPS — set directly, no double-blend
  function onSpdUpdate(spd) {
    if (appRef.current !== 'running') return;
    setCurSpd(spd);
  }

  function onGpsGot() {
    setGpsGot(prev => prev || true);
  }

  const { gpsOn, gpsOff, resetGPS, tPts, updateDistRef: gpsUpdateDistRef } = useGPS({
    onDistUpdate,
    onSpdUpdate,
    onGpsGot,
    mapRef,
  });

  // ── Timer ──
  function tickOn() {
    if (tickId.current) return;
    tickId.current = setInterval(() => {
      if (appRef.current === 'running' && runStart.current) {
        setElapsed(pauseAccum.current + Math.floor((Date.now() - runStart.current) / 1000));
      }
    }, 1000);
  }

  function tickOff() {
    clearInterval(tickId.current);
    tickId.current = null;
  }

  // ── Toggle run ──
  async function toggleRun() {
    const current = appRef.current;

    if (current === 'idle' || current === 'paused') {
      let hasPerm = sOk;
      if (!hasPerm) {
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
          try {
            const p = await DeviceMotionEvent.requestPermission();
            if (p === 'granted') { hasPerm = true; setSok(true); }
          } catch {}
        } else if (window.DeviceMotionEvent) {
          hasPerm = true; setSok(true);
        }
      }
      if (hasPerm) activateSensor(hasPerm);

      if (current === 'idle') {
        runStart.current = Date.now();
        pauseAccum.current = 0;
      } else {
        pauseAccum.current = elapsed;
        runStart.current = Date.now();
      }

      updateApp('running');
      gpsOn();
      tickOn();
      wlOn();
    } else {
      setElapsed(pauseAccum.current + Math.floor((Date.now() - runStart.current) / 1000));
      updateApp('paused');
      gpsOff();
      tickOff();
      wlOff();
    }
  }

  // ── Reset ──
  function doReset() {
    updateApp('idle');
    setSRate(0);
    setSCount(0);
    tDistRef.current = 0;
    setTDist(0);
    setElapsed(0);
    setCurSpd(0);
    runStart.current = null;
    pauseAccum.current = 0;
    recent.current = [];
    recentStrokeTimes.current = [];
    setGpsGot(false);
    resetGPS();
    tickOff();
    wlOff();
    clearTimeout(decayId.current);
  }

  // ── Permission request from overlay ──
  async function requestPermissions() {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const p = await DeviceMotionEvent.requestPermission();
        if (p === 'granted') setSok(true);
      } catch {}
    } else if (window.DeviceMotionEvent) {
      setSok(true);
    }

    if (navigator.geolocation) {
      try {
        await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(
            p => { setGpsPermOk(true); res(p); },
            e => rej(e),
            { enableHighAccuracy: true, timeout: 10000 }
          )
        );
      } catch {}
    }
  }

  return {
    app, sRate, sCount, tDist, elapsed, curSpd,
    sOk, sOn, gpsPermOk, gpsGot,
    toggleRun, doReset, requestPermissions,
    setSens, setCurSpd,
    currentStrokeSamples, prevStrokeSamples, strokePeak,
    stroke,
    tPts,
  };
}
