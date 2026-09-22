import NativeAd from "./NativeAd";

/** Four fixed-size native placements that stay on one line on phones. */
const InlineAdRow = ({ count = 4, compact = false }: { count?: number; compact?: boolean }) => (
  <section aria-label="Sponsored" className="my-3 w-full px-3 sm:px-[4%]">
    <span className="mb-1 block text-[8px] font-medium uppercase text-muted-foreground/60">Sponsored</span>
    <div className="grid min-h-[72px] grid-cols-4 gap-1.5 sm:min-h-[88px] sm:gap-2">
      {Array.from({ length: Math.min(4, Math.max(1, count)) }).map((_, index) => (
        <NativeAd key={index} compact={compact} inline />
      ))}
    </div>
  </section>
);

export default InlineAdRow;
