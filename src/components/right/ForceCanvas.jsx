import { useRef, useEffect } from 'react';
import { useLang } from '../../context/LangContext';

export default function ForceCanvas({ forceBuf, forceBufIdx, forceMax, recentStrokeTimes, sOk }) {
  const canvasRef = useRef(null);
  const rafIdRef = useRef(null);
  const { t } = useLang();
  const localForceMax = useRef(1);
  // Keep latest sOk in a ref so the RAF loop reads it without needing a restart
  const sOkRef = useRef(sOk);
  sOkRef.current = sOk;

  function drawForce() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const W = r.width, H = r.height;
    if (W === 0 || H === 0) return;

    const dpr = window.devicePixelRatio;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const n = 300;
    const total = forceBufIdx.current;
    const samples = new Float32Array(n);
    let curMax = 0.5;
    for (let i = 0; i < n; i++) {
      const v = forceBuf.current[(total - n + i + n) % n];
      samples[i] = v;
      if (v > curMax) curMax = v;
    }
    localForceMax.current = localForceMax.current * 0.96 + curMax * 0.04;
    const scale = localForceMax.current < 0.1 ? 1 : localForceMax.current;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let g = 1; g < 4; g++) {
      const y = H * (g / 4);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (recentStrokeTimes.current.length > 0) {
      const nowMs = Date.now();
      const msPerSample = 16;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      recentStrokeTimes.current.forEach(ts => {
        const msSince = nowMs - ts;
        const samplesAgo = msSince / msPerSample;
        const x = W - (samplesAgo / n) * W;
        if (x > 0 && x < W) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
      });
    }

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W;
      const y = H - (samples[i] / scale) * (H * 0.88) - H * 0.06;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();

    if (!sOkRef.current) {
      ctx.font = `400 ${Math.max(8, Math.round(W * 0.08))}px 'Barlow',sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('noSensor'), W / 2, H / 2);
    }
  }

  useEffect(() => {
    const loop = () => {
      drawForce();
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []); // loop runs for lifetime of this component; sOkRef provides latest value

  return (
    <canvas
      ref={canvasRef}
      style={{ flex: 1, width: '100%', display: 'block' }}
    />
  );
}
