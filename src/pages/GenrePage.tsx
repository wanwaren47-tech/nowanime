import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import SEO from "@/components/SEO";
import { fetchList, img } from "@/lib/tmdb";

const GENRE_MAP: Record<string, { name: string; id: number }> = {
  action: { name: "Action", id: 10759 },
  comedy: { name: "Comedy", id: 35 },
  horror: { name: "Horror", id: 9648 },
  drama: { name: "Drama", id: 18 },
  scifi: { name: "Sci-Fi", id: 10765 },
  romance: { name: "Romance", id: 10749 },
  thriller: { name: "Thriller", id: 9648 },
  animation: { name: "Animation", id: 16 },
  documentary: { name: "Documentary", id: 99 },
  trending: { name: "Trending", id: 0 },
  "new-releases": { name: "New Releases", id: -1 },
};

const GenrePage = () => {
  const { genre } = useParams<{ genre: string }>();
  const info = GENRE_MAP[genre || ""] || { name: genre || "Movies", id: 0 };

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ["tmdb-genre", genre],
    queryFn: async () => {
      const qs = new URLSearchParams({
        sort_by: "popularity.desc",
        with_genres: "16",
        with_original_language: "ja",
        include_adult: "false",
      });
      if (genre === "trending") {
        qs.set("sort_by", "popularity.desc");
      } else if (genre === "new-releases") {
        qs.set("sort_by", "first_air_date.desc");
      } else {
        qs.set("with_genres", info.id === 16 ? "16" : `16,${info.id}`);
      }
      const data = await fetchList(`/discover/tv?${qs.toString()}`, "tv");
      return data.map((m: any) => ({
        id: `tmdb-${m.id}`,
        tmdbId: m.id,
        title: m.title || m.name || "",
        thumbnail: img(m.poster_path, "w500"),
        channel: "",
        views: `${(m.vote_average || 0).toFixed(1)}`,
        duration: "",
        backdrop: img(m.backdrop_path, "w780"),
      }));
    },
  });

  return (
    <AppLayout>
      <SEO
          title={`${info.name} Anime – NowAnime`}
          description={`Discover ${info.name.toLowerCase()} anime on NowAnime. Trending, top-rated and new releases all in one place.`}
        jsonLd={{
          "@type": "CollectionPage",
            name: `${info.name} Anime – NowAnime`,
            description: `Discover ${info.name.toLowerCase()} anime on NowAnime.`,
          url: `https://nowanime.lovable.app/genre/${genre}`,
        }}
      />
      <div className="px-[4%] pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-white">{info.name}</h1>
        <p className="text-sm text-[#A1A1A1] mt-1">Discover {info.name.toLowerCase()} anime</p>
      </div>

      <div className="px-[4%] pb-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-5 mt-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-[#1A1A1A] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-5 mt-4">
            {movies.map((m: any) => (
              <a key={m.id} href={`/tv/${m.tmdbId}`} className="group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1A1A1A] relative shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                  {m.thumbnail ? (
                    <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">{m.title?.[0]}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white text-lg ml-0.5">▶</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white font-medium mt-2 line-clamp-1">{m.title}</p>
                <p className="text-xs text-[#A1A1A1]">{m.views} ★</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GenrePage;
