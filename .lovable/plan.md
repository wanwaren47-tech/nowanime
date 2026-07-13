# BingBloom → NowAnime: Full Rebrand & Anime Refocus

Turning the current multi-content app (movies, TV, live TV, anime, music, novels) into an **anime-only** experience called **NowAnime**, using the uploaded repo as the visual reference (logo, color scheme, layout patterns) while keeping all the functionality we've already built (downloads flow, offline, ads, edge functions).

## Scope confirmation
- Rebrand only — same routes, same backend, same download/offline system.
- Content narrows to anime + anime movies (still powered by TMDB) plus new metadata sources (Jikan, AniList, Kitsu, ANN).
- New streaming servers replace vidsrc default.
- Player redesigned YouTube-style (video left, suggestions right on desktop; stacked on mobile).

## Task plan (10 tasks)

**1. Extract reference repo + brand assets**
Unzip `nowanime-a04861e4-main.zip` to `/tmp/nowanime-ref/`, upload `nowanime-logo.png` via `lovable-assets`, and read `index.css`, `tailwind.config.ts`, `Navbar.tsx`, `Spotlight.tsx`, `Section.tsx`, `Player.tsx` to lift the exact color tokens, gradients, and layout structure.

**2. New design system (NowAnime tokens)**
Rewrite `src/index.css` + `tailwind.config.ts` with the reference palette (anime-style: deep purple/magenta/cyan gradients on near-black, per reference). All existing semantic tokens (`--primary`, `--background`, `--accent`, gradients, shadows) get new HSL values. No component change needed — tokens do the work.

**3. Rebrand strings, logo, meta, PWA**
- Replace every "BingBloom" / "bingbloom" occurrence with "NowAnime" / "nowanime" across `src/`, `public/manifest.json`, `index.html`, `README.md`, `public/sw.js`, `public/llms.txt`, `public/sitemap.xml`, `SEO.tsx`, `Footer.tsx`, `TopBar.tsx`.
- Replace `BrandLogo` image with new `nowanime-logo.png` asset. Update favicon (`public/favicon.ico` → new PNG, update `index.html <link rel="icon">`, delete old ico per rules).
- Update `<title>` / meta description to anime-focused copy.
- Email `hello.bingbloom@gmail.com` → `hello.nowanime@gmail.com`.

**4. Anime-first navigation & pages**
- `BottomNav`: Home, Browse (anime catalog), Search, Downloads, Profile — remove Movies/TV/LiveTV entries.
- `App.tsx`: redirect `/movies`, `/tv`, `/live-tv`, `/podcasts`, `/shorts` to `/home` (keep routes to avoid 404s; render anime browse).
- `HomePage`: replace mixed rails with anime-only rails (Trending, Top Airing, Seasonal, Movies, By Genre) sourced from Jikan + TMDB anime.
- Keep `MovieDetailPage` / `TVDetailPage` — they already work for anime titles; just repoint entry points.

**5. Metadata layer (Jikan + AniList + Kitsu)**
Extend existing `src/lib/jikan.ts`, `src/lib/anilist.ts`, `src/lib/kitsu.ts` with a unified `getAnimeFull(idOrSlug)` that merges: TMDB (for streaming ids), Jikan (characters + VAs + episodes), AniList (relations + recommendations), Kitsu (trending fallback). New hook `useAnimeMeta(tmdbId, title)` used by detail + player pages. Cast section renders character + Japanese/English VA.

**6. New streaming servers in player**
Replace/extend `MoviePlayer.tsx` server list with 4 servers:
1. **111Movies** (new HD default) — `https://111movies.com/movie/{tmdbId}` and `/tv/{tmdbId}/{s}/{e}`.
2. **BingBloom** (rename to **NowAnime Server**) — existing vidsrc-stream edge function using new domains list (`vidsrcme.ru`, `vidsrcme.su`, `vsrc.su`, etc. with fallback rotation).
3. **VidSrc** — direct embed `https://vidsrc.su/embed/movie/{tmdbId}` (updated domain).
4. **Nontongo** — `https://www.nontongo.win/embed/movie/{tmdbId}`.
Each iframe uses `sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"` (no `allow-popups`, `allow-top-navigation`) to block redirects. Update `vidsrc-stream` edge function to rotate through the new domain list.

**7. YouTube-style player layout**
New `WatchPage` layout: on `md+`, CSS grid `grid-cols-[minmax(0,1fr)_360px]`. Left column: player + title + description + cast + episodes (for series) + ads. Right column (sticky): "Up Next" suggestions rail (vertical list of `TmdbCard` in horizontal thumb+title format), driven by `useMovieSimilar` / anime recommendations. Mobile stays stacked. Update `MovieWatchPage.tsx` + `TvWatchPage.tsx`.

**8. Ad slot preservation**
Audit every page for existing `<AdSlot>`, `<InlineAdRow>`, `<NativeAd>` — keep placements exactly. Confirm ad slots on: Home (3), Browse (3), Anime detail, Watch (left column, between synopsis/cast and suggestions), Downloads, Search. No new ads, no removed ads.

**9. Download flow — keep as-is**
Verify `DownloadSourceSheet`, `DownloadButton`, `MyDownloadsPage`, `moviebox-resolve`, offline IndexedDB all still work after rebrand. Only string change is "BingBloom" label → "NowAnime Fast" in `DownloadSourceSheet`. External flow (`videodownloader.site`) untouched.

**10. Live TV → Anime TV + final QA**
Repurpose `LiveTVPage` as "Anime TV" (curated list of free anime streams from `iptv-org` filtered by category=anime + Japanese; keep list layout). Then full pass: typecheck, build, click through home → browse → detail → watch (test all 4 servers with sandbox iframe), downloads flow, offline popup, ads visible, no BingBloom strings remaining (`rg -i bingbloom src/ public/`). Fix any bugs.

## Technical notes
- No new secrets, no schema changes.
- Iframe redirect blocking: strict `sandbox` attr on all embed servers; if a server needs `allow-popups` we drop it.
- Player domain rotation: edge function tries domains in order, HEAD-checks, returns first live URL; cached 15 min.
- Cast/VA data cached client-side via React Query (Jikan rate-limited to 60/min — respected via `staleTime: 30min`).
- Reference repo is source-of-truth for **look**; our routing/pages/functionality remain.

## Out of scope
- Rewriting existing detail pages structurally (only tokens + strings change).
- Auth changes, database changes.
- Removing the download-source sheet (kept — just relabeled).

Ready to execute all 10 tasks in one pass on approval.