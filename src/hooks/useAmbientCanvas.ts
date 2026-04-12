import { useEffect, useRef } from 'react';
import type { Mood } from '../types';

const AMB_ORBS = [
  { x: 0.15, y: 0.20, r: 0.55, h: 250, s: 70, l: 52 },
  { x: 0.85, y: 0.78, r: 0.48, h: 320, s: 62, l: 50 },
  { x: 0.50, y: 0.50, r: 0.38, h: 180, s: 66, l: 54 },
];

const MOOD_PALETTES: Record<Mood, [number, number, number][]> = {
  standby:     [[250, 70, 52], [320, 62, 50], [180, 66, 54]],
  calm:        [[165, 80, 55], [200, 72, 54], [140, 76, 54]],
  energetic:   [[330, 88, 60], [20,  90, 60], [0,  82, 55]],
  melancholic: [[220, 72, 50], [250, 66, 50], [200, 62, 54]],
  euphoric:    [[45,  95, 65], [30,  90, 60], [60, 86, 60]],
};

export function useAmbientCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, mood: Mood) {
  const orbsRef = useRef(AMB_ORBS.map((o) => ({ ...o })));
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const palette = MOOD_PALETTES[mood] || MOOD_PALETTES.standby;
    for (let i = 0; i < orbsRef.current.length; i++) {
      orbsRef.current[i].h = palette[i][0];
      orbsRef.current[i].s = palette[i][1];
      orbsRef.current[i].l = palette[i][2];
    }
  }, [mood]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = reduceMotion ? 0.001 : 0.0025;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (document.visibilityState === 'hidden') return;
      tRef.current += speed;
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < orbsRef.current.length; i++) {
        const o = orbsRef.current[i];
        const ox = o.x * W + Math.sin(tRef.current + i * 1.3) * W * 0.08;
        const oy = o.y * H + Math.cos(tRef.current + i * 0.9) * H * 0.06;
        const r = o.r * Math.min(W, H);
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        g.addColorStop(0, `hsla(${o.h},${o.s}%,${o.l}%,.14)`);
        g.addColorStop(0.5, `hsla(${o.h},${o.s}%,${o.l}%,.05)`);
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    };
    loop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}
