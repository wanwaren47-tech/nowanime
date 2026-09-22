import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import UpNextOverlay from "@/components/player/UpNextOverlay";
import { getNextEpisode, getAutoplayEnabled } from "@/lib/autoplay";
import MoviePlayer, { ServerId } from "@/components/MoviePlayer";
import SEO from "@/components/SEO";
import InlineAdRow from "@/components/InlineAdRow";
import TmdbRow from "@/components/TmdbRow";
import Footer from "@/components/Footer";
import { useTvDetail, useTvSeason, useTvExternalIds } from "@/hooks/useTmdb";
import { useTrendingAnime, usePopularAnime, useTopRatedAnime } from "@/hooks/useAnimeContent";
import { img } from "@/lib/tmdb";
import { recordContinue } from "@/components/TmdbContinueRow";

const TvWatchPage = () => {
  const { tmdbId, season, episode } = useParams<{ tmdbId: string; season: string; episode: string }>();
  const navigate = useNavigate();
  const { data } = useTvDetail(tmdbId);
  const seasonNum = Number(season || 1);
  const episodeNum = Number(episode || 1);
  const [activeSeason, setActiveSeason] = useState<number>(seasonNum);
  const [server, setServer] = useState<ServerId>("vidbolt");
  useEffect(() => setActiveSeason(seasonNum), [seasonNum]);
  const seasonQuery = useTvSeason(tmdbId, activeSeason);
  const seasons = (data?.seasons || []).filter((s: any) => s.season_number > 0);
  const cast = (data?.credits?.cast || []).slice(0, 15);
  const trending = useTrendingAnime();
  const popular = usePopularAnime();
  const topRated = useTopRatedAnime();
  const ext = useTvExternalIds(tmdbId);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (data) {
      recordContinue({
        id: data.id, type: "tv", title: data.name,
        poster_path: data.poster_path, backdrop_path: data.backdrop_path,
        season: seasonNum, episode: episodeNum, progress: 5,
      });
    }
  }, [data, seasonNum, episodeNum]);

  const upNextList = (trending.data || []).slice(0, 15);
  const [upNext, setUpNext] = useState<{ season: number; episode: number } | null>(null);

  const handleEnded = async () => {
    if (!getAutoplayEnabled()) return;
    const nx = await getNextEpisode(tmdbId || "", seasonNum, episodeNum);
    if (nx) setUpNext({ season: nx.season, episode: nx.episode });
  };
  const goNext = async () => {
    if (upNext) {
      navigate(`/watch/tv/${tmdbId}/${upNext.season}/${upNext.episode}`);
      return;
    }
    const nx = await getNextEpisode(tmdbId || "", seasonNum, episodeNum);
    if (nx) navigate(`/watch/tv/${tmdbId}/${nx.season}/${nx.episode}`);
  };
  const goPrev = () => {
    if (episodeNum > 1) navigate(`/watch/tv/${tmdbId}/${seasonNum}/${episodeNum - 1}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={data ? `${data.name} S${seasonNum}E${episodeNum} – NowAnime` : "Watch Anime – NowAnime"}
        description={data?.overview?.slice(0, 160) || "Stream anime episodes in HD on NowAnime."}
        type="video.episode"
      />
      <div className="flex-1 max-w-[1600px] mx-auto w-full">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-3 h-11 bg-background/95 backdrop-blur border-b border-border">
          <Link to={tmdbId ? `/tv/${tmdbId}` : "/home"} className="p-1.5 -ml-1 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="text-[13px] font-semibold text-foreground truncate">
            {data ? `${data.name} · S${seasonNum} E${episodeNum}` : "Watch"}
          </h1>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-4 lg:px-4 lg:py-3">
          <div className="min-w-0">
            <div className="w-full lg:rounded-lg lg:overflow-hidden relative">
              <MoviePlayer
                tmdbId={tmdbId || ""}
                imdbId={ext.data?.imdb_id || null}
                type="tv"
                season={seasonNum}
                episode={episodeNum}
                serverId={server}
                onServerChange={setServer}
                title={data?.name}
                year={(data?.first_air_date || "").slice(0, 4)}
                poster={data?.poster_path ? img(data.poster_path, "w500") : null}
                backdrop={data?.backdrop_path ? img(data.backdrop_path, "w780") : null}
                onEnded={handleEnded}
                onNext={goNext}
                onPrevious={episodeNum > 1 ? goPrev : undefined}
              />
              {upNext && data && (
                <UpNextOverlay
                  title={`${data.name} · S${upNext.season} E${upNext.episode}`}
                  subtitle="Next episode"
                  onPlay={() => navigate(`/watch/tv/${tmdbId}/${upNext.season}/${upNext.episode}`)}
                  onCancel={() => setUpNext(null)}
                />
              )}
            </div>

        {data && (
          <div className="px-4 pb-4">
            <div className="flex items-start justify-between gap-3 pt-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white tracking-tight">{data.name}</h2>
                <p className="text-[10.5px] text-white/55 mt-0.5">Season {seasonNum} · Episode {episodeNum}</p>
              </div>
              {seasons.length > 0 && (
                <div className="relative">
                  <select
                    value={activeSeason}
                    onChange={(e) => setActiveSeason(Number(e.target.value))}
                    className="appearance-none bg-white/8 text-white text-[11px] pl-3 pr-7 py-1.5 rounded-lg border border-white/10"
                  >
                    {seasons.map((s: any) => (
                      <option key={s.id} value={s.season_number} className="bg-[#1a1a1a]">
                        Season {s.season_number}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-white/70 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="mt-4 -mx-4">
              <InlineAdRow />
            </div>

            <section className="mt-4">
              <h3 className="text-[12px] font-semibold text-white mb-2">Episodes</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                {seasonQuery.isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-[110px] h-[68px] bg-white/5 rounded-lg animate-pulse" />
                    ))
                  : (seasonQuery.data?.episodes || []).map((ep: any) => {
                      const isPlaying = activeSeason === seasonNum && ep.episode_number === episodeNum;
                      return (
                        <Link
                          key={ep.id}
                          to={`/watch/tv/${data.id}/${activeSeason}/${ep.episode_number}`}
                          className={`relative flex-shrink-0 w-[110px] aspect-video rounded-lg overflow-hidden bg-white/5 ${isPlaying ? "neon-playing" : "border border-white/10"}`}
                        >
                          {ep.still_path && (
                            <img src={img(ep.still_path, "w300")} alt={ep.name} loading="lazy" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute top-1 left-1 text-[9px] font-extrabold text-white">E{ep.episode_number}</span>
                          {isPlaying && (
                            <span className="absolute bottom-1 right-1 grid place-items-center w-4 h-4 rounded-full bg-[hsl(var(--primary))]">
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </span>
                          )}
                        </Link>
                      );
                    })}
              </div>
            </section>

            {data.overview && (
              <section className="mt-4">
                <h3 className="text-[12px] font-semibold text-white mb-1">Synopsis</h3>
                <p className="text-[11px] leading-relaxed text-white/65 line-clamp-3">{data.overview}</p>
              </section>
            )}

            <div className="mt-3 -mx-4">
              <InlineAdRow />
            </div>

            {cast.length > 0 && (
              <div className="mt-4">
                <h3 className="text-[12px] font-semibold text-white mb-1.5">Cast</h3>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {cast.map((c: any) => (
                    <div key={c.credit_id || c.id} className="flex-shrink-0 w-11 text-center">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-white/5 mx-auto">
                        <img src={img(c.profile_path, "w200") || "/placeholder.svg"} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 -mx-4">
              <InlineAdRow count={4} />
            </div>

            <div className="mt-2 -mx-4 space-y-0.5">
              <TmdbRow title="Trending Anime" items={trending.data} isLoading={trending.isLoading} type="tv" />
              <TmdbRow title="Popular Anime" items={popular.data} isLoading={popular.isLoading} type="tv" />
              <TmdbRow title="Top Rated Anime" items={topRated.data} isLoading={topRated.isLoading} type="tv" ranked />
            </div>

            <div className="mt-2 -mx-4">
              <InlineAdRow count={4} />
            </div>
          </div>
        )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-14">
              <h3 className="text-[12px] font-semibold text-foreground mb-2 px-1">Up Next</h3>
              <div className="flex flex-col gap-2">
                {upNextList.map((m: any) => (
                  <Link key={m.id} to={`/watch/tv/${m.id}/1/1`} className="flex gap-2 rounded-lg p-1.5 hover:bg-white/5 transition">
                    <div className="relative flex-shrink-0 w-[150px] aspect-video rounded-md overflow-hidden bg-surface-2">
                      {(m.backdrop_path || m.poster_path) && (
                        <img src={img(m.backdrop_path || m.poster_path, "w300")} alt={m.name || m.title} loading="lazy" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-semibold text-foreground line-clamp-2 leading-snug">{m.name || m.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{(m.first_air_date || "").slice(0, 4)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      <div className="hidden md:block"><Footer /></div>
    </div>
  );
};

export default TvWatchPage;
