import { useEffect, useRef, useCallback, useState } from 'react';
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

export default function App() {
  const store = usePlayerStore();
  const { analyzeMood } = useMoodEngine(store.setMood);

  const moodConfig = MOODS[store.mood];
  const moodClass = moodConfig.cls;

  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistError, setPlaylistError] = useState('');

  const playlistInputRef = useRef<HTMLInputElement>(null);

  const {
    audioRef,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    toggleImmersive,
    toggleLike,
    addFiles,
    currentIndex,
    loadTrack,
    immersiveOpen,
    tracks,
    playlists,
    savePlaylist,
  } = store;

  // Apply mood class to document root
  useEffect(() => {
    const allCls = Object.values(MOODS).map((m) => m.cls).filter(Boolean);
    document.documentElement.classList.remove(...allCls);
    if (moodClass) document.documentElement.classList.add(moodClass);
    return () => {
      document.documentElement.classList.remove(...allCls);
    };
  }, [moodClass]);

  useEffect(() => {
    if (!playlistDialogOpen) return;
    playlistInputRef.current?.focus();
  }, [playlistDialogOpen]);

  useEffect(() => {
    if (!mobileQueueOpen) return;
    const handler = () => setMobileQueueOpen(false);
    window.addEventListener('resize', handler, { once: true });
    return () => window.removeEventListener('resize', handler);
  }, [mobileQueueOpen]);

  // Global drag-over for drop zone
  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDropActive(true);
  }, []);

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    if (!e.relatedTarget) {
      setDropActive(false);
    }
  }, []);

  const handleGlobalDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) addFiles(files);
  }, [addFiles]);

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
      if (
        target.tagName === 'INPUT'
        || target.tagName === 'SELECT'
        || target.tagName === 'TEXTAREA'
        || target.isContentEditable
      ) return;

      const audio = audioRef.current;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey || e.metaKey || e.ctrlKey) nextTrack();
          else if (audio?.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          break;
        case 'ArrowLeft':
          if (e.shiftKey || e.metaKey || e.ctrlKey) prevTrack();
          else if (audio) audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowUp': {
          if (!audio) break;
          const v = Math.min(1, audio.volume + 0.05);
          setVolume(v);
          break;
        }
        case 'ArrowDown': {
          if (!audio) break;
          const v = Math.max(0, audio.volume - 0.05);
          setVolume(v);
          break;
        }
        case 'KeyI':
          toggleImmersive();
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'KeyR':
          toggleRepeat();
          break;
        case 'KeyL':
          toggleLike();
          break;
        case 'KeyQ':
          setMobileQueueOpen((v) => !v);
          break;
        case 'Escape':
          if (immersiveOpen) toggleImmersive();
          if (playlistDialogOpen) setPlaylistDialogOpen(false);
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [
    audioRef,
    immersiveOpen,
    nextTrack,
    playlistDialogOpen,
    prevTrack,
    setVolume,
    toggleImmersive,
    toggleLike,
    togglePlay,
    toggleRepeat,
    toggleShuffle,
  ]);

  const handleSavePlaylist = useCallback(() => {
    setPlaylistError('');
    setPlaylistName('');
    setPlaylistDialogOpen(true);
  }, []);

  const handleConfirmSavePlaylist = useCallback(() => {
    const name = playlistName.trim();
    if (!name) {
      setPlaylistError('Playlist name is required.');
      return;
    }
    if (playlists[name]) {
      setPlaylistError('A playlist with this name already exists.');
      return;
    }
    savePlaylist(name);
    setPlaylistDialogOpen(false);
  }, [playlistName, playlists, savePlaylist]);

  const handleTrackSelect = useCallback((index: number) => {
    if (index === currentIndex) togglePlay();
    else loadTrack(index, true);
    setMobileQueueOpen(false);
  }, [currentIndex, loadTrack, togglePlay]);

  const hasTracks = tracks.length > 0;

  return (
    <>
      <AmbientCanvas mood={store.mood} />

      <audio ref={store.audioRef} preload="auto" crossOrigin="anonymous" />

      <div className={`mobile-sidebar-backdrop${mobileQueueOpen ? ' open' : ''}`} onClick={() => setMobileQueueOpen(false)} />

      <div className="app">
        <Header
          mood={store.mood}
          playlists={store.playlists}
          activePlaylist={store.activePlaylist}
          onAddFiles={store.addFiles}
          onSavePlaylist={handleSavePlaylist}
          onLoadPlaylist={store.loadPlaylist}
          onToggleImmersive={store.toggleImmersive}
          mobileQueueOpen={mobileQueueOpen}
          onToggleMobileQueue={() => setMobileQueueOpen((v) => !v)}
        />

        <Sidebar
          tracks={store.tracks}
          filteredTracks={store.filteredTracks}
          currentIndex={store.currentIndex}
          isPlaying={store.isPlaying}
          searchQuery={store.searchQuery}
          mobileOpen={mobileQueueOpen}
          collapsed={sidebarCollapsed}
          onCloseMobile={() => setMobileQueueOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          onSelect={handleTrackSelect}
          onRemove={store.removeTrack}
          onReorder={store.reorderTrack}
          onClearAll={store.clearAll}
          onSearch={store.setSearchQuery}
        />

        {sidebarCollapsed && (
          <button
            className="sidebar-expand-btn"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        <main className="main" id="main-area" aria-hidden={mobileQueueOpen}>
          <div className={`drop-zone${dropActive ? ' active' : ''}`}>
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
              hasTracks={hasTracks}
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
          onTogglePlay={store.togglePlay}
          onPrev={store.prevTrack}
          onNext={store.nextTrack}
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

      <Toast show={store.showToast} currentTrack={store.currentTrack} errorMessage={store.errorMessage} />

      {playlistDialogOpen && (
        <div className="playlist-modal-backdrop" onClick={() => setPlaylistDialogOpen(false)}>
          <div
            className="playlist-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Save playlist"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Save Playlist</h2>
            <input
              ref={playlistInputRef}
              type="text"
              value={playlistName}
              onChange={(e) => {
                setPlaylistName(e.target.value);
                if (playlistError) setPlaylistError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmSavePlaylist();
              }}
              placeholder="Playlist name"
              aria-label="Playlist name"
            />
            {playlistError && <p className="playlist-error">{playlistError}</p>}
            <div className="playlist-actions">
              <button onClick={() => setPlaylistDialogOpen(false)}>Cancel</button>
              <button onClick={handleConfirmSavePlaylist}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}