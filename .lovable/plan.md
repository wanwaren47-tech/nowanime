# NowAnime — 10 Task Plan

> Note: paste your **OpenSubtitles API key** in chat when ready. I'll store it as `OPENSUBTITLES_API_KEY` via `add_secret` and wire it into a new edge function before shipping Task 4.

## Task 1 — New moon-icon brand asset everywhere
- Extract just the red crescent-moon mark from the uploaded logo (no wordmark, transparent bg) via `imagegen--edit_image`.
- Export at 512, 192, 180 (apple-touch), and 32 (favicon.png). Overwrite `public/favicon.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`.
- Update `src/assets/nowanime-icon-v2.png.asset.json` + `nowanime-mark.png.asset.json` pointers so every `BrandLogo` / TopBar / BottomNav / splash / OG image uses the new mark.
- Update `public/manifest.json` name, short_name, theme_color (#E53935), icons.

## Task 2 — Splash screen animation
- New `src/components/SplashScreen.tsx`: full-screen dark bg, moon mark spins 360° for 6s, then a red-orange glow pulse (`box-shadow` + `filter: drop-shadow`), then "NOW ANIME" wordmark fades in with a "Continue" CTA linking to `/home`.
- Show once per session (sessionStorage `nowanime_splash_seen`), mounted at the top of `AppLayout` before route content.
- Respect `prefers-reduced-motion` (skip spin, straight fade).

## Task 3 — Mobile quality selector = dropdown
- In `MoviePlayer.tsx` toolbar, on `md:` and up keep the current pill row; on mobile replace with a shadcn `<Select>` triggered by a chevron button showing current resolution (e.g. "1080p ▾"). Options list all `downloads[]`. Selecting a quality swaps `selected` and restarts playback at current time when possible.

## Task 4 — OpenSubtitles integration
- New edge function `supabase/functions/opensubtitles/index.ts`: accepts `{tmdbId, type, season?, episode?, languages?}`, calls `https://api.opensubtitles.com/api/v1/subtitles` with `Api-Key: OPENSUBTITLES_API_KEY`, then resolves a download URL via `/download`. Returns `[{lang, label, url}]`. Includes CORS + JWT check.
- New `src/lib/subtitles.ts` client helper.
- In `MoviePlayer.tsx`: on stream load, fetch subtitle tracks. Replace the placeholder subtitles icon with a shadcn `<Popover>` listing languages ("Off" + each track). Selected track becomes a `<track kind="subtitles" src=... default>` on the native `<video>`; store choice in `localStorage.nowanime_sub_lang`.
- Fallback UI when list is empty: "No subtitles found — try another episode."

## Task 5 — Ads loading reliably
- Audit `AdBanner.tsx` + `NativeAd.tsx`: ensure Adsterra scripts inject on mount (not during SSR), re-inject on route change with unique container IDs, and set `key={route}` on wrappers so React recreates the DOM. Add `data-adsterra-loaded` marker + fallback placeholder.
- Add a lightweight `AdsProvider` that appends the Adsterra loader once to `<head>` and exposes `useAdSlot(zone)` to render individual zones deterministically.
- Verify with Playwright: navigate 3 pages, assert each ad container has children.

## Task 6 — Library hub (renamed from Downloads)
- Rename `/my-downloads` → `/library` (keep redirect). New `src/pages/LibraryPage.tsx` with segmented tabs: **Watchlist · Saved · Downloads**.
  - Watchlist tab → embeds current `MyListPage` content.
  - Saved tab → new list backed by `useSavedItems` hook (localStorage `nowanime_saved`).
  - Downloads tab → existing `MyDownloadsPage` content.
- Update `BottomNav.tsx` to Home · Explore · Trending · My List · **Library** (icon: Library from lucide).

## Task 7 — Save + Add to Watchlist buttons on detail pages
- New `src/components/ActionButtons.tsx` with two buttons: **Save** (bookmark icon, toggles `useSavedItems`) and **Add to Watchlist** (plus icon, toggles `useMyList`). Toast on toggle.
- Wire into `AnimeDetailPage.tsx`, `TVDetailPage.tsx`, `MovieDetailPage.tsx` under the hero.

## Task 8 — Sitemap covers everything (25 categories + top titles)
- Extend `scripts/generate-sitemap.ts`:
  - Static routes: `/`, `/home`, `/anime`, `/trending`, `/search`, `/library`, `/settings`, `/welcome`, all footer/legal pages.
  - `/genre/{slug}` for all 25 categories from `src/lib/animeGenres.ts`.
  - Fetch top ~100 anime from TMDB (genre 16 + JP) and emit `/anime/{id}`, `/watch/tv/{id}/1/1`.
  - `<image:image>` entries per URL pointing to poster/backdrop (image sitemap).
- Runs on `predev` + `prebuild`; writes `public/sitemap.xml`.

## Task 9 — robots.txt + Google Search Console submission
- `public/robots.txt`: `User-agent: * / Allow: / / Sitemap: https://nowanime.lovable.app/sitemap.xml`.
- After deploy: call GSC connector to (a) verify `https://nowanime.lovable.app/` via existing META token, (b) `PUT sites/…`, (c) `PUT sitemaps/…/sitemap.xml`, (d) URL-inspect top routes to request indexing.
- Add IndexNow: generate `public/{key}.txt` and a tiny `scripts/indexnow-ping.ts` invoked from `postbuild` that POSTs top routes to `https://www.bing.com/indexnow`.

## Task 10 — SEO polish & verify
- Per-route `<SEO>` metadata via `react-helmet-async`: unique title, description, canonical, `og:image` = poster for detail pages.
- Add JSON-LD: `TVSeries` / `Movie` on detail pages, `FAQPage` on FAQ, `BreadcrumbList` on library/genre.
- Ensure no `noindex` anywhere. Run Playwright smoke: `/`, `/home`, `/anime`, `/genre/action`, `/library`, `/watch/tv/1429/1/1` — screenshot + assert no console errors, ads present, subtitles button visible.

## Technical notes
- OpenSubtitles: uses REST v1 — key goes in `Api-Key` header, plus `User-Agent: NowAnime v1`. `/subtitles` search then `/download` to get temporary CDN URL (VTT preferred; convert SRT→VTT server-side if needed).
- Splash uses CSS keyframes (`@keyframes spin-slow` 6s linear + `@keyframes glow-pulse` 1.2s ease-out) — no extra deps.
- Library tabs use shadcn `Tabs`; each tab lazy-loads its content to keep first paint fast.
- Ads: Adsterra requires unique numeric `key` per zone — keep zone IDs in `src/lib/adZones.ts`.
- All new UI uses existing red/orange semantic tokens.

Reply **go** to build all 10 in one pass, and paste the OpenSubtitles key when you have it.