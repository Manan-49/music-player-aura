import { useCallback } from 'react';
import { SPEEDS } from '../types';

interface Props {
  hasTracks: boolean;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: boolean;
  volume: number;
  speedIdx: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onSetVolume: (v: number) => void;
  onCycleSpeed: () => void;
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="4" width="4" height="16" rx="1" />
    <rect x="15" y="4" width="4" height="16" rx="1" />
  </svg>
);

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" />
        <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (volume < 0.5) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

export default function Controls({
  hasTracks,
  isPlaying,
  shuffle,
  repeat,
  volume,
  speedIdx,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onSetVolume,
  onCycleSpeed,
}: Props) {
  const speed = SPEEDS[speedIdx];

  const handleVolumeInteraction = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const track = e.currentTarget.querySelector('.range-track') as HTMLElement | null;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSetVolume(ratio);
    },
    [onSetVolume],
  );

  return (
    <>
      <div className="controls">
        <button
          className={`ctrl-btn${shuffle ? ' active' : ''}`}
          title="Shuffle (S)"
          onClick={onToggleShuffle}
          aria-label="Toggle shuffle"
          aria-pressed={shuffle}
          disabled={!hasTracks}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
          </svg>
        </button>

        <button
          className="ctrl-btn"
          onClick={onPrev}
          title="Previous (Shift+Left)"
          aria-label="Previous track"
          disabled={!hasTracks}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 20L9 12l10-8v16z" />
            <rect x="5" y="4" width="2" height="16" rx="1" />
          </svg>
        </button>

        <button className="play-btn" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} disabled={!hasTracks}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          className="ctrl-btn"
          onClick={onNext}
          title="Next (Shift+Right)"
          aria-label="Next track"
          disabled={!hasTracks}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4z" />
            <rect x="17" y="4" width="2" height="16" rx="1" />
          </svg>
        </button>

        <button
          className={`ctrl-btn${repeat ? ' active' : ''}`}
          title="Repeat (R)"
          onClick={onToggleRepeat}
          aria-label="Toggle repeat"
          aria-pressed={repeat}
          disabled={!hasTracks}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
        </button>
      </div>

      <div className="bottom-controls">
        <div className="vol-group" onClick={handleVolumeInteraction}>
          <span className="vol-icon">
            <VolumeIcon volume={volume} />
          </span>
          <div className="range-track">
            <div className="range-fill" style={{ width: `${volume * 100}%` }} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              disabled={!hasTracks}
            />
          </div>
        </div>
        <button
          className="speed-btn"
          onClick={onCycleSpeed}
          title="Playback speed"
          aria-label={`Playback speed: ${speed}x`}
          disabled={!hasTracks}
        >
          {speed}×
        </button>
      </div>
    </>
  );
}