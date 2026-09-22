import NativeAd from "./NativeAd";

/** Four larger fixed-size native placements that stay stable on phones. */
const InlineAdRow = ({ count = 4, compact = false }: { count?: number; compact?: boolean }) => (
  <section aria-label="Sponsored" className="my-4 w-full px-2 sm:px-[4%]">
    <span className="mb-1 block text-[8px] font-medium uppercase text-muted-foreground/60">Sponsored</span>
    <div className="grid min-h-[96px] grid-cols-4 gap-2 sm:min-h-[128px] sm:gap-3">
      {Array.from({ length: Math.min(4, Math.max(1, count)) }).map((_, index) => (
        <NativeAd key={index} compact={compact} inline />
      ))}
    </div>
  </section>
);

export default InlineAdRow;
