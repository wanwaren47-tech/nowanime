import { useEffect, useRef } from "react";

// Adsterra native ad. Rendered inside an isolated iframe document (no sandbox)
// so several placements can live on one page without clashing over the
// container id. Skipped in FB/IG in-app browsers that block ad scripts.

const AD_KEY = "ba3fd22b78c6d97f709385e2e0894584";
const AD_SRC = `https://disturbknockedcaterpillar.com/${AD_KEY}/invoke.js`;

const HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent;font-family:system-ui,sans-serif;color:#fff}#container-${AD_KEY}{width:100%;height:100%;overflow:hidden}img{max-width:100%;height:auto}*{box-sizing:border-box}</style></head><body><script async data-cfasync="false" src="${AD_SRC}"><\/script><div id="container-${AD_KEY}"></div></body></html>`;

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
      iframe.setAttribute("allow", "autoplay; clipboard-write");
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

  const h = inline ? "h-[72px] sm:h-[88px]" : compact ? "h-[84px] sm:h-28" : "h-[96px] sm:h-[140px]";

  return (
    <div
      role="complementary"
      aria-label="Sponsored"
      className={`min-w-0 w-full ${inline ? "" : "px-3 sm:px-[4%] my-3"} ${className}`}
    >
      {!inline && (
        <span className="block text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">
          Sponsored
        </span>
      )}
      <div ref={ref} className={`w-full ${h} overflow-hidden rounded bg-surface-2/30`} />
    </div>
  );
};

export default NativeAd;
