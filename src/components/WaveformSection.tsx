import { useRef, useCallback } from 'react';
import { useWaveform } from '../hooks/useWaveform';
import { fmt } from '../lib/audio';

interface Props {
  waveformData: Float32Array | null;
  waveformLoading: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  onSeek: (ratio: number) => void;
}

export default function WaveformSection({
  waveformData, waveformLoading, progress, currentTime, duration, onSeek,
}: Props) {
  const cvRef  = useRef<HTMLCanvasElement>(null);
  const secRef = useRef<HTMLDivElement>(null);
  const { onMouseMove, onMouseLeave } = useWaveform(cvRef, waveformData, progress);

  const ratio = useCallback(
    (clientX: number, el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    }, [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => onSeek(ratio(e.clientX, e.currentTarget)), [onSeek, ratio]);

  const handleTouch = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length !== 1) return;
      onSeek(ratio(e.touches[0].clientX, e.currentTarget));
    }, [onSeek, ratio]);

  return (
    <div className="waveform-section" ref={secRef}>
      <canvas ref={cvRef} className="waveform-canvas" height={48}
        onClick={handleClick}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        aria-hidden="true"
      />
      <input className="wf-seek-range" type="range" min="0" max="1000" step="1"
        value={Math.round(progress * 1000)}
        onChange={(e) => onSeek(parseFloat(e.target.value) / 1000)}
        aria-label="Seek"
      />
      <div className={`wf-loading${waveformLoading ? ' show' : ''}`}>Rendering…</div>
      <div className="progress-times">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>
    </div>
  );
}