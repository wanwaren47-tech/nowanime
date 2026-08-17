// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Generates 250+ pages including image + video sitemap entries for anime.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://nowanime.lovable.app";
const TMDB_KEY = process.env.TMDB_API_KEY || "";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

interface ImageRef { loc: string; caption?: string; title?: string; }
interface VideoRef {
  thumbnail: string;
  title: string;
  description: string;
  contentUrl?: string;
  playerUrl?: string;
}
interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  images?: ImageRef[];
  videos?: VideoRef[];
}

const HERO_IMG = `${IMG}/w1280/49WJfeN0moxb9IPfGn8AIqMGskD.jpg`;

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0", images: [{ loc: HERO_IMG, caption: "NowAnime — stream anime free in HD" }] },
  { path: "/home", changefreq: "daily", priority: "1.0" },
  { path: "/anime", changefreq: "daily", priority: "0.9" },
  { path: "/trending", changefreq: "daily", priority: "0.8" },
  { path: "/search", changefreq: "weekly", priority: "0.7" },
  { path: "/auth", changefreq: "monthly", priority: "0.5" },

  { path: "/profile", changefreq: "monthly", priority: "0.3" },
  { path: "/settings", changefreq: "monthly", priority: "0.3" },
  { path: "/my-list", changefreq: "weekly", priority: "0.4" },
  { path: "/liked", changefreq: "weekly", priority: "0.4" },
  { path: "/library", changefreq: "weekly", priority: "0.4" },
  { path: "/my-downloads", changefreq: "weekly", priority: "0.5" },
  { path: "/install", changefreq: "monthly", priority: "0.8" },
  { path: "/follow-us", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "yearly", priority: "0.3" },
  { path: "/help", changefreq: "yearly", priority: "0.3" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/legal-notices", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie-preferences", changefreq: "yearly", priority: "0.3" },
  { path: "/speed-test", changefreq: "yearly", priority: "0.3" },
];

// Anime genre = 16 on TMDB (Animation). We further filter for original_language=ja.
async function fetchAnimeTv(page: number): Promise<any[]> {
  if (!TMDB_KEY) return [];
  const url = `${TMDB}/discover/tv?api_key=${TMDB_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const j: any = await r.json();
    return j.results || [];
  } catch { return []; }
}
async function fetchAnimeMovies(page: number): Promise<any[]> {
  if (!TMDB_KEY) return [];
  const url = `${TMDB}/discover/movie?api_key=${TMDB_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const j: any = await r.json();
    return j.results || [];
  } catch { return []; }
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function toEntry(item: any, type: "tv" | "movie"): SitemapEntry {
  const title = item.name || item.title || "Anime";
  const overview = (item.overview || `Watch ${title} on NowAnime`).slice(0, 500);
  const poster = item.poster_path ? `${IMG}/w780${item.poster_path}` : HERO_IMG;
  const backdrop = item.backdrop_path ? `${IMG}/w1280${item.backdrop_path}` : poster;
  const playerUrl = type === "tv"
    ? `${BASE_URL}/watch/tv/${item.id}/1/1`
    : `${BASE_URL}/watch/movie/${item.id}`;
  return {
    path: `/${type}/${item.id}`,
    changefreq: "weekly",
    priority: "0.7",
    images: [{ loc: poster, caption: title, title }, { loc: backdrop, title: `${title} backdrop` }],
    videos: [{
      thumbnail: poster,
      title,
      description: overview,
      playerUrl,
    }],
  };
}

async function collectDynamicEntries(target: number): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];
  const seenTv = new Set<number>();
  const seenMovie = new Set<number>();
  let page = 1;
  // Pull TV anime first (bulk of the catalog), interleave movies.
  while (out.length < target && page <= 15) {
    const [tv, movies] = await Promise.all([fetchAnimeTv(page), fetchAnimeMovies(page)]);
    for (const it of tv) {
      if (seenTv.has(it.id)) continue;
      seenTv.add(it.id);
      out.push(toEntry(it, "tv"));
      // Add matching watch route for coverage
      out.push({
        path: `/watch/tv/${it.id}/1/1`,
        changefreq: "weekly",
        priority: "0.6",
      });
      if (out.length >= target) break;
    }
    if (out.length >= target) break;
    for (const it of movies) {
      if (seenMovie.has(it.id)) continue;
      seenMovie.add(it.id);
      out.push(toEntry(it, "movie"));
      out.push({
        path: `/watch/movie/${it.id}`,
        changefreq: "weekly",
        priority: "0.6",
      });
      if (out.length >= target) break;
    }
    page++;
    if (tv.length === 0 && movies.length === 0) break;
  }
  return out;
}

const SITEMAP_NS = [
  `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
  `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`,
  `xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"`,
].join(" ");

function renderEntry(e: SitemapEntry): string {
  const parts: string[] = [
    `  <url>`,
    `    <loc>${BASE_URL}${e.path}</loc>`,
  ];
  if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
  if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
  for (const i of e.images || []) {
    parts.push(`    <image:image>`);
    parts.push(`      <image:loc>${esc(i.loc)}</image:loc>`);
    if (i.title) parts.push(`      <image:title>${esc(i.title)}</image:title>`);
    if (i.caption) parts.push(`      <image:caption>${esc(i.caption)}</image:caption>`);
    parts.push(`    </image:image>`);
  }
  for (const v of e.videos || []) {
    parts.push(`    <video:video>`);
    parts.push(`      <video:thumbnail_loc>${esc(v.thumbnail)}</video:thumbnail_loc>`);
    parts.push(`      <video:title>${esc(v.title)}</video:title>`);
    parts.push(`      <video:description>${esc(v.description)}</video:description>`);
    if (v.playerUrl) parts.push(`      <video:player_loc>${esc(v.playerUrl)}</video:player_loc>`);
    if (v.contentUrl) parts.push(`      <video:content_loc>${esc(v.contentUrl)}</video:content_loc>`);
    parts.push(`      <video:family_friendly>yes</video:family_friendly>`);
    parts.push(`      <video:live>no</video:live>`);
    parts.push(`    </video:video>`);
  }
  parts.push(`  </url>`);
  return parts.join("\n");
}

async function main() {
  const NEEDED = 260 - staticEntries.length;
  const dynamic = await collectDynamicEntries(NEEDED);

  // Fallback: 130+ curated anime TMDB ids so we ship ≥250 entries even
  // when TMDB is unreachable at build time.
  const FALLBACK_TV = [
    1429, 46260, 31910, 37854, 30984, 95479, 13916, 30991, 46298, 65930,
    85937, 114410, 99966, 30983, 83095, 62741, 45782, 46952, 60863, 12971,
    114695, 93740, 92685, 94664, 100088, 90228, 94997, 96648, 105248, 89685,
    90790, 65249, 61374, 63926, 63332, 68716, 71914, 73223, 74776, 75450,
    77169, 79501, 81797, 80564, 83067, 86031, 87108, 88329, 89686, 90680,
    93142, 93685, 94682, 96060, 97374, 98290, 99027, 101040, 102046, 103283,
    104254, 105108, 106088, 107078, 108046, 42410, 43423, 44006, 45782, 46261,
    47640, 48891, 49020, 50026, 51818, 52814, 54155, 55175, 56905, 57532,
    59266, 60625, 61889, 62286, 63174, 64196, 65733, 66732, 67200, 68507,
    69478, 70668, 71446, 72879, 74705, 76669, 78191, 79680, 82684, 85803,
    87739, 89229, 90802, 91557, 92749, 93810, 94608, 95312, 96047, 97531,
    99321, 100889, 102903, 103768, 105123, 106379, 108545, 110316, 112470, 113962,
  ];
  const FALLBACK_MOVIE = [
    129, 372058, 568160, 508883, 4935, 128, 149, 62177, 38142, 12429,
    10515, 22538, 15342, 81, 76341, 8687, 137113, 210577, 293670, 447365,
    346364, 4995, 66574, 122806, 244786, 315635, 335983, 396422, 429617, 466272,
  ];
  if (dynamic.length < NEEDED) {
    const already = new Set(dynamic.map((e) => e.path));
    for (const id of FALLBACK_TV) {
      const p = `/tv/${id}`;
      if (!already.has(p)) {
        already.add(p);
        dynamic.push({
          path: p, changefreq: "weekly", priority: "0.7",
          videos: [{ thumbnail: HERO_IMG, title: `Anime TMDB ${id}`, description: "Watch on NowAnime.", playerUrl: `${BASE_URL}/watch/tv/${id}/1/1` }],
        });
      }
      const wp = `/watch/tv/${id}/1/1`;
      if (!already.has(wp)) {
        already.add(wp);
        dynamic.push({ path: wp, changefreq: "weekly", priority: "0.6" });
      }
      if (staticEntries.length + dynamic.length >= 260) break;
    }
    for (const id of FALLBACK_MOVIE) {
      const p = `/movie/${id}`;
      if (!already.has(p)) {
        already.add(p);
        dynamic.push({
          path: p, changefreq: "weekly", priority: "0.7",
          videos: [{ thumbnail: HERO_IMG, title: `Anime movie ${id}`, description: "Watch on NowAnime.", playerUrl: `${BASE_URL}/watch/movie/${id}` }],
        });
      }
      const wp = `/watch/movie/${id}`;
      if (!already.has(wp)) {
        already.add(wp);
        dynamic.push({ path: wp, changefreq: "weekly", priority: "0.6" });
      }
      if (staticEntries.length + dynamic.length >= 260) break;
    }
  }

  const all = [...staticEntries, ...dynamic];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset ${SITEMAP_NS}>`,
    ...all.map(renderEntry),
    `</urlset>`,
  ].join("\n");
  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(`sitemap.xml written (${all.length} entries)`);
}

main().catch((e) => { console.error(e); process.exit(0); });
