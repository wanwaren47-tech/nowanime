import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import { Bookmark, Play, X } from "lucide-react";
import { img } from "@/lib/tmdb";
import {
  getWatchlist,
  toggleWatchlist,
  WATCHLIST_EVENT,
  type WatchlistItem,
} from "@/lib/animeWatchlist";

const MyListPage = () => {
  const [list, setList] = useState<WatchlistItem[]>(getWatchlist);

  useEffect(() => {
    const sync = () => setList(getWatchlist());
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <AppLayout>
      <SEO title="Watchlist – NowAnime" description="Your saved anime on NowAnime — pick up where you left off." />
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          {list.length} saved title{list.length !== 1 ? "s" : ""}
        </p>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
          <Bookmark className="w-12 h-12" />
          <p className="text-sm font-medium">Your watchlist is empty</p>
          <p className="text-xs">Tap “Add to Watchlist” on any anime to save it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 px-6 pb-8">
          {list.map((v) => (
            <div key={`${v.type}-${v.id}`} className="group relative">
              <Link
                to={v.type === "tv" ? `/anime/${v.id}` : `/movie/${v.id}`}
                className="block rounded-lg overflow-hidden bg-surface-2 border border-white/10"
              >
                <div className="relative aspect-[2/3] bg-white/5">
                  {v.poster_path ? (
                    <img
                      src={img(v.poster_path, "w500") || undefined}
                      alt={v.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="grid place-items-center h-full text-muted-foreground text-xs">No image</div>
                  )}
                  <span className="absolute bottom-2 right-2 grid place-items-center w-7 h-7 rounded-full bg-primary">
                    <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" />
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-[11.5px] font-semibold text-foreground line-clamp-2 leading-snug">{v.title}</p>
                  {v.year && <p className="text-[10px] text-muted-foreground mt-0.5">{v.year}</p>}
                </div>
              </Link>
              <button
                onClick={() => {
                  toggleWatchlist({ ...v });
                  setList(getWatchlist());
                }}
                aria-label={`Remove ${v.title} from watchlist`}
                className="absolute top-2 left-2 grid place-items-center w-7 h-7 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default MyListPage;
