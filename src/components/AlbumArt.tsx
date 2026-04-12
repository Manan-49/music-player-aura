import { useRef } from 'react';
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

  useVisCanvas(visCvRef, analyserRef, dataArrayRef, freqBinCountRef, audioReadyRef, isPlaying, onMoodData);

  return (
    <div className="album-section">
      <canvas ref={visCvRef} className="vis-canvas" width={310} height={310} />
      <button
        className={`album-art${isPlaying ? ' playing' : ''}`}
        onClick={onTogglePlay}
        aria-label="Play / Pause"
      >
        {currentTrack?.art ? (
          <img src={currentTrack.art} alt="" />
        ) : (
          <span className="art-emoji">🎵</span>
        )}
        <div className="vinyl-ring" />
      </button>
    </div>
  );
}
