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
  const artist = currentTrack?.artist || (currentTrack ? 'Local file' : 'Add music to get started');

  const marqueeWrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [marqueeShift, setMarqueeShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      const wrapWidth = marqueeWrapRef.current?.clientWidth ?? 0;
      const titleWidth = titleRef.current?.scrollWidth ?? 0;
      const overflow = Math.max(0, titleWidth - wrapWidth);
      setMarqueeShift(overflow);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (marqueeWrapRef.current) observer.observe(marqueeWrapRef.current);
    return () => observer.disconnect();
  }, [title]);

  const titleStyle = { '--marquee-shift': `${marqueeShift}px` } as CSSProperties;

  return (
    <div className="now-playing">
      <div className="np-label">Now Playing</div>
      <div ref={marqueeWrapRef} className="marquee-wrap">
        <div
          ref={titleRef}
          style={titleStyle}
          className={`now-title${marqueeShift > 0 ? ' marquee' : ''}`}
        >
          {title}
        </div>
      </div>
      <div className="now-artist">{artist}</div>
      <button
        className={`like-btn${isLiked ? ' liked' : ''}`}
        onClick={onToggleLike}
        aria-label={isLiked ? 'Unlike track' : 'Like track'}
        aria-pressed={isLiked}
        title="Like (L)"
      >
        {isLiked ? '♥' : '♡'}
      </button>
    </div>
  );
}