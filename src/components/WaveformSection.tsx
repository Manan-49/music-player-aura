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
  waveformData,
  waveformLoading,
  progress,
  currentTime,
  duration,
  onSeek,
}: Props) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { onMouseMove, onMouseLeave } = useWaveform(cvRef, waveformData, progress);

  const getSeekRatio = useCallback(
    (clientX: number, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      onSeek(getSeekRatio(e.clientX, e.currentTarget));
    },
    [onSeek, getSeekRatio],
  );

  const handleTouch = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length !== 1) return;
      const ratio = getSeekRatio(e.touches[0].clientX, e.currentTarget);
      onSeek(ratio);
    },
    [onSeek, getSeekRatio],
  );

  const handleRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSeek(parseFloat(e.target.value) / 1000);
    },
    [onSeek],
  );

  return (
    <div className="waveform-section" ref={sectionRef}>
      <canvas
        ref={cvRef}
        className="waveform-canvas"
        height={46}
        onClick={handleClick}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        aria-hidden="true"
      />
      <input
        className="wf-seek-range"
        type="range"
        min="0"
        max="1000"
        step="1"
        value={Math.round(progress * 1000)}
        onChange={handleRangeChange}
        aria-label="Seek position"
      />
      <div className={`wf-loading${waveformLoading ? ' show' : ''}`}>Rendering waveform…</div>
      <div className="progress-times">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>
    </div>
  );
}