import { useEffect, useRef, useState } from 'react';
import { MOODS } from '../types';
import type { Mood } from '../types';

interface Props {
  mood: Mood;
  playlists: Record<string, string[]>;
  activePlaylist: string;
  onAddFiles: (files: File[]) => void;
  onSavePlaylist: () => void;
  onLoadPlaylist: (name: string) => void;
  onToggleImmersive: () => void;
  mobileQueueOpen: boolean;
  onToggleMobileQueue: () => void;
}

export default function Header({
  mood, playlists, activePlaylist, onAddFiles, onSavePlaylist,
  onLoadPlaylist, onToggleImmersive, mobileQueueOpen, onToggleMobileQueue,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = MOODS[mood];

  useEffect(() => {
    if (!menuOpen) return;
    const away = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [menuOpen]);

  return (
    <header className="header">
      {/* Logo */}
      <div className="logo">
        <div className="logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <span className="logo-word">aura<span>.</span></span>
      </div>

      {/* Mood pill */}
      <div className="header-center">
        <div className="mood-pill">
          <div className="mood-dot" />
          <span>{cfg.icon}</span>
          <span className="mood-name">{cfg.label}</span>
        </div>
      </div>

      {/* Right */}
      <div className="header-right">
        {/* Mobile queue toggle */}
        <button
          className={`hdr-btn hdr-queue-btn${mobileQueueOpen ? ' active' : ''}`}
          onClick={onToggleMobileQueue}
          aria-label={mobileQueueOpen ? 'Close queue' : 'Open queue'}
          title="Queue"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="14" y2="18" />
          </svg>
          <span className="hdr-btn-label">Queue</span>
        </button>

        {/* Playlist selector */}
        <select
          className="playlist-select"
          value={activePlaylist}
          onChange={(e) => onLoadPlaylist(e.target.value)}
          aria-label="Playlists"
        >
          <option value="Library">Library</option>
          {Object.keys(playlists).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* Add music */}
        <button className="hdr-btn" onClick={() => fileRef.current?.click()} title="Add music">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          <span className="hdr-btn-label">Add</span>
        </button>

        <div className="hdr-div" />

        {/* Desktop secondary */}
        <div className="hdr-secondary" style={{ display: 'inline-flex', gap: 5 }}>
          <button className="hdr-btn" onClick={onSavePlaylist} title="Save playlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span className="hdr-btn-label">Save</span>
          </button>
          <button className="hdr-btn" onClick={onToggleImmersive} title="Immersive (I)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
            </svg>
            <span className="hdr-btn-label">Cinema</span>
          </button>
        </div>

        {/* Overflow menu */}
        <div className="hdr-menu" ref={menuRef}>
          <button
            className={`hdr-btn hdr-btn-icon${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="More"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          <div className={`hdr-menu-popover${menuOpen ? ' open' : ''}`} role="menu">
            <button className="hdr-menu-item" role="menuitem"
              onClick={() => { setMenuOpen(false); onSavePlaylist(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
              </svg>
              Save Playlist
            </button>
            <button className="hdr-menu-item" role="menuitem"
              onClick={() => { setMenuOpen(false); onToggleImmersive(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
              </svg>
              Cinema Mode
            </button>
          </div>
        </div>

        <input ref={fileRef} type="file" multiple accept="audio/*"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files) { onAddFiles(Array.from(e.target.files)); e.target.value = ''; } }}
        />
      </div>
    </header>
  );
}