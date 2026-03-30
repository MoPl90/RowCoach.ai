import { useRef } from 'react';

const MAX_STROKE_SAMPLES = 600; // up to ~10s at 60Hz

export function useMotionSensor({ onStroke, sensFillRef }) {
  const smoothed = useRef(0);
  const isAbove = useRef(false);
  const lastVis = useRef(0);
  const sOn = useRef(false);
  const sensRef = useRef(3);

  const currentStrokeSamples = useRef([]);
  const prevStrokeSamples = useRef([]);
  const strokePeak = useRef(1);

  function onMot(e) {
    const a = e.acceleration || e.accelerationIncludingGravity;
    if (!a) return;
    let mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    if (!e.acceleration) mag = Math.abs(mag - 9.81);

    smoothed.current = 0.3 * mag + 0.7 * smoothed.current;

    if (currentStrokeSamples.current.length < MAX_STROKE_SAMPLES) {
      currentStrokeSamples.current.push(mag);
    }
    if (smoothed.current > strokePeak.current) strokePeak.current = smoothed.current;

    const now = Date.now();
    if (now - lastVis.current > 80) {
      lastVis.current = now;
      if (sensFillRef.current) {
        sensFillRef.current.style.width =
          Math.min(100, (smoothed.current / (sensRef.current * 2)) * 100) + '%';
      }
    }

    if (!isAbove.current && smoothed.current > sensRef.current) {
      isAbove.current = true;
      if (currentStrokeSamples.current.length > 10) {
        prevStrokeSamples.current = currentStrokeSamples.current;
        strokePeak.current = strokePeak.current * 0.998;
      }
      currentStrokeSamples.current = [];
      onStroke(now);
    } else if (isAbove.current && smoothed.current < sensRef.current * 0.4) {
      isAbove.current = false;
    }
  }

  function sensStart(hasPerm) {
    if (sOn.current || !hasPerm) return;
    window.addEventListener('devicemotion', onMot);
    sOn.current = true;
  }

  function sensStop() {
    if (!sOn.current) return;
    window.removeEventListener('devicemotion', onMot);
    sOn.current = false;
  }

  function setSens(v) {
    sensRef.current = v;
  }

  return { sensStart, sensStop, setSens, currentStrokeSamples, prevStrokeSamples, strokePeak, sOn };
}
