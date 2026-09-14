import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowLeft, Loader2, TrendingUp, Star, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import InlineAdRow from "@/components/InlineAdRow";

import { fetchList, searchTv, img, type TmdbItem } from "@/lib/tmdb";

// Anime-only search: TMDB tv genre 16 (Animation) + Japanese origin.
const searchAnime = async (q: string): Promise<TmdbItem[]> => {
  if (!q.trim()) return [];
  const results = await searchTv(q);
  return results.filter(
    (r: any) =>
      r.genre_ids?.includes(16) && (r.original_language === "ja" || !r.original_language),
  );
};

const trendingAnime = () => {
  const qs = new URLSearchParams({
    sort_by: "popularity.desc",
    with_genres: "16",
    with_original_language: "ja",
    include_adult: "false",
  });
  return fetchList(`/discover/tv?${qs.toString()}`, "tv");
};

const useDebounced = <T,>(value: T, delay = 250) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

/** Small poster card — 4 fit across on mobile. */
const ResultCard = ({ item, onClick }: { item: TmdbItem; onClick: () => void }) => {
  const title = (item as any).name || item.title || "Untitled";
  const date = (item as any).first_air_date || item.release_date || "";
  const poster = item.poster_path || item.backdrop_path;
  return (
    <button onClick={onClick} className="text-left group">
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-black border border-white/8">
        {poster ? (
          <img src={img(poster, "w200") || ""} alt={title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/25 text-[8px]">No art</div>
        )}
        {!!item.vote_average && (
          <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-[1px] rounded bg-black/70 text-[8px] text-amber-400 font-bold">
            <Star className="w-2 h-2 fill-amber-400" /> {item.vote_average.toFixed(1)}
          </span>
        )}
        <span className="absolute bottom-1 right-1 grid place-items-center w-4 h-4 rounded-full bg-[hsl(var(--primary))]">
          <Play className="w-2 h-2 text-white fill-white" />
        </span>
      </div>
      <h3 className="text-[10px] font-semibold text-white truncate mt-1">{title}</h3>
      <p className="text-[9px] text-white/45">{date ? date.slice(0, 4) : "Anime"}</p>
    </button>
  );
};

/** Grid of 4-across cards with a sponsored slot after every 3 rows. */
const ResultGrid = ({ items, onOpen }: { items: TmdbItem[]; onOpen: (i: TmdbItem) => void }) => {
  const chunks: TmdbItem[][] = [];
  for (let i = 0; i < items.length; i += 12) chunks.push(items.slice(i, i + 12));
  return (
    <div className="pb-4">
      {chunks.map((chunk, ci) => (
        <div key={ci}>
          <div className="grid grid-cols-4 gap-2">
            {chunk.map((m) => (
              <ResultCard key={m.id} item={m} onClick={() => onOpen(m)} />
            ))}
          </div>
          <div className="-mx-5 my-3">
            <InlineAdRow />
          </div>
        </div>
      ))}
    </div>
  );
};

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounced(query, 220);

  const { data: liveSuggest = [] } = useQuery({
    queryKey: ["anime-search-live", debouncedQuery],
    queryFn: () => searchAnime(debouncedQuery),
    enabled: debouncedQuery.trim().length > 1,
    staleTime: 1000 * 60,
  });

  const { data: results = [], isFetching } = useQuery<TmdbItem[]>({
    queryKey: ["anime-search", searchQuery],
    queryFn: () => (searchQuery.trim() ? searchAnime(searchQuery) : trendingAnime()),
    staleTime: 1000 * 60 * 10,
  });

  const { data: trending = [] } = useQuery({
    queryKey: ["anime-search-trending"],
    queryFn: trendingAnime,
    staleTime: 1000 * 60 * 30,
  });

  const handleSearch = (q: string) => {
    setSearchQuery(q.trim());
    setSearchParams(q.trim() ? { q: q.trim() } : {});
    setSuggestOpen(false);
  };

  const openItem = (item: TmdbItem) => navigate(`/tv/${item.id}`);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showExplore = !searchQuery;

  return (
    <AppLayout>
      <SEO
        title={searchQuery ? `${searchQuery} – Search – NowAnime` : "Explore Anime – NowAnime"}
        description={searchQuery ? `Anime search results for "${searchQuery}" on NowAnime.` : "Explore trending, popular and top-rated anime on NowAnime."}
      />
      <div className="px-5 pt-4" style={{ background: "#000" }}>
        <div className="-mx-5 mb-3">
          <InlineAdRow />
        </div>
        <div ref={wrapRef} className="relative flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search className="w-3.5 h-3.5 text-white/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSuggestOpen(true); }}
              onFocus={() => setSuggestOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="Search anime titles, genres..."
              className="flex-1 bg-transparent text-white text-xs placeholder:text-white/50 outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(""); handleSearch(""); }} className="text-[10px] text-white/50 hover:text-white">
                clear
              </button>
            )}
          </div>

          {suggestOpen && liveSuggest.length > 0 && (
            <div
              className="absolute left-9 right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden shadow-2xl"
              style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {liveSuggest.slice(0, 6).map((s: any) => {
                const title = s.name || s.title || "Untitled";
                const date = s.first_air_date || "";
                return (
                  <button
                    key={s.id}
                    onClick={() => { navigate(`/tv/${s.id}`); setSuggestOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0"
                  >
                    <div className="w-9 h-12 rounded overflow-hidden bg-black/50 flex-shrink-0">
                      {s.poster_path && <img src={img(s.poster_path, "w200") || ""} alt="" className="w-full h-full object-cover" loading="lazy" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] font-semibold text-white truncate">{title}</p>
                      <p className="text-[10px] text-white/50">Anime{date ? ` · ${date.slice(0, 4)}` : ""}</p>
                    </div>
                    <Search className="w-3 h-3 text-white/40" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {showExplore ? (
          <>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
              <h2 className="text-white text-sm font-bold">Trending anime</h2>
            </div>
            {isFetching && results.length === 0 ? (
              <div className="flex items-center justify-center h-28">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(var(--primary))" }} />
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {results.slice(0, 24).map((m, i) => (
                  <div key={m.id}>
                    <ResultRow item={m} onClick={() => openItem(m)} />
                    {(i === 4 || i === 9 || i === 14 || i === 19) && (
                      <div className="-mx-5 my-3">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/45 font-semibold mb-1.5">
                          Sponsored · Featured placements
                        </p>
                        <InlineAdRow count={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {isFetching ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(var(--primary))" }} />
              </div>
            ) : results.length === 0 ? (
              <div className="py-6">
                <p className="text-xs text-white/60 mb-4 text-center">No anime matches for "{searchQuery}".</p>
                {trending.length > 0 && (
                  <div className="text-left">
                    <h3 className="text-[11px] font-semibold text-white/80 mb-2">You might like</h3>
                    <div className="space-y-2">
                      {(trending as TmdbItem[]).slice(0, 8).map((m) => (
                        <ResultRow key={m.id} item={m} onClick={() => navigate(`/tv/${m.id}`)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-[10px] text-white/50 mb-2">
                  {results.length} anime result{results.length === 1 ? "" : "s"} for "{searchQuery}"
                </p>
                <div className="space-y-2 pb-4">
                  {results.map((item, i) => (
                    <div key={item.id}>
                      <ResultRow item={item} onClick={() => openItem(item)} />
                      {(i + 1) % 6 === 0 && i < results.length - 1 && (
                        <div className="-mx-5 my-2">
                          <InlineAdRow count={4} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SearchPage;
