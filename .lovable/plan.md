## Goal

Reduce the player to just **111Movies (HD)** and **Smashy** as backups to each other, finish purging every movie surface (details rails, Download page, studios, links), refresh the browser/app/favicon icons from the uploaded logo, swap the Adsterra script to the new key, add a free-app `llms.txt`, and clean up the SEO findings surfaced in the review (heading/a11y, sitemap, per-page metadata, FAQ schema, social preview, perf).

## 10-Task Plan

### 1. Prune stream providers to HD + Smashy

- `src/lib/streamProviders.ts`: delete VidSrc, VidLink, VidSrc.pro, VidZee, VidFast, VidNest, MegaPlay, Nontongo. Keep only `hd` (111Movies, IMDb-based) and `smashy` (TMDB) — in that order so 111Movies is default and Smashy is the automatic fallback.
- Bump `streamCache` key namespace (`v3`) to drop stale entries pointing at removed servers.
- `MoviePlayer.tsx`: no code changes needed (registry-driven), but re-verify the chip row renders cleanly with 2 items and the auto-cycle-on-error still works (idx+1 wraps 1→0).

### 2. generate  app icon / browser icon / favicon from the uploaded logo

- Copy the current official logo to `public/favicon.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png` (square crops via `imagegen--edit_image` crop-only when needed).
- `rm public/favicon.ico` (browsers request it by default and it would override the PNG).
- `index.html`: single `<link rel="icon" href="/favicon.png" type="image/png">` + `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.
- `public/manifest.json`: confirm the 192/512 point at the new files, `theme_color` stays `#ff4d2e`.

### 3. Purge lingering movie surfaces from detail + watch pages

- `MovieDetailPage.tsx` / `TVDetailPage.tsx`: any "Similar Movies", "You might also like", cast filmography rails must call the anime-only source (`getAnimeRecommendations` / Jikan by title) — same source `PlayerRecommendations` already uses. Sweep any `useMovieSimilar` / `getSimilarMovies` imports.
- `MovieWatchPage.tsx` / `TvWatchPage.tsx`: Up-Next sidebar is anime-only; kill any remaining generic recommendations.
- Grep pass: `rg -i "movie|film" src/pages/*Detail* src/pages/*Watch*` — remaining hits must be type-checks, not UI copy.

### 4. Rebrand the Download page to anime

- `DownloadPage.tsx`: replace hero copy, studio logos, feature bullets, and testimonials with anime-appropriate content (studios: MAPPA, Ufotable, Wit, Kyoto Animation, Trigger, Bones, A-1, Madhouse, Toei, Sunrise). Icons/colors align with the pink→red-orange fire palette.
- Change every "Download Movies / TV" CTA to "Download Anime". Screenshots or mockups referencing non-anime titles get replaced with anime posters pulled from Jikan trending.

### 5. Fix broken / non-anime links across the app

- `Footer.tsx`, `TopBar.tsx`, `CategoriesMenu.tsx`, `BottomNav.tsx`: audit every `<Link to=…>` and external `<a>`. Kill dead routes, redirect legacy `/movies`, `/tv`, `/live` (already redirect) — extend for `/kdrama`, `/kenya`, `/podcasts`, `/shorts` if any residual references remain.
- Sitemap generator (`scripts/generate-sitemap.ts`): drop any entry that no longer resolves; ensure only anime-relevant paths are advertised.

### 6. Swap Adsterra invoke script + container

- `AdBanner.tsx` (and any other file loading `highperformanceformat.com/…/invoke.js`): replace with the new host + key:
  - `<script async data-cfasync="false" src="https://disturbknockedcaterpillar.com/ba3fd22b78c6d97f709385e2e0894584/invoke.js"></script>`
  - `<div id="container-ba3fd22b78c6d97f709385e2e0894584"></div>`
- If the old 5-format registry is still in use, replace it with a single container implementation (Adsterra Native Banner style). Sandboxed iframe stays for isolation.
- Grep `rg "highperformanceformat|invoke.js"` → zero results after change.

### 7. Add `public/llms.txt` describing NowAnime as a free app

- File: `public/llms.txt` — title, one-line description, key routes (home, anime, search, downloads), stance that the app is free / ad-supported / no signup required, contact page, ToS/Privacy links. Format per llmstxt.org spec (`# NowAnime` + short markdown sections).

### 8. Fix the SEO findings (heading, a11y, sitemap, metadata, FAQ, social)

- **Heading / a11y**: Add missing mobile page `<h1>` (Home, Anime, Search, Downloads). Give every icon-only `<Button>` an `aria-label`. Fix contrast tokens if any `text-gray-*` slipped in.
- **Sitemap**: run `scripts/generate-sitemap.ts` mentally against `App.tsx` routes; keep only live routes; commit `public/sitemap.xml` fresh.
- **Per-page metadata**: install `react-helmet-async` (if not present) + `<HelmetProvider>` in `main.tsx`. Give Home, Anime, Search, MovieDetail, TVDetail, Watch, Downloads distinct `<title>` + `<meta description>` + canonical + og:title/og:url. Remove the generic reused defaults.
- **FAQ schema**: `FAQ.tsx` → inject `FAQPage` JSON-LD via Helmet with the real Q/A pairs on the page.
- **Social preview**: leave og:image absent so hosting injects the auto preview (per head-metadata rules), and remove any relative `og:image` still baked into `index.html`.
- Google Search Console verification: skip unless the user asks — needs their account. Note it in the reply.

### 9. Perf pass (page loads slowly finding)

- Lazy-load below-the-fold rows via existing `LazyContentRow`.
- Add `loading="lazy" decoding="async"` to poster/backdrop `<img>` in `TmdbCard`, `AnimeCard`, `HeroBanner` where missing.
- Defer Adsterra script (`async` is already set; make sure it's mounted only when the ad container scrolls into view via `IntersectionObserver` inside `AdBanner.tsx`).
- Preconnect `<link rel="preconnect">` for `image.tmdb.org` and `cdn.myanimelist.net` in `index.html`.

### 10. Verify end-to-end

- Typecheck.
- Playwright at 1280×1800 and 390×844: load `/`, `/anime`, `/search`, `/tv/{knownAnimeId}`, `/watch/tv/{id}/1/1`, `/downloads`. Screenshot each. Confirm: 2-server chip row, HD default, Smashy fallback works when HD errors (force via bad id), fullscreen `F` still binds, no "movie" UI copy on any anime page, new favicon in tab, Adsterra loads from new host in network log, `<h1>` present on mobile, per-route `<title>` updates on navigation.
- Trigger a fresh SEO scan afterward and mark the previously-listed findings fixed via `seo_chat--update_findings` once verified in code.

## Notes / Out of scope

- Google Search Console verification requires the user's GSC account; will surface an action if needed but not block on it.
- No changes to auth, moviebox download engine, external-downloader redirect flow, or Supabase policies.
- Ads: single Adsterra unit per placement using the provided key; no A/B mix with the old key.

Approve and I'll execute all 10 tasks in one pass.