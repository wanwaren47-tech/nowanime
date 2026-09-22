import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      onClick={onClick}
      className="h-11 min-w-0 flex-1 rounded-md px-3 text-xs font-semibold md:px-5 md:text-sm"
      aria-pressed={saved}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {saved ? "Saved" : "Watchlist"}
    </Button>
  );
};

export default WatchlistButton;
