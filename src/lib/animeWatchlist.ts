// Lightweight anime watchlist backed by localStorage. Kept separate from the
// legacy YouTube-style `my_list` so it can store TMDB items with the fields the
// detail pages already have.

export interface WatchlistItem {
  id: number | string;
  type: "movie" | "tv";
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  year?: string;
  addedAt: number;
}

const KEY = "nowanime_watchlist";
const EVT = "nowanime-watchlist-updated";

function read(): WatchlistItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: WatchlistItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function getWatchlist(): WatchlistItem[] {
  return read().sort((a, b) => b.addedAt - a.addedAt);
}

export function isInWatchlist(id: number | string, type: "movie" | "tv"): boolean {
  return read().some((v) => String(v.id) === String(id) && v.type === type);
}

/** Toggle membership. Returns true if the item is now saved. */
export function toggleWatchlist(item: Omit<WatchlistItem, "addedAt">): boolean {
  const list = read();
  const idx = list.findIndex(
    (v) => String(v.id) === String(item.id) && v.type === item.type,
  );
  if (idx >= 0) {
    list.splice(idx, 1);
    write(list);
    return false;
  }
  list.unshift({ ...item, addedAt: Date.now() });
  write(list);
  return true;
}

export const WATCHLIST_EVENT = EVT;
