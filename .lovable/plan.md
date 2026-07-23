
# Full implementation plan

## 1. Offline player: subtitle button
- In `src/pages/MyDownloadsPage.tsx`, replace the plain `<video>` with a wrapper that shows a "CC" button (bottom-right overlay) opening a small popover listing available captions (from stored `OfflineCaption` blobs).
- Toggling a track calls `video.textTracks[i].mode = "showing"` / `"disabled"`. Persist last-used lang in localStorage.
- Ensure `offlineDownloads.ts` still stores captions as VTT blobs (already done) — verify decode + `<track>` load path.

## 2. Moon favicon / app icon
- Generate a clean, high-contrast red crescent-moon icon (transparent PNG) via imagegen premium, from the uploaded reference.
- Produce: `public/favicon.png` (32/192), `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`.
- Update `index.html` `<link rel="icon">` and `manifest.json` icon entries. Delete `public/favicon.ico`.

## 3. SUB/DUB labeling for known anime
- Extend `TmdbCard.tsx` label logic: maintain a curated slug/id list of known SUB titles (Jujutsu Kaisen, Death Note, +others) forcing "SUB" regardless of `original_language`.
- Store list in `src/lib/animeSubDub.ts` keyed by TMDB id.

## 4. Desktop top nav redesign
- `src/components/TopBar.tsx`: on `md+`, layout = [logo left] · [centered nav pills] · [inline 4-in-row ad slot] · [visible search input] · [profile].
- Search input becomes always-visible (not icon-only) on desktop, submits to `/search?q=`.
- Add a compact `AdSlot` (banner 4-in-row Adsterra key) between nav and search.

## 5. Downloads player = app player shell
- Replace fullscreen overlay in `MyDownloadsPage.tsx` with the same layout used on Watch pages: video left, `PlayerRecommendations` sidebar on desktop, stacked on mobile.
- Feed recommendations from TMDB by tmdbId of the offline item (anime-only filter).

## 6. Anime detail page cleanup
- In `src/pages/AnimeDetailPage.tsx`, keep exactly 3 recommendation rows below; filter out any TMDB result not classified as animation/anime (keyword 210024 or `original_language==='ja'` + animation genre). No movies-only rails.

## 7. Sitemap: 250 pages + images + video
- Rewrite `scripts/generate-sitemap.ts` to:
  - Static routes (~15).
  - Fetch top anime from TMDB discover (genre 16, lang ja) across pages until ~230 dynamic entries — mix of `/anime/:id` and `/tv/:id`.
  - Use image + video sitemap namespaces: for each entry include `<image:image><image:loc>` (TMDB poster) and `<video:video>` (embed URL, thumbnail, title, description).
  - Output `public/sitemap.xml` (single file, ≥250 `<url>`).
- Keep `predev`/`prebuild` hooks.
- After deploy, ping Google Search Console `sitemaps` submit via connector gateway.

## 8. Install page link
- `src/pages/InstallAppPage.tsx`: primary install/download button → `https://nowanimeapp.lovable.app`.

## 9. robots.txt
- Ensure `Allow: /` for all agents and `Sitemap: https://nowanime.lovable.app/sitemap.xml` (already present).

## Technical notes
- Files touched: `MyDownloadsPage.tsx`, `TopBar.tsx`, `TmdbCard.tsx`, `AnimeDetailPage.tsx`, `InstallAppPage.tsx`, `scripts/generate-sitemap.ts`, `index.html`, `public/manifest.json`, new `src/lib/animeSubDub.ts`, new icon assets in `public/`.
- Use existing `PlayerRecommendations` component for offline sidebar.
- Sitemap uses `xmlns:image` and `xmlns:video` schemas; each URL entry ≤ Google's limits.
- GSC submission via `curl` to `/webmasters/v3/sites/<encoded>/sitemaps/<encoded-sitemap-url>` PUT.
