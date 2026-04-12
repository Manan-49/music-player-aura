import type { Track } from '../types';

interface Props {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  miniMode: boolean;
  onToggleMini: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function BottomBar({
  currentTrack,
  isPlaying,
  progress,
  miniMode,
  onToggleMini,
  onTogglePlay,
  onPrev,
  onNext,
}: Props) {
  const title = currentTrack?.title || currentTrack?.name || 'No track';
  const artist = currentTrack?.artist || '-';

  return (
    <div className="bottom-bar">
      <div className="mini-progress" style={{ transform: `scaleX(${progress})` }} />
      <div className="mini-art">
        {currentTrack?.art ? (
          <img src={currentTrack.art} alt="" />
        ) : (
          <span>🎵</span>
        )}
      </div>
      <div className="mini-info">
        <div className="mini-title">{title}</div>
        <div className="mini-artist">{artist}</div>
      </div>

      {miniMode ? (
        <div className="mini-mode-controls">
          <button className="mini-btn" onClick={onPrev} aria-label="Previous track">◀</button>
          <button className="mini-btn mini-play" onClick={onTogglePlay} aria-label="Play / Pause">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="mini-btn" onClick={onNext} aria-label="Next track">▶</button>
          <button className="mini-btn mini-exit" onClick={onToggleMini} aria-label="Exit mini mode">Exit</button>
        </div>
      ) : (
        <div className="key-hint">
          <kbd>Space</kbd> play &nbsp;
          <kbd>←→</kbd> seek &nbsp;
          <kbd>Shift+←→</kbd> skip &nbsp;
          <kbd>↑↓</kbd> vol &nbsp;
          <kbd>I</kbd> immersive &nbsp;
          <kbd>L</kbd> like &nbsp;
          <kbd>M</kbd> mini
        </div>
      )}

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
