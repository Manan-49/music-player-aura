import type { Track } from '../types';

const DB_NAME = 'auraDB_v4';
const STORE = 'tracks';

type StoredTrack = Omit<Track, 'url' | 'blob'> & { blob: File };

export function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export function dbPut(db: IDBDatabase, track: StoredTrack): Promise<void> {
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(track);
    tx.oncomplete = () => res();
  });
}

export function dbGetAll(db: IDBDatabase): Promise<StoredTrack[]> {
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readonly');
    const rq = tx.objectStore(STORE).getAll();
    rq.onsuccess = () => res((rq.result as StoredTrack[]) || []);
  });
}

export function dbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
  });
}

export function dbClear(db: IDBDatabase): Promise<void> {
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => res();
  });
}
