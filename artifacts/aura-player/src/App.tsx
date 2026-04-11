import { useEffect, useRef, useCallback } from 'react';
import { MOODS } from './types';
import { usePlayerStore } from './hooks/usePlayerStore';
import { useMoodEngine } from './hooks/useMoodEngine';
import AmbientCanvas from './components/AmbientCanvas';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AlbumArt from './components/AlbumArt';
import NowPlaying from './components/NowPlaying';
import WaveformSection from './components/WaveformSection';
import Controls from './components/Controls';
import BottomBar from './components/BottomBar';
import ImmersiveOverlay from './components/ImmersiveOverlay';
import Toast from './components/Toast';
import DropZone from './components/DropZone';

export default function App() {
  const store = usePlayerStore();
  const { analyzeMood } = useMoodEngine(store.setMood);

  const moodConfig = MOODS[store.mood];
  const moodClass = moodConfig.cls;

  // Apply mood class to document root
  useEffect(() => {
    const allCls = Object.values(MOODS).map((m) => m.cls).filter(Boolean);
    document.documentElement.classList.remove(...allCls);
    if (moodClass) document.documentElement.classList.add(moodClass);
    return () => { document.documentElement.classList.remove(...allCls); };
  }, [moodClass]);

  // Apply mini-mode class to document root
  useEffect(() => {
    if (store.miniMode) {
      document.documentElement.classList.add('mini-mode');
    } else {
      document.documentElement.classList.remove('mini-mode');
    }
  }, [store.miniMode]);

  // Global drag-over for drop zone (triggered from window-level)
  const dropOverlayRef = useRef<HTMLDivElement>(null);
  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    dropOverlayRef.current?.classList.add('active');
  }, []);
  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    if (!e.relatedTarget) {
      dropOverlayRef.current?.classList.remove('active');
    }
  }, []);
  const handleGlobalDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    dropOverlayRef.current?.classList.remove('active');
    const files = Array.from(e.dataTransfer?.files || []).filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(f.name),
    );
    if (files.length) store.addFiles(files);
  }, [store.addFiles]);

  useEffect(() => {
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('dragleave', handleGlobalDragLeave);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('dragleave', handleGlobalDragLeave);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [handleGlobalDragOver, handleGlobalDragLeave, handleGlobalDrop]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return;

      const audio = store.audioRef.current;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          store.togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey || e.metaKey || e.ctrlKey) store.nextTrack();
          else if (audio?.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          break;
        case 'ArrowLeft':
          if (e.shiftKey || e.metaKey || e.ctrlKey) store.prevTrack();
          else if (audio) audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowUp': {
          if (!audio) break;
          const v = Math.min(1, audio.volume + 0.05);
          store.setVolume(v);
          break;
        }
        case 'ArrowDown': {
          if (!audio) break;
          const v = Math.max(0, audio.volume - 0.05);
          store.setVolume(v);
          break;
        }
        case 'KeyI': store.toggleImmersive(); break;
        case 'KeyS': store.toggleShuffle(); break;
        case 'KeyR': store.toggleRepeat(); break;
        case 'KeyL': store.toggleLike(); break;
        case 'KeyM': store.toggleMini(); break;
        case 'Escape': if (store.immersiveOpen) store.toggleImmersive(); break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [store]);

  const handleSavePlaylist = useCallback(() => {
    const name = window.prompt('Playlist name:');
    if (name) store.savePlaylist(name);
  }, [store.savePlaylist]);

  const handleTrackSelect = useCallback((index: number) => {
    if (index === store.currentIndex) store.togglePlay();
    else store.loadTrack(index, true);
  }, [store.currentIndex, store.togglePlay, store.loadTrack]);

  return (
    <>
      <AmbientCanvas mood={store.mood} />

      <audio ref={store.audioRef} preload="auto" crossOrigin="anonymous" />

      <div className="app">
        <Header
          mood={store.mood}
          playlists={store.playlists}
          activePlaylist={store.activePlaylist}
          onAddFiles={store.addFiles}
          onSavePlaylist={handleSavePlaylist}
          onLoadPlaylist={store.loadPlaylist}
          onToggleImmersive={store.toggleImmersive}
          onToggleMini={store.toggleMini}
        />

        <Sidebar
          tracks={store.tracks}
          filteredTracks={store.filteredTracks}
          currentIndex={store.currentIndex}
          isPlaying={store.isPlaying}
          searchQuery={store.searchQuery}
          onSelect={handleTrackSelect}
          onRemove={store.removeTrack}
          onReorder={store.reorderTrack}
          onClearAll={store.clearAll}
          onSearch={store.setSearchQuery}
        />

        <main className="main" id="main-area">
          <div ref={dropOverlayRef} className="drop-zone">
            <div className="dz-icon">🎶</div>
            <p>Drop audio files here</p>
          </div>

          <div className="player-inner">
            <AlbumArt
              currentTrack={store.currentTrack}
              isPlaying={store.isPlaying}
              analyserRef={store.analyserRef}
              dataArrayRef={store.dataArrayRef}
              freqBinCountRef={store.freqBinCountRef}
              audioReadyRef={store.audioReadyRef}
              onTogglePlay={store.togglePlay}
              onMoodData={analyzeMood}
            />

            <NowPlaying
              currentTrack={store.currentTrack}
              isLiked={store.isLiked}
              onToggleLike={store.toggleLike}
            />

            <WaveformSection
              waveformData={store.waveformData}
              waveformLoading={store.waveformLoading}
              progress={store.progress}
              currentTime={store.currentTime}
              duration={store.duration}
              onSeek={store.seekTo}
            />

            <Controls
              isPlaying={store.isPlaying}
              shuffle={store.shuffle}
              repeat={store.repeat}
              volume={store.volume}
              speedIdx={store.speedIdx}
              onTogglePlay={store.togglePlay}
              onPrev={store.prevTrack}
              onNext={store.nextTrack}
              onToggleShuffle={store.toggleShuffle}
              onToggleRepeat={store.toggleRepeat}
              onSetVolume={store.setVolume}
              onCycleSpeed={store.cycleSpeed}
            />
          </div>
        </main>

        <BottomBar
          currentTrack={store.currentTrack}
          isPlaying={store.isPlaying}
          progress={store.progress}
        />
      </div>

      <ImmersiveOverlay
        open={store.immersiveOpen}
        currentTrack={store.currentTrack}
        isPlaying={store.isPlaying}
        currentTime={store.currentTime}
        duration={store.duration}
        progress={store.progress}
        onClose={store.toggleImmersive}
        onTogglePlay={store.togglePlay}
        onPrev={store.prevTrack}
        onNext={store.nextTrack}
        onSeek={store.seekTo}
      />

      <Toast show={store.showToast} currentTrack={store.currentTrack} />
    </>
  );
}
