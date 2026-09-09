import { useState, useMemo, useCallback, useRef } from "react";
import { Expand, RefreshCw, CloudDownload, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
    id: "vidlink",
    label: "VidLink",
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: "111movies",
    label: "111Movies",
    movie: (id) => `https://111movies.com/movie/${id}`,
    tv: (id, s, e) => `https://111movies.com/tv/${id}/${s}/${e}`,
  },
  {
    id: "smashystream",
    label: "SmashyStream",
    movie: (id) => `https://player.smashy.stream/movie/${id}`,
    tv: (id, s, e) => `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
  },
  {
    id: "videasy",
    label: "Videasy",
    movie: (id) => `https://player.videasy.net/movie/${id}`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
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
  title,
}: Props) => {
  const [serverIdx, setServerIdx] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const server = PLAYER_SERVERS[serverIdx];
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
    <div className="w-full" style={{ background: "hsl(var(--background))" }}>
      <div ref={containerRef} className="relative w-full aspect-video overflow-hidden bg-black">
        <iframe
          key={`${src}-${reloadKey}`}
          src={src}
          title={title ? `${title} player` : "Player"}
          className="absolute inset-0 w-full h-full bg-black"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="origin"
        />
      </div>

      {/* Server switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2">
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold pr-1">
          Servers
        </span>
        {PLAYER_SERVERS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setServerIdx(i)}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition"
            style={
              i === serverIdx
                ? { background: "hsl(var(--primary))", color: "#fff" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }
            }
          >
            {s.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          aria-label="Reload player"
          className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <Link
          to={type === "tv" ? `/download/tv/${tmdbId}/${season}/${episode}` : `/download/movie/${tmdbId}`}
          aria-label="Download"
          className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <CloudDownload className="w-4 h-4" />
        </Link>
        <button
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
          className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <Expand className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MoviePlayer;
