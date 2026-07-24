import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Loader2, AlertCircle, RefreshCw, Expand, WifiOff, CloudDownload, Play, SkipBack, SkipForward, Subtitles, Settings2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isDownloaded } from "@/lib/offlineDownloads";
import DownloadButton from "@/components/DownloadButton";
import {
  resolveMovieboxDownloads,
  movieboxProxyUrl,
  resolutionLabel,
  type MovieboxDownload,
  type MovieboxCaption,
} from "@/lib/moviebox";
import { loadCaptionAsVtt, languageName } from "@/lib/subtitles";
import { getDownload, type OfflineVideo } from "@/lib/offlineDownloads";
import { attachProgress, progressKey, getProgress, formatTime } from "@/lib/playbackProgress";

// Legacy type kept as a no-op export so existing imports don't break.
export type ServerId = "moviebox";
export const PLAYER_SERVERS = [{ id: "moviebox", label: "MovieBox", short: "HD" }] as const;

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

const PREFERRED = [1080, 720, 480];

interface PreparedCaption extends MovieboxCaption {
  fullName: string;
  vttUrl?: string;
}

const MoviePlayer = ({
  tmdbId,
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
  const [captions, setCaptions] = useState<PreparedCaption[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null); // fullName or null=off
  const [qualityOpen, setQualityOpen] = useState(false);
  const [subsOpen, setSubsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const online = useOnlineStatus();
  const [savedOffline, setSavedOffline] = useState(false);
  const [offlineMeta, setOfflineMeta] = useState<OfflineVideo | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  const pKey = progressKey({ type, tmdbId, season, episode });

  useEffect(() => {
    let active = true;
    getDownload(`${type}-${tmdbId}`).then((d) => {
      if (!active) return;
      setOfflineMeta(d || null);
      setSavedOffline(!!d && d.status === "ready" && !!d.blob);
    });
    const p = getProgress(pKey);
    setResumeAt(p && p.position > 5 ? p.position : null);
    return () => { active = false; };
  }, [type, tmdbId, pKey]);

  // Wire resume-position handling to the <video>.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !proxiedReady) return;
    return attachProgress(v, pKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pKey, selected]);

  const fetchStreams = useCallback(async () => {
    if (!title) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setCaptions([]);
    setSelectedCaption(null);
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
    Array.from(byRes.values())
      .filter((d) => !PREFERRED.includes(d.resolution))
      .sort((a, b) => b.resolution - a.resolution)
      .forEach((d) => ordered.push(d));
    setDownloads(ordered);
    setSelected(ordered[0] || null);

    // Prepare captions (fetch + convert to VTT lazily via proxy so browser can load them).
    const rawCaps = res.captions || [];
    const prepared: PreparedCaption[] = rawCaps.map((c) => ({
      ...c,
      fullName: languageName(c.lang),
    }));
    setCaptions(prepared);
    // Default to English if present, otherwise off.
    const en = prepared.find((c) => c.fullName.toLowerCase() === "english");
    if (en) setSelectedCaption(en.fullName);
    setLoading(false);
  }, [title, year, type, season, episode]);

  useEffect(() => { fetchStreams(); }, [fetchStreams]);

  // Materialize the selected caption to a same-origin VTT blob URL when needed.
  useEffect(() => {
    if (!selectedCaption) return;
    const cap = captions.find((c) => c.fullName === selectedCaption);
    if (!cap || cap.vttUrl) return;
    let cancelled = false;
    loadCaptionAsVtt(movieboxProxyUrl(cap.url))
      .then((vttUrl) => {
        if (cancelled) { URL.revokeObjectURL(vttUrl); return; }
        setCaptions((prev) => prev.map((c) => (c.fullName === cap.fullName ? { ...c, vttUrl } : c)));
      })
      .catch(() => { /* ignore — subtitle just won't appear */ });
    return () => { cancelled = true; };
  }, [selectedCaption, captions]);

  // Toggle native track visibility whenever selection changes.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tracks = v.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      t.mode = selectedCaption && t.label === selectedCaption ? "showing" : "disabled";
    }
  }, [selectedCaption, captions]);

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

  const proxied = useMemo(() => (selected ? movieboxProxyUrl(selected.url) : ""), [selected]);

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
        {proxied && (
          <video
            key={proxied}
            ref={videoRef}
            src={proxied}
            className="absolute inset-0 w-full h-full bg-black"
            controls
            autoPlay
            playsInline
            crossOrigin="anonymous"
            onError={() => setError("Playback failed. Try a different quality.")}
            onEnded={() => onEnded?.()}
            poster={backdrop || poster || undefined}
          >
            {captions
              .filter((c) => c.vttUrl)
              .map((c) => (
                <track
                  key={c.fullName}
                  kind="subtitles"
                  label={c.fullName}
                  srcLang={(c.lang || "").slice(0, 2).toLowerCase() || "en"}
                  src={c.vttUrl}
                  default={selectedCaption === c.fullName}
                />
              ))}
          </video>
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

      {/* Toolbar: transport · subtitles · quality · download · fullscreen */}
      <div className="relative flex items-center gap-1.5 px-3 py-2" style={{ background: "hsl(var(--background))", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
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
            onClick={() => videoRef.current?.play()}
            title="Play"
            aria-label="Play"
            className="grid place-items-center h-7 w-7 rounded-md text-white"
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

        <div className="flex-1" />

        {/* Subtitles picker */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setSubsOpen((s) => !s); setQualityOpen(false); }}
            title="Subtitles"
            aria-label="Subtitles"
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-white text-[10.5px] font-semibold"
            style={{ background: selectedCaption ? "hsl(var(--primary))" : "rgba(255,255,255,0.08)" }}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{selectedCaption || "Subtitles"}</span>
          </button>
          {subsOpen && (
            <div className="absolute right-0 bottom-full mb-2 z-30 min-w-[180px] max-h-[240px] overflow-y-auto rounded-lg border border-white/10 bg-[#141414] py-1 shadow-2xl">
              <button
                onClick={() => { setSelectedCaption(null); setSubsOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-white hover:bg-white/5"
              >
                <span>Off</span>
                {!selectedCaption && <Check className="w-3 h-3" />}
              </button>
              {captions.length === 0 && (
                <div className="px-3 py-2 text-[10.5px] text-white/45">No subtitles available</div>
              )}
              {captions.map((c) => (
                <button
                  key={c.fullName}
                  onClick={() => { setSelectedCaption(c.fullName); setSubsOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-white hover:bg-white/5"
                >
                  <span>{c.fullName}</span>
                  {selectedCaption === c.fullName && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Single Quality button + dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setQualityOpen((s) => !s); setSubsOpen(false); }}
            disabled={!downloads.length}
            title="Quality"
            aria-label="Quality"
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-white text-[10.5px] font-semibold disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{selected ? resolutionLabel(selected.resolution) : "Quality"}</span>
          </button>
          {qualityOpen && downloads.length > 0 && (
            <div className="absolute right-0 bottom-full mb-2 z-30 min-w-[160px] rounded-lg border border-white/10 bg-[#141414] py-1 shadow-2xl">
              <div className="px-3 py-1 text-[9.5px] uppercase tracking-wider text-white/45 font-bold">Quality</div>
              {downloads.map((d) => {
                const active = selected?.resolution === d.resolution;
                return (
                  <button
                    key={d.resolution + d.url}
                    onClick={() => { setSelected(d); setQualityOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-white hover:bg-white/5"
                  >
                    <span>{resolutionLabel(d.resolution)}</span>
                    {active && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          )}
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
