import { useRef } from 'react';
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
  const { onMouseMove, onMouseLeave } = useWaveform(cvRef, waveformData, progress);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - r.left) / r.width;
    onSeek(ratio);
  };

  return (
    <div className="waveform-section">
      <canvas
        ref={cvRef}
        className="waveform-canvas"
        height={46}
        onClick={handleClick}
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
        onChange={(e) => onSeek(parseFloat(e.target.value) / 1000)}
        aria-label="Seek position"
      />
      <div className={`wf-loading${waveformLoading ? ' show' : ''}`}>Rendering waveform...</div>
      <div className="progress-times">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>
    </div>
  );
}
