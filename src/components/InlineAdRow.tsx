import { useEffect, useState } from "react";
import NativeAd from "./NativeAd";
import CuratedAdGrid from "./CuratedAds";

/**
 * 4-up ad row that alternates between our own curated image ads and the
 * Adsterra native ads on a timer.
 */
const ROTATE_MS = 9000;

const InlineAdRow = ({ count = 4 }: { count?: number }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const showCurated = tick % 2 === 0;
  const offset = Math.floor(tick / 2) % 4;

  return (
    <div className="px-[4%] my-0 py-1">
      <span className="block text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-0.5">
        Sponsored
      </span>
      {showCurated ? (
        <CuratedAdGrid count={count} offset={offset} />
      ) : (
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="min-h-[56px] rounded-md overflow-hidden bg-surface-2/40">
              <NativeAd inline />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InlineAdRow;
