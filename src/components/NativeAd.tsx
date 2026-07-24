import { useEffect, useRef } from "react";

// Adsterra native ad rendered inside a sandboxed iframe. Uses idle scheduling
// and a one-shot retry so it loads reliably on low-end Android (Redmi/Samsung)
// and iOS Safari. Skipped in FB/IG in-app browsers that block ad scripts.

const AD_KEY = "ba3fd22b78c6d97f709385e2e0894584";
const AD_SRC = `https://disturbknockedcaterpillar.com/${AD_KEY}/invoke.js`;

const HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;font-family:system-ui,sans-serif;color:#fff}#container-${AD_KEY}{width:100%}</style></head><body><script async data-cfasync="false" src="${AD_SRC}"><\/script><div id="container-${AD_KEY}"></div></body></html>`;

function isBlockedInApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|Line\//.test(navigator.userAgent || "");
}
function schedule(cb: () => void) {
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) ric(cb, { timeout: 1500 });
  else setTimeout(cb, 250);
}

const NativeAd = ({
  className = "",
  compact = false,
  inline = false,
}: {
  className?: string;
  compact?: boolean;
  inline?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (isBlockedInApp()) return;

    let retried = false;
    const build = () => {
      host.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.scrolling = "no";
      iframe.frameBorder = "0";
      iframe.title = "Sponsored";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.setAttribute("sandbox", "allow-scripts allow-popups allow-same-origin");
      iframe.style.cssText =
        "border:0;display:block;width:100%;height:100%;background:transparent;";
      iframe.srcdoc = HTML;
      host.appendChild(iframe);
      // Retry once if empty after 4s.
      window.setTimeout(() => {
        if (retried) return;
        try {
          const doc = iframe.contentDocument;
          const hasAd = doc?.querySelector("iframe, ins, a, img");
          if (!hasAd) { retried = true; iframe.srcdoc = HTML; }
        } catch { /* cross-origin child */ }
      }, 4000);
    };
    schedule(build);
    return () => { host.innerHTML = ""; };
  }, []);

  if (inline) {
    return (
      <div role="complementary" aria-label="Sponsored" className={`w-full ${className}`}>
        <div ref={ref} className="w-full min-h-[60px] rounded-md overflow-hidden bg-surface-2/40" />
      </div>
    );
  }

  return (
    <div
      role="complementary"
      aria-label="Sponsored"
      className={`w-full px-[5%] ${compact ? "my-2" : "my-5"} ${className}`}
    >
      <span className="block text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">
        Sponsored
      </span>
      <div
        ref={ref}
        className={`w-full ${compact ? "min-h-[60px]" : "min-h-[100px]"} rounded-md overflow-hidden`}
      />
    </div>
  );
};

export default NativeAd;
