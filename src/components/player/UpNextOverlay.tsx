import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  poster?: string | null;
  seconds?: number;
  onPlay: () => void;
  onCancel: () => void;
}

/**
 * A 5-second countdown overlay shown when a video ends. Rendered by watch
 * pages that opt into autoplay.
 */
const UpNextOverlay = ({ title, subtitle, poster, seconds = 5, onPlay, onCancel }: Props) => {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      onPlay();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onPlay]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-sm px-6">
      <div className="max-w-sm w-full rounded-2xl border border-white/10 bg-background/90 p-4 flex gap-3 items-center">
        {poster && (
          <img src={poster} alt="" loading="lazy" className="w-20 h-28 object-cover rounded-md flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Up next in {left}s</p>
          <p className="text-sm font-bold text-foreground mt-1 line-clamp-2">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={onPlay}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
            >
              <Play className="w-3 h-3 fill-current" /> Play now
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpNextOverlay;
