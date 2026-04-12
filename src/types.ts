export interface Track {
  id: string;
  name: string;
  url: string;
  blob: File;
  title: string;
  artist: string;
  art: string | null;
  duration: number | null;
}

export type Mood = 'standby' | 'calm' | 'energetic' | 'melancholic' | 'euphoric';

export interface MoodConfig {
  icon: string;
  label: string;
  cls: string;
}

export const MOODS: Record<Mood, MoodConfig> = {
  standby: { icon: '✦', label: 'Standby', cls: '' },
  calm: { icon: '🌊', label: 'Calm', cls: 'mood-calm' },
  energetic: { icon: '⚡', label: 'Energetic', cls: 'mood-energetic' },
  melancholic: { icon: '🌙', label: 'Melancholic', cls: 'mood-melancholic' },
  euphoric: { icon: '✨', label: 'Euphoric', cls: 'mood-euphoric' },
};

export const SPEEDS = [1, 1.25, 1.5, 0.75] as const;