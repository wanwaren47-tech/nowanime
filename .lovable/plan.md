# NowAnime — 5 Task Plan

## Task 1 — Autoplay engine (TV + Movies)
- Add `src/lib/autoplay.ts` with:
  - `getNextEpisode(tvId, season, episode)` — uses TMDB `/tv/{id}/season/{n}` to check total episodes; rolls to next season when needed; returns `null` at series end.
  - `getNextMovie(movieId)` — uses TMDB `/movie/{id}/similar`, returns the first anime‑tagged result.
- Add `useAutoplay` hook that:
  - Reads `localStorage.nowanime_autoplay` (default `true`).
  - Preloads the next stream via existing `resolve-stream` edge function while the current one is still playing (last 30s) so playback is instant.
  - Emits a 5‑second countdown overlay on `ended` with **Play now / Cancel** buttons.
- Wire the `ended` event in `MoviePlayer.tsx` (native player) and via `postMessage` for iframe servers where supported; fallback: show a manual "Play Next" button after 100% progress or when iframe reports end.

## Task 2 — YouTube/MovieBox‑style player controls bar
Redesign the bar under the player (in `WatchMoviePage` / `WatchTVPage`):
- Left cluster: **Play/Pause · Previous · Next** (Next/Prev use the autoplay resolver; on movies, Previous = last watched from history).
- Middle cluster: **Subtitles** picker (fetch tracks from resolver payload; user selects language, applied to `<track>` on native, appended as query param on iframe servers that support it).
- Right cluster: **Quality** selector (uses resolver `qualities[]`, persists choice), **Download**, **Fullscreen**.
- Fullscreen on mobile: request `screen.orientation.lock('landscape')` after `requestFullscreen()`; unlock on exit. Desktop keeps current constrained size.

## Task 3 — Bottom nav restructure
Update `src/components/BottomNav.tsx` to exactly: **Home · Explore · Trending · My List · Downloads**.
- Add `/trending` route pulling TMDB `/trending/tv/week` filtered to anime (genre 16 + `original_language=ja`).
- `My List` = existing likes/watchlist page (rename route to `/my-list`).
- Remove any leftover Movies tab; redirect `/movies*` → `/home`.

## Task 4 — Movies purge + Movie details cleanup
- Investigate `MovieDetailPage.tsx` and any movie rails; remove non‑working movie sections and any residual "Movies" navigation, since the app is anime‑only.
- Keep the file only if reused for anime films (TMDB movie genre 16 + `original_language=ja`); otherwise delete route and imports.
- Grep for `movie` UI strings and align to anime terminology; keep backend `resolve-stream` movie path (used by anime films).

## Task 5 — SEO, favicon & indexing
- Generate a bold NowAnime app icon (red/orange gradient bg, phoenix mark, high‑contrast) at 512/192/apple‑touch/favicon.ico, wired in `index.html` and `manifest.webmanifest`.
- `public/robots.txt`: `User-agent: *` / `Allow: /` / `Sitemap: https://nowanime.lovable.app/sitemap.xml`.
- Ensure `scripts/generate-sitemap.ts` emits dynamic anime routes and runs on `prebuild`/`predev`.
- Confirm Google Search Console META token is live (already in `index.html`), then via the connector: verify site, submit sitemap, request indexing on key routes.
- Add IndexNow: generate key file at `public/{key}.txt` and ping `https://www.bing.com/indexnow` from a tiny post‑build script for the top routes.
- Verify `<meta name="robots">` is not `noindex` anywhere and canonical/og:url self‑reference each route via `react-helmet-async`.

## Technical notes
- Autoplay preloading uses an off‑screen `<video preload="auto">` for native streams and a hidden `<iframe>` warmup for embed servers.
- Countdown overlay is a small component in `src/components/player/UpNextOverlay.tsx`, reused by TV and movie pages.
- Setting toggle lives in `SettingsPage` under a new "Playback" row; state stored in `localStorage` and mirrored to a lightweight `useAutoplaySetting` hook.
- Subtitle tracks: extend `resolve-stream` response type with `subtitles: {lang, url}[]`; UI falls back gracefully when empty.
- All new UI uses existing semantic tokens (red/orange theme) — no hardcoded colors.
