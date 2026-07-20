import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw, Expand, WifiOff, CloudDownload, Play, SkipBack, SkipForward, Subtitles } from "lucide-react";
import { Link } from "react-router-dom";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isDownloaded } from "@/lib/offlineDownloads";
import DownloadButton from "@/components/DownloadButton";
import {
  resolveMovieboxDownloads,
  movieboxProxyUrl,
  resolutionLabel,
  formatBytes,
  type MovieboxDownload,
} from "@/lib/moviebox";
import { listSubtitles, subtitleVttUrl, type SubtitleTrack } from "@/lib/subtitles";

// Legacy type kept as a no-op export so existing imports don't break.
export type ServerId = "moviebox";
export const PLAYER_SERVERS = [{ id: "moviebox", label: "MovieBox", short: "HD" }] as const;

interface Props {
  tmdbId: string;
  imdbId?: string | null;
  type?: "movie" | "tv";
  season?: number;
  episode?: number;
  /** Kept for backwards compatibility; unused. */
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

// Preferred order of resolutions we surface in the selector.
const PREFERRED = [1080, 720, 480];

const MoviePlayer = ({
  tmdbId,
  imdbId,
  type = "movie",
  season = 1,
  episode = 1,
  title,
  year,
  poster,
  backdrop,
  onEnded,
  onNext,
  onPrevious,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<MovieboxDownload[]>([]);
  const [selected, setSelected] = useState<MovieboxDownload | null>(null);
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const online = useOnlineStatus();
  const [savedOffline, setSavedOffline] = useState(false);
  const [subs, setSubs] = useState<SubtitleTrack[]>([]);
  const [activeSubFileId, setActiveSubFileId] = useState<number | null>(null);
  const [subsMenuOpen, setSubsMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    isDownloaded(`${type}-${tmdbId}`).then((d) => {
      if (active) setSavedOffline(d);
    });
    return () => { active = false; };
  }, [type, tmdbId]);

  const fetchStreams = useCallback(async () => {
    if (!title) return;
    setLoading(true);
    setError(null);
    setPlaying(false);
    setSelected(null);
    const res = await resolveMovieboxDownloads({
      title,
      year,
      mediaType: type === "tv" ? "tv" : "anime",
      season: type === "tv" ? season : undefined,
      episode: type === "tv" ? episode : undefined,
    });
    if (!res.ok || !res.downloads?.length) {
      setError(res.reason || "No stream available for this title.");
      setDownloads([]);
      setLoading(false);
      return;
    }
    // Pick best available for each preferred rung, then keep any extras.
    const byRes = new Map<number, MovieboxDownload>();
    for (const d of res.downloads) {
      const existing = byRes.get(d.resolution);
      if (!existing || (d.size || 0) > (existing.size || 0)) byRes.set(d.resolution, d);
    }
    const ordered: MovieboxDownload[] = [];
    for (const r of PREFERRED) {
      const hit = byRes.get(r);
      if (hit) ordered.push(hit);
    }
    // Include any other resolutions not in preferred list, highest first.
    Array.from(byRes.values())
      .filter((d) => !PREFERRED.includes(d.resolution))
      .sort((a, b) => b.resolution - a.resolution)
      .forEach((d) => ordered.push(d));
    setDownloads(ordered);
    // Default highlight to 1080p or the best available.
    setSelected(ordered[0] || null);
    setLoading(false);
  }, [title, year, type, season, episode]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  // Fetch subtitle tracks when title/episode changes.
  useEffect(() => {
    let active = true;
    setSubs([]);
    setActiveSubFileId(null);
    if (!tmdbId) return;
    listSubtitles({
      type: type === "tv" ? "episode" : "movie",
      tmdbId,
      imdbId: imdbId || undefined,
      season: type === "tv" ? season : undefined,
      episode: type === "tv" ? episode : undefined,
      languages: "en",
    }).then((tracks) => {
      if (!active) return;
      setSubs(tracks);
    });
    return () => { active = false; };
  }, [tmdbId, imdbId, type, season, episode]);

  const startPlayback = (d: MovieboxDownload) => {
    setSelected(d);
    setPlaying(true);
  };

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
        // Lock landscape on touch devices where supported.
        const orientation: any = (screen as any).orientation;
        if (orientation?.lock && window.matchMedia("(pointer: coarse)").matches) {
          try { await orientation.lock("landscape"); } catch { /* ignore */ }
        }
      } else {
        const orientation: any = (screen as any).orientation;
        try { orientation?.unlock?.(); } catch { /* ignore */ }
        await document.exitFullscreen?.();
      }
    } catch { /* ignore */ }
  }, []);

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

  const proxied = selected ? movieboxProxyUrl(selected.url) : "";

  return (
    <div className="w-full" style={{ background: "hsl(var(--background))" }}>
      <div ref={containerRef} className="relative w-full aspect-video overflow-hidden bg-black">
        {playing && proxied && (
          <video
            key={proxied}
            src={proxied}
            className="absolute inset-0 w-full h-full bg-black"
            controls
            autoPlay
            playsInline
            crossOrigin="anonymous"
            onError={() => setError("Playback failed. Try a different quality.")}
            onEnded={() => onEnded?.()}
            poster={backdrop || poster || undefined}
          />
        )}

        {!playing && !loading && !error && downloads.length > 0 && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center"
            style={{
              background: backdrop
                ? `linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.85)), url(${backdrop}) center/cover no-repeat`
                : "hsl(var(--background))",
            }}
          >
            <p className="text-white text-xs font-semibold uppercase tracking-wider opacity-80">Select quality</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {downloads.map((d) => {
                const active = selected?.resolution === d.resolution;
                return (
                  <button
                    key={d.resolution + d.url}
                    onClick={() => setSelected(d)}
                    className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-semibold transition-colors"
                    style={{
                      background: active ? "var(--gradient-primary, hsl(var(--primary)))" : "rgba(255,255,255,0.09)",
                      color: "#fff",
                      border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
                    }}
                  >
                    {resolutionLabel(d.resolution)}
                    {d.size ? <span className="ml-1.5 opacity-70 font-normal">{formatBytes(d.size)}</span> : null}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => selected && startPlayback(selected)}
              disabled={!selected}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Watch now
            </button>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none" style={{ background: "hsl(var(--background))" }}>
            <Loader2 className="w-9 h-9 animate-spin mb-2" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-white text-xs font-medium">Finding stream…</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-6 text-center" style={{ background: "hsl(var(--background))" }}>
            <AlertCircle className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-white text-xs font-medium">{error}</p>
            <button
              onClick={fetchStreams}
              className="flex items-center gap-1.5 text-white text-[11px] px-3 py-1.5 rounded-md font-semibold"
              style={{ background: "hsl(var(--primary))" }}
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
      </div>

      {/* MovieBox-style toolbar: transport controls · subtitles · quality · download · fullscreen */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "hsl(var(--background))", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Transport controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onPrevious?.()}
            disabled={!onPrevious}
            title="Previous"
            aria-label="Previous"
            className="grid place-items-center h-7 w-7 rounded-md text-white disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => selected && startPlayback(selected)}
            disabled={!selected}
            title="Play"
            aria-label="Play"
            className="grid place-items-center h-7 w-7 rounded-md text-white disabled:opacity-30"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
          </button>
          <button
            onClick={() => onNext?.()}
            disabled={!onNext}
            title="Next"
            aria-label="Next"
            className="grid place-items-center h-7 w-7 rounded-md text-white disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quality selector */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pl-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-1 flex-shrink-0">Quality</span>
          {downloads.map((d) => {
            const active = selected?.resolution === d.resolution;
            return (
              <button
                key={d.resolution + d.url}
                onClick={() => { setSelected(d); setPlaying(true); }}
                className="px-2.5 py-1 rounded-md text-[10.5px] font-semibold whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  background: active ? "var(--gradient-primary, hsl(var(--primary)))" : "rgba(255,255,255,0.06)",
                  color: active ? "#fff" : "rgba(255,255,255,0.75)",
                  border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {resolutionLabel(d.resolution)}
              </button>
            );
          })}
          {!downloads.length && (
            <span className="text-[10.5px] text-white/45">Waiting for stream…</span>
          )}
        </div>

        {/* Subtitles (placeholder — resolver payload doesn't yet include tracks) */}
        <button
          title="Subtitles"
          aria-label="Subtitles"
          className="flex-shrink-0 grid place-items-center h-7 w-7 rounded-md text-white/70 hover:text-white"
          style={{ background: "rgba(255,255,255,0.06)" }}
          onClick={() => {
            // Native <video controls> exposes browser-provided caption UI when tracks exist.
            // MovieBox streams currently ship without external tracks; this is here for UX parity.
          }}
        >
          <Subtitles className="w-3.5 h-3.5" />
        </button>

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
