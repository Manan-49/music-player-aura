import { useRef, useCallback } from 'react';
import type { Mood } from '../types';

export function useMoodEngine(setMood: (m: Mood) => void) {
  const moodHistoryRef = useRef<Mood[]>([]);
  const currentMoodRef = useRef<Mood>('standby');
  const moodFramesRef = useRef(0);

  const analyzeMood = useCallback((data: Uint8Array<ArrayBuffer>) => {
    if (++moodFramesRef.current % 30 !== 0) return;
    let bass = 0, mid = 0, high = 0;
    for (let i = 0; i < 8; i++) bass += data[i];
    for (let i = 8; i < 64; i++) mid += data[i];
    for (let i = 64; i < 128; i++) high += data[i];
    bass /= 8 * 255;
    mid /= 56 * 255;
    high /= 64 * 255;
    const energy = (bass * 2 + mid + high * 0.5) / 3.5;
    let mood: Mood = energy < 0.12
      ? 'melancholic'
      : bass > 0.35 && energy > 0.3
        ? 'energetic'
        : high > 0.2 && energy > 0.25
          ? 'euphoric'
          : 'calm';

    moodHistoryRef.current.push(mood);
    if (moodHistoryRef.current.length > 10) moodHistoryRef.current.shift();

    const counts: Record<string, number> = {};
    for (const m of moodHistoryRef.current) counts[m] = (counts[m] || 0) + 1;
    let dominant: Mood = 'calm', best = 0;
    for (const k in counts) { if (counts[k] > best) { best = counts[k]; dominant = k as Mood; } }

    if (dominant !== currentMoodRef.current) {
      currentMoodRef.current = dominant;
      setMood(dominant);
    }
  }, [setMood]);

  const resetMood = useCallback(() => {
    moodHistoryRef.current = [];
    currentMoodRef.current = 'standby';
    setMood('standby');
  }, [setMood]);

  return { analyzeMood, resetMood };
}
