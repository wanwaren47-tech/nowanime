// Client-side stream provider registry, backed by `tmdb-embed-providers`.
// No backend: embed URLs are built from the TMDB id right in the browser.
import { listProviders } from "tmdb-embed-providers";

export interface PlayerServer {
  id: string;
  label: string;
  short: string;
  buildMovieUrl: (tmdbId: number | string) => string | null;
  buildTvUrl: (tmdbId: number | string, season: number, episode: number) => string | null;
}

const shortLabel = (label: string) =>
  label.replace(/\.(pro|to|cc|pm|skin|net|xyz|su|me)$/i, "").slice(0, 10);

export const PLAYER_SERVERS: PlayerServer[] = listProviders({ tiers: ["core", "extras"] })
  .map((p) => ({
    id: p.id,
    label: p.label,
    short: shortLabel(p.label),
    buildMovieUrl: p.buildMovieUrl,
    buildTvUrl: p.buildTvUrl,
  }));

export type ServerId = string;

export const getServer = (id?: ServerId): PlayerServer =>
  PLAYER_SERVERS.find((p) => p.id === id) || PLAYER_SERVERS[0];

/** Build the embed URL for a title on a given server. */
export function buildEmbedUrl(
  server: PlayerServer,
  type: "movie" | "tv",
  tmdbId: string,
  season = 1,
  episode = 1,
): string | null {
  return type === "tv"
    ? server.buildTvUrl(tmdbId, season, episode)
    : server.buildMovieUrl(tmdbId);
}
