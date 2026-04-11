import TrackItem from './TrackItem';
import type { Track } from '../types';

interface Props {
  tracks: Track[];
  filteredTracks: { t: Track; i: number }[];
  currentIndex: number;
  isPlaying: boolean;
  searchQuery: string;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onClearAll: () => void;
  onSearch: (q: string) => void;
}

export default function Sidebar({
  tracks,
  filteredTracks,
  currentIndex,
  isPlaying,
  searchQuery,
  onSelect,
  onRemove,
  onReorder,
  onClearAll,
  onSearch,
}: Props) {
  const n = tracks.length;

  return (
    <aside className="sidebar" aria-label="Queue">
      <div className="sidebar-header">
        <span className="sidebar-title">Queue</span>
        <div className="sidebar-meta">
          <span className="track-count">{n} track{n !== 1 ? 's' : ''}</span>
          <div className="clear-btn" onClick={onClearAll} title="Clear all">✕</div>
        </div>
      </div>

      <div className="sidebar-search">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search tracks…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="queue-list" role="list">
        {n === 0 ? (
          <div className="queue-empty">
            <div className="emp-icon">🎵</div>
            <p>Drop <strong>MP3 / FLAC / WAV</strong> files<br />or click <strong>Add Music</strong></p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="queue-empty">
            <div className="emp-icon">🔍</div>
            <p>No results for "<strong>{searchQuery}</strong>"</p>
          </div>
        ) : (
          filteredTracks.map(({ t, i }) => (
            <TrackItem
              key={t.id}
              track={t}
              index={i}
              isActive={i === currentIndex}
              isPlaying={isPlaying}
              searchQuery={searchQuery}
              onSelect={onSelect}
              onRemove={onRemove}
              onReorder={onReorder}
            />
          ))
        )}
      </div>
    </aside>
  );
}
