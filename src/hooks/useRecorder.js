import { useRef } from 'react';

// Raw session log for offline replay / threshold tuning.
// Times are ms since the session start; `startedAt` gives the absolute anchor.
const r3 = v => (v == null ? null : Math.round(v * 1000) / 1000);

export function useRecorder() {
  const rec = useRef(null);

  function begin(meta) {
    const t0 = Date.now();
    rec.current = {
      version: 1,
      startedAt: new Date(t0).toISOString(),
      t0,
      meta: { userAgent: navigator.userAgent, ...meta },
      // [t, x, y, z, withGravity (0|1)]
      motion: [],
      // [t, lat, lon, accuracy, speed]
      gps: [],
      // [t] — strokes accepted by the stroke-rate logic
      strokes: [],
      // [t, type, value]
      events: [],
    };
  }

  function rel() {
    return Date.now() - rec.current.t0;
  }

  function motion(x, y, z, withGravity) {
    if (!rec.current) return;
    rec.current.motion.push([rel(), r3(x), r3(y), r3(z), withGravity ? 1 : 0]);
  }

  function gps(lat, lon, acc, speed) {
    if (!rec.current) return;
    rec.current.gps.push([rel(), lat, lon, r3(acc), r3(speed)]);
  }

  function stroke(now) {
    if (!rec.current) return;
    rec.current.strokes.push([now - rec.current.t0]);
  }

  function event(type, value = null) {
    if (!rec.current) return;
    rec.current.events.push([rel(), type, value]);
  }

  function download() {
    if (!rec.current) return;
    const { t0: _t0, ...data } = rec.current;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `row-pacer-${data.startedAt.slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  return { begin, motion, gps, stroke, event, download };
}
