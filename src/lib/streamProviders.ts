// Central registry of all iframe stream providers used by MoviePlayer.
// URL templates are the current public embed formats for each service.
// Auto-cycle order matches export order.

export type ServerId =
  | "hd"
  | "vidsrc"
  | "vidlink"
  | "vidsrcpro"
  | "vidzee"
  | "vidfast"
  | "vidnest"
  | "megaplay"
  | "nontongo"
  | "smashy";

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
    id: "vidsrc",
    label: "VidSrc",
    short: "VidSrc",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://vidsrc.su/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.su/embed/movie/${tmdbId}`,
  },
  {
    id: "vidlink",
    label: "VidLink",
    short: "VidLink",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidlink.pro/movie/${tmdbId}`,
  },
  {
    id: "vidsrcpro",
    label: "VidSrc.pro",
    short: "VidPro",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${tmdbId}`,
  },
  {
    id: "vidzee",
    label: "VidZee",
    short: "VidZee",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://player.vidzee.wtf/embed/tv?id=${tmdbId}&s=${season}&e=${episode}`
        : `https://player.vidzee.wtf/embed/movie?id=${tmdbId}`,
  },
  {
    id: "vidfast",
    label: "VidFast",
    short: "VidFast",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidfast.pro/movie/${tmdbId}`,
  },
  {
    id: "vidnest",
    label: "VidNest",
    short: "VidNest",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`
        : `https://vidnest.fun/movie/${tmdbId}`,
  },
  {
    id: "megaplay",
    label: "MegaPlay",
    short: "MegaPlay",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://megaplay.buzz/stream/tv/${tmdbId}/${season}/${episode}`
        : `https://megaplay.buzz/stream/movie/${tmdbId}`,
  },
  {
    id: "nontongo",
    label: "Nontongo",
    short: "Nontongo",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://www.nontongo.win/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://www.nontongo.win/embed/movie/${tmdbId}`,
  },
  {
    id: "smashy",
    label: "Smashy",
    short: "Smashy",
    build: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`,
  },
];

export const getProvider = (id: ServerId) =>
  PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
