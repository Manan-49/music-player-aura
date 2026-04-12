import type { Track } from '../types';

interface Props {
  show: boolean;
  currentTrack: Track | null;
  errorMessage: string | null;
}

export default function Toast({ show, currentTrack, errorMessage }: Props) {
  const title = currentTrack?.title || currentTrack?.name || '-';
  const artist = currentTrack?.artist || '-';
  const isError = Boolean(errorMessage);

  return (
    <div
      className={`toast${show ? ' show' : ''}${isError ? ' error' : ''}`}
      role="status"
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div className="toast-art" aria-hidden="true">
        {isError ? (
          <span className="toast-error-icon">⚠</span>
        ) : currentTrack?.art ? (
          <img src={currentTrack.art} alt="" draggable={false} />
        ) : (
          <span>🎵</span>
        )}
      </div>
      <div className="toast-info">
        <div className="toast-label">{isError ? 'Error' : 'Now Playing'}</div>
        {isError ? (
          <div className="toast-title toast-error-msg">{errorMessage}</div>
        ) : (
          <>
            <div className="toast-title">{title}</div>
            <div className="toast-artist">{artist}</div>
          </>
        )}
      </div>
    </div>
  );
}