// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://nowanime.lovable.app";

interface ImageRef { loc: string; caption?: string; }
interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  images?: ImageRef[];
}

const IMG = {
  hero: "https://image.tmdb.org/t/p/w1280/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
  anime1: "https://image.tmdb.org/t/p/w780/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
  anime2: "https://image.tmdb.org/t/p/w780/x4HHy6V7TbXmoEgKQTwwR7BdY9k.jpg",
} as const;

// Popular anime TMDB IDs — one sample entry per dynamic route pattern so
// crawlers see the full URL shape for detail, watch and download pages.
const SAMPLE_TV_IDS = [1429, 30984, 37854, 46260, 65930, 85937];       // Attack on Titan, Naruto, One Piece, etc.
const SAMPLE_MOVIE_IDS = [129, 372058, 568160, 508883];                // Spirited Away, Your Name, Belle, The Boy and the Heron
const ANIME_MAL_IDS = [16498, 20, 21, 5114, 40748, 11061];             // Attack on Titan, Naruto, One Piece, FMA:B, JJK, HxH
const GENRES = [28, 35, 18, 27, 878, 10749, 53, 16, 80, 14, 9648, 12];

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0", images: [{ loc: IMG.hero, caption: "NowAnime — stream anime free in HD" }] },
  { path: "/home", changefreq: "daily", priority: "1.0", images: [{ loc: IMG.hero, caption: "NowAnime home — trending anime" }] },
  { path: "/anime", changefreq: "daily", priority: "0.9", images: [{ loc: IMG.anime1, caption: "Browse anime" }, { loc: IMG.anime2 }] },
  { path: "/search", changefreq: "weekly", priority: "0.7" },
  { path: "/welcome", changefreq: "monthly", priority: "0.5" },
  { path: "/signin", changefreq: "monthly", priority: "0.5" },
  { path: "/register", changefreq: "monthly", priority: "0.5" },
  { path: "/onboarding/genres", changefreq: "monthly", priority: "0.3" },
  { path: "/onboarding/titles", changefreq: "monthly", priority: "0.3" },
  { path: "/onboarding/done", changefreq: "monthly", priority: "0.3" },
  { path: "/profile", changefreq: "monthly", priority: "0.3" },
  { path: "/settings", changefreq: "monthly", priority: "0.3" },
  { path: "/my-list", changefreq: "monthly", priority: "0.4" },
  { path: "/liked", changefreq: "monthly", priority: "0.4" },
  { path: "/library", changefreq: "monthly", priority: "0.4" },
  { path: "/my-downloads", changefreq: "monthly", priority: "0.5" },
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
  ...GENRES.map((g) => ({ path: `/genre/${g}`, changefreq: "weekly" as const, priority: "0.6" })),
  // Dynamic route samples — /movie/:id, /tv/:id, /watch/movie/:tmdbId,
  // /watch/tv/:tmdbId/:season/:episode, /movie/:tmdbId/watch, /anime/:id, /watch/:videoId
  ...SAMPLE_MOVIE_IDS.flatMap((id) => [
    { path: `/movie/${id}`, changefreq: "weekly" as const, priority: "0.7" },
    { path: `/watch/movie/${id}`, changefreq: "weekly" as const, priority: "0.7" },
    { path: `/movie/${id}/watch`, changefreq: "weekly" as const, priority: "0.6" },
  ]),
  ...SAMPLE_TV_IDS.flatMap((id) => [
    { path: `/tv/${id}`, changefreq: "weekly" as const, priority: "0.7" },
    { path: `/watch/tv/${id}/1/1`, changefreq: "weekly" as const, priority: "0.7" },
  ]),
  ...ANIME_MAL_IDS.map((id) => ({ path: `/anime/${id}`, changefreq: "weekly" as const, priority: "0.7" })),
  { path: "/watch/dQw4w9WgXcQ", changefreq: "weekly", priority: "0.5" },
];

const SITEMAP_NS = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`;

function generateSitemap(entries: SitemapEntry[]) {
  const description =
    "NowAnime — stream and download subbed & dubbed anime in HD. " +
    "Visit https://nowanime.lovable.app";
  const urls = entries.map((e) => {
    const imgBlocks = (e.images || []).map((i) => [
      `    <image:image>`,
      `      <image:loc>${i.loc}</image:loc>`,
      i.caption ? `      <image:caption>${i.caption.replace(/&/g, "&amp;")}</image:caption>` : null,
      `    </image:image>`,
    ].filter(Boolean).join("\n"));
    return [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      ...imgBlocks,
      `  </url>`,
    ].filter(Boolean).join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!-- ${description} -->`,
    `<urlset ${SITEMAP_NS}>`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
