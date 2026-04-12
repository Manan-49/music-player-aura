import { useEffect, useRef } from 'react';
import { cssVar, toRgba } from '../lib/audio';
import type { Mood } from '../types';

function drawIdleRing(ctx: CanvasRenderingContext2D, W: number, H: number, idleT: number) {
  const cx = W / 2, cy = H / 2;
  const r = 88 + Math.sin(idleT) * 4;
  const mc = cssVar('--mood-accent') || '#7c6aff';
  const g = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 20);
  g.addColorStop(0, toRgba(mc, 0.07));
  g.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

export function useVisCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  analyserRef: React.RefObject<AnalyserNode | null>,
  dataArrayRef: React.RefObject<Uint8Array | null>,
  freqBinCountRef: React.RefObject<number>,
  audioReadyRef: React.RefObject<boolean>,
  isPlaying: boolean,
  onMoodData?: (data: Uint8Array) => void,
) {
  const idleTRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);

      if (!audioReadyRef.current || !isPlaying || !analyserRef.current || !dataArrayRef.current) {
        idleTRef.current += 0.018;
        drawIdleRing(ctx, W, H, idleTRef.current);
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      if (onMoodData) onMoodData(dataArrayRef.current);

      const cx = W / 2, cy = H / 2;
      const artR = 88;
      const BARS = 120;
      const step = Math.floor(freqBinCountRef.current / BARS);
      const data = dataArrayRef.current;

      let bs = 0;
      for (let b = 0; b < 8; b++) bs += data[b];
      const bassE = bs / (8 * 255);

      const mc = cssVar('--mood-accent') || '#7c6aff';
      const mc2 = cssVar('--mood-accent2') || '#ff6ab0';

      const g0 = ctx.createRadialGradient(cx, cy, artR, cx, cy, artR + 60);
      g0.addColorStop(0, toRgba(mc, 0.1 + bassE * 0.22));
      g0.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, artR + 60, 0, Math.PI * 2);
      ctx.fillStyle = g0;
      ctx.fill();

      for (let i = 0; i < BARS; i++) {
        const val = data[i * step] / 255;
        const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        const iR = artR + 5;
        const bh = val * 55 + 2;
        const x1 = cx + Math.cos(angle) * iR;
        const y1 = cy + Math.sin(angle) * iR;
        const x2 = cx + Math.cos(angle) * (iR + bh);
        const y2 = cy + Math.sin(angle) * (iR + bh);
        const frac = i / BARS;
        const col = frac < 0.25 ? mc : frac < 0.6 ? mc2 : '#6affda';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = toRgba(col, 0.45 + val * 0.55);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, artR);
      g1.addColorStop(0, toRgba(mc, bassE * 0.18));
      g1.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, artR, 0, Math.PI * 2);
      ctx.fillStyle = g1;
      ctx.fill();
    };

    loop();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [canvasRef, analyserRef, dataArrayRef, freqBinCountRef, audioReadyRef, isPlaying, onMoodData]);
}
