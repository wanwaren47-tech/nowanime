import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Expand, RefreshCw, CloudDownload, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Embed-only player. No backend / edge functions involved.
export type ServerId = string;

interface Server {
  id: string;
  label: string;
  movie: (id: string) => string;
  tv: (id: string, s: number, e: number) => string;
}

export const PLAYER_SERVERS: Server[] = [
  {
    id: "cinesrc",
    label: "Nova",
    movie: (id) => `https://cinesrc.st/embed/movie/${id}`,
    tv: (id, s, e) => `https://cinesrc.st/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidcore",
    label: "Crimson",
    movie: (id) => `https://vidcore.io/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidcore.io/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidnest",
    label: "Helix",
    movie: (id) => `https://vidnest.fun/movie/${id}`,
    tv: (id, s, e) => `https://vidnest.fun/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidlink",
    label: "Astra",
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrc",
    label: "Ironclad",
    movie: (id) => `https://vidsrcme.ru/embed/movie?tmdb=${id}`,
    tv: (id, s, e) => `https://vidsrcme.ru/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: "vidgod",
    label: "Vale",
    movie: (id) => `https://vidgod.site/movie/${id}`,
    tv: (id, s, e) => `https://vidgod.site/tv/${id}/${s}/${e}`,
  },
  {
    id: "filmu",
    label: "Lumen",
    movie: (id) => `https://embed.filmu.in/movie/${id}`,
    tv: (id, s, e) => `https://embed.filmu.in/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidbolt",
    label: "Cipher",
    movie: (id) => `https://vidbolt.xyz/movie/${id}?theme=ef3b28`,
    tv: (id, s, e) => `https://vidbolt.xyz/tv/${id}/${s}/${e}?theme=ef3b28`,
  },
];

interface Props {
  tmdbId: string;
  imdbId?: string | null;
  type?: "movie" | "tv";
  season?: number;
  episode?: number;
  serverId?: ServerId;
  onServerChange?: (id: ServerId) => void;
  title?: string;
  year?: string;
  poster?: string | null;
  backdrop?: string | null;
  onEnded?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const MoviePlayer = ({
  tmdbId,
  type = "movie",
  season = 1,
  episode = 1,
  serverId = "vidbolt",
  onServerChange,
  title,
}: Props) => {
  const initialIndex = PLAYER_SERVERS.findIndex((item) => item.id === serverId);
  const [serverIdx, setServerIdx] = useState(initialIndex >= 0 ? initialIndex : PLAYER_SERVERS.length - 1);
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const server = PLAYER_SERVERS[serverIdx];
  useEffect(() => {
    const nextIndex = PLAYER_SERVERS.findIndex((item) => item.id === serverId);
    if (nextIndex >= 0) setServerIdx(nextIndex);
  }, [serverId]);

  const selectServer = (id: string) => {
    const nextIndex = PLAYER_SERVERS.findIndex((item) => item.id === id);
    if (nextIndex < 0) return;
    setServerIdx(nextIndex);
    onServerChange?.(id);
  };
  const src = useMemo(
    () => (type === "tv" ? server.tv(tmdbId, season, episode) : server.movie(tmdbId)),
    [server, type, tmdbId, season, episode],
  );

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="w-full bg-background">
      <div ref={containerRef} className="relative w-full aspect-video overflow-hidden bg-card">
        <iframe
          key={`${src}-${reloadKey}`}
          src={src}
          title={title ? `${title} player` : "Player"}
          className="absolute inset-0 h-full w-full bg-card"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
        />
      </div>

      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
        <span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">Source</span>
        <Select value={server.id} onValueChange={selectServer}>
          <SelectTrigger className="h-8 w-[126px] border-border bg-secondary text-xs font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAYER_SERVERS.map((item) => (
              <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setReloadKey((k) => k + 1)}
          aria-label="Reload player"
          className="h-8 w-8 shrink-0 text-muted-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Link
          to={type === "tv" ? `/download/tv/${tmdbId}/${season}/${episode}` : `/download/movie/${tmdbId}`}
          aria-label="Download"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <CloudDownload className="w-4 h-4" />
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={async () => {
            const link = `${window.location.origin}${type === "tv" ? `/anime/${tmdbId}` : `/movie/${tmdbId}`}`;
            try {
              await navigator.clipboard.writeText(link);
              toast.success("Link copied — share it anywhere");
            } catch {
              toast.error(link);
            }
          }}
          aria-label="Share"
          className="h-8 w-8 shrink-0 text-muted-foreground"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          className="h-8 w-8 shrink-0 text-muted-foreground"
        >
          <Expand className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default MoviePlayer;
