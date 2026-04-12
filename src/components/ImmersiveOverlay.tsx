import { useEffect, useRef, useCallback } from 'react';
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

const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1" /><rect x="15" y="4" width="4" height="16" rx="1" /></svg>;

function focusable(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(
    'button,[href],input,select,[tabindex]:not([tabindex="-1"])',
  )).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
}

export default function ImmersiveOverlay({
  open, currentTrack, isPlaying, currentTime, duration, progress,
  onClose, onTogglePlay, onPrev, onNext, onSeek,
}: Props) {
  const title = currentTrack?.title || currentTrack?.name || '—';
  const artist = currentTrack?.artist || '—';

  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActive.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !overlayRef.current) return;
      const items = focusable(overlayRef.current);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const cur = document.activeElement as HTMLElement;
      if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); lastActive.current?.focus(); };
  }, [open, onClose]);

  const r = useCallback((clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  if (!open) return null;

  return (
    <div ref={overlayRef} className="immersive-overlay"
      role="dialog" aria-modal="true" aria-label="Cinema player">
      <div className="imm-bg" />
      <div className="imm-blur" style={{ backgroundImage: currentTrack?.art ? `url(${currentTrack.art})` : 'none' }} />
      <div className="imm-vignette" />

      <button ref={closeRef} className="imm-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="imm-content">
        <div className="imm-art">
          {currentTrack?.art
            ? <img src={currentTrack.art} alt="" draggable={false} />
            : <span>🎵</span>
          }
        </div>

        <div className="imm-info">
          <div className="imm-title">{title}</div>
          <div className="imm-artist">{artist}</div>
        </div>

        <div className="imm-progress">
          <div className="imm-bar-wrap"
            onClick={(e) => onSeek(r(e.clientX, e.currentTarget))}
            onTouchStart={(e) => { if (e.touches.length === 1) onSeek(r(e.touches[0].clientX, e.currentTarget)); }}
            onTouchMove={(e) => { if (e.touches.length === 1) onSeek(r(e.touches[0].clientX, e.currentTarget)); }}>
            <div className="imm-bar-fill" style={{ width: `${progress * 100}%` }} />
            <input className="imm-seek-range" type="range" min="0" max="1000" step="1"
              value={Math.round(progress * 1000)}
              onChange={(e) => onSeek(parseFloat(e.target.value) / 1000)}
              aria-label="Seek"
            />
          </div>
          <div className="imm-times">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="imm-controls">
          <button className="imm-ctrl" onClick={onPrev} aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 20L9 12l10-8v16z" /><rect x="5" y="4" width="2" height="16" rx="1" />
            </svg>
          </button>
          <button className="imm-play-btn" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="imm-ctrl" onClick={onNext} aria-label="Next">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 4l10 8-10 8V4z" /><rect x="17" y="4" width="2" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}