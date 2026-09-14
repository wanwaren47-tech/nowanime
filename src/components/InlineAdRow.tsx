import NativeAd from "./NativeAd";

/** Sponsored slot — Adsterra native ad. */
const InlineAdRow = ({ compact = false }: { count?: number; compact?: boolean }) => (
  <NativeAd compact={compact} />
);

export default InlineAdRow;
