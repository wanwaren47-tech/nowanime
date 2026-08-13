import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Loader2, Expand, WifiOff, CloudDownload, Share2, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import DownloadButton from "@/components/DownloadButton";
import { PLAYER_SERVERS, getServer, buildEmbedUrl, type ServerId } from "@/lib/streamProviders";

export type { ServerId };
export { PLAYER_SERVERS };

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
  serverId,
  onServerChange,
  title,
  year,
  poster,
  backdrop,
}: Props) => {
  const online = useOnlineStatus();
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ServerId>(() => getServer(serverId).id);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const next = PLAYER_SERVERS.find((s) => s.id === serverId);
    if (next) setActive(next.id);
  }, [serverId]);

  const src = useMemo(() => {
    const server = getServer(active);
    return buildEmbedUrl(server, type, tmdbId, season, episode);
  }, [active, type, tmdbId, season, episode]);

  useEffect(() => { setLoading(true); }, [src, reloadKey]);

  const pick = (id: ServerId) => {
    setActive(id);
    onServerChange?.(id);
  };

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
        const orientation: any = (screen as any).orientation;
        if (orientation?.lock && window.matchMedia("(pointer: coarse)").matches) {
          try { await orientation.lock("landscape"); } catch { /* ignore */ }
        }
      } else {
        try { (screen as any).orientation?.unlock?.(); } catch { /* ignore */ }
        await document.exitFullscreen?.();
      }
    } catch { /* ignore */ }
  }, []);

  const share = async () => {
    const link = `${window.location.origin}${type === "tv" ? `/anime/${tmdbId}` : `/movie/${tmdbId}`}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied — share it anywhere");
    } catch {
      toast.error(link);
    }
  };

  if (!online) {
    return (
      <div className="w-full" style={{ background: "hsl(var(--background))" }}>
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
            <WifiOff className="h-6 w-6 text-white/70" />
          </div>
          <p className="text-white text-sm font-semibold">You're offline</p>
          <p className="text-white/55 text-xs max-w-xs leading-relaxed">
            Connect to the internet to stream this title — or open your saved downloads.
          </p>
          <Link
            to="/my-downloads"
            className="mt-1 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[11px] font-semibold text-white"
            style={{ background: "hsl(var(--primary))" }}
          >
            <CloudDownload className="h-3.5 w-3.5" /> Go to Downloads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ background: "hsl(var(--background))" }}>
      <div ref={containerRef} className="relative w-full aspect-video overflow-hidden bg-black">
        {src ? (
          <iframe
            key={`${src}-${reloadKey}`}
            src={src}
            title={title ? `${title} player` : "Player"}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            onLoad={() => setLoading(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-white/70">
            This server doesn't serve {type === "tv" ? "episodes" : "movies"} — pick another below.
          </div>
        )}

        {loading && src && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
            style={{ background: "hsl(var(--background))" }}
          >
            <Loader2 className="w-9 h-9 animate-spin mb-2" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-white text-xs font-medium">Loading stream…</p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-2"
        style={{ background: "hsl(var(--background))", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          aria-label="Reload player"
          title="Reload"
          className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          title="Fullscreen"
          className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          <Expand className="w-4 h-4" />
        </button>
        <button
          onClick={share}
          aria-label="Share"
          title="Copy link"
          className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        {title && (
          <DownloadButton
            size="sm"
            type={type}
            tmdbId={tmdbId}
            title={title}
            year={year}
            poster={poster}
            backdrop={backdrop}
            season={type === "tv" ? season : undefined}
            episode={type === "tv" ? episode : undefined}
          />
        )}
      </div>

      {/* Server picker */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
          <Server className="w-3 h-3" /> Servers — switch if playback fails
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {PLAYER_SERVERS.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => pick(s.id)}
                className="flex-shrink-0 px-3 h-8 rounded-full text-[11px] font-semibold transition"
                style={{
                  background: isActive ? "hsl(var(--primary))" : "rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              >
                {s.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;
