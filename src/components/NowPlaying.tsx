import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Track } from '../types';

interface Props {
  currentTrack: Track | null;
  isLiked: boolean;
  onToggleLike: () => void;
}

export default function NowPlaying({ currentTrack, isLiked, onToggleLike }: Props) {
  const title = currentTrack?.title || currentTrack?.name || 'No track selected';
  const artist = currentTrack?.artist || (currentTrack ? 'Unknown artist' : 'Drop files to begin');

  const wrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      const w = wrapRef.current?.clientWidth ?? 0;
      const t = titleRef.current?.scrollWidth ?? 0;
      setShift(Math.max(0, t - w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [title]);

  return (
    <div className="now-playing">
      <div className="np-eyebrow">Now Playing</div>

      <div ref={wrapRef} className="marquee-wrap">
        <div
          ref={titleRef}
          className={`now-title${shift > 0 ? ' marquee' : ''}`}
          style={{ '--mshift': `${shift}px` } as CSSProperties}
        >
          {title}
        </div>
      </div>

      <div className="now-artist">{artist}</div>

      <button
        className={`like-btn${isLiked ? ' liked' : ''}`}
        onClick={onToggleLike}
        aria-label={isLiked ? 'Unlike' : 'Like'}
        aria-pressed={isLiked}
        title="Like (L)"
      >
        {isLiked ? '♥' : '♡'}
      </button>
    </div>
  );
}