import { useEffect, useRef } from "react";

// Adsterra native container. Rendered inside a sandboxed iframe (srcdoc) so
// third-party script errors can't crash the app. Retries once if the iframe
// hasn't rendered any ad content after 4s (common on low-end Redmi/Samsung).

const AD_KEY = "ba3fd22b78c6d97f709385e2e0894584";
const AD_SRC = `https://disturbknockedcaterpillar.com/${AD_KEY}/invoke.js`;

function isBlockedInApp(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // In-app browsers that routinely block third-party ad scripts.
  return /FBAN|FBAV|Instagram|Line\//.test(ua);
}

function schedule(cb: () => void) {
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) ric(cb, { timeout: 1500 });
  else setTimeout(cb, 250);
}

type AdFormat =
  | "banner-468x60"
  | "banner-728x90"
  | "banner-320x50"
  | "rect-160x300"
  | "sky-160x600";

interface AdBannerProps {
  format?: AdFormat;
  className?: string;
  label?: boolean;
}

const HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;font-family:system-ui,sans-serif;color:#fff}#c{width:100%}</style></head><body><script async data-cfasync="false" src="${AD_SRC}"><\/script><div id="container-${AD_KEY}"></div><div id="c"></div></body></html>`;

const AdBanner = ({ className = "", label = true }: AdBannerProps) => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (isBlockedInApp()) return; // silently skip in FB/IG in-app browsers
    const el = ref.current;
    let retried = false;
    const load = () => { el.srcdoc = HTML; };
    schedule(load);
    // Retry once if the iframe is still empty after 4s (slow-network Redmi/Samsung).
    const retry = window.setTimeout(() => {
      if (retried) return;
      try {
        const doc = el.contentDocument;
        const hasAd = doc?.querySelector("iframe, ins, a, img");
        if (!hasAd) { retried = true; el.srcdoc = HTML; }
      } catch { /* cross-origin child; leave alone */ }
    }, 4000);
    return () => window.clearTimeout(retry);
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
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-popups allow-same-origin"
          style={{ border: 0, display: "block", width: "100%", minHeight: 90 }}
        />
      </div>
    </div>
  );
};

export default AdBanner;
