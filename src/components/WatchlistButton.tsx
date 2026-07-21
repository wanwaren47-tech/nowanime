import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import {
  isInWatchlist,
  toggleWatchlist,
  WATCHLIST_EVENT,
  type WatchlistItem,
} from "@/lib/animeWatchlist";

interface Props {
  item: Omit<WatchlistItem, "addedAt">;
}

const WatchlistButton = ({ item }: Props) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isInWatchlist(item.id, item.type));
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
  }, [item.id, item.type]);

  const onClick = () => {
    const nowSaved = toggleWatchlist(item);
    setSaved(nowSaved);
    toast.success(nowSaved ? "Added to your watchlist" : "Removed from watchlist");
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-semibold px-5 py-3 rounded-lg text-sm border transition-colors"
      style={{
        background: saved ? "hsl(var(--primary) / 0.15)" : "rgba(255,255,255,0.06)",
        borderColor: saved ? "hsl(var(--primary))" : "rgba(255,255,255,0.14)",
        color: saved ? "hsl(var(--primary))" : "#fff",
      }}
      aria-pressed={saved}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {saved ? "In Watchlist" : "Add to Watchlist"}
    </button>
  );
};

export default WatchlistButton;
