// Anime category taxonomy for the desktop nav dropdown.
// Slugs feed /anime?genre=<slug> and map to TMDB tv-genre filters via the anime page.

export interface AnimeCategory {
  slug: string;
  label: string;
  tmdbGenreId?: number; // secondary TMDB tv genre (in addition to 16 Animation)
  keyword?: number; // TMDB keyword id fallback
}

export const ANIME_CATEGORIES: AnimeCategory[] = [
  { slug: "action", label: "Action", tmdbGenreId: 10759 },
  { slug: "adventure", label: "Adventure", tmdbGenreId: 10759 },
  { slug: "comedy", label: "Comedy", tmdbGenreId: 35 },
  { slug: "drama", label: "Drama", tmdbGenreId: 18 },
  { slug: "fantasy", label: "Fantasy", tmdbGenreId: 10765 },
  { slug: "romance", label: "Romance", tmdbGenreId: 10749 },
  { slug: "sci-fi", label: "Sci-Fi", tmdbGenreId: 10765 },
  { slug: "slice-of-life", label: "Slice of Life", keyword: 210024 },
  { slug: "sports", label: "Sports", keyword: 6075 },
  { slug: "supernatural", label: "Supernatural", keyword: 6152 },
  { slug: "mecha", label: "Mecha", keyword: 4344 },
  { slug: "horror", label: "Horror", tmdbGenreId: 9648 },
  { slug: "isekai", label: "Isekai", keyword: 246716 },
  { slug: "shounen", label: "Shounen", keyword: 210024 },
  { slug: "seinen", label: "Seinen", keyword: 13141 },
];
