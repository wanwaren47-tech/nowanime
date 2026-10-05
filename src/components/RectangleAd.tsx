import { useEffect, useRef, useState } from "react";

const KEY = "2136969b862789c9341bdd04bd3227e9";
const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:300px;height:250px;overflow:hidden;background:transparent}</style></head><body><script>atOptions={'key':'${KEY}','format':'iframe','height':250,'width':300,'params':{}};<\/script><script src="https://bauval.org/22/${KEY}"><\/script></body></html>`;

/** Independent document per placement prevents atOptions collisions. */
const RectangleAd = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const update = () => setScale(Math.min(1, host.clientWidth / 300));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[300px] aspect-[6/5] overflow-hidden rounded bg-surface-2/30">
      <iframe
        title="Sponsored rectangle"
        srcDoc={HTML}
        scrolling="no"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="absolute left-1/2 top-0 border-0"
        style={{ width: 300, height: 250, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}
      />
    </div>
  );
};

export default RectangleAd;