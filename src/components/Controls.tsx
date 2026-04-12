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

const PlayIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>;

function VolIcon({ v }: { v: number }) {
  if (v === 0) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
  if (v < 0.5) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
      <path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
    </svg>
  );
}

export default function Controls({
  hasTracks, isPlaying, shuffle, repeat, volume, speedIdx,
  onTogglePlay, onPrev, onNext, onToggleShuffle, onToggleRepeat, onSetVolume, onCycleSpeed,
}: Props) {
  const speed = SPEEDS[speedIdx];

  const handleVolClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const track = e.currentTarget.querySelector('.range-track') as HTMLElement | null;
    if (!track) return;
    const rect  = track.getBoundingClientRect();
    onSetVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, [onSetVolume]);

  return (
    <>
      {/* Transport */}
      <div className="controls">
        <button className={`ctrl-btn${shuffle ? ' active' : ''}`}
          onClick={onToggleShuffle} aria-pressed={shuffle}
          aria-label="Shuffle" title="Shuffle (S)" disabled={!hasTracks}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
        </button>

        <button className="ctrl-btn" onClick={onPrev}
          aria-label="Previous" title="Prev (Shift+←)" disabled={!hasTracks}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 20L9 12l10-8v16z"/><rect x="5" y="4" width="2" height="16" rx="1"/>
          </svg>
        </button>

        <button className="play-btn" onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'} disabled={!hasTracks}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button className="ctrl-btn" onClick={onNext}
          aria-label="Next" title="Next (Shift+→)" disabled={!hasTracks}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4z"/><rect x="17" y="4" width="2" height="16" rx="1"/>
          </svg>
        </button>

        <button className={`ctrl-btn${repeat ? ' active' : ''}`}
          onClick={onToggleRepeat} aria-pressed={repeat}
          aria-label="Repeat" title="Repeat (R)" disabled={!hasTracks}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 014-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 01-4 4H3"/>
          </svg>
        </button>
      </div>

      {/* Volume + speed */}
      <div className="btm-controls">
        <div className="vol-group" onClick={handleVolClick}>
          <span className="vol-icon"><VolIcon v={volume} /></span>
          <div className="range-track">
            <div className="range-fill" style={{ width:`${volume * 100}%` }} />
            <input type="range" min="0" max="1" step="0.01" value={volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              aria-label="Volume" disabled={!hasTracks} />
          </div>
        </div>

        <button className="speed-btn" onClick={onCycleSpeed}
          title="Speed" disabled={!hasTracks}>
          {speed}×
        </button>
      </div>
    </>
  );
}