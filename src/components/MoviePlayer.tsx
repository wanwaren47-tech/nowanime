import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Expand, RefreshCw, CloudDownload, Share2, Shield, ShieldCheck, SkipForward } from "lucide-react";
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
  protection?: "optional" | "default-on";
}

export const PLAYER_SERVERS: Server[] = [
  {
    id: "cinesrc",
    label: "CineSrc",
    protection: "optional",
    movie: (id) => `https://cinesrc.st/embed/movie/${id}`,
    tv: (id, s, e) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}`,
  },
  {
    id: "nova",
    label: "Nova",
    movie: (id) => `https://moviesapi.to/movie/${id}`,
    tv: (id, s, e) => `https://moviesapi.to/tv/${id}/${s}/${e}`,
    protection: "default-on",
  },
  {
    id: "vale",
    label: "Vale",
    movie: (id) => `https://vidzen.fun/movie/${id}`,
    tv: (id, s, e) => `https://vidzen.fun/tv/${id}/${s}/${e}`,
    protection: "default-on",
  },
  {
    id: "smashy",
    label: "Smashy",
    movie: (id) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    tv: (id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`,
    protection: "optional",
  },
  {
    id: "crimson",
    label: "Crimson",
    movie: (id) => `https://vidcore.io/movie/${id}`,
    tv: (id, s, e) => `https://vidcore.io/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidnest",
    label: "Helix",
    movie: (id) => `https://vidnest.fun/movie/${id}`,
    tv: (id, s, e) => `https://vidnest.fun/tv/${id}/${s}/${e}`,
  },
  {
    id: "astra",
    label: "Astra",
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: "ironclad",
    label: "Ironclad",
    movie: (id) => `https://vidsrcme.ru/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrcme.ru/embed/tv/${id}/${s}-${e}`,
  },
  {
    id: "filmu",
    label: "Lumen",
    movie: (id) => `https://embed.filmu.in/movie/${id}`,
    tv: (id, s, e) => `https://embed.filmu.in/tv/${id}/${s}/${e}`,
  },
];

// No popup or top-navigation permissions: blocked ad redirects cannot leave the app.
const PROTECTED_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

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
  serverId = "cinesrc",
  onServerChange,
  title,
}: Props) => {
  const initialIndex = PLAYER_SERVERS.findIndex((item) => item.id === serverId);
  const [serverIdx, setServerIdx] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [protectionSettings, setProtectionSettings] = useState<Record<string, boolean>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const orientationLocked = useRef(false);

  useEffect(() => {
    const releaseOrientation = () => {
      if (document.fullscreenElement !== containerRef.current && orientationLocked.current) {
        screen.orientation?.unlock?.();
        orientationLocked.current = false;
      }
    };
    document.addEventListener("fullscreenchange", releaseOrientation);
    return () => {
      document.removeEventListener("fullscreenchange", releaseOrientation);
      if (orientationLocked.current) screen.orientation?.unlock?.();
    };
  }, []);

  const server = PLAYER_SERVERS[serverIdx] ?? PLAYER_SERVERS[0];
  const supportsProtection = Boolean(server.protection);
  const isProtected = supportsProtection && (protectionSettings[server.id] ?? server.protection === "default-on");
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
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
        const orientation = screen.orientation as LockableOrientation | undefined;
        if (document.fullscreenElement === el && window.matchMedia("(pointer: coarse)").matches && orientation?.lock) {
          try {
            await orientation.lock("landscape");
            orientationLocked.current = true;
            if (document.fullscreenElement !== el) {
              orientation.unlock();
              orientationLocked.current = false;
            }
          } catch { /* Orientation locking is unavailable on some phone browsers. */ }
        }
      } else await document.exitFullscreen?.();
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="w-full bg-background">
      <div ref={containerRef} className="relative w-full aspect-video overflow-hidden bg-card">
        <iframe
          key={`${src}-${reloadKey}-${isProtected ? "protected" : "standard"}`}
          src={src}
          title={title ? `${title} player` : "Player"}
          className="absolute inset-0 h-full w-full bg-card"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
          sandbox={isProtected ? PROTECTED_SANDBOX : undefined}
        />
      </div>

      <div className="flex items-center gap-1 border-t border-border/60 bg-background px-2 py-1.5 sm:gap-2 sm:px-3">
        <span className="hidden sm:inline shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">Source</span>
        <div>
        <Select value={server.id} onValueChange={selectServer}>
          <SelectTrigger className="h-8 w-[110px] sm:w-[126px] border-border bg-secondary text-xs font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAYER_SERVERS.map((item) => (
              <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
        {supportsProtection && (
          <Button type="button" variant={isProtected ? "default" : "ghost"}
            aria-pressed={isProtected} aria-label="Turn off ads"
            onClick={() => setProtectionSettings((settings) => ({ ...settings, [server.id]: !isProtected }))}
            title={isProtected ? "Allow ads and redirects" : "Turn off ads and redirects"}
            className="h-8 w-8 shrink-0 gap-1 p-0 sm:w-auto sm:px-2 text-[10px] font-semibold">
            {isProtected ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            <span className="hidden sm:inline">Turn off ads</span>
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Try next source"
          title="Not playing? Try next source"
          onClick={() => {
            const nextServer = PLAYER_SERVERS[(serverIdx + 1) % PLAYER_SERVERS.length];
            selectServer(nextServer.id);
          }}
          className="h-8 w-8 shrink-0 text-muted-foreground"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
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
      {supportsProtection && (
        <p className="border-t border-border/60 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
          Turn off ads to block popups and redirects away from the app. If you see something like "sandboxed" or the video won't play, switch it off to watch normally.
        </p>
      )}
    </div>
  );
};

export default MoviePlayer;
