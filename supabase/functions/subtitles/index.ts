// OpenSubtitles integration.
// GET /functions/v1/subtitles?action=list&type=movie|episode&tmdbId=...&season=...&episode=...&imdbId=...&languages=en
// GET /functions/v1/subtitles?action=vtt&fileId=...
//
// Requires env: OPENSUBTITLES_API_KEY

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const API = "https://api.opensubtitles.com/api/v1";
const UA = "NowAnime v1.0";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

// Minimal SRT → WebVTT converter.
function srtToVtt(srt: string): string {
  const body = srt
    .replace(/\r+/g, "")
    // timestamp commas → dots
    .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2");
  return "WEBVTT\n\n" + body.trim() + "\n";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("OPENSUBTITLES_API_KEY");
  if (!apiKey) return json({ ok: false, reason: "missing api key" }, 500);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "list";

  const baseHeaders = {
    "Api-Key": apiKey,
    "User-Agent": UA,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    if (action === "list") {
      const type = url.searchParams.get("type") || "movie"; // movie | episode
      const tmdbId = url.searchParams.get("tmdbId");
      const imdbId = url.searchParams.get("imdbId");
      const season = url.searchParams.get("season");
      const episode = url.searchParams.get("episode");
      const languages = url.searchParams.get("languages") || "en";

      const q = new URLSearchParams();
      if (tmdbId) q.set("tmdb_id", tmdbId);
      if (imdbId) q.set("imdb_id", imdbId.replace(/^tt/, ""));
      q.set("languages", languages);
      if (type === "episode") {
        q.set("type", "episode");
        if (season) q.set("season_number", season);
        if (episode) q.set("episode_number", episode);
      } else {
        q.set("type", "movie");
      }
      q.set("order_by", "download_count");

      const r = await fetch(`${API}/subtitles?${q.toString()}`, { headers: baseHeaders });
      if (!r.ok) return json({ ok: false, reason: `list failed ${r.status}` }, 502);
      const data = await r.json();
      const items = (data?.data || []).slice(0, 20).map((it: any) => {
        const attr = it.attributes || {};
        const file = (attr.files || [])[0] || {};
        return {
          id: it.id,
          fileId: file.file_id,
          language: attr.language,
          languageName: attr.language,
          release: attr.release,
          downloads: attr.download_count,
          hearingImpaired: attr.hearing_impaired,
        };
      }).filter((x: any) => x.fileId);
      return json({ ok: true, subtitles: items });
    }

    if (action === "vtt") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) return json({ ok: false, reason: "fileId required" }, 400);

      // 1) Request a download link from OpenSubtitles.
      const dl = await fetch(`${API}/download`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ file_id: Number(fileId) }),
      });
      if (!dl.ok) {
        const t = await dl.text().catch(() => "");
        return json({ ok: false, reason: `download failed ${dl.status}`, detail: t }, 502);
      }
      const dlData = await dl.json();
      const link = dlData?.link;
      if (!link) return json({ ok: false, reason: "no link" }, 502);

      // 2) Fetch the SRT and convert to WebVTT.
      const srtResp = await fetch(link);
      if (!srtResp.ok) return json({ ok: false, reason: `srt fetch ${srtResp.status}` }, 502);
      const srt = await srtResp.text();
      const vtt = srt.trim().startsWith("WEBVTT") ? srt : srtToVtt(srt);

      return new Response(vtt, {
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "text/vtt; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      });
    }

    return json({ ok: false, reason: "unknown action" }, 400);
  } catch (e) {
    return json({ ok: false, reason: String(e) }, 500);
  }
});
