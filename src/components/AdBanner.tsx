import { useEffect, useRef } from "react";

// All banner formats now route through a single Adsterra native container.
// The old "format" prop is kept for backward compatibility but ignored.
type AdFormat =
  | "banner-468x60"
  | "banner-728x90"
  | "banner-320x50"
  | "rect-160x300"
  | "sky-160x600";

const AD_KEY = "ba3fd22b78c6d97f709385e2e0894584";
const AD_SRC = `https://disturbknockedcaterpillar.com/${AD_KEY}/invoke.js`;

interface AdBannerProps {
  format?: AdFormat;
  className?: string;
  label?: boolean;
}

const AdBanner = ({ className = "", label = true }: AdBannerProps) => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}#container-${AD_KEY}{width:100%;}</style></head><body><script async data-cfasync="false" src="${AD_SRC}"><\/script><div id="container-${AD_KEY}"></div></body></html>`;
    ref.current.srcdoc = html;
  }, []);

  return (
    <div
      role="complementary"
      aria-label="Advertisement"
      className={`w-full flex flex-col items-center my-4 ${className}`}
    >
      {label && (
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">
          Advertisement
        </span>
      )}
      <div className="relative overflow-hidden rounded-md w-full max-w-xl" style={{ minHeight: 90 }}>
        <iframe
          ref={ref}
          title="ad"
          scrolling="no"
          frameBorder={0}
          style={{ border: 0, display: "block", width: "100%", minHeight: 90 }}
        />
      </div>
    </div>
  );
};

export default AdBanner;
