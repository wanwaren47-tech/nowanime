import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { ANIME_CATEGORIES } from "@/lib/animeGenres";

const CategoriesMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        Categories
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 rounded-2xl p-3 shadow-2xl min-w-[420px]"
          style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="grid grid-cols-3 gap-1">
            {ANIME_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/anime?genre=${c.slug}`}
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium text-foreground/80 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesMenu;
