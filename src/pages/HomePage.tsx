import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import TmdbHero from "@/components/TmdbHero";
import TmdbRow from "@/components/TmdbRow";
import TmdbContinueRow from "@/components/TmdbContinueRow";
import LiveTvRow from "@/components/LiveTvRow";
import InlineAdRow from "@/components/InlineAdRow";
import { fetchList, type TmdbItem } from "@/lib/tmdb";
import { useTrendingAnime, usePopularAnime, useTopRatedAnime, useAnimeByGenre } from "@/hooks/useAnimeContent";
import { useAnimationMovies } from "@/hooks/useTmdb";

// Discover anime with custom params (TMDB).
const animeDiscover = (extra: Record<string, string> = {}) => {
  const qs = new URLSearchParams({
    sort_by: "popularity.desc",
    with_genres: "16",
    with_original_language: "ja",
    include_adult: "false",
    ...extra,
  });
  return fetchList(`/discover/tv?${qs.toString()}`, "tv");
};

const useAnimeSeasonal = () =>
  useQuery<TmdbItem[]>({
    queryKey: ["anime", "seasonal-home"],
    queryFn: () => animeDiscover({ "first_air_date.gte": "2025-06-01" }),
    staleTime: 1000 * 60 * 30,
  });

const useAnimeMovies = () =>
  useQuery<TmdbItem[]>({
    queryKey: ["anime", "movies-home"],
    queryFn: () => {
      const qs = new URLSearchParams({
        sort_by: "popularity.desc",
        with_genres: "16",
        with_original_language: "ja",
        include_adult: "false",
      });
      return fetchList(`/discover/movie?${qs.toString()}`, "movie");
    },
    staleTime: 1000 * 60 * 30,
  });

const HomePage = () => {
  const trending = useTrendingAnime();
  const popular = usePopularAnime();
  const topRated = useTopRatedAnime();
  const seasonal = useAnimeSeasonal();
  const movies = useAnimeMovies();
  const action = useAnimeByGenre("Action");
  const romance = useAnimeByGenre("Romance");
  const fantasy = useAnimeByGenre("Fantasy");
  const comedy = useAnimeByGenre("Comedy");
  const drama = useAnimeByGenre("Drama");
  const mystery = useAnimeByGenre("Mystery");
  const animationMovies = useAnimationMovies();

  const heroItem = trending.data?.[0];

  return (
    <AppLayout>
      <SEO
        title="NowAnime — Watch Anime Free"
        description="Stream and download subbed & dubbed anime in HD. Trending, seasonal, and classic anime series and movies, always free."
      />

      <TmdbHero item={heroItem} type="tv" isLoading={trending.isLoading} />

      <InlineAdRow count={4} />

      <TmdbContinueRow />

      <TmdbRow title="Trending Anime" items={trending.data} isLoading={trending.isLoading} type="tv" viewAll="/anime" ranked />
      <TmdbRow title="This Season" items={seasonal.data} isLoading={seasonal.isLoading} type="tv" viewAll="/anime" />

      <InlineAdRow count={4} />

      <TmdbRow title="Popular Anime" items={popular.data} isLoading={popular.isLoading} type="tv" viewAll="/anime" />
      <TmdbRow title="Top Rated" items={topRated.data} isLoading={topRated.isLoading} type="tv" ranked />
      <TmdbRow title="Anime Movies" items={movies.data} isLoading={movies.isLoading} type="movie" />

      <InlineAdRow count={4} />

      <TmdbRow title="Action & Adventure" items={action.data} isLoading={action.isLoading} type="tv" />
      <TmdbRow title="Romance" items={romance.data} isLoading={romance.isLoading} type="tv" />
      <TmdbRow title="Fantasy" items={fantasy.data} isLoading={fantasy.isLoading} type="tv" />

      <InlineAdRow count={4} />

      <TmdbRow title="Comedy" items={comedy.data} isLoading={comedy.isLoading} type="tv" />
      <TmdbRow title="Drama" items={drama.data} isLoading={drama.isLoading} type="tv" />
      <TmdbRow title="Mystery" items={mystery.data} isLoading={mystery.isLoading} type="tv" />

      <LiveTvRow />

      <TmdbRow title="Animated Movies" items={animationMovies.data} isLoading={animationMovies.isLoading} type="movie" viewAll="/animation" />
    </AppLayout>
  );
};

export default HomePage;
