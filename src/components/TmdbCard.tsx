import { Link } from "react-router-dom";
import { Star, Play } from "lucide-react";
import { TmdbItem, img } from "@/lib/tmdb";
import { subDubLabel } from "@/lib/animeSubDub";

interface TmdbCardProps {
  item: TmdbItem;
  type?: "movie" | "tv";
  width?: number;
  fill?: boolean;
  rank?: number;
}

/** NowAnime noir poster card — soft charcoal tile, dusty rose accents. */
const TmdbCard = ({ item, type, width, fill, rank }: TmdbCardProps) => {
  const mediaType = type || item.media_type || (item.first_air_date ? "tv" : "movie");
  const to = `/${mediaType}/${item.id}`;
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const poster = img(item.poster_path, "w300") || "/placeholder.svg";

  const sizingClass = fill
    ? "w-full"
    : "w-[104px] sm:w-[124px] md:w-[146px] lg:w-[158px]";
  const inlineStyle = !fill && width ? { width, minWidth: width } : undefined;

  const card = (
    <Link
      to={to}
      className={`group flex-shrink-0 snap-start ${sizingClass}`}
      style={inlineStyle}
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden relative bg-surface-2 ring-1 ring-white/[0.06] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:ring-primary/50">
        <img
          src={poster}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80" />
        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="rounded-full bg-primary p-2.5 text-primary-foreground shadow-xl">
            <Play className="w-3.5 h-3.5 fill-current" />
          </span>
        </div>
        {item.vote_average > 0 && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-black/60 backdrop-blur px-1.5 py-0.5 text-[9px] font-semibold text-primary">
            <Star className="w-2.5 h-2.5 fill-current" /> {item.vote_average.toFixed(1)}
          </div>
        )}
        <div className="absolute top-1.5 right-1.5 rounded-full bg-primary/90 px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wide text-primary-foreground">
          {subDubLabel(item.id, item.original_language)}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2">
          <p className="text-[11px] md:text-[12px] font-semibold text-white line-clamp-1">{item.title}</p>
          {year && <p className="text-[9px] md:text-[10px] text-white/55">{year}</p>}
        </div>
      </div>
    </Link>
  );

  if (rank === undefined) return card;

  return (
    <div className="flex items-end flex-shrink-0 snap-start">
      <span
        aria-hidden
        className="font-serif leading-none select-none text-transparent -mr-2 md:-mr-4 text-[76px] md:text-[118px]"
        style={{ WebkitTextStroke: "1.5px hsl(var(--primary) / 0.75)" }}
      >
        {rank}
      </span>
      {card}
    </div>
  );
};

export default TmdbCard;
