// Autoplay helpers for TV and Movies. TMDB calls go through the shared `tmdb`
// client so the API key stays server-side.
import { tmdb, tvSeason, movieSimilar } from "@/lib/tmdb";

export interface NextEpisode {
  tvId: string | number;
  season: number;
  episode: number;
}

export interface NextMovie {
  id: number;
  title: string;
}

/**
 * Given the current TV episode, resolve the next episode. Rolls over into the
 * following season when the current season ends. Returns `null` when the
 * series has no further episodes.
 */
export async function getNextEpisode(
  tvId: string | number,
  currentSeason: number,
  currentEpisode: number,
): Promise<NextEpisode | null> {
  try {
    const season: any = await tvSeason(tvId, currentSeason);
    const totalInSeason = (season?.episodes || []).length;
    if (currentEpisode + 1 <= totalInSeason) {
      return { tvId, season: currentSeason, episode: currentEpisode + 1 };
    }
    // Try next season.
    const details: any = await tmdb(`/tv/${tvId}`);
    const seasons = (details?.seasons || [])
      .filter((s: any) => s.season_number > currentSeason && s.episode_count > 0)
      .sort((a: any, b: any) => a.season_number - b.season_number);
    const next = seasons[0];
    if (next) return { tvId, season: next.season_number, episode: 1 };
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the first anime-flavoured similar movie for a TMDB movie ID.
 */
export async function getNextMovie(currentMovieId: string | number): Promise<NextMovie | null> {
  try {
    const res: any = await movieSimilar(currentMovieId);
    const list = res?.results || res || [];
    const pick = list.find((m: any) => m?.id && m?.title) || list[0];
    if (!pick) return null;
    return { id: pick.id, title: pick.title };
  } catch {
    return null;
  }
}

const KEY = "nowanime_autoplay";

export function getAutoplayEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(KEY);
  return v === null ? true : v === "true";
}

export function setAutoplayEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, v ? "true" : "false");
}
