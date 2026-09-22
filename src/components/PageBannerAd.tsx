import { useEffect, useRef, useState } from "react";

const AD_KEY = "5b6beb58c6b3a15cbeec08371006507f";
const AD_SRC = `https://disturbknockedcaterpillar.com/${AD_KEY}/invoke.js`;
const CREATIVE_WIDTH = 468;
const CREATIVE_HEIGHT = 60;

const AD_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:468px;height:60px;overflow:hidden;background:transparent}</style></head><body><script>atOptions={'key':'${AD_KEY}','format':'iframe','height':60,'width':468,'params':{}};<\/script><script src="${AD_SRC}"><\/script></body></html>`;

const PageBannerAd = ({ className = "" }: { className?: string }) => {
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frameWrap = frameWrapRef.current;
    if (!frameWrap) return;

    const updateScale = () => setScale(Math.min(1, frameWrap.clientWidth / CREATIVE_WIDTH));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frameWrap);
    return () => observer.disconnect();
  }, []);

  return (
    <aside
      role="complementary"
      aria-label="Advertisement"
      className={`w-full px-3 py-2 sm:px-[4%] ${className}`}
    >
      <span className="mx-auto mb-1 block max-w-[468px] text-[9px] uppercase text-muted-foreground/60">
        Advertisement
      </span>
      <div
        ref={frameWrapRef}
        className="relative mx-auto w-full max-w-[468px] overflow-hidden rounded-md bg-surface-2/30"
        style={{ height: CREATIVE_HEIGHT * scale }}
      >
        <iframe
          title="Sponsored banner"
          srcDoc={AD_HTML}
          scrolling="no"
          frameBorder={0}
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="absolute left-1/2 top-0 block border-0"
          style={{
            width: CREATIVE_WIDTH,
            height: CREATIVE_HEIGHT,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
        />
      </div>
    </aside>
  );
};

export default PageBannerAd;