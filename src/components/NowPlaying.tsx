import type { Track } from '../types';

interface Props {
  currentTrack: Track | null;
  isLiked: boolean;
  onToggleLike: () => void;
}

export default function NowPlaying({ currentTrack, isLiked, onToggleLike }: Props) {
  const title = currentTrack?.title || currentTrack?.name || 'No track selected';
  const artist = currentTrack?.artist || (currentTrack ? 'Local file' : 'Add music to get started');
  const isLong = title.length > 24;

  return (
    <div className="now-playing">
      <div className="np-label">Now Playing</div>
      <div className="marquee-wrap">
        <div className={`now-title${isLong ? ' marquee' : ''}`}>{title}</div>
      </div>
      <div className="now-artist">{artist}</div>
      <button
        className={`like-btn${isLiked ? ' liked' : ''}`}
        onClick={onToggleLike}
        title="Like (L)"
      >
        {isLiked ? '♥' : '♡'}
      </button>
    </div>
  );
}
