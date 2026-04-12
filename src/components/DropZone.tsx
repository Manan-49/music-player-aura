import { useState, useCallback } from 'react';

interface Props {
  onAddFiles: (files: File[]) => void;
}

export default function DropZone({ onAddFiles }: Props) {
  const [active, setActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.relatedTarget) setActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(f.name),
    );
    if (files.length) onAddFiles(files);
  }, [onAddFiles]);

  return (
    <div
      className={`drop-zone${active ? ' active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="dz-icon">🎶</div>
      <p>Drop audio files here</p>
    </div>
  );
}
