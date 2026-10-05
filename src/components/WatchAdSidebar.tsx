import NativeAd from "./NativeAd";
import RectangleAd from "./RectangleAd";

const WatchAdSidebar = () => (
  <aside aria-label="Sponsored placements" className="hidden md:block min-w-0">
    <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-hide">
      <p className="mb-2 text-[9px] uppercase text-muted-foreground">Sponsored</p>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <RectangleAd />
            <NativeAd inline compact />
          </div>
        ))}
      </div>
    </div>
  </aside>
);

export default WatchAdSidebar;