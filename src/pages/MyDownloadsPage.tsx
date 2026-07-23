import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, ChevronLeft, Search, Trash2, CloudDownload, X, Pause, Loader2, Folder, ChevronDown, Captions } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import PlayerRecommendations from "@/components/PlayerRecommendations";
import { getAllDownloads, deleteDownload, getDownload, getDownloadBlobUrl, pauseDownload, type OfflineVideo, type OfflineCaption } from "@/lib/offlineDownloads";
import { toast } from "sonner";

function fmtMB(bytes: number) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(0)} MB`;
}

interface SeriesFolder {
  key: string;
  tmdbId: string;
  title: string;
  poster?: string | null;
  episodes: OfflineVideo[];
}

const MyDownloadsPage = () => {
  const [offline, setOffline] = useState<OfflineVideo[]>([]);
  const [query, setQuery] = useState("");
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [playTitle, setPlayTitle] = useState("");
  const [playTmdbId, setPlayTmdbId] = useState<string>("");
  const [playType, setPlayType] = useState<"movie" | "tv">("tv");
  const [playCaptions, setPlayCaptions] = useState<{ label: string; lang: string; url: string }[]>([]);
  const [ccOpen, setCcOpen] = useState(false);
  const [activeCc, setActiveCc] = useState<string>(""); // lang currently showing (empty = off)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const playOffline = async (v: OfflineVideo) => {
    const url = await getDownloadBlobUrl(v.id);
    if (!url) { toast.error("This download isn't ready yet."); return; }
    const full = await getDownload(v.id);
    const capUrls = (full?.captions || []).map((c: OfflineCaption) => ({
      label: c.label,
      lang: c.lang,
      url: URL.createObjectURL(c.blob),
    }));
    setPlayTitle(v.title);
    setPlayTmdbId(v.tmdbId);
    setPlayType(v.type === "movie" ? "movie" : "tv");
    setPlayCaptions(capUrls);
    const saved = localStorage.getItem("nowanime-offline-cc") || "";
    setActiveCc(saved && capUrls.some((c) => c.lang === saved) ? saved : (capUrls[0]?.lang || ""));
    setPlayUrl(url);
    setCcOpen(false);
  };

  // Toggle textTracks whenever activeCc changes.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tracks = v.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      t.mode = t.language === activeCc && activeCc ? "showing" : "disabled";
    }
    if (activeCc) localStorage.setItem("nowanime-offline-cc", activeCc);
  }, [activeCc, playUrl, playCaptions]);

  const closePlayer = () => {
    if (playUrl) URL.revokeObjectURL(playUrl);
    playCaptions.forEach((c) => URL.revokeObjectURL(c.url));
    setPlayCaptions([]);
    setPlayUrl(null);
    setCcOpen(false);
  };


  const refresh = async () => {
    try { setOffline(await getAllDownloads()); } catch { setOffline([]); }
  };

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 3000);
    return () => clearInterval(i);
  }, []);

  const removeOne = async (id: string) => {
    await deleteDownload(id);
    toast.success("Removed");
    refresh();
  };

  const removeFolder = async (folder: SeriesFolder) => {
    await Promise.all(folder.episodes.map((e) => deleteDownload(e.id)));
    toast.success("Series removed");
    refresh();
  };

  // Split offline downloads into single movies and grouped series folders.
  const { movies, folders } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => (!q ? true : s.toLowerCase().includes(q));
    const movieList: OfflineVideo[] = [];
    const folderMap = new Map<string, SeriesFolder>();

    for (const v of offline) {
      if (v.type === "tv") {
        const key = `tv-${v.tmdbId}`;
        const name = v.seriesTitle || v.title;
        if (!match(name) && !match(v.title)) continue;
        let f = folderMap.get(key);
        if (!f) {
          f = { key, tmdbId: v.tmdbId, title: name, poster: v.poster, episodes: [] };
          folderMap.set(key, f);
        }
        if (!f.poster && v.poster) f.poster = v.poster;
        f.episodes.push(v);
      } else {
        if (match(v.title)) movieList.push(v);
      }
    }

    const folderList = Array.from(folderMap.values());
    folderList.forEach((f) =>
      f.episodes.sort((a, b) => (a.season ?? 0) - (b.season ?? 0) || (a.episode ?? 0) - (b.episode ?? 0)),
    );
    return { movies: movieList, folders: folderList };
  }, [offline, query]);

  const empty = movies.length === 0 && folders.length === 0;

  const renderRow = (v: OfflineVideo, indent = false) => {
    const pct = v.size > 0 ? Math.min(100, Math.round((v.downloaded / v.size) * 100)) : 0;
    const ready = v.status === "ready";
    const downloading = v.status === "downloading" || v.status === "queued";
    return (
      <li key={v.id} className={`flex items-center gap-3 p-2 rounded-xl ${indent ? "ml-3" : ""}`} style={{ background: "#141414" }}>
        <button
          onClick={() => ready && playOffline(v)}
          className="relative w-[58px] h-[78px] rounded-lg overflow-hidden bg-black flex-shrink-0 group"
        >
          {v.poster && <img src={v.poster} alt={v.title} loading="lazy" className="w-full h-full object-cover" />}
          {ready && (
            <span className="absolute inset-0 grid place-items-center bg-black/30">
              <Play className="w-5 h-5 text-white fill-white" />
            </span>
          )}
          {downloading && (
            <span className="absolute inset-0 grid place-items-center bg-black/50">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </span>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-white truncate">
            {indent && v.episode ? `Episode ${v.episode}` : v.title}
          </h3>
          {ready ? (
            <p className="text-[10px] text-emerald-400 mt-0.5">Available offline · {fmtMB(v.size)}</p>
          ) : v.status === "error" ? (
            <p className="text-[10px] text-[hsl(var(--primary))] mt-0.5">Download failed</p>
          ) : v.status === "paused" ? (
            <p className="text-[10px] text-white/55 mt-0.5">Paused · {pct}%</p>
          ) : (
            <p className="text-[10px] text-white/55 mt-0.5">
              Downloading · {pct}% {v.size ? `of ${fmtMB(v.size)}` : ""}
            </p>
          )}
          {!ready && v.status !== "error" && (
            <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        {downloading && (
          <button onClick={() => pauseDownload(v.id)} className="p-2 text-white/55 hover:text-white" aria-label="Pause">
            <Pause className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => removeOne(v.id)} className="p-2 text-white/55 hover:text-[hsl(var(--primary))]" aria-label="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </li>
    );
  };

  return (
    <AppLayout hideFooter>
      <SEO title="My Downloads – NowAnime" description="Watch your downloaded movies offline anytime on NowAnime." />
      <div className="px-4 pt-3 pb-8 max-w-2xl mx-auto" style={{ background: "#0e0b18" }}>
        <header className="flex items-center justify-between mb-4 pt-1">
          <button onClick={() => navigate(-1)} className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/5 text-white" aria-label="Back">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold text-white tracking-wide">Downloads</h1>
          <button onClick={() => setQuery((q) => (q ? "" : " "))} className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/5 text-white" aria-label="Search">
            <Search className="w-4 h-4" />
          </button>
        </header>

        {query !== "" && (
          <input
            autoFocus
            value={query.trim()}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search downloads…"
            className="w-full mb-3 px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[hsl(var(--primary))]/60"
          />
        )}

        {empty ? (
          <div className="text-center py-16 text-white/55">
            <CloudDownload className="w-10 h-10 mx-auto mb-3 text-[hsl(var(--primary))]" />
            <p className="text-sm font-semibold text-white">No downloads yet</p>
            <p className="text-[11px] mt-1">Tap the download button on any anime episode and it will appear here.</p>
            <Link to="/anime" className="inline-block mt-4 px-4 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: "hsl(var(--primary))" }}>
              Browse anime
            </Link>
          </div>
        ) : (
          <>
            {folders.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-white/45 mb-2">Series</p>
                <ul className="space-y-2 mb-4">
                  {folders.map((f) => {
                    const isOpen = openFolders[f.key];
                    const readyCount = f.episodes.filter((e) => e.status === "ready").length;
                    return (
                      <li key={f.key} className="rounded-xl overflow-hidden" style={{ background: "#141414" }}>
                        <div className="flex items-center gap-3 p-2">
                          <button
                            onClick={() => setOpenFolders((s) => ({ ...s, [f.key]: !s[f.key] }))}
                            className="relative w-[58px] h-[78px] rounded-lg overflow-hidden bg-black flex-shrink-0"
                          >
                            {f.poster ? (
                              <img src={f.poster} alt={f.title} loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-white/30"><Folder className="w-5 h-5" /></div>
                            )}
                            <span className="absolute bottom-1 right-1 grid place-items-center w-5 h-5 rounded-full bg-black/70">
                              <Folder className="w-3 h-3 text-white" />
                            </span>
                          </button>
                          <button
                            onClick={() => setOpenFolders((s) => ({ ...s, [f.key]: !s[f.key] }))}
                            className="flex-1 min-w-0 text-left"
                          >
                            <h3 className="text-xs font-bold text-white truncate">{f.title}</h3>
                            <p className="text-[10px] text-white/55 mt-0.5">
                              {f.episodes.length} episode{f.episodes.length !== 1 ? "s" : ""} · {readyCount} ready offline
                            </p>
                          </button>
                          <button onClick={() => removeFolder(f)} className="p-2 text-white/55 hover:text-[hsl(var(--primary))]" aria-label="Delete series">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronDown className={`w-4 h-4 text-white/45 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                        {isOpen && (
                          <ul className="space-y-2 px-2 pb-2">
                            {f.episodes.map((e) => renderRow(e, true))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {movies.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-white/45 mb-2">Movies</p>
                <ul className="space-y-2">
                  {movies.map((v) => renderRow(v))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {playUrl && (
        <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-background/95 backdrop-blur border-b border-border/40">
            <h2 className="text-xs font-semibold text-foreground truncate pr-3">{playTitle}</h2>
            <button onClick={closePlayer} className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10 text-foreground" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <div>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={playUrl}
                  controls
                  autoPlay
                  playsInline
                  crossOrigin="anonymous"
                  className="w-full max-h-[70vh] bg-black"
                >
                  {playCaptions.map((c) => (
                    <track key={c.lang} kind="subtitles" src={c.url} srcLang={c.lang} label={c.label} />
                  ))}
                </video>

                {playCaptions.length > 0 && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setCcOpen((o) => !o)}
                      className={`grid place-items-center h-8 px-2 rounded-md text-[11px] font-bold gap-1 ${activeCc ? "bg-primary text-primary-foreground" : "bg-black/70 text-white"}`}
                      aria-label="Subtitles"
                    >
                      <Captions className="w-3.5 h-3.5" /> CC
                    </button>
                    {ccOpen && (
                      <div className="absolute right-0 mt-1 min-w-[160px] rounded-md bg-black/90 border border-white/10 py-1 text-xs text-white shadow-xl">
                        <button
                          onClick={() => { setActiveCc(""); setCcOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-white/10 ${!activeCc ? "text-primary font-semibold" : ""}`}
                        >
                          Off
                        </button>
                        {playCaptions.map((c) => (
                          <button
                            key={c.lang}
                            onClick={() => { setActiveCc(c.lang); setCcOpen(false); }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-white/10 ${activeCc === c.lang ? "text-primary font-semibold" : ""}`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 lg:hidden">
                <PlayerRecommendations tmdbId={playTmdbId} type={playType} />
              </div>
            </div>

            <aside className="hidden lg:block">
              <PlayerRecommendations tmdbId={playTmdbId} type={playType} />
            </aside>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default MyDownloadsPage;
