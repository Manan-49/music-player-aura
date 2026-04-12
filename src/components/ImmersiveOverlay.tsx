import { fmt } from '../lib/audio';
import type { Track } from '../types';

interface Props {
  open: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (ratio: number) => void;
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

export default function ImmersiveOverlay({
  open, currentTrack, isPlaying, currentTime, duration, progress,
  onClose, onTogglePlay, onPrev, onNext, onSeek,
}: Props) {
  const title = currentTrack?.title || currentTrack?.name || '–';
  const artist = currentTrack?.artist || '–';
  const blurBg = currentTrack?.art ? `url(${currentTrack.art})` : 'none';

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - r.left) / r.width);
  };

  return (
    <div className={`immersive-overlay${open ? ' active' : ''}`}>
      <div className="imm-bg" />
      <div className="imm-blur" style={{ backgroundImage: blurBg }} />
      <div className="imm-vignette" />
      <div className="imm-close" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
      <div className="imm-content">
        <div className="imm-art">
          {currentTrack?.art ? (
            <img src={currentTrack.art} alt="" />
          ) : (
            <span>🎵</span>
          )}
        </div>
        <div className="imm-info">
          <div className="imm-title">{title}</div>
          <div className="imm-artist">{artist}</div>
        </div>
        <div className="imm-progress">
          <div className="imm-bar-wrap" onClick={handleBarClick}>
            <div className="imm-bar-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="imm-times">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="imm-controls">
          <div className="imm-ctrl" onClick={onPrev}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 20L9 12l10-8v16z" />
              <rect x="5" y="4" width="2" height="16" />
            </svg>
          </div>
          <button className="imm-play-btn" onClick={onTogglePlay}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div className="imm-ctrl" onClick={onNext}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 4l10 8-10 8V4z" />
              <rect x="17" y="4" width="2" height="16" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
