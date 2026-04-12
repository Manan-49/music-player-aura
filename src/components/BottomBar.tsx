import type { Track } from '../types';

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function BottomBar({
  currentTrack,
  isPlaying,
  progress,
  onTogglePlay,
  onPrev,
  onNext,
}: Props) {
  const title = currentTrack?.title || currentTrack?.name || 'No track';
  const artist = currentTrack?.artist || '-';

  return (
    <div className="bottom-bar">
      <div className="bar-progress" style={{ transform: `scaleX(${progress})` }} />
      <div className="bar-art">
        {currentTrack?.art ? (
          <img src={currentTrack.art} alt="" draggable={false} />
        ) : (
          <span>🎵</span>
        )}
      </div>
      <div className="bar-info">
        <div className="bar-title">{title}</div>
        <div className="bar-artist">{artist}</div>
      </div>

      <div className="bar-controls">
        <button className="bar-ctrl-btn" onClick={onPrev} aria-label="Previous track">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
        </button>
        <button className="bar-ctrl-btn bar-play-btn" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button className="bar-ctrl-btn" onClick={onNext} aria-label="Next track">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
        </button>
      </div>

      <div className="key-hint">
        <kbd>Space</kbd> play&nbsp;&nbsp;
        <kbd>←→</kbd> seek&nbsp;&nbsp;
        <kbd>Shift+←→</kbd> skip&nbsp;&nbsp;
        <kbd>↑↓</kbd> vol&nbsp;&nbsp;
        <kbd>I</kbd> immersive&nbsp;&nbsp;
        <kbd>L</kbd> like
      </div>

      <div className={`eq-dots${isPlaying ? '' : ' paused'}`}>
        <div className="eq-d" />
        <div className="eq-d" />
        <div className="eq-d" />
        <div className="eq-d" />
        <div className="eq-d" />
      </div>
    </div>
  );
}