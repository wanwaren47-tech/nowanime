// Legacy YouTube-style content hook. The backend proxy it used is gone —
// the app is 100% client-side now and all content comes from TMDB.
// Kept only for the shared `NormalizedVideo` shape used by a few cards.
export interface NormalizedVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
  duration: string;
}

export function useKenyaContent(_query: string, _enabled = true) {
  return { data: [] as NormalizedVideo[], isLoading: false };
}

export function useTrending() {
  return { data: [] as NormalizedVideo[], isLoading: false };
}
