// Client helper for the OpenSubtitles-backed `subtitles` edge function.
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export interface SubtitleTrack {
  fileId: number;
  language: string;
  languageName: string;
  release?: string;
  downloads?: number;
  hearingImpaired?: boolean;
}

const BASE = `${SUPABASE_URL}/functions/v1/subtitles`;

export async function listSubtitles(args: {
  type: "movie" | "episode";
  tmdbId?: string | number;
  imdbId?: string | null;
  season?: number;
  episode?: number;
  languages?: string;
}): Promise<SubtitleTrack[]> {
  const q = new URLSearchParams({ action: "list", type: args.type });
  if (args.tmdbId) q.set("tmdbId", String(args.tmdbId));
  if (args.imdbId) q.set("imdbId", args.imdbId);
  if (args.season) q.set("season", String(args.season));
  if (args.episode) q.set("episode", String(args.episode));
  q.set("languages", args.languages || "en");
  try {
    const r = await fetch(`${BASE}?${q.toString()}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.subtitles || []) as SubtitleTrack[];
  } catch {
    return [];
  }
}

export function subtitleVttUrl(fileId: number): string {
  // The edge function returns a text/vtt body directly.
  return `${BASE}?action=vtt&fileId=${fileId}&apikey=${encodeURIComponent(SUPABASE_PUBLISHABLE_KEY)}`;
}
