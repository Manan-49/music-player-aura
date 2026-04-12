import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Track, Mood } from '../types';
import { SPEEDS } from '../types';
import { openDB, dbPut, dbGetAll, dbDelete, dbClear } from '../lib/db';
import { cleanName, extractMeta, extractDuration, extractAverageColor, buildWaveformData } from '../lib/audio';

function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(file.name);
}

export function usePlayerStore() {
  const [library, setLibrary] = useState<Track[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [mood, setMoodState] = useState<Mood>('standby');
  const [likedTracks, setLikedTracks] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('aura:likes') || '[]')); }
    catch { return new Set(); }
  });
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const [miniMode, setMiniMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlists, setPlaylists] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem('aura:playlists') || '{}'); }
    catch { return {}; }
  });
  const [activePlaylist, setActivePlaylist] = useState('Library');
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [waveformLoading, setWaveformLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaSrcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const freqBinCountRef = useRef(0);
  const audioReadyRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wfWorkingRef = useRef(false);
  const currentIndexRef = useRef(-1);
  const tracksRef = useRef<Track[]>([]);
  const isPlayingRef = useRef(false);
  const libraryRef = useRef<Track[]>([]);
  const waveformCacheRef = useRef<Map<string, { data: Float32Array; duration: number }>>(new Map());
  const timePersistRef = useRef(0);

  currentIndexRef.current = currentIndex;
  tracksRef.current = tracks;
  isPlayingRef.current = isPlaying;
  libraryRef.current = library;

  const saveOrder = useCallback((t: Track[]) => {
    localStorage.setItem('aura:order', JSON.stringify(t.map((x) => x.id)));
  }, []);

  const showNowPlayingToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setErrorMessage(null);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  }, []);

  const showErrorToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setErrorMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
      setErrorMessage(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Boot: open DB, restore tracks
  useEffect(() => {
    (async () => {
      const db = await openDB();
      dbRef.current = db;
      const stored = await dbGetAll(db);
      const loaded: Track[] = stored.map((s) => ({ ...s, url: URL.createObjectURL(s.blob) }));
      const savedOrder = JSON.parse(localStorage.getItem('aura:order') || '[]') as string[];
      if (savedOrder.length) {
        loaded.sort((a, b) => savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id));
      }
      setLibrary(loaded);
      setTracks(loaded);

      const vol = parseFloat(localStorage.getItem('aura:vol') || '1');
      setVolumeState(vol);
      const sh = localStorage.getItem('aura:shuffle') === 'true';
      const rp = localStorage.getItem('aura:repeat') === 'true';
      setShuffle(sh);
      setRepeat(rp);

      const lastIdx = parseInt(localStorage.getItem('aura:lastIdx') || '-1', 10);
      if (lastIdx >= 0 && loaded[lastIdx]) {
        await loadTrackInternal(lastIdx, false, loaded);
        const t = parseFloat(localStorage.getItem('aura:lastTime') || '0');
        if (t && audioRef.current) audioRef.current.currentTime = t;
      }
    })().catch(() => {
      showErrorToast('Could not restore library from local storage.');
    });
  }, [showErrorToast]);

  const ensureAudioCtx = useCallback(() => {
    if (!audioReadyRef.current && audioRef.current) {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.83;
      freqBinCountRef.current = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(freqBinCountRef.current) as Uint8Array<ArrayBuffer>;
      const gainNode = ctx.createGain();
      const mediaSrc = ctx.createMediaElementSource(audioRef.current);
      mediaSrc.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      gainNodeRef.current = gainNode;
      mediaSrcRef.current = mediaSrc;
      audioReadyRef.current = true;
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const buildWaveform = useCallback(async (track: Track) => {
    const cached = waveformCacheRef.current.get(track.id);
    if (cached) {
      setWaveformData(cached.data);
      setDuration(cached.duration);
      return;
    }
    if (wfWorkingRef.current) return;
    wfWorkingRef.current = true;
    setWaveformLoading(true);
    setWaveformData(null);
    try {
      const result = await buildWaveformData(track.blob);
      waveformCacheRef.current.set(track.id, result);
      setWaveformData(result.data);
      setDuration(result.duration);
      if (!track.duration) track.duration = result.duration;
    } catch {
      setWaveformData(null);
      showErrorToast('Could not render waveform for this track.');
    } finally {
      wfWorkingRef.current = false;
      setWaveformLoading(false);
    }
  }, [showErrorToast]);

  const applyTheme = useCallback(async (art: string | null, curMood: Mood) => {
    if (!art || curMood !== 'standby') return;
    const color = await extractAverageColor(art);
    if (!color) return;
    const { r, g, b } = color;
    document.documentElement.style.setProperty('--mood-accent', `rgb(${r},${g},${b})`);
    document.documentElement.style.setProperty('--mood-accent2', `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 20)},${Math.min(255, b + 70)})`);
    document.documentElement.style.setProperty('--mood-glow', `rgba(${r},${g},${b},.22)`);
  }, []);

  const loadTrackInternal = useCallback(async (index: number, autoplay: boolean, trackList?: Track[]) => {
    const tl = trackList || tracksRef.current;
    if (index < 0 || index >= tl.length) return;
    const t = tl[index];
    setCurrentIndex(index);
    setWaveformData(null);

    if (audioRef.current) {
      audioRef.current.src = t.url;
      audioRef.current.playbackRate = SPEEDS[speedIdx] ?? 1;
      audioRef.current.load();
    }

    buildWaveform(t);
    showNowPlayingToast();
    applyTheme(t.art, 'standby');
    localStorage.setItem('aura:lastIdx', String(index));

    if ('mediaSession' in navigator) {
      const title = t.title || t.name;
      const artist = t.artist || 'Unknown';
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        artwork: t.art ? [{ src: t.art }] : [],
      });
    }

    if (autoplay || isPlayingRef.current) {
      try {
        ensureAudioCtx();
        await audioRef.current?.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [applyTheme, buildWaveform, ensureAudioCtx, showNowPlayingToast, speedIdx]);

  const loadTrack = useCallback((index: number, autoplay = false) => loadTrackInternal(index, autoplay), [loadTrackInternal]);

  const togglePlay = useCallback(() => {
    if (!tracksRef.current.length) return;
    if (currentIndexRef.current === -1) {
      loadTrack(0, true);
      return;
    }
    if (isPlayingRef.current) {
      audioRef.current?.pause();
    } else {
      ensureAudioCtx();
      audioRef.current?.play().catch(() => showErrorToast('Playback could not be started.'));
    }
  }, [ensureAudioCtx, loadTrack, showErrorToast]);

  const nextTrack = useCallback(() => {
    const tl = tracksRef.current;
    if (!tl.length) return;
    let next: number;
    if (shuffle) {
      const opts = tl.map((_, i) => i).filter((i) => i !== currentIndexRef.current);
      next = opts.length ? opts[Math.floor(Math.random() * opts.length)] : currentIndexRef.current;
    } else {
      next = (currentIndexRef.current + 1) % tl.length;
    }
    loadTrack(next, true);
  }, [loadTrack, shuffle]);

  const prevTrack = useCallback(() => {
    if (!tracksRef.current.length) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prev = (currentIndexRef.current - 1 + tracksRef.current.length) % tracksRef.current.length;
    loadTrack(prev, true);
  }, [loadTrack]);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      const next = !s;
      localStorage.setItem('aura:shuffle', String(next));
      return next;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => {
      const next = !r;
      localStorage.setItem('aura:repeat', String(next));
      return next;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setVolumeState(v);
    localStorage.setItem('aura:vol', String(v));
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((idx) => {
      const next = (idx + 1) % SPEEDS.length;
      if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
      return next;
    });
  }, []);

  const toggleLike = useCallback(() => {
    if (currentIndexRef.current < 0) return;
    const key = tracksRef.current[currentIndexRef.current]?.id;
    if (!key) return;
    setLikedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem('aura:likes', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleImmersive = useCallback(() => setImmersiveOpen((v) => !v), []);
  const toggleMini = useCallback(() => setMiniMode((v) => !v), []);

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const db = dbRef.current;
    if (!db) return;

    const valid = files.filter(isAudioFile);
    const invalidCount = files.length - valid.length;
    if (!valid.length) {
      showErrorToast('No supported audio files were added.');
      return;
    }
    if (invalidCount > 0) {
      showErrorToast(`Skipped ${invalidCount} unsupported file${invalidCount > 1 ? 's' : ''}.`);
    }

    const newTracks: Track[] = [];
    for (const file of valid) {
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);
      const name = cleanName(file.name);
      const track: Track = { id, name, url, blob: file, title: name, artist: '', art: null, duration: null };
      newTracks.push(track);
      await dbPut(db, { id, name, blob: file, title: '', artist: '', art: null, duration: null });
    }

    setLibrary((prev) => {
      const updated = [...prev, ...newTracks];
      libraryRef.current = updated;
      return updated;
    });
    setTracks((prev) => {
      const updated = [...prev, ...newTracks];
      tracksRef.current = updated;
      saveOrder(updated);
      if (currentIndexRef.current === -1 && updated.length) loadTrack(0, false);
      return updated;
    });

    for (const track of newTracks) {
      extractMeta(track).then(async (meta) => {
        const updated: Track = {
          ...track,
          title: meta.title || track.name,
          artist: meta.artist || '',
          art: meta.art || null,
          name: meta.title || track.name,
        };
        Object.assign(track, updated);
        await dbPut(db, {
          id: track.id,
          name: track.name,
          blob: track.blob,
          title: track.title,
          artist: track.artist,
          art: track.art,
          duration: track.duration,
        });
        setTracks((prev) => [...prev]);
        setLibrary((prev) => [...prev]);
      }).catch(() => {});

      extractDuration(track).then((dur) => {
        if (dur !== null) {
          track.duration = dur;
          setTracks((prev) => [...prev]);
        }
      }).catch(() => {});
    }
  }, [loadTrack, saveOrder, showErrorToast]);

  const removeTrack = useCallback((idx: number) => {
    const db = dbRef.current;
    const tl = tracksRef.current;
    if (!tl[idx]) return;
    URL.revokeObjectURL(tl[idx].url);
    if (db) dbDelete(db, tl[idx].id);
    waveformCacheRef.current.delete(tl[idx].id);

    setLibrary((prev) => prev.filter((x) => x.id !== tl[idx].id));
    setTracks((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      saveOrder(next);

      if (idx === currentIndexRef.current) {
        if (next.length) {
          const newIdx = Math.min(idx, next.length - 1);
          setTimeout(() => loadTrack(newIdx, isPlayingRef.current), 0);
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
          }
          setIsPlaying(false);
          setCurrentIndex(-1);
          setWaveformData(null);
          setProgress(0);
          setCurrentTime(0);
          setDuration(0);
        }
      } else if (currentIndexRef.current > idx) {
        setCurrentIndex((ci) => ci - 1);
      }
      return next;
    });
  }, [loadTrack, saveOrder]);

  const reorderTrack = useCallback((from: number, to: number) => {
    setTracks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      saveOrder(next);

      setCurrentIndex((ci) => {
        if (ci === from) return to;
        if (ci > from && ci <= to) return ci - 1;
        if (ci < from && ci >= to) return ci + 1;
        return ci;
      });
      return next;
    });
  }, [saveOrder]);

  const clearAll = useCallback(() => {
    if (!tracksRef.current.length) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    for (const t of tracksRef.current) URL.revokeObjectURL(t.url);
    if (dbRef.current) dbClear(dbRef.current);
    localStorage.removeItem('aura:order');
    setTracks([]);
    setLibrary([]);
    setIsPlaying(false);
    setCurrentIndex(-1);
    setWaveformData(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setMoodState('standby');
    setErrorMessage(null);
    waveformCacheRef.current.clear();
  }, []);

  const setMood = useCallback((m: Mood) => {
    setMoodState(m);
  }, []);

  const savePlaylist = useCallback((name: string) => {
    if (!name) return;
    const updated = { ...playlists, [name]: tracksRef.current.map((t) => t.id) };
    setPlaylists(updated);
    localStorage.setItem('aura:playlists', JSON.stringify(updated));
    setActivePlaylist(name);
  }, [playlists]);

  const loadPlaylist = useCallback((name: string) => {
    const activeId = tracksRef.current[currentIndexRef.current]?.id || null;
    setActivePlaylist(name);

    if (name === 'Library' || !name) {
      const base = [...libraryRef.current];
      setTracks(base);
      const preservedIdx = activeId ? base.findIndex((t) => t.id === activeId) : -1;
      if (preservedIdx >= 0) setCurrentIndex(preservedIdx);
      else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setCurrentIndex(-1);
        setIsPlaying(false);
        setProgress(0);
      }
      return;
    }

    const ids = playlists[name] || [];
    const filtered = ids
      .map((id) => libraryRef.current.find((t) => t.id === id))
      .filter(Boolean) as Track[];
    setTracks(filtered);
    const preservedIdx = activeId ? filtered.findIndex((t) => t.id === activeId) : -1;
    if (preservedIdx >= 0) {
      setCurrentIndex(preservedIdx);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setCurrentIndex(-1);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setWaveformData(null);
    }
  }, [playlists]);

  const seekTo = useCallback((ratio: number) => {
    if (!audioRef.current?.duration) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    audioRef.current.currentTime = clamped * audioRef.current.duration;
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      ensureAudioCtx();
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      nextTrack();
    };
    const onTimeUpdate = () => {
      const cur = audio.currentTime;
      const dur = audio.duration || 0;
      const pct = dur ? cur / dur : 0;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress(pct);
      const now = performance.now();
      if (now - timePersistRef.current > 5000) {
        timePersistRef.current = now;
        localStorage.setItem('aura:lastTime', String(audio.currentTime));
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [ensureAudioCtx, nextTrack, repeat]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // MediaSession action handlers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    }
  }, [togglePlay, prevTrack, nextTrack]);

  // Save state on unload
  useEffect(() => {
    const handler = () => {
      localStorage.setItem('aura:lastIdx', String(currentIndexRef.current));
      if (audioRef.current) localStorage.setItem('aura:lastTime', String(audioRef.current.currentTime));
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const currentTrack = useMemo(
    () => (currentIndex >= 0 ? tracks[currentIndex] : null),
    [currentIndex, tracks],
  );
  const isLiked = useMemo(
    () => currentIndex >= 0 && likedTracks.has(tracks[currentIndex]?.id),
    [currentIndex, likedTracks, tracks],
  );
  const speed = SPEEDS[speedIdx];
  const filteredTracks = useMemo(() => {
    if (!searchQuery) return tracks.map((t, i) => ({ t, i }));
    const q = searchQuery.toLowerCase();
    return tracks
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.name.toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q));
  }, [tracks, searchQuery]);

  return {
    audioRef,
    analyserRef,
    dataArrayRef,
    freqBinCountRef,
    audioReadyRef,
    tracks,
    library,
    currentIndex,
    currentTrack,
    isPlaying,
    shuffle,
    repeat,
    volume,
    speed,
    speedIdx,
    mood,
    isLiked,
    progress,
    currentTime,
    duration,
    immersiveOpen,
    miniMode,
    searchQuery,
    playlists,
    activePlaylist,
    waveformData,
    waveformLoading,
    showToast,
    errorMessage,
    filteredTracks,
    loadTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    cycleSpeed,
    toggleLike,
    toggleImmersive,
    toggleMini,
    addFiles,
    removeTrack,
    reorderTrack,
    clearAll,
    setMood,
    setSearchQuery,
    savePlaylist,
    loadPlaylist,
    seekTo,
    setWaveformData,
    showErrorToast,
  };
}
