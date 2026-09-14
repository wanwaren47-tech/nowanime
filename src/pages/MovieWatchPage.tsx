import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import MoviePlayer, { ServerId } from "@/components/MoviePlayer";
import UpNextOverlay from "@/components/player/UpNextOverlay";
import { getNextMovie } from "@/lib/autoplay";
import { getAutoplayEnabled } from "@/lib/autoplay";
import SEO from "@/components/SEO";
import InlineAdRow from "@/components/InlineAdRow";
import TmdbRow from "@/components/TmdbRow";
import Footer from "@/components/Footer";
import {
  useMovieDetail,
  useMovieExternalIds,
} from "@/hooks/useTmdb";
import { useTrendingAnime, usePopularAnime, useTopRatedAnime } from "@/hooks/useAnimeContent";
import { img } from "@/lib/tmdb";
import { recordContinue } from "@/components/TmdbContinueRow";

const MovieWatchPage = () => {
  const { tmdbId } = useParams<{ tmdbId: string }>();
  const navigate = useNavigate();
  const { data } = useMovieDetail(tmdbId);
  const ext = useMovieExternalIds(tmdbId);
  const trending = useTrendingAnime();
  const popular = usePopularAnime();
  const topRated = useTopRatedAnime();
  const suggestions = trending.data || [];
  const cast = (data?.credits?.cast || []).slice(0, 15);
  const [server, setServer] = useState<ServerId>("moviebox");
  const [upNext, setUpNext] = useState<{ id: number; title: string } | null>(null);

  const handleEnded = async () => {
    if (!getAutoplayEnabled()) return;
    const next = await getNextMovie(tmdbId || "");
    if (next) setUpNext(next);
  };
  const goNext = async () => {
    const next = upNext || (await getNextMovie(tmdbId || ""));
    if (next) navigate(`/watch/movie/${next.id}`);
  };

  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (data) {
      recordContinue({
        id: data.id, type: "movie", title: data.title,
        poster_path: data.poster_path, backdrop_path: data.backdrop_path, progress: 5,
      });
    }
  }, [data]);

  const year = (data?.release_date || "").slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={data ? `Watch ${data.title} – NowAnime` : "Watch Anime – NowAnime"}
        description={data?.overview?.slice(0, 160) || "Stream anime in HD on NowAnime."}
        type="video.movie"
      />
      <div className="flex-1 max-w-[1600px] mx-auto w-full">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-3 h-11 bg-background/95 backdrop-blur border-b border-border">
          <Link to={tmdbId ? `/movie/${tmdbId}` : "/home"} className="p-1.5 -ml-1 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="text-[13px] font-semibold text-foreground truncate">{data?.title || "Watch"}</h1>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-4 lg:px-4 lg:py-3">
          {/* LEFT: player + content */}
          <div className="min-w-0">
            <div className="w-full lg:rounded-lg lg:overflow-hidden relative">
              <MoviePlayer
                tmdbId={tmdbId || ""}
                imdbId={ext.data?.imdb_id || null}
                type="movie"
                serverId={server}
                onServerChange={setServer}
                title={data?.title}
                year={year}
                poster={data?.poster_path ? img(data.poster_path, "w500") : null}
                backdrop={data?.backdrop_path ? img(data.backdrop_path, "w780") : null}
                onEnded={handleEnded}
                onNext={goNext}
              />
              {upNext && (
                <UpNextOverlay
                  title={upNext.title}
                  subtitle="Similar anime"
                  onPlay={() => navigate(`/watch/movie/${upNext.id}`)}
                  onCancel={() => setUpNext(null)}
                />
              )}
            </div>

        {data && (
          <div className="px-4 pb-4">
            <div className="pt-3">
              <h2 className="text-base font-bold text-foreground tracking-tight">{data.title}</h2>
              <p className="text-[10.5px] text-muted-foreground mt-0.5">
                {year}{data.runtime ? ` · ${data.runtime} min` : ""}
              </p>
            </div>

            {/* Mobile-only horizontal suggestions (desktop uses sidebar) */}
            <section className="mt-4 lg:hidden">
              <h3 className="text-[12px] font-semibold text-foreground mb-2">More Anime</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                {suggestions.slice(0, 20).map((m: any) => (
                  <Link
                    key={m.id}
                    to={`/watch/tv/${m.id}/1/1`}
                    className="relative flex-shrink-0 w-[110px] aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10"
                  >
                    {(m.backdrop_path || m.poster_path) && (
                      <img src={img(m.backdrop_path || m.poster_path, "w300")} alt={m.name || m.title} loading="lazy" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-1 right-1 grid place-items-center w-5 h-5 rounded-full bg-primary">
                      <Play className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
                    </span>
                  </Link>
                ))}
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

          {/* RIGHT: desktop sidebar suggestions (YouTube-style) */}
          <aside className="hidden lg:block">
            <div className="sticky top-14">
              <h3 className="text-[12px] font-semibold text-foreground mb-2 px-1">Up Next</h3>
              <div className="flex flex-col gap-2">
                {suggestions.slice(0, 15).map((m: any) => (
                  <Link
                    key={m.id}
                    to={`/watch/tv/${m.id}/1/1`}
                    className="flex gap-2 rounded-lg p-1.5 hover:bg-white/5 transition"
                  >
                    <div className="relative flex-shrink-0 w-[150px] aspect-video rounded-md overflow-hidden bg-surface-2">
                      {(m.backdrop_path || m.poster_path) && (
                        <img src={img(m.backdrop_path || m.poster_path, "w300")} alt={m.name || m.title} loading="lazy" className="w-full h-full object-cover" />
                      )}
                      <span className="absolute bottom-1 right-1 grid place-items-center w-5 h-5 rounded-full bg-primary">
                        <Play className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-semibold text-foreground line-clamp-2 leading-snug">{m.name || m.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{(m.first_air_date || m.release_date || "").slice(0, 4)}</p>
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

export default MovieWatchPage;
