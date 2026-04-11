import { useRef } from 'react';
import { useVisCanvas } from '../hooks/useVisCanvas';
import type { Track } from '../types';

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  analyserRef: React.RefObject<AnalyserNode | null>;
  dataArrayRef: React.RefObject<Uint8Array | null>;
  freqBinCountRef: React.RefObject<number>;
  audioReadyRef: React.RefObject<boolean>;
  onTogglePlay: () => void;
  onMoodData?: (data: Uint8Array) => void;
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

  useVisCanvas(visCvRef, analyserRef, dataArrayRef, freqBinCountRef, audioReadyRef, isPlaying, onMoodData);

  return (
    <div className="album-section">
      <canvas ref={visCvRef} className="vis-canvas" width={310} height={310} />
      <div
        className={`album-art${isPlaying ? ' playing' : ''}`}
        onClick={onTogglePlay}
        role="button"
        tabIndex={0}
        aria-label="Play / Pause"
        onKeyDown={(e) => e.code === 'Space' && onTogglePlay()}
      >
        {currentTrack?.art ? (
          <img src={currentTrack.art} alt="" />
        ) : (
          <span className="art-emoji">🎵</span>
        )}
        <div className="vinyl-ring" />
      </div>
    </div>
  );
}
