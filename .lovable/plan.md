## Goals

Ship six coordinated improvements: offline subtitle availability indicator, sitemap pre-deploy verifier, VideoObject/TVEpisode structured data, resume-position playback, redesigned independent download cards, and reliable cross-device ad loading.

## 1. Subtitle offline-availability status

- In `MyDownloadsPage` player (offline) and `MoviePlayer` (online), compute per-track availability:
  - Offline: track blob present in IndexedDB `captions` array → "Available offline".
  - Online with a matching downloaded episode: check `getDownload(id)` for matching lang.
- Show a small badge next to the selected language in the CC menu and a status pill under the player: green "Subtitles ready offline" / amber "Subtitles online-only".

## 2. Pre-deploy sitemap verifier

- New script `scripts/verify-sitemap.ts` that:
  - Parses `public/sitemap.xml` and asserts ≥250 `<url>` entries.
  - HEADs each `<loc>`, `<image:loc>`, `<video:thumbnail_loc>`, `<video:player_loc>` (concurrency 10, small timeout).
  - Fails (non-zero exit) on ≥5% failure rate or <250 entries; logs offenders.
- Wire into `package.json` as `predeploy` and `postbuild` so it runs after `generate-sitemap` during `bun run build`.

## 3. VideoObject / TVEpisode / Anime schema

- Extend `SEO.tsx` (or add `StructuredData.tsx`) to accept a `jsonLd` prop and inject via react-helmet-async.
- On `MovieDetailPage`, `TVDetailPage`, `AnimeDetailPage`: emit `VideoObject` (name, description, thumbnailUrl, uploadDate, contentUrl/embedUrl, duration).
- On TV/Anime: also emit `TVSeries` with `numberOfEpisodes`, `numberOfSeasons`, and per-episode `TVEpisode` list (top 10 to keep size sane).
- On watch pages: emit `VideoObject` for the current episode/movie.

## 4. Resume playback (online + offline)

- New `src/lib/playbackProgress.ts` — localStorage keyed by `${type}-${tmdbId}-s${season}-e${ep}` or offline id. Stores `{ position, duration, updatedAt }`.
- Hook `MoviePlayer` `<video>` events: `loadedmetadata` seeks to saved position (if <95% done); `timeupdate` throttled write every 5s; `ended` clears entry.
- Offline player in `MyDownloadsPage` uses same helper with the download id as key.
- Show a "Resume from X:XX" toast/inline button when saved position exists.

## 5. Downloads page redesign

- Rebuild `MyDownloadsPage` grid: each item is an independent card (poster left, title/progress right, tap-to-play). Remove the delete button entirely; long-press or a subtle overflow menu can keep management, but per request the delete button is removed from the card face.
- Grouped series stay as expandable folders with the same independent-card style inside.
- Match spacing/typography of the reference layout (compact rows, rounded surfaces, no destructive buttons visible).

## 6. Cross-device ad reliability

- Wrap Adsterra loader in `AdBanner`/`NativeAd` with:
  - `requestIdleCallback` fallback to `setTimeout` for slow devices (Redmi/older Android).
  - Retry once after 4s if the injected `<ins>`/iframe hasn't rendered.
  - `crossorigin="anonymous"` and `referrerPolicy="no-referrer-when-downgrade"` on script tags for iOS Safari.
  - Explicit min-height container to avoid CLS-driven unmounts.
  - Guard for iOS in-app browsers (skip when `navigator.standalone === false && /FBAN|FBAV|Instagram/.test(ua)` blocks scripts — fallback to a static promo).

## Technical notes

- react-helmet-async already installed; JSON-LD injected as `<script type="application/ld+json">`.
- Progress storage uses a single localStorage namespace `nowanime:progress:v1` to allow future migration.
- Verifier uses `node:fetch` with `AbortController`; concurrency via a small pool, no extra deps.
- Ad retry keyed by a random id to avoid duplicate script tags.

## Out of scope

- No changes to auth, DB schema, or streaming resolver logic.
- Series-folder navigation stays as-is aside from the card visual refresh.
