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

  const moodClass = MOODS[store.mood].cls;

  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgName, setDlgName] = useState('');
  const [dlgError, setDlgError] = useState('');

  const dlgInputRef = useRef<HTMLInputElement>(null);

  const {
    audioRef, togglePlay, nextTrack, prevTrack,
    toggleShuffle, toggleRepeat, setVolume,
    toggleImmersive, toggleLike, addFiles,
    currentIndex, loadTrack, immersiveOpen,
    tracks, playlists, savePlaylist,
  } = store;

  /* mood class on <html> */
  useEffect(() => {
    const all = Object.values(MOODS).map((m) => m.cls).filter(Boolean);
    document.documentElement.classList.remove(...all);
    if (moodClass) document.documentElement.classList.add(moodClass);
    return () => document.documentElement.classList.remove(...all);
  }, [moodClass]);

  useEffect(() => { if (dlgOpen) dlgInputRef.current?.focus(); }, [dlgOpen]);

  useEffect(() => {
    if (!mobileQueueOpen) return;
    const h = () => setMobileQueueOpen(false);
    window.addEventListener('resize', h, { once: true });
    return () => window.removeEventListener('resize', h);
  }, [mobileQueueOpen]);

  /* Global drag-and-drop */
  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDropActive(true); }, []);
  const onDragLeave = useCallback((e: DragEvent) => { if (!e.relatedTarget) setDropActive(false); }, []);
  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setDropActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) addFiles(files);
  }, [addFiles]);

  useEffect(() => {
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onDragOver, onDragLeave, onDrop]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      const audio = audioRef.current;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight':
          if (e.shiftKey || e.metaKey || e.ctrlKey) nextTrack();
          else if (audio?.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          break;
        case 'ArrowLeft':
          if (e.shiftKey || e.metaKey || e.ctrlKey) prevTrack();
          else if (audio) audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowUp': if (audio) setVolume(Math.min(1, audio.volume + 0.05)); break;
        case 'ArrowDown': if (audio) setVolume(Math.max(0, audio.volume - 0.05)); break;
        case 'KeyI': toggleImmersive(); break;
        case 'KeyS': toggleShuffle(); break;
        case 'KeyR': toggleRepeat(); break;
        case 'KeyL': toggleLike(); break;
        case 'KeyQ': setMobileQueueOpen((v) => !v); break;
        case 'Escape':
          if (immersiveOpen) toggleImmersive();
          if (dlgOpen) setDlgOpen(false);
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [
    audioRef, immersiveOpen, nextTrack, dlgOpen,
    prevTrack, setVolume, toggleImmersive, toggleLike,
    togglePlay, toggleRepeat, toggleShuffle,
  ]);

  const handleSavePlaylist = useCallback(() => {
    setDlgError(''); setDlgName(''); setDlgOpen(true);
  }, []);

  const handleConfirmSave = useCallback(() => {
    const name = dlgName.trim();
    if (!name) { setDlgError('Playlist name is required.'); return; }
    if (playlists[name]) { setDlgError('Name already exists.'); return; }
    savePlaylist(name);
    setDlgOpen(false);
  }, [dlgName, playlists, savePlaylist]);

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

      {/* Mobile sidebar backdrop */}
      <div
        className={`mobile-backdrop${mobileQueueOpen ? ' open' : ''}`}
        onClick={() => setMobileQueueOpen(false)}
      />

      <div className={`app${sidebarCollapsed ? ' sidebar-off' : ''}`}>
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
          {/* Drop zone */}
          <div className={`drop-zone${dropActive ? ' active' : ''}`}>
            <div className="dz-ring">🎶</div>
            <h3>Drop audio files</h3>
            <p>MP3 · FLAC · WAV · OGG · M4A</p>
          </div>

          <div className="player-card">
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

      <Toast
        show={store.showToast}
        currentTrack={store.currentTrack}
        errorMessage={store.errorMessage}
      />

      {/* Playlist dialog */}
      {dlgOpen && (
        <div className="modal-backdrop" onClick={() => setDlgOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Save playlist"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Save Playlist</h2>
            <input
              ref={dlgInputRef}
              type="text"
              value={dlgName}
              onChange={(e) => { setDlgName(e.target.value); if (dlgError) setDlgError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSave(); }}
              placeholder="Playlist name…"
              aria-label="Playlist name"
            />
            {dlgError && <p className="modal-error">{dlgError}</p>}
            <div className="modal-actions">
              <button onClick={() => setDlgOpen(false)}>Cancel</button>
              <button onClick={handleConfirmSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}