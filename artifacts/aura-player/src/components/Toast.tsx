import type { Track } from '../types';

interface Props {
  show: boolean;
  currentTrack: Track | null;
}

export default function Toast({ show, currentTrack }: Props) {
  const title = currentTrack?.title || currentTrack?.name || '–';
  const artist = currentTrack?.artist || '–';

  return (
    <div className={`toast${show ? ' show' : ''}`}>
      <div className="toast-art">
        {currentTrack?.art ? (
          <img src={currentTrack.art} alt="" />
        ) : (
          <span>🎵</span>
        )}
      </div>
      <div className="toast-info">
        <div className="toast-label">Now Playing</div>
        <div className="toast-title">{title}</div>
        <div className="toast-artist">{artist}</div>
      </div>
    </div>
  );
}
