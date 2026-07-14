# Full Anime Cleanup & Polish — 10 Tasks

Complete the NowAnime transformation: purge remaining movie/red references, wire all 4 servers reliably, new professional logo, tighter bottom nav, and settings-as-pages.

## Tasks

**1. New professional NowAnime logo + favicon/splash**
Generate a clean anime-style mark (stylized "N" with pink/purple gradient, subtle sparkle/star motif — professional not cartoony). Upload via `lovable-assets`. Replace: `public/favicon.png`, `public/manifest.json` icons, `apple-touch-icon`, all `BrandLogo` references, splash screen meta. Delete stale logo asset JSONs.

**2. Purge red color remnants → pink brand token**
`rg -i "red-|#ff0000|#dc2626|#ef4444|bg-red|text-red|border-red"` across `src/**` and replace with `primary`/`destructive` semantic tokens (destructive already themed pink). Sweep `index.css` for any leftover red HSL values.

**3. Delete irrelevant movie/TV pages**
Remove: `MoviesPage.tsx`, `TVPage.tsx`, `PodcastsPage.tsx`, `ShortsPage.tsx`, `DocumentaryPage.tsx`, `AnimationPage.tsx` (redundant w/ Anime), `LiveTVPage.tsx`, `LikedVideosPage.tsx` (if unused), `OnlyOnNowAnime.tsx`, `GiftCards.tsx`, `Redeem.tsx`, `Investors.tsx`, `Jobs.tsx`, `Corporate.tsx`, `MediaCenter.tsx`, `WaysToWatch.tsx`, `AdChoices.tsx` unused corp pages. Update `App.tsx` routes → redirect to `/home`. Remove `Footer.tsx` usage on mobile.

**4. BottomNav: 5 tabs, larger buttons**
Simplify to **Home / Explore / Downloads / Profile / Settings** (remove Anime TV, remove Anime tab — Anime is on Home). Increase icon size to 22px, label to 11px, min-height 52px, more padding. Remove Live TV entry.

**5. Remove mobile footer + settings-as-pages**
`AppLayout.tsx`: hide `<Footer />` on mobile (`hidden md:block`). In `SettingsPage.tsx`, add sections for each footer link (Help, FAQ, Contact, Privacy, Terms, Legal, Follow Us, Install App, Speed Test) as tappable list rows navigating to their existing pages.

**6. Onboarding → anime-first**
`OnboardingGenres.tsx`: replace movie genres with anime genres (Shounen, Shoujo, Isekai, Mecha, Slice of Life, Romance, Action, Fantasy, Sci-Fi, Horror, Sports, Comedy, Drama, Music, Supernatural). `OnboardingTitles.tsx`: seed with popular anime titles from Jikan/TMDB anime discover. `Welcome.tsx` copy → anime-focused. `OnboardingDone.tsx` → "Start watching anime".

**7. 4 servers with working embeds + stream caching**
`MoviePlayer.tsx` server list, in this order:
1. **111Movies** (default) — `https://111movies.com/movie/{id}` / `/tv/{id}/{s}/{e}`
2. **SmashyStream** — `https://embed.smashystream.com/playere.php?tmdb={id}` (movie) / `?tmdb={id}&season={s}&episode={e}` (tv)
3. **VidSrc** — `https://vidsrc.su/embed/movie/{id}` / `/tv/{id}/{s}/{e}`
4. **Nontongo** — `https://www.nontongo.win/embed/movie/{id}` / `/tv/{id}/{s}/{e}`

Sandbox: `allow-same-origin allow-scripts allow-forms allow-presentation`, `referrerpolicy="no-referrer"`. Use existing `streamCache.ts` (`getCachedStream`/`recordStream`) — on iframe load success record working=true, on error try next server and cache result. 7-day cache already in place.

**8. Home page — anime-only sections polish**
Remove `LiveTvRow` and `useAnimationMovies` row from `HomePage.tsx`. Keep: Trending, Seasonal, Popular, Top Rated, Movies, Genre rows (Action, Romance, Fantasy, Comedy, Drama, Mystery). Ensure `TmdbHero` uses anime. `PlayerRecommendations` / suggestions rail on watch pages: filter to `with_genres=16 & with_original_language=ja`.

**9. Watch page suggestions = anime only**
`MovieWatchPage.tsx` + `TvWatchPage.tsx`: replace `useMovieSimilar` "Up Next" with anime-filtered discover (recommendations intersected with genre 16 or fallback trending anime). Ensures no non-anime bleed into the right rail.

**10. QA sweep**
- `rg -i "bingbloom|movies page|live tv|podcast" src/ public/` → 0 hits
- `rg -i "red-[0-9]|#ef4444|#dc2626" src/` → 0 hits
- Typecheck + build
- Playwright: load `/home`, `/anime`, `/search`, `/my-downloads`, click a title → watch page → cycle through all 4 servers, verify iframe loads (screenshot each), verify downloads sheet still works, verify onboarding flow, verify bottom nav 5 tabs, verify no footer on mobile, verify settings page shows all sub-page rows.

## Technical notes
- Logo: `imagegen` premium tier for legible mark, transparent PNG, then `lovable-assets create`.
- Stream cache already exists (`src/lib/streamCache.ts` + `record-stream` edge fn) — just wire calls in `MoviePlayer.tsx` onLoad/onError.
- Iframe redirect prevention already via strict `sandbox`.
- No schema/secret changes.
