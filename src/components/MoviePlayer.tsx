import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Loader2, AlertCircle, RefreshCw, Expand, WifiOff, CloudDownload, Play, Pause,
  SkipBack, SkipForward, RotateCcw, RotateCw, Subtitles, Settings2, Check, Volume2, VolumeX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
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

  // ---- Custom overlay state ----
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);
  const interacting = subsOpen || qualityOpen;

  const showControls = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), 3200);
  }, []);

  useEffect(() => {
    if (interacting) {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      setVisible(true);
    } else {
      showControls();
    }
  }, [interacting, showControls]);

  useEffect(() => () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }, []);

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
    if (!v || !selected) return;
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

    const rawCaps = res.captions || [];
    const prepared: PreparedCaption[] = rawCaps.map((c) => ({
      ...c,
      fullName: languageName(c.lang),
    }));
    setCaptions(prepared);
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

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play?.(); else v.pause();
    showControls();
  }, [showControls]);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    try { v.currentTime = Math.max(0, Math.min(v.duration || Infinity, v.currentTime + delta)); } catch { /* ignore */ }
    showControls();
  }, [showControls]);

  // Keyboard / remote controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = document.activeElement;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (t as HTMLElement | null)?.isContentEditable) return;
      showControls();
      switch (e.key) {
        case "f": case "F": e.preventDefault(); toggleFullscreen(); break;
        case " ": case "k": case "K": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault(); seekBy(10); break;
        case "ArrowLeft": e.preventDefault(); seekBy(-10); break;
        case "m": case "M": {
          const v = videoRef.current;
          if (v) { v.muted = !v.muted; setMuted(v.muted); }
          break;
        }
        default: break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen, togglePlay, seekBy, showControls]);

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

  const overlayShown = visible || !playing || interacting;
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="w-full" style={{ background: "hsl(var(--background))" }}>
      <div
        ref={containerRef}
        onMouseMove={showControls}
        onMouseLeave={() => { if (!interacting && playing) setVisible(false); }}
        onTouchStart={showControls}
        onClick={showControls}
        className="relative w-full aspect-video overflow-hidden bg-black select-none group/player"
      >
        {proxied && (
          <video
            key={proxied}
            ref={videoRef}
            src={proxied}
            className="absolute inset-0 w-full h-full bg-black"
            autoPlay
            playsInline
            crossOrigin="anonymous"
            onClick={togglePlay}
            onPlay={() => { setPlaying(true); showControls(); }}
            onPause={() => setPlaying(false)}
            onVolumeChange={(e) => setMuted((e.currentTarget as HTMLVideoElement).muted)}
            onTimeUpdate={(e) => setCurrent((e.currentTarget as HTMLVideoElement).currentTime)}
            onLoadedMetadata={(e) => setDuration((e.currentTarget as HTMLVideoElement).duration || 0)}
            onError={() => setError("Playback failed. Try a different quality.")}
            onEnded={() => { setPlaying(false); onEnded?.(); }}
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

        {/* ===== Premium control overlay ===== */}
        {!loading && !error && selected && (
          <div
            className={`absolute inset-0 z-20 transition-opacity duration-300 ${
              overlayShown ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Dim */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" />

            {/* Center playback cluster */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 sm:gap-5">
              <button
                onClick={() => onPrevious?.()}
                disabled={!onPrevious}
                aria-label="Previous episode"
                title="Previous episode"
                className="grid place-items-center h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur text-white border border-white/15 transition hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => seekBy(-10)}
                aria-label="Skip back 10 seconds"
                title="Back 10s"
                className="relative grid place-items-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/10 backdrop-blur text-white border border-white/15 transition hover:bg-white/20"
              >
                <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute text-[8.5px] sm:text-[9px] font-bold tracking-tight">10s</span>
              </button>

              <button
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                title={playing ? "Pause" : "Play"}
                className="grid place-items-center h-16 w-16 sm:h-20 sm:w-20 rounded-full text-white shadow-2xl transition active:scale-95"
                style={{ background: "hsl(var(--primary))" }}
              >
                {playing
                  ? <Pause className="w-7 h-7 sm:w-9 sm:h-9 fill-white" />
                  : <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white translate-x-[2px]" />}
              </button>

              <button
                onClick={() => seekBy(10)}
                aria-label="Skip forward 10 seconds"
                title="Forward 10s"
                className="relative grid place-items-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/10 backdrop-blur text-white border border-white/15 transition hover:bg-white/20"
              >
                <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute text-[8.5px] sm:text-[9px] font-bold tracking-tight">10s</span>
              </button>

              <button
                onClick={() => onNext?.()}
                disabled={!onNext}
                aria-label="Next episode"
                title="Next episode"
                className="grid place-items-center h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur text-white border border-white/15 transition hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom bar: seek + options */}
            <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-2.5 sm:pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/80 tabular-nums w-10 text-right">
                  {formatTime(current)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(current, duration || 0)}
                  aria-label="Seek"
                  onChange={(e) => {
                    const v = videoRef.current;
                    const val = Number(e.target.value);
                    setCurrent(val);
                    if (v) { try { v.currentTime = val; } catch { /* ignore */ } }
                    showControls();
                  }}
                  className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, rgba(255,255,255,0.25) ${pct}%)`,
                  }}
                />
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/60 tabular-nums w-10">
                  {formatTime(duration)}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-1.5">
                <button
                  onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } showControls(); }}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <div className="flex-1" />

                {/* Download */}
                <Link
                  to={
                    type === "tv"
                      ? `/download/tv/${tmdbId}/${season}/${episode}`
                      : `/download/movie/${tmdbId}`
                  }
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Download"
                  title="Download"
                  className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex-shrink-0"
                >
                  <CloudDownload className="w-4 h-4" />
                </Link>

                {/* Share — copies a deep link to this title */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const link = `${window.location.origin}${type === "tv" ? `/anime/${tmdbId}` : `/movie/${tmdbId}`}`;
                    try {
                      await navigator.clipboard.writeText(link);
                      toast.success("Link copied — share it anywhere");
                    } catch {
                      toast.error(link);
                    }
                  }}
                  aria-label="Share"
                  title="Copy link"
                  className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex-shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </button>


                {/* Subtitles picker */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSubsOpen((s) => !s); setQualityOpen(false); }}
                    aria-label="Subtitles"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full text-white text-[10.5px] font-semibold"
                    style={{ background: selectedCaption ? "hsl(var(--primary))" : "rgba(255,255,255,0.12)" }}
                  >
                    <Subtitles className="w-4 h-4" />
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
                      {captions.map((c) => {
                        const offlineHas = !!offlineMeta?.captions?.some(
                          (oc) => oc.label === c.fullName || oc.lang === c.lang,
                        );
                        return (
                          <button
                            key={c.fullName}
                            onClick={() => { setSelectedCaption(c.fullName); setSubsOpen(false); }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] text-white hover:bg-white/5"
                          >
                            <span className="flex items-center gap-1.5">
                              {c.fullName}
                              <span
                                className={`px-1 py-[1px] rounded text-[8px] font-bold uppercase ${offlineHas ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"}`}
                                title={offlineHas ? "Available offline" : "Online only"}
                              >
                                {offlineHas ? "Offline" : "Online"}
                              </span>
                            </span>
                            {selectedCaption === c.fullName && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quality */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setQualityOpen((s) => !s); setSubsOpen(false); }}
                    disabled={!downloads.length}
                    aria-label="Quality"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full text-white text-[10.5px] font-semibold disabled:opacity-40"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <Settings2 className="w-4 h-4" />
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

                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  aria-label="Fullscreen"
                  title="Fullscreen (F)"
                  className="grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                >
                  <Expand className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none" style={{ background: "hsl(var(--background))" }}>
            <Loader2 className="w-9 h-9 animate-spin mb-2" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-white text-xs font-medium">Finding stream…</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 px-6 text-center" style={{ background: "hsl(var(--background))" }}>
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

        {resumeAt !== null && selected && !loading && !error && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const v = videoRef.current;
              if (v) { try { v.currentTime = resumeAt; v.play?.(); } catch { /* ignore */ } }
              setResumeAt(null);
            }}
            className="absolute top-3 left-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white shadow-xl"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Play className="w-3 h-3 fill-white" /> Resume from {formatTime(resumeAt)}
          </button>
        )}
      </div>

      {/* Secondary bar: download only (playback controls live on the player) */}
      {title && (
        <div className="flex items-center justify-end px-3 py-2" style={{ background: "hsl(var(--background))", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
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
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;
