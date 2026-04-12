import { useRef, useEffect, useState } from 'react';
import { useVisCanvas } from '../hooks/useVisCanvas';
import type { Track } from '../types';

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  analyserRef: React.RefObject<AnalyserNode | null>;
  dataArrayRef: React.RefObject<Uint8Array<ArrayBuffer> | null>;
  freqBinCountRef: React.RefObject<number>;
  audioReadyRef: React.RefObject<boolean>;
  onTogglePlay: () => void;
  onMoodData?: (data: Uint8Array<ArrayBuffer>) => void;
}

export default function AlbumArt({
  currentTrack,
  isPlaying,
  analyserRef,
  dataArrayRef,
  freqBinCountRef,
  audioReadyRef,
  onTogglePlay,
  onMoodData,
}: Props) {
  const visCvRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(310);

  useEffect(() => {
    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const artEl = el.querySelector('.album-art') as HTMLElement | null;
      if (artEl) {
        const rect = artEl.getBoundingClientRect();
        setCanvasSize(Math.round(Math.max(rect.width, rect.height) * 1.65));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useVisCanvas(visCvRef, analyserRef, dataArrayRef, freqBinCountRef, audioReadyRef, isPlaying, onMoodData);

  return (
    <div className="album-section" ref={sectionRef}>
      <canvas
        ref={visCvRef}
        className="vis-canvas"
        width={canvasSize}
        height={canvasSize}
        aria-hidden="true"
      />
      <button
        className={`album-art${isPlaying ? ' playing' : ''}`}
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {currentTrack?.art ? (
          <img src={currentTrack.art} alt="" draggable={false} />
        ) : (
          <span className="art-emoji">🎵</span>
        )}
        <div className="vinyl-ring" />
      </button>
    </div>
  );
}