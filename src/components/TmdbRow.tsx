import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { TmdbItem } from "@/lib/tmdb";
import TmdbCard from "./TmdbCard";

interface TmdbRowProps {
  title: string;
  items?: TmdbItem[];
  isLoading?: boolean;
  type?: "movie" | "tv";
  viewAll?: string;
  ranked?: boolean;
}

const TmdbRow = ({ title, items, isLoading, type, viewAll, ranked }: TmdbRowProps) => {
  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <section className="mb-5 md:mb-7">
      <div className="flex items-center justify-between px-[4%] mb-2 md:mb-3">
        <h2 className="font-serif text-lg md:text-2xl tracking-tight text-foreground">{title}</h2>
        {viewAll && (
          <Link to={viewAll} className="flex items-center gap-0.5 text-[10px] md:text-xs text-primary font-semibold hover:underline">
            All <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="flex gap-2.5 md:gap-4 px-[4%] overflow-x-auto scrollbar-hide pb-2 snap-x snap-proximity">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[104px] sm:w-[124px] md:w-[146px] aspect-[2/3] rounded-xl bg-card animate-pulse" />
            ))
          : items!.slice(0, 20).map((item, idx) => (
              <TmdbCard
                key={`${item.id}-${item.media_type ?? type}`}
                item={item}
                type={type}
                rank={ranked ? idx + 1 : undefined}
              />
            ))}
      </div>
    </section>
  );
};

export default TmdbRow;
