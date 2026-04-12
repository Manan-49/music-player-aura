import { useRef } from 'react';
import { useAmbientCanvas } from '../hooks/useAmbientCanvas';
import type { Mood } from '../types';

interface Props {
  mood: Mood;
}

export default function AmbientCanvas({ mood }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useAmbientCanvas(canvasRef, mood);
  return <canvas ref={canvasRef} className="ambient-canvas" />;
}
