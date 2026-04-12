import type { Track } from '../types';

export function fmt(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function toRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(124,106,255,${alpha})`;
  hex = hex.trim();
  if (hex.startsWith('rgb')) {
    const n = hex.match(/[\d.]+/g);
    if (n && n.length >= 3) return `rgba(${n[0]},${n[1]},${n[2]},${alpha})`;
  }
  if (hex.length === 4 && hex.startsWith('#')) {
    const r = parseInt(`${hex[1]}${hex[1]}`, 16);
    const g = parseInt(`${hex[2]}${hex[2]}`, 16);
    const b = parseInt(`${hex[3]}${hex[3]}`, 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (hex.charAt(0) !== '#') return `rgba(124,106,255,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16) || 124;
  const g = parseInt(hex.slice(3, 5), 16) || 106;
  const b = parseInt(hex.slice(5, 7), 16) || 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function cleanName(fn: string): string {
  return fn.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function u8b64(bytes: Uint8Array): string {
  let s = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(s);
}

export function parseID3Art(buffer: ArrayBuffer): string | null {
  try {
    const b = new Uint8Array(buffer);
    if (b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return null;
    const sz = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
    let o = 10;
    const end = Math.min(10 + sz, b.length);
    while (o < end - 10) {
      const id = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
      const fs = (b[o + 4] << 24) | (b[o + 5] << 16) | (b[o + 6] << 8) | b[o + 7];
      o += 10;
      if (fs <= 0 || fs > end - o) break;
      if (id === 'APIC') {
        let i = o + 1;
        while (i < o + fs && b[i] !== 0) i++;
        const mime = String.fromCharCode.apply(null, Array.from(b.slice(o + 1, i))).toLowerCase();
        i++; i++;
        while (i < o + fs && b[i] !== 0) i++;
        i++;
        const img = b.slice(i, o + fs);
        const fmt2 = mime.indexOf('png') >= 0 ? 'image/png' : 'image/jpeg';
        return 'data:' + fmt2 + ';base64,' + u8b64(img);
      }
      o += fs;
    }
    return null;
  } catch {
    return null;
  }
}

export interface MetaResult {
  title?: string;
  artist?: string;
  art?: string;
}

export function extractMeta(track: Track): Promise<MetaResult> {
  return new Promise((res) => {
    const w = window as unknown as { jsmediatags?: { read: (f: File, opts: { onSuccess: (tag: { tags: { title?: string; artist?: string; picture?: { data: number[]; format: string } } }) => void; onError: () => void }) => void } };
    if (w.jsmediatags) {
      w.jsmediatags.read(track.blob, {
        onSuccess: (tag) => {
          const t = tag.tags;
          const out: MetaResult = {};
          if (t.title) out.title = t.title;
          if (t.artist) out.artist = t.artist;
          if (t.picture) {
            const d = t.picture.data, f = t.picture.format;
            let bin = '';
            for (let i = 0; i < d.length; i++) bin += String.fromCharCode(d[i]);
            out.art = `data:${f};base64,${btoa(bin)}`;
          }
          res(out);
        },
        onError: () => {
          track.blob.arrayBuffer()
            .then((buf) => { const art = parseID3Art(buf); res(art ? { art } : {}); })
            .catch(() => res({}));
        },
      });
    } else {
      track.blob.arrayBuffer()
        .then((buf) => { const art = parseID3Art(buf); res(art ? { art } : {}); })
        .catch(() => res({}));
    }
  });
}

export function extractDuration(track: Track): Promise<number | null> {
  if (!track.blob) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(track.blob);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = url;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.src = '';
    };
    audio.onloadedmetadata = () => {
      const d = Number.isFinite(audio.duration) ? audio.duration : null;
      cleanup();
      resolve(d);
    };
    audio.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

export function buildWaveformData(blob: File, pts = 220): Promise<{ data: Float32Array; duration: number }> {
  return blob.arrayBuffer().then((buf) => {
    const offCtx = new OfflineAudioContext(1, 1, 44100);
    return offCtx.decodeAudioData(buf.slice(0)).then((decoded) => {
      const raw = decoded.getChannelData(0);
      const block = Math.floor(raw.length / pts);
      const data = new Float32Array(pts);
      for (let i = 0; i < pts; i++) {
        let sum = 0;
        for (let j = 0; j < block; j++) sum += Math.abs(raw[i * block + j]);
        data[i] = sum / block;
      }
      let max = 0;
      for (let i = 0; i < data.length; i++) if (data[i] > max) max = data[i];
      if (max > 0) for (let i = 0; i < data.length; i++) data[i] /= max;
      return { data, duration: decoded.duration };
    });
  });
}

export function extractAverageColor(art: string): Promise<{ r: number; g: number; b: number } | null> {
  return new Promise((res) => {
    const img = new Image();
    img.src = art;
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const x = c.getContext('2d', { willReadFrequently: true });
      if (!x) { res(null); return; }
      x.drawImage(img, 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      res({ r: (r / n) | 0, g: (g / n) | 0, b: (b / n) | 0 });
    };
    img.onerror = () => res(null);
  });
}
