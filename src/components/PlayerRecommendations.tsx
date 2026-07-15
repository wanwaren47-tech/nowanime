import TmdbRow from "./TmdbRow";
import { useTrendingAnime, usePopularAnime, useTopRatedAnime } from "@/hooks/useAnimeContent";

interface Props {
  tmdbId: string;
  type: "movie" | "tv";
}

// Suggestions are ALWAYS anime, regardless of the current title.
const PlayerRecommendations = (_: Props) => {
  const trending = useTrendingAnime();
  const popular = usePopularAnime();
  const topRated = useTopRatedAnime();

  return (
    <div className="mt-8">
      <TmdbRow title="Trending Anime" items={trending.data} isLoading={trending.isLoading} type="tv" />
      <TmdbRow title="Popular Anime" items={popular.data} isLoading={popular.isLoading} type="tv" />
      <TmdbRow title="Top Rated Anime" items={topRated.data} isLoading={topRated.isLoading} type="tv" ranked />
    </div>
  );
};

export default PlayerRecommendations;
