import { memo, useMemo, useRef } from 'react';
import type { Track } from '../types';
import { fmt } from '../lib/audio';

interface Props {
  track: Track;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  searchQuery: string;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}

function getHighlightedNodes(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const qLower = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const hit = text.toLowerCase().indexOf(qLower, cursor);
    if (hit === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (hit > cursor) parts.push(text.slice(cursor, hit));
    const value = text.slice(hit, hit + q.length);
    parts.push(<mark key={`${hit}-${value}`} className="hl">{value}</mark>);
    cursor = hit + q.length;
  }
  return parts;
}

function TrackItem({
  track, index, isActive, isPlaying, searchQuery, onSelect, onRemove, onReorder,
}: Props) {
  const dragOverRef = useRef(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index));
    itemRef.current?.classList.add('dragging');
  };

  const handleDragEnd = () => itemRef.current?.classList.remove('dragging');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragOverRef.current) {
      dragOverRef.current = true;
      itemRef.current?.classList.add('drag-over');
    }
  };

  const handleDragLeave = () => {
    dragOverRef.current = false;
    itemRef.current?.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
    itemRef.current?.classList.remove('drag-over');
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (Number.isInteger(from) && from !== index) onReorder(from, index);
  };

  const playing = isActive && isPlaying;
  const name = track.name || '?';
  const artist = track.artist || 'Local file';
  const nameNodes = useMemo(() => getHighlightedNodes(name, searchQuery), [name, searchQuery]);
  const artistNodes = useMemo(() => getHighlightedNodes(artist, searchQuery), [artist, searchQuery]);

  return (
    <div
      ref={itemRef}
      className={`track-item${isActive ? ' active' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="listitem"
    >
      <button
        className="track-main-btn"
        onClick={() => onSelect(index)}
        aria-label={`Play ${name}`}
      >
        <div className="track-num">{index + 1}</div>
        <div className="now-eq" aria-hidden="true">
          <div className={`eq-mini${playing ? '' : ' paused'}`} />
          <div className={`eq-mini${playing ? '' : ' paused'}`} />
          <div className={`eq-mini${playing ? '' : ' paused'}`} />
        </div>
        <div className="track-thumb">
          {track.art ? (
            <img src={track.art} alt="" />
          ) : (
            <span>🎵</span>
          )}
          <div className="hover-play" aria-hidden="true">{playing ? '⏸' : '▶'}</div>
        </div>
        <div className="track-info">
          <div className="track-name">{nameNodes}</div>
          <div className="track-sub">{artistNodes}</div>
          <div className="track-dur">{track.duration ? fmt(track.duration) : '-'}</div>
        </div>
      </button>
      <button
        className="track-remove"
        title="Remove"
        aria-label={`Remove ${name}`}
        onClick={() => onRemove(index)}
      >
        x
      </button>
    </div>
  );
}

export default memo(TrackItem);
