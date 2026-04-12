import { useRef, useCallback, useEffect } from 'react';
import { cssVar, toRgba } from '../lib/audio';

export function useWaveform(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  waveformData: Float32Array | null,
  progress: number,
) {
  const hoverRatioRef = useRef<number | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameSizeRef = useRef<{ w: number; h: number; key: string }>({ w: 0, h: 0, key: '' });

  const buildLayers = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.offsetWidth * dpr;
    const H = 46 * dpr;
    cv.width = W;
    cv.height = H;

    const mc = cssVar('--mood-accent') || '#7c6aff';
    const mc2 = cssVar('--mood-accent2') || '#ff6ab0';
    const frameKey = `${W}:${H}:${mc}:${mc2}:${waveformData?.length ?? 0}`;
    if (frameSizeRef.current.w === W && frameSizeRef.current.h === H && frameSizeRef.current.key === frameKey) {
      return;
    }
    frameSizeRef.current = { w: W, h: H, key: frameKey };

    const baseLayer = document.createElement('canvas');
    baseLayer.width = W;
    baseLayer.height = H;
    const baseCtx = baseLayer.getContext('2d');
    if (!baseCtx) return;

    const playedLayer = document.createElement('canvas');
    playedLayer.width = W;
    playedLayer.height = H;
    const playedCtx = playedLayer.getContext('2d');
    if (!playedCtx) return;

    if (!waveformData) {
      baseCtx.fillStyle = 'rgba(255,255,255,0.06)';
      baseCtx.fillRect(0, H / 2 - 1, W, 2);
      baseCanvasRef.current = baseLayer;
      playedCanvasRef.current = null;
      return;
    }

    const PTS = waveformData.length;
    const bw = W / PTS;
    const midY = H / 2;
    const grad = playedCtx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, toRgba(mc, 0.92));
    grad.addColorStop(1, toRgba(mc2, 0.72));
    playedCtx.fillStyle = grad;
    baseCtx.fillStyle = 'rgba(255,255,255,0.09)';

    for (let i = 0; i < PTS; i++) {
      const x = i * bw;
      const h = waveformData[i] * midY * 0.88 + 1;
      const bw2 = Math.max(1, bw - 1);
      baseCtx.fillRect(x, midY - h, bw2, h);
      baseCtx.fillRect(x, midY, bw2, h);
      playedCtx.fillRect(x, midY - h, bw2, h);
      playedCtx.fillRect(x, midY, bw2, h);
    }

    baseCanvasRef.current = baseLayer;
    playedCanvasRef.current = playedLayer;
  }, [canvasRef, waveformData]);

  const paint = useCallback((pct: number, hoverRatio?: number | null) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    buildLayers();
    const W = cv.width;
    const H = cv.height;
    ctx.clearRect(0, 0, W, H);

    if (baseCanvasRef.current) ctx.drawImage(baseCanvasRef.current, 0, 0);
    if (playedCanvasRef.current) {
      const clipW = Math.max(0, Math.min(W, pct * W));
      if (clipW > 0) ctx.drawImage(playedCanvasRef.current, 0, 0, clipW, H, 0, 0, clipW, H);
    }

    const px = pct * W;
    ctx.beginPath();
    ctx.moveTo(px, 3);
    ctx.lineTo(px, H - 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
    ctx.stroke();

    if (hoverRatio !== null && hoverRatio !== undefined) {
      const hx = hoverRatio * W;
      const dpr = window.devicePixelRatio || 1;
      ctx.beginPath();
      ctx.moveTo(hx, 3);
      ctx.lineTo(hx, H - 3);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [canvasRef, buildLayers]);

  useEffect(() => {
    paint(progress, hoverRatioRef.current);
  }, [progress, paint, waveformData]);

  useEffect(() => {
    const onResize = () => {
      frameSizeRef.current = { w: 0, h: 0, key: '' };
      paint(progress, hoverRatioRef.current);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [paint, progress]);

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
