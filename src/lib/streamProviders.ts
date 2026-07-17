// Central registry of iframe stream providers used by MoviePlayer.
// Reduced to 2 providers: 111Movies (HD, IMDb-based, default) with
// SmashyStream as automatic fallback.

export type ServerId = "hd" | "smashy";

export interface ProviderCtx {
  tmdbId: string;
  imdbId?: string | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
}

export interface Provider {
  id: ServerId;
  label: string;
  short: string;
  requiresImdb?: boolean;
  build: (ctx: ProviderCtx) => string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "hd",
    label: "HD · 111Movies",
    short: "HD",
    requiresImdb: true,
    build: ({ imdbId, tmdbId, type, season, episode }) => {
      const id = imdbId || tmdbId;
      return type === "tv"
        ? `https://111movies.com/tv/${id}/${season}/${episode}`
        : `https://111movies.com/movie/${id}`;
    },
  },
  {
    id: "smashy",
    label: "SmashyStream",
    short: "Smashy",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`,
  },
];

export const getProvider = (id: ServerId) =>
  PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
