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
  currentTrack, isPlaying, analyserRef, dataArrayRef,
  freqBinCountRef, audioReadyRef, onTogglePlay, onMoodData,
}: Props) {
  const visCvRef = useRef<HTMLCanvasElement>(null);
  const secRef = useRef<HTMLDivElement>(null);
  const [cvSize, setCvSize] = useState(340);

  useEffect(() => {
    const measure = () => {
      const art = secRef.current?.querySelector('.album-art') as HTMLElement | null;
      if (art) {
        const { width, height } = art.getBoundingClientRect();
        setCvSize(Math.round(Math.max(width, height) * 1.72));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (secRef.current) ro.observe(secRef.current);
    return () => ro.disconnect();
  }, []);

  useVisCanvas(visCvRef, analyserRef, dataArrayRef, freqBinCountRef, audioReadyRef, isPlaying, onMoodData);

  return (
    <div className="album-section" ref={secRef}>
      <canvas ref={visCvRef} className="vis-canvas"
        width={cvSize} height={cvSize} aria-hidden="true" />

      <button
        className={`album-art${isPlaying ? ' playing' : ''}`}
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {currentTrack?.art
          ? <img src={currentTrack.art} alt="" draggable={false} />
          : <span className="art-emoji">🎵</span>
        }

        {/* Hover overlay */}
        <div className="art-overlay" aria-hidden="true">
          {isPlaying
            ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
          }
        </div>

        <div className="vinyl-ring" />
      </button>
    </div>
  );
}