import { useRef, useEffect } from 'react';
import { useLang } from '../../context/LangContext';

const DEFAULT_EXPECTED_LEN = 180; // ~3s at 60Hz

function smoothArr(arr, w = 3) {
  if (arr.length < 2) return arr;
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(arr.length - 1, i + w); j++) {
      sum += arr[j]; count++;
    }
    out[i] = sum / count;
  }
  return out;
}

function drawCurve(ctx, samples, totalLen, l, t, w, h, peak, strokeStyle, fillStyle, lineWidth) {
  if (samples.length < 2) return;
  const sm = smoothArr(samples);
  const scaleY = h / (peak * 1.1);
  ctx.beginPath();
  for (let i = 0; i < sm.length; i++) {
    const x = l + (i / Math.max(totalLen - 1, 1)) * w;
    const y = t + h - sm[i] * scaleY;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.stroke();
  const lastX = l + ((sm.length - 1) / Math.max(totalLen - 1, 1)) * w;
  ctx.lineTo(lastX, t + h);
  ctx.lineTo(l, t + h);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

export default function ForceCanvas({ currentStrokeSamples, prevStrokeSamples, strokePeak, sOk }) {
  const canvasRef = useRef(null);
  const rafIdRef = useRef(null);
  const { t } = useLang();
  const sOkRef = useRef(sOk);
  sOkRef.current = sOk;

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const W = r.width, H = r.height;
    if (W === 0 || H === 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const ml = W * 0.04, mr = W * 0.04;
    const mt = H * 0.06, mb = H * 0.10;
    const iW = W - ml - mr, iH = H - mt - mb;

    const peak = Math.max(strokePeak.current, 1);
    const prev = prevStrokeSamples.current;
    const curr = currentStrokeSamples.current;
    const expectedLen = prev.length > 0 ? prev.length : DEFAULT_EXPECTED_LEN;

    // Baseline
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ml, mt + iH);
    ctx.lineTo(ml + iW, mt + iH);
    ctx.stroke();

    // Horizontal gridlines at 25%, 50%, 75% of peak
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (const frac of [0.25, 0.5, 0.75]) {
      const y = mt + iH - (frac / 1.1) * iH;
      ctx.beginPath();
      ctx.moveTo(ml, y);
      ctx.lineTo(ml + iW, y);
      ctx.stroke();
    }

    // Previous stroke — ghost
    if (prev.length > 1) {
      drawCurve(ctx, prev, prev.length, ml, mt, iW, iH, peak,
        'rgba(255,255,255,0.22)', 'rgba(255,255,255,0.03)', 1);
    }

    // Current stroke — live, builds from left
    if (curr.length > 1) {
      drawCurve(ctx, curr, expectedLen, ml, mt, iW, iH, peak,
        'rgba(255,255,255,0.90)', 'rgba(255,255,255,0.07)', 1.5);
    }

    // No sensor message
    if (!sOkRef.current) {
      ctx.font = `400 ${Math.max(8, Math.round(W * 0.08))}px 'Barlow',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('noSensor'), W / 2, H / 2);
    }
  }

  useEffect(() => {
    const loop = () => { draw(); rafIdRef.current = requestAnimationFrame(loop); };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas ref={canvasRef} style={{ flex: 1, width: '100%', display: 'block' }} />
  );
}
