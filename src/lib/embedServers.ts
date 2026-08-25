// Registry of iframe embed servers used by MoviePlayer as alternates to the
// direct MovieBox stream. Each builds a full embed URL for a TMDB id.

export interface EmbedServer {
  id: string;
  label: string;
  url: (ctx: { tmdbId: string; type: "movie" | "tv"; season: number; episode: number }) => string;
}

const vidsrc = (domain: string): EmbedServer["url"] =>
  ({ tmdbId, type, season, episode }) =>
    type === "tv"
      ? `https://${domain}/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1`
      : `https://${domain}/embed/movie/${tmdbId}?autoplay=1`;

export const EMBED_SERVERS: EmbedServer[] = [
  { id: "vidsrc.pm", label: "Server 1", url: vidsrc("vidsrc.pm") },
  { id: "vidsrc.to", label: "Server 2", url: vidsrc("vidsrc.to") },
  { id: "vidsrc.xyz", label: "Server 3", url: vidsrc("vidsrc.xyz") },
  { id: "vidsrc.net", label: "Server 4", url: vidsrc("vidsrc.net") },
  { id: "vidsrc.cc", label: "Server 5", url: vidsrc("vidsrc.cc") },
  { id: "vidsrc.in", label: "Server 6", url: vidsrc("vidsrc.in") },
  { id: "111movies.com", label: "Server 7", url: vidsrc("111movies.com") },
  {
    id: "videasy",
    label: "Server 8",
    url: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`
        : `https://player.videasy.net/movie/${tmdbId}`,
  },
  {
    id: "vidlink",
    label: "Server 9",
    url: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?autoplay=true`
        : `https://vidlink.pro/movie/${tmdbId}?autoplay=true`,
  },
  {
    id: "2embed.cc",
    label: "Server 10",
    url: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${tmdbId}`,
  },
  {
    id: "autoembed",
    label: "Server 11",
    url: ({ tmdbId, type, season, episode }) =>
      type === "tv"
        ? `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1`
        : `https://player.autoembed.cc/embed/movie/${tmdbId}?autoplay=1`,
  },
];

export const getEmbedServer = (id: string) => EMBED_SERVERS.find((s) => s.id === id);
