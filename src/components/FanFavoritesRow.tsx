import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Star, Play } from "lucide-react";
import { fetchList, img, type TmdbItem } from "@/lib/tmdb";

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
  const { data = [], isLoading } = useFanFavorites();
  const items = data.slice(0, 20);

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-[4%] mb-3">
        <div>
          <h2 className="text-base md:text-lg font-bold text-foreground">Fan Favorites</h2>
          <p className="text-[11px] text-muted-foreground">The highest-rated anime, ranked by fans.</p>
        </div>
        <Link to="/anime" className="text-[11px] font-semibold text-primary hover:underline">
          View all →
        </Link>
      </div>

      <div className="flex gap-3 px-[4%] overflow-x-auto scrollbar-hide pb-2">
        {(isLoading ? Array.from({ length: 10 }) : items).map((raw: any, i) => {
          const it = raw as TmdbItem | undefined;
          const title = (it as any)?.name || it?.title || "Loading…";
          const year = ((it as any)?.first_air_date || (it as any)?.release_date || "").slice(0, 4);
          const score = it?.vote_average?.toFixed(1) || "—";
          const poster = img(it?.poster_path, "w500") || "/placeholder.svg";
          const rank = String(i + 1).padStart(2, "0");
          const to = it ? `/tv/${it.id}` : "#";

          return (
            <Link
              key={it?.id || i}
              to={to}
              className="group flex-shrink-0 w-[260px] flex items-stretch gap-2 rounded-xl p-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
            >
              <div className="flex flex-col items-center justify-between py-1 pl-1 pr-2 border-r border-white/5">
                <span
                  className="text-[26px] font-black leading-none"
                  style={{
                    background: "var(--gradient-primary)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {rank}
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> {score}
                  </div>
                  <span className="text-[8.5px] font-bold text-white/70 tracking-wider">TV</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[12.5px] font-bold text-foreground line-clamp-2 leading-tight">{title}</p>
                <p className="text-[10.5px] text-muted-foreground mt-1">{year}</p>
              </div>

              <div className="relative w-[64px] h-[92px] rounded-md overflow-hidden bg-black flex-shrink-0">
                {it?.poster_path && (
                  <img src={poster} alt={title} loading="lazy" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default FanFavoritesRow;
