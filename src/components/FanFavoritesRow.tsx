import { useQuery } from "@tanstack/react-query";
import TmdbRow from "./TmdbRow";
import { fetchList, type TmdbItem } from "@/lib/tmdb";

// Fan Favorites — the score-ranked top anime list shown on Home.
// Data comes from TMDB discover filtered to Japanese animation, sorted by rating.
const useFanFavorites = () =>
  useQuery<TmdbItem[]>({
    queryKey: ["anime", "fan-favorites"],
    queryFn: () => {
      const qs = new URLSearchParams({
        sort_by: "vote_average.desc",
        with_genres: "16",
        with_original_language: "ja",
        "vote_count.gte": "200",
        include_adult: "false",
      });
      return fetchList(`/discover/tv?${qs.toString()}`, "tv");
    },
    staleTime: 1000 * 60 * 30,
  });

const FanFavoritesRow = () => {
  const { data, isLoading } = useFanFavorites();

  return (
    <TmdbRow
      title="Fan Favorites"
      items={data}
      isLoading={isLoading}
      type="tv"
      viewAll="/anime"
      ranked
    />
  );
};

export default FanFavoritesRow;
