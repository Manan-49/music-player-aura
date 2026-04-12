import { useEffect, useRef } from 'react';
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

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

export default function ImmersiveOverlay({
  open,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  progress,
  onClose,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
}: Props) {
  const title = currentTrack?.title || currentTrack?.name || '-';
  const artist = currentTrack?.artist || '-';
  const blurBg = currentTrack?.art ? `url(${currentTrack.art})` : 'none';

  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !overlayRef.current) return;
      const focusables = getFocusable(overlayRef.current);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      lastActiveRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - r.left) / r.width);
  };

  return (
    <div
      ref={overlayRef}
      className="immersive-overlay active"
      role="dialog"
      aria-modal="true"
      aria-label="Immersive player"
    >
      <div className="imm-bg" />
      <div className="imm-blur" style={{ backgroundImage: blurBg }} />
      <div className="imm-vignette" />
      <button ref={closeRef} className="imm-close" onClick={onClose} aria-label="Close immersive player">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
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
          <div className="imm-bar-wrap" onClick={handleBarClick} aria-hidden="true">
            <div className="imm-bar-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <input
            className="imm-seek-range"
            type="range"
            min="0"
            max="1000"
            step="1"
            value={Math.round(progress * 1000)}
            onChange={(e) => onSeek(parseFloat(e.target.value) / 1000)}
            aria-label="Seek position"
          />
          <div className="imm-times">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="imm-controls">
          <button className="imm-ctrl" onClick={onPrev} aria-label="Previous track">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 20L9 12l10-8v16z" />
              <rect x="5" y="4" width="2" height="16" />
            </svg>
          </button>
          <button className="imm-play-btn" onClick={onTogglePlay} aria-label="Play / Pause">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="imm-ctrl" onClick={onNext} aria-label="Next track">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 4l10 8-10 8V4z" />
              <rect x="17" y="4" width="2" height="16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
