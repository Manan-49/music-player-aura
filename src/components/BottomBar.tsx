import type { Track } from '../types';

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function BottomBar({ currentTrack, isPlaying, progress, onTogglePlay, onPrev, onNext }: Props) {
  const title = currentTrack?.title || currentTrack?.name || 'No track';
  const artist = currentTrack?.artist || '—';

  return (
    <div className="bottom-bar">
      <div className="bar-progress" style={{ transform: `scaleX(${progress})` }} />

      <div className="bar-art">
        {currentTrack?.art
          ? <img src={currentTrack.art} alt="" draggable={false} />
          : <span>🎵</span>
        }
      </div>

      <div className="bar-info">
        <div className="bar-title">{title}</div>
        <div className="bar-artist">{artist}</div>
      </div>

      <div className="bar-controls">
        <button className="bar-btn" onClick={onPrev} aria-label="Previous">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 20L9 12l10-8v16z" /><rect x="5" y="4" width="2" height="16" rx="1" />
          </svg>
        </button>
        <button className="bar-btn bar-play" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying
            ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
          }
        </button>
        <button className="bar-btn" onClick={onNext} aria-label="Next">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4z" /><rect x="17" y="4" width="2" height="16" rx="1" />
          </svg>
        </button>
      </div>

      <div className="key-hint">
        <kbd>Space</kbd> play
        <kbd>←→</kbd> seek
        <kbd>Shift+←→</kbd> skip
        <kbd>I</kbd> cinema
      </div>

      <div className={`eq-dots${isPlaying ? '' : ' paused'}`} aria-hidden="true">
        <div className="eq-d" /><div className="eq-d" /><div className="eq-d" />
        <div className="eq-d" /><div className="eq-d" />
      </div>
    </div>
  );
}