// resolve-stream
// Central aggregator: takes a TMDB (or IMDb) id and returns a playable stream.
// Providers, in order:
//   1) faststreams   - VidSrc domain rotator (embed)
//   2) hd            - MovieBox direct MP4/HLS extraction (native <video>)
//   3) mirror        - NetMirror-style embed rotator (Netflix/Hotstar/Prime templates)
//
// Response shape (always 200):
//   { ok, kind: "embed"|"hls"|"mp4", streamUrl, source, provider, diagnostics }
//   { ok:false, error, diagnostics }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TMDB_KEY = Deno.env.get("TMDB_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

// ---------- VidSrc / FastStreams domain chain ----------
const VIDSRC_DOMAINS = [
  "vidsrc.pm",
  "vidsrc.su",
  "vsrc.su",
  "vidsrcme.ru",
  "vidsrcme.su",
  "vidsrc-me.ru",
  "vidsrc-embed.ru",
  "vidsrc-embed.su",
  "vidsrc.xyz",
];

const FALLBACK_EMBEDS = [
  "2embed.cc",
  "autoembed.co",
  "multiembed.mov",
  "vidfast.pro",
];

// NetMirror-style provider templates (subset of Sushan64/NetMirror-Extension).
const NETMIRROR_PROVIDERS = [
  {
    id: "netflix",
    label: "Netflix Mirror",
    movie: (id: string) => `https://netmirror.8man.me/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://netmirror.8man.me/tv/${id}/${s}/${e}`,
  },
  {
    id: "hotstar",
    label: "Hotstar Mirror",
    movie: (id: string) => `https://hotstarmirror.icu/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://hotstarmirror.icu/tv/${id}/${s}/${e}`,
  },
  {
    id: "prime",
    label: "Prime Mirror",
    movie: (id: string) => `https://primemirror.win/movie/${id}`,
    tv: (id: string, s: number, e: number) => `https://primemirror.win/tv/${id}/${s}/${e}`,
  },
];

function buildVidsrcUrl(domain: string, tmdbId: string, type: "movie" | "tv", season?: number, episode?: number) {
  if (domain === "2embed.cc") {
    return type === "tv"
      ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
      : `https://www.2embed.cc/embed/${tmdbId}`;
  }
  if (domain === "autoembed.co") {
    return type === "tv"
      ? `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1`
      : `https://player.autoembed.cc/embed/movie/${tmdbId}?autoplay=1`;
  }
  if (domain === "multiembed.mov") {
    return type === "tv"
      ? `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
      : `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`;
  }
  if (domain === "vidfast.pro") {
    return type === "tv"
      ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoPlay=true`
      : `https://vidfast.pro/movie/${tmdbId}?autoPlay=true`;
  }
  return type === "tv"
    ? `https://${domain}/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1`
    : `https://${domain}/embed/movie/${tmdbId}?autoplay=1`;
}

// Fast probe (HEAD/GET with abort). Returns true if the URL responds < 4s with 2xx/3xx.
async function probe(url: string, timeoutMs = 4000): Promise<boolean> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
      redirect: "follow",
    });
    // Consume body to avoid leak
    try { await r.body?.cancel(); } catch { /* noop */ }
    return r.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// ---------- IMDb -> TMDB ----------
async function resolveTmdbId(rawId: string, type: "movie" | "tv"): Promise<string | null> {
  if (!rawId.startsWith("tt")) return rawId;
  if (!TMDB_KEY) return null;
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/find/${rawId}?api_key=${TMDB_KEY}&external_source=imdb_id`,
    );
    if (!r.ok) return null;
    const data = await r.json();
    const arr = type === "tv" ? data.tv_results : data.movie_results;
    return arr?.[0]?.id ? String(arr[0].id) : null;
  } catch {
    return null;
  }
}

// ---------- FastStreams: rotate VidSrc domains, first that probes -> return embed ----------
async function resolveFastStreams(tmdbId: string, type: "movie" | "tv", season?: number, episode?: number) {
  const chain = [...VIDSRC_DOMAINS, ...FALLBACK_EMBEDS];
  const attempts: { domain: string; ok: boolean }[] = [];
  for (const domain of chain) {
    const url = buildVidsrcUrl(domain, tmdbId, type, season, episode);
    const ok = await probe(url);
    attempts.push({ domain, ok });
    if (ok) {
      return { streamUrl: url, source: `faststreams:${domain}`, attempts };
    }
  }
  // Nothing probed OK — return first domain anyway (iframe may still render).
  const fallback = buildVidsrcUrl(VIDSRC_DOMAINS[0], tmdbId, type, season, episode);
  return { streamUrl: fallback, source: `faststreams:${VIDSRC_DOMAINS[0]} (unprobed)`, attempts };
}

// ---------- HD: call moviebox-resolve for direct MP4/HLS ----------
async function resolveHD(
  title: string,
  year: string | undefined,
  type: "movie" | "tv",
  season?: number,
  episode?: number,
) {
  if (!SUPABASE_URL) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/moviebox-resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
      },
      body: JSON.stringify({
        title,
        year,
        mediaType: type === "tv" ? "tv" : "movie",
        season,
        episode,
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data?.ok || !Array.isArray(data.downloads) || data.downloads.length === 0) return null;
    // Prefer highest resolution
    const sorted = [...data.downloads].sort(
      (a: any, b: any) => (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0),
    );
    const best = sorted[0];
    if (!best?.url) return null;
    const kind = /\.m3u8/i.test(best.url) ? "hls" : "mp4";
    return { streamUrl: best.url, source: `hd:moviebox-${best.resolution}`, kind };
  } catch {
    return null;
  }
}

// ---------- Mirror: rotate NetMirror templates ----------
async function resolveMirror(tmdbId: string, type: "movie" | "tv", season?: number, episode?: number) {
  const attempts: { id: string; ok: boolean }[] = [];
  for (const p of NETMIRROR_PROVIDERS) {
    const url = type === "tv" ? p.tv(tmdbId, season || 1, episode || 1) : p.movie(tmdbId);
    const ok = await probe(url, 3500);
    attempts.push({ id: p.id, ok });
    if (ok) return { streamUrl: url, source: `mirror:${p.id}`, attempts };
  }
  // Fallback to first
  const p = NETMIRROR_PROVIDERS[0];
  const url = type === "tv" ? p.tv(tmdbId, season || 1, episode || 1) : p.movie(tmdbId);
  return { streamUrl: url, source: `mirror:${p.id} (unprobed)`, attempts };
}

function respond(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const t0 = Date.now();
  try {
    let body: any = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
    } else {
      const u = new URL(req.url);
      body = Object.fromEntries(u.searchParams.entries());
    }

    const provider = (body.provider || "faststreams") as "faststreams" | "hd" | "mirror";
    const rawId = String(body.tmdbId || body.imdbId || "");
    const type = (body.type === "tv" ? "tv" : "movie") as "movie" | "tv";
    const season = body.season != null ? Number(body.season) : undefined;
    const episode = body.episode != null ? Number(body.episode) : undefined;
    const title = String(body.title || "");
    const year = body.year ? String(body.year) : undefined;

    if (!rawId) return respond({ ok: false, error: "Missing tmdbId" });
    if (type === "tv" && (!season || !episode)) {
      return respond({ ok: false, error: "season and episode required for tv" });
    }

    const tmdbId = (await resolveTmdbId(rawId, type)) || rawId;

    if (provider === "hd") {
      if (!title) {
        return respond({ ok: false, error: "title required for hd", provider });
      }
      const hd = await resolveHD(title, year, type, season, episode);
      if (hd) {
        return respond({
          ok: true,
          provider: "hd",
          kind: hd.kind,
          streamUrl: hd.streamUrl,
          source: hd.source,
          diagnostics: { ms: Date.now() - t0 },
        });
      }
      // Fall through to faststreams as backup
      const fs = await resolveFastStreams(tmdbId, type, season, episode);
      return respond({
        ok: true,
        provider: "hd",
        kind: "embed",
        streamUrl: fs.streamUrl,
        source: `hd-fallback → ${fs.source}`,
        diagnostics: { ms: Date.now() - t0, attempts: fs.attempts },
      });
    }

    if (provider === "mirror") {
      const m = await resolveMirror(tmdbId, type, season, episode);
      return respond({
        ok: true,
        provider: "mirror",
        kind: "embed",
        streamUrl: m.streamUrl,
        source: m.source,
        diagnostics: { ms: Date.now() - t0, attempts: m.attempts },
      });
    }

    // Default: FastStreams
    const fs = await resolveFastStreams(tmdbId, type, season, episode);
    return respond({
      ok: true,
      provider: "faststreams",
      kind: "embed",
      streamUrl: fs.streamUrl,
      source: fs.source,
      diagnostics: { ms: Date.now() - t0, attempts: fs.attempts },
    });
  } catch (err) {
    return respond({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      diagnostics: { ms: Date.now() - t0 },
    });
  }
});
