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
  collapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onClearAll: () => void;
  onSearch: (q: string) => void;
}

const ITEM_H = 54;
const OVER = 8;

function Sidebar({
  tracks, filteredTracks, currentIndex, isPlaying,
  searchQuery, mobileOpen, collapsed,
  onCloseMobile, onToggleCollapse, onSelect, onRemove, onReorder, onClearAll, onSearch,
}: Props) {
  const n = tracks.length;
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(0);

  useEffect(() => {
    const update = () => { if (listRef.current) setViewH(listRef.current.clientHeight); };
    update();
    const ro = new ResizeObserver(update);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [searchQuery, n]);

  const { startIdx, visible } = useMemo(() => {
    const total = filteredTracks.length;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_H) - OVER);
    const end = Math.min(total, Math.ceil((scrollTop + Math.max(viewH, ITEM_H)) / ITEM_H) + OVER);
    return { startIdx: start, visible: filteredTracks.slice(start, end) };
  }, [filteredTracks, scrollTop, viewH]);

  const cls = ['sidebar', mobileOpen && 'open', collapsed && 'collapsed'].filter(Boolean).join(' ');

  return (
    <aside className={cls} aria-label="Queue">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <span className="sidebar-title">Queue</span>
          {/* Desktop collapse */}
          <button className="s-btn s-btn-collapse" onClick={onToggleCollapse}
            aria-label="Collapse sidebar" title="Collapse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="sidebar-meta">
          <span className="track-badge">{n}</span>
          <button className="s-btn" onClick={onClearAll}
            title="Clear all" aria-label="Clear all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
          {/* Mobile close */}
          <button className="s-btn s-btn-close" onClick={onCloseMobile}
            aria-label="Close queue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            autoComplete="off"
            aria-label="Search tracks"
          />
        </div>
      </div>

      {/* List */}
      <div
        ref={listRef}
        className="queue-list"
        role="list"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {n === 0 ? (
          <div className="q-empty">
            <div className="q-empty-icon">🎵</div>
            <p>Drop <strong>audio files</strong><br />or click <strong>Add</strong></p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="q-empty">
            <div className="q-empty-icon">🔍</div>
            <p>No results for<br /><strong>"{searchQuery}"</strong></p>
          </div>
        ) : (
          <div className="queue-virtual" style={{ height: `${filteredTracks.length * ITEM_H}px` }}>
            {visible.map(({ t, i }, li) => (
              <div
                key={t.id}
                className="queue-row"
                style={{ transform: `translateY(${(startIdx + li) * ITEM_H}px)` }}
              >
                <TrackItem
                  track={t} index={i}
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