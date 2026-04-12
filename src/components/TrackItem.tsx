import { useRef } from 'react';
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

function hlText(text: string, q: string): string {
  if (!q) return text;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${esc})`, 'gi'),
    '<mark class="hl">$1</mark>',
  );
}

export default function TrackItem({
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
    const from = parseInt(e.dataTransfer.getData('text/plain'));
    if (from !== index) onReorder(from, index);
  };

  const playing = isActive && isPlaying;

  return (
    <div
      ref={itemRef}
      className={`track-item${isActive ? ' active' : ''}`}
      draggable
      onClick={() => onSelect(index)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="listitem"
    >
      <div className="track-num">{index + 1}</div>
      <div className="now-eq">
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
        <div className="hover-play">{playing ? '⏸' : '▶'}</div>
      </div>
      <div className="track-info">
        <div
          className="track-name"
          dangerouslySetInnerHTML={{ __html: hlText(track.name || '?', searchQuery) }}
        />
        <div
          className="track-sub"
          dangerouslySetInnerHTML={{ __html: hlText(track.artist || 'Local file', searchQuery) }}
        />
        <div className="track-dur">{track.duration ? fmt(track.duration) : '–'}</div>
      </div>
      <div
        className="track-remove"
        title="Remove"
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
      >
        ✕
      </div>
    </div>
  );
}
