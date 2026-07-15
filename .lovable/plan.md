## Goal
Transform NowAnime end-to-end into a pure anime experience: new red/orange brand + logo, anime-only suggestions everywhere, spotlight fed from anime, working IMDb-based 111Movies + VidSrc + Nontongo, and persistent stream caching.

## 10-Task Plan

### 1. New professional logo + favicon
Generate a corporate-grade anime mark (stylized flame/torii silhouette in red→orange gradient, no letter "N", clean vector-look). Save as `src/assets/nowanime-logo.png`, upload via `lovable-assets`, then update:
- `public/favicon.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`
- `public/manifest.json` name/theme_color
- `src/components/BrandLogo.tsx` to consume the new asset

### 2. Red + orange theme tokens
Rewrite `src/index.css` primary tokens:
- `--primary: 12 90% 55%` (vivid red-orange)
- `--accent: 28 100% 58%` (orange)
- `--gradient-primary: linear-gradient(135deg, hsl(12 90% 55%), hsl(28 100% 58%))`
- Background stays dark (`240 12% 6%`)
Sweep all `#ffbade`, `pink-*`, `purple-*` remnants → semantic tokens.

### 3. IMDb-based 111Movies server (fix embed)
Update `src/components/MoviePlayer.tsx`:
- Add `imdbId` prop threaded from watch pages
- 111Movies URL: `https://111movies.com/movie/{imdbId}` / `/tv/{imdbId}/{s}/{e}`
- Fetch IMDb ID via TMDB `/movie/{id}/external_ids` in `MovieWatchPage.tsx` + `TvWatchPage.tsx` (add `useMovieExternalIds` hook in `useTmdb.ts`)
- Fallback to TMDB-based servers if IMDb missing

### 4. Verify VidSrc + Nontongo embeds
- VidSrc: `https://vidsrc.su/embed/movie/{tmdbId}` and `/tv/{tmdbId}/{s}/{e}` (confirmed working format)
- Nontongo: `https://www.nontongo.win/embed/movie/{tmdbId}` / `/tv/{tmdbId}/{s}/{e}`
- Iframe sandbox: `allow-same-origin allow-scripts allow-forms allow-presentation allow-popups` + `referrerpolicy="no-referrer"`
- Add onError → auto-cycle to next server

### 5. Server selector redesign (top-of-player row)
Replace old bottom-source buttons with a clean chip row directly under the iframe:
- 4 chips: **HD (111Movies)** · **VidSrc** · **Nontongo** · **Smashy**
- Active chip uses gradient-primary; inactive muted
- Remove any leftover "previous button" / legacy source pills

### 6. Anime spotlight (hero)
`src/components/TmdbHero.tsx` (or HomePage hero): replace TMDB trending-movie source with Jikan `getTopAnime()` from `src/lib/jikan.ts`. Card shows: rank #, anime title, score, "TV"/"Movie", year, "HD", synopsis, Watch button routing to `/anime/:mal_id`. Remove all references to "The Furious"/movie fallback data.

### 7. Anime-only player suggestions
`src/components/PlayerRecommendations.tsx`: switch data source from `useMovieSimilar` / `useTvSimilar` to Jikan `getAnimeRecommendations(malId)` with fallback to `getTopAnime()`. Remove non-anime cards entirely. Same treatment for the "Up Next" rail in `MovieWatchPage` / `TvWatchPage`.

### 8. Top nav = fully anime
`src/components/TopBar.tsx` + `src/components/BottomNav.tsx`:
- Remove "Movies" / "TV" entries
- Tabs: Home · Anime · Explore (Flame icon `lucide-react`) · Downloads · Profile
- Explore uses `Flame` icon in red-orange gradient

### 9. Stream caching (persistent)
`src/lib/streamCache.ts` already exists — wire it:
- `MoviePlayer.tsx` calls `recordStream({ tmdbId, imdbId, server, url, mediaType, s, e })` on successful iframe load
- On mount, `getCachedStream()` returns last-working server for that title → auto-select
- 7-day TTL via `localStorage` key `nowanime:streamcache:v1`
- Also record last IMDb ID lookup to skip re-fetch

### 10. QA sweep + cleanup
- `rg -i "the furious|pink-|purple-|ffbade|bingbloom"` across `src/` → 0 hits
- Delete stale movie/TV suggestion imports
- Typecheck passes
- Playwright: load `/`, `/anime`, `/watch/movie/{id}`, `/watch/tv/{id}/1/1` → screenshot each server chip switch, confirm iframe URL matches expected pattern (IMDb for 111Movies, TMDB for others), confirm suggestion rail shows only anime titles.

## Technical Details
- IMDb lookup endpoint: `GET https://api.themoviedb.org/3/{movie|tv}/{id}/external_ids` → `imdb_id` field
- Jikan recommendations: `GET https://api.jikan.moe/v4/anime/{id}/recommendations`
- Iframe redirect protection kept via strict sandbox flags (no `allow-top-navigation`)
- Cache shape: `{ [tmdbId]: { server: ServerId, imdbId?: string, ts: number } }`

## Out of Scope
- No changes to auth, downloads, onboarding, or SEO tags
- No new pages; existing routes stay intact
