import { memo, useEffect, useMemo, useRef, useState } from 'react';
import TrackItem from './TrackItem';
import type { Track } from '../types';

interface Props {
  tracks: Track[];
  filteredTracks: { t: Track; i: number }[];
  currentIndex: number;
  isPlaying: boolean;
  searchQuery: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onClearAll: () => void;
  onSearch: (q: string) => void;
}

const ITEM_HEIGHT = 54;
const OVERSCAN = 7;

function Sidebar({
  tracks,
  filteredTracks,
  currentIndex,
  isPlaying,
  searchQuery,
  mobileOpen,
  onCloseMobile,
  onSelect,
  onRemove,
  onReorder,
  onClearAll,
  onSearch,
}: Props) {
  const n = tracks.length;
  const queueRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (queueRef.current) setViewportHeight(queueRef.current.clientHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    setScrollTop(0);
    if (queueRef.current) queueRef.current.scrollTop = 0;
  }, [searchQuery, n]);

  const { startIndex, visible } = useMemo(() => {
    const total = filteredTracks.length;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const end = Math.min(
      total,
      Math.ceil((scrollTop + Math.max(viewportHeight, ITEM_HEIGHT)) / ITEM_HEIGHT) + OVERSCAN,
    );
    return {
      startIndex: start,
      visible: filteredTracks.slice(start, end),
    };
  }, [filteredTracks, scrollTop, viewportHeight]);

  return (
    <aside className={`sidebar${mobileOpen ? ' open' : ''}`} aria-label="Queue">
      <div className="sidebar-header">
        <span className="sidebar-title">Queue</span>
        <div className="sidebar-meta">
          <span className="track-count">{n} track{n !== 1 ? 's' : ''}</span>
          <button className="clear-btn" onClick={onClearAll} title="Clear all" aria-label="Clear all tracks">
            x
          </button>
          <button className="sidebar-close" onClick={onCloseMobile} aria-label="Close queue panel">
            x
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            autoComplete="off"
            aria-label="Search tracks"
          />
        </div>
      </div>

      <div
        ref={queueRef}
        className="queue-list"
        role="list"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
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
          <div className="queue-virtual" style={{ height: `${filteredTracks.length * ITEM_HEIGHT}px` }}>
            {visible.map(({ t, i }, localIdx) => (
              <div
                key={t.id}
                className="queue-row"
                style={{ transform: `translateY(${(startIndex + localIdx) * ITEM_HEIGHT}px)` }}
              >
                <TrackItem
                  track={t}
                  index={i}
                  isActive={i === currentIndex}
                  isPlaying={isPlaying}
                  searchQuery={searchQuery}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onReorder={onReorder}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default memo(Sidebar);
