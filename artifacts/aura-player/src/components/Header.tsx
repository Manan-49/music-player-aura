import { useRef } from 'react';
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
  onToggleMini: () => void;
}

export default function Header({
  mood,
  playlists,
  activePlaylist,
  onAddFiles,
  onSavePlaylist,
  onLoadPlaylist,
  onToggleImmersive,
  onToggleMini,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moodConfig = MOODS[mood];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-dot" />
        aura<span>.</span>
      </div>

      <div className="header-center">
        <div className="mood-chip">
          <span className="mood-icon">{moodConfig.icon}</span>
          <span className="mood-label">{moodConfig.label}</span>
        </div>
      </div>

      <div className="header-right">
        <select
          className="playlist-select"
          value={activePlaylist}
          onChange={(e) => onLoadPlaylist(e.target.value)}
          title="Playlists"
        >
          <option value="Library">Library</option>
          {Object.keys(playlists).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button className="hdr-btn" onClick={onSavePlaylist} title="Save queue as playlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save
        </button>

        <button className="hdr-btn" onClick={() => fileInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          Add Music
        </button>

        <button className="hdr-btn" onClick={onToggleImmersive} title="Immersive (I)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
          </svg>
        </button>

        <button className="hdr-btn" onClick={onToggleMini} title="Mini mode (M)">Mini</button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </header>
  );
}
