## Goal
Ship the user's uploaded NowAnime logo across every icon surface, restyle the desktop nav to a Dulo-TV-style centered pill with anime categories, purge every remaining movie reference from suggestions/search/continue-watching, redesign the player toolbar (one-line controls + `F` for fullscreen), and expand server support to 10 providers using the NetMirror-Extension source code as reference.

## 10-Task Plan

### 1. Install official logo → favicon, PWA icons, app icon, in-app logo
- Copy `user-uploads://image.png` → upload via `lovable-assets` → write `src/assets/nowanime-logo.png.asset.json` (replaces current placeholder).
- Regenerate square favicon (32/180/192/512) crops from the same file into `public/favicon.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png` via `imagegen--edit_image` (crop-only, keep art).
- Update `public/manifest.json` icons + theme_color `#ff4d2e` (matches logo red-orange).
- `BrandLogo.tsx`: drop the "NowAnime" text wordmark (logo already contains it) — render image only.

### 2. Extract NetMirror provider list from the uploaded ZIP
- `unzip /mnt/user-uploads/NetMirror-Extension-master.zip -d /tmp/netmirror`, grep for embed URL templates.
- Produce a canonical mapping in `src/lib/streamProviders.ts` — one object per provider with `id`, `label`, `requiresImdb`, `buildUrl({tmdbId, imdbId, type, s, e})`.
- Refactor `MoviePlayer.tsx` to import from this file (kills the hardcoded `PLAYER_SERVERS`).

### 3. Add 6 new servers + verify 111Movies/VidSrc
Final 10-server list (in `streamProviders.ts`, order = default cycle):
1. **HD (111Movies)** — `https://111movies.com/{movie|tv}/{imdbId}[/s/e]`
2. **VidSrc.su** — `https://vidsrc.su/embed/{movie|tv}/{tmdbId}[/s/e]` (confirmed stable domain from NetMirror)
3. **VidLink** — `https://vidlink.pro/{movie|tv}/{tmdbId}[/s/e]`
4. **VidSrc.pro** — `https://vidsrc.pro/embed/{movie|tv}/{tmdbId}[/s/e]`
5. **VidZee** — `https://player.vidzee.wtf/embed/{movie|tv}?id={tmdbId}[&s=&e=]`
6. **VidFast** (vidfy) — `https://vidfast.pro/{movie|tv}/{tmdbId}[/s/e]`
7. **VidNest** — `https://vidnest.fun/{movie|tv}/{tmdbId}[/s/e]`
8. **MegaPlay** — `https://megaplay.buzz/stream/{tmdbId}[?s=&e=]`
9. **Nontongo** — `https://www.nontongo.win/embed/{movie|tv}/{tmdbId}[/s/e]`
10. **Smashy** — existing fallback
- All URLs sourced from NetMirror-Extension's provider registry (verified in Task 2).
- Auto-cycle on error, 15s timeout, cache last-working via existing `streamCache`.

### 4. Player toolbar redesign
- Remove the "Shield/adblock" toggle button entirely.
- Single row *below* iframe: `[Server: chip · chip · chip …] · spacer · [Download] · [Fullscreen]`.
- Replace `Maximize2` icon with `Expand` (lucide) — cleaner square-arrow look.
- Bind global `keydown "f"` (when player mounted, not in an input) → toggle fullscreen. Also `Esc` handled natively.
- Move the "Save for offline" strip into the same row as a compact icon button (no separate section).

### 5. Desktop nav → centered pill with anime categories
- `TopBar.tsx`: on `md+`, move brand to left, nav to `mx-auto` centered pill (`rounded-full bg-white/5 backdrop-blur px-2 py-1.5`), search+profile right.
- Nav items: **Home · Anime · Categories ▾ · Trending · My List · Downloads**.
- New `<CategoriesMenu />` popover: Action, Adventure, Comedy, Drama, Fantasy, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Mecha, Horror, Isekai, Shounen, Seinen — each links to `/anime?genre={slug}`.
- Mobile keeps existing `BottomNav`; TopBar collapses to logo+search only.

### 6. "Fan Favorites" replaces Continue Watching on Home
- Rename `ContinueWatchingRow` slot on `HomePage.tsx` → new `FanFavoritesRow` component.
- Data source: Jikan `getTopAnime()` (score-sorted, top 20).
- Card layout matches user's screenshot: big rank number (01–20), title, year, score badge, "TV" tag, poster on right.
- Continue-watching logic still exists but only surfaces on `/library`, not homepage.

### 7. Purge movies from Search
- `SearchPage.tsx`: remove TMDB `searchMulti`/`searchMovie` calls. Use only:
  - Jikan `searchJikanAnime(query)` (primary)
  - TMDB `searchTv` filtered by `genre_ids.includes(16)` (animation) as fallback for TMDB-native anime IDs used by the player
- Remove any movie result cards, movie filter tabs, "Movies" heading.

### 8. Purge movies from detail/watch suggestions
- `MovieDetailPage.tsx` + `MovieWatchPage.tsx` "Similar" and "Up Next" rails → same anime-only source as `PlayerRecommendations` (already anime-only from prior work). Sweep any lingering `useMovieSimilar` imports.
- `TVDetailPage.tsx`: same treatment — recommendations pull from Jikan by title match, fallback to trending anime.

### 9. Anime page section overhaul
- `AnimePage.tsx`: add sectioned rails matching screenshot:
  - **Fan Favorites** (top-anime by score, ranked 1–20)
  - **Trending Now** (Jikan `/top/anime?filter=airing`)
  - **Popular Shows** (Jikan `/top/anime?filter=bypopularity`)
  - **New Releases** (Jikan `/seasons/now`)
  - **Top Rated Movies** (Jikan `/top/anime?type=movie`)
- Each row uses ranked TmdbCard variant with score + year + "TV/Movie" tag.

### 10. QA + verification sweep
- `rg -i "movie|film" src/components/PlayerRecommendations.tsx src/pages/SearchPage.tsx src/pages/AnimePage.tsx` → should only hit anime-type checks, no UI copy.
- Playwright: load `/`, `/anime`, `/tv/37854`, `/watch/tv/37854/1/1`; screenshot each; click through every server chip and confirm iframe URL matches Task 3 template; press `F` in player and confirm fullscreen; screenshot centered desktop nav at 1280px viewport.
- Typecheck + build.

## Technical Details
- NetMirror ZIP path: `/mnt/user-uploads/NetMirror-Extension-master.zip` — inspected in Task 2 to lock exact URL patterns before code (some providers change subdomains).
- IMDb lookup already implemented in `useTmdb.ts` (from prior turn) — reused for 111Movies.
- Fullscreen key handler lives in `MoviePlayer.tsx` `useEffect`, guarded by `document.activeElement?.tagName !== "INPUT"`.
- Category slugs map to Jikan genre IDs in `src/lib/animeGenres.ts` (new file).
- Cache invalidation: bump `streamCache` key to `v2` because provider list changed.

## Out of Scope
- Auth, onboarding, downloads engine, SEO tags, sitemap (already fixed).
- No Netmirror UI/extension code copied — only the URL templates are referenced.

Approve and I'll execute all 10 tasks in one pass.
