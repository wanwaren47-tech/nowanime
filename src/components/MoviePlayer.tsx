import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw, Expand, WifiOff, CloudDownload } from "lucide-react";
import { Link } from "react-router-dom";
import { recordStream, getCachedStream } from "@/lib/streamCache";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isDownloaded } from "@/lib/offlineDownloads";
import DownloadButton from "@/components/DownloadButton";
import { PROVIDERS, type ServerId } from "@/lib/streamProviders";

export type { ServerId };
export const PLAYER_SERVERS = PROVIDERS; // legacy export

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
}

const SANDBOX = "allow-same-origin allow-scripts allow-forms allow-presentation";

const MoviePlayer = ({
  tmdbId,
  imdbId,
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
  const initialIdx = Math.max(0, PROVIDERS.findIndex((s) => s.id === serverId));
  const [serverIdx, setServerIdx] = useState(initialIdx === -1 ? 0 : initialIdx);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const online = useOnlineStatus();
  const [savedOffline, setSavedOffline] = useState(false);

  useEffect(() => {
    let active = true;
    isDownloaded(`${type}-${tmdbId}`).then((d) => {
      if (active) setSavedOffline(d);
    });
    return () => {
      active = false;
    };
  }, [type, tmdbId]);

  useEffect(() => {
    if (!serverId) return;
    const i = PROVIDERS.findIndex((s) => s.id === serverId);
    if (i >= 0 && i !== serverIdx) setServerIdx(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  const server = PROVIDERS[serverIdx];
  const builtSrc = server.build({ tmdbId, imdbId, type, season, episode });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setResolvedSrc("");
    (async () => {
      const cached = await getCachedStream(
        tmdbId,
        type,
        server.id,
        type === "tv" ? season : undefined,
        type === "tv" ? episode : undefined,
      );
      if (!active) return;
      setResolvedSrc(cached?.url || builtSrc);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtSrc]);

  useEffect(() => {
    if (!resolvedSrc) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setError(true);
      recordStream(
        tmdbId,
        type,
        server.id,
        resolvedSrc,
        false,
        type === "tv" ? season : undefined,
        type === "tv" ? episode : undefined,
      );
    }, 15000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc]);

  const selectServer = useCallback(
    (idx: number) => {
      const i = ((idx % PROVIDERS.length) + PROVIDERS.length) % PROVIDERS.length;
      setServerIdx(i);
      onServerChange?.(PROVIDERS[i].id);
    },
    [onServerChange],
  );

  const handleLoad = () => {
    clearTimeout(timerRef.current);
    setLoading(false);
    setError(false);
    recordStream(
      tmdbId,
      type,
      server.id,
      resolvedSrc,
      true,
      type === "tv" ? season : undefined,
      type === "tv" ? episode : undefined,
    );
  };

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // Bind "F" key → fullscreen (skip when typing in an input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F") return;
      const t = document.activeElement;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (t as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen]);

  if (!online && !savedOffline) {
    return (
      <div className="w-full" style={{ background: "hsl(var(--background))" }}>
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
            <WifiOff className="h-6 w-6 text-white/70" />
          </div>
          <p className="text-white text-sm font-semibold">You're offline</p>
          <p className="text-white/55 text-xs max-w-xs leading-relaxed">
            Connect to the internet to stream this title — or download episodes while online to watch anytime.
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
        {resolvedSrc && (
          <iframe
            key={resolvedSrc}
            src={resolvedSrc}
            className="absolute inset-0 w-full h-full"
            onLoad={handleLoad}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
            sandbox={SANDBOX}
            referrerPolicy="origin"
            title="NowAnime Player"
            style={{ border: 0, aspectRatio: "16/9" }}
          />
        )}

        {loading && !error && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
            style={{ background: "hsl(var(--background))" }}
          >
            <Loader2 className="w-9 h-9 animate-spin mb-2" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-white text-xs font-medium">Loading {server.label}…</p>
          </div>
        )}

        {error && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-6 text-center"
            style={{ background: "hsl(var(--background))" }}
          >
            <AlertCircle className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-white text-xs font-medium">Couldn't load {server.label}.</p>
            <button
              onClick={() => selectServer(serverIdx + 1)}
              className="flex items-center gap-1.5 text-white text-[11px] px-3 py-1.5 rounded-md font-semibold"
              style={{ background: "hsl(var(--primary))" }}
            >
              <RefreshCw className="w-3 h-3" /> Try next server
            </button>
          </div>
        )}
      </div>

      {/* One-line toolbar: server chips (scrollable) + download + fullscreen */}
      <div
        className="flex items-center gap-1.5 px-3 py-2"
        style={{ background: "hsl(var(--background))", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-1 flex-shrink-0">
            Server
          </span>
          {PROVIDERS.map((s, i) => {
            const active = i === serverIdx;
            const disabled = s.requiresImdb && !imdbId;
            return (
              <button
                key={s.id}
                onClick={() => !disabled && selectServer(i)}
                disabled={disabled}
                className="px-2.5 py-1 rounded-md text-[10.5px] font-semibold whitespace-nowrap transition-colors disabled:opacity-40 flex-shrink-0"
                style={{
                  background: active ? "var(--gradient-primary)" : "rgba(255,255,255,0.06)",
                  color: active ? "#fff" : "rgba(255,255,255,0.75)",
                  border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {s.short}
              </button>
            );
          })}
        </div>

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

        <button
          onClick={toggleFullscreen}
          title="Fullscreen (F)"
          aria-label="Fullscreen"
          className="flex-shrink-0 grid place-items-center h-7 w-7 rounded-md text-white"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <Expand className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default MoviePlayer;
