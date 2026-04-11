import { useRef, useCallback, useEffect } from 'react';
import { cssVar, toRgba } from '../lib/audio';

export function useWaveform(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  waveformData: Float32Array | null,
  progress: number,
) {
  const hoverRatioRef = useRef<number | null>(null);

  const paint = useCallback((pct: number, hoverRatio?: number | null) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = cv.offsetWidth * dpr;
    const H = 46 * dpr;
    cv.width = W;
    cv.height = H;
    ctx.clearRect(0, 0, W, H);

    if (!waveformData) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, H / 2 - 1, W, 2);
      return;
    }

    const mc = cssVar('--mood-accent') || '#7c6aff';
    const mc2 = cssVar('--mood-accent2') || '#ff6ab0';
    const PTS = waveformData.length;
    const bw = W / PTS;
    const midY = H / 2;

    for (let i = 0; i < PTS; i++) {
      const x = i * bw;
      const h = waveformData[i] * midY * 0.88 + 1;
      const played = i / PTS <= pct;
      if (played) {
        const g = ctx.createLinearGradient(0, midY - h, 0, midY + h);
        g.addColorStop(0, toRgba(mc, 0.92));
        g.addColorStop(1, toRgba(mc2, 0.72));
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.09)';
      }
      const bw2 = Math.max(1, bw - 1);
      ctx.fillRect(x, midY - h, bw2, h);
      ctx.fillRect(x, midY, bw2, h);
    }

    const px = pct * W;
    ctx.beginPath();
    ctx.moveTo(px, 3);
    ctx.lineTo(px, H - 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    if (hoverRatio !== null && hoverRatio !== undefined) {
      const hx = hoverRatio * W;
      ctx.beginPath();
      ctx.moveTo(hx, 3);
      ctx.lineTo(hx, H - 3);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [canvasRef, waveformData]);

  useEffect(() => {
    paint(progress, hoverRatioRef.current);
  }, [progress, paint, waveformData]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    hoverRatioRef.current = ratio;
    paint(progress, ratio);
  }, [canvasRef, paint, progress]);

  const onMouseLeave = useCallback(() => {
    hoverRatioRef.current = null;
    paint(progress, null);
  }, [paint, progress]);

  return { onMouseMove, onMouseLeave };
}
