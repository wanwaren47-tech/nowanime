import { Link } from "react-router-dom";
import { Flame, Play } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import { useTrendingAnime, usePopularAnime, useTopRatedAnime } from "@/hooks/useAnimeContent";
import { img } from "@/lib/tmdb";

const TrendingPage = () => {
  const trending = useTrendingAnime();
  const popular = usePopularAnime();
  const topRated = useTopRatedAnime();

  const merged = [
    ...(trending.data || []),
    ...(popular.data || []).slice(0, 12),
    ...(topRated.data || []).slice(0, 12),
  ];
  // Deduplicate by id.
  const seen = new Set<number>();
  const list = merged.filter((m: any) => {
    if (!m?.id || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const loading = trending.isLoading && !list.length;

  return (
    <AppLayout>
      <SEO
        title="Trending Anime – NowAnime"
        description="See what's trending in anime this week — top titles across NowAnime."
      />
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Flame className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Trending this week</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-4 pb-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-4 pb-24">
          {list.map((m: any, idx) => {
            const isMovie = !!m.title;
            const to = isMovie ? `/movie/${m.id}` : `/tv/${m.id}`;
            return (
              <Link
                key={m.id}
                to={to}
                className="group relative rounded-lg overflow-hidden bg-white/5 border border-white/5"
              >
                <div className="aspect-[2/3] w-full">
                  {m.poster_path && (
                    <img
                      src={img(m.poster_path, "w500")}
                      alt={m.name || m.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="absolute top-2 left-2 grid place-items-center min-w-[22px] h-[22px] px-1 rounded-md bg-primary text-primary-foreground text-[11px] font-bold">
                  {idx + 1}
                </span>
                <span className="absolute bottom-2 right-2 grid place-items-center w-7 h-7 rounded-full bg-primary/95 opacity-0 group-hover:opacity-100 transition">
                  <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" />
                </span>
                <p className="p-2 text-[11.5px] font-semibold text-foreground line-clamp-1">
                  {m.name || m.title}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default TrendingPage;
