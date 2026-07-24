// Resume-playback storage. Persists position per title/episode so users can
// pick up where they left off — works for online streams and offline blobs.

const NS = "nowanime:progress:v1";

export interface Progress {
  position: number;
  duration: number;
  updatedAt: number;
}

type Store = Record<string, Progress>;

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(NS) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(s: Store) {
  try { localStorage.setItem(NS, JSON.stringify(s)); } catch { /* quota */ }
}

export function progressKey(args: {
  type: "movie" | "tv" | "anime";
  tmdbId: string | number;
  season?: number;
  episode?: number;
}): string {
  const { type, tmdbId, season, episode } = args;
  if (type === "tv" || type === "anime") {
    return `${type}-${tmdbId}-s${season ?? 1}-e${episode ?? 1}`;
  }
  return `${type}-${tmdbId}`;
}

export function getProgress(key: string): Progress | null {
  const s = read();
  return s[key] || null;
}

export function saveProgress(key: string, position: number, duration: number) {
  if (!key || !isFinite(position) || position < 5) return;
  // Consider "finished" if within 30s of end — clear instead of save.
  if (duration > 0 && position >= duration - 30) {
    clearProgress(key);
    return;
  }
  const s = read();
  s[key] = { position, duration, updatedAt: Date.now() };
  write(s);
}

export function clearProgress(key: string) {
  const s = read();
  if (s[key]) { delete s[key]; write(s); }
}

export function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const mm = m.toString().padStart(h ? 2 : 1, "0");
  const ss = s.toString().padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Wire a <video> to a progress key. Seeks to saved position on metadata load
 * (if not effectively finished), throttles writes, clears on natural end.
 */
export function attachProgress(video: HTMLVideoElement, key: string) {
  if (!video || !key) return () => {};
  let last = 0;
  const onMeta = () => {
    const p = getProgress(key);
    if (!p) return;
    const dur = video.duration || p.duration || 0;
    if (dur > 0 && p.position < dur - 30) {
      try { video.currentTime = p.position; } catch { /* ignore */ }
    }
  };
  const onTime = () => {
    const now = Date.now();
    if (now - last < 5000) return;
    last = now;
    saveProgress(key, video.currentTime, video.duration || 0);
  };
  const onEnded = () => clearProgress(key);
  video.addEventListener("loadedmetadata", onMeta);
  video.addEventListener("timeupdate", onTime);
  video.addEventListener("ended", onEnded);
  return () => {
    video.removeEventListener("loadedmetadata", onMeta);
    video.removeEventListener("timeupdate", onTime);
    video.removeEventListener("ended", onEnded);
  };
}
