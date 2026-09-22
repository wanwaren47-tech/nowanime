# Responsive ads and anime navigation

## Build
- Add the supplied 468×60 advertisement as a responsive banner that preserves its proportions on phones and displays at full size on wider screens.
- Place that banner directly below the top bar on Home, Explore, movie details, series/anime details, and all player pages.
- Enlarge the existing four-across native ad row while keeping a fixed, stable height so content does not collapse or shift.
- Start ad loading immediately, reserve the ad space before scripts finish, and retain a single quick retry for slow networks.
- Change mobile and desktop navigation to: Home, Explore, Trending, Library, Profile.
- Give Explore a distinct four-separate-squares icon and preserve clear active states on both navigation layouts.

## Technical details
- Keep each third-party ad instance isolated in its own iframe to prevent global script and container-ID collisions.
- Scale the fixed 468×60 creative proportionally with its container instead of cropping it on mobile.
- Reuse the existing `/search`, `/trending`, `/library`, and `/profile` pages rather than changing their behavior.
- Verify the updated pages at mobile and desktop widths and check the preview for build/runtime errors.
