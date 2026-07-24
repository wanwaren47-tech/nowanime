// Post-build sitemap verifier. Ensures public/sitemap.xml contains at least
// 250 <url> entries and that every advertised URL (page, image, video
// thumbnail/player) resolves. Fails the build on <250 entries or ≥5% dead
// links so bad sitemaps never reach production.

import { readFileSync } from "fs";
import { resolve } from "path";

const MIN_ENTRIES = 250;
const CONCURRENCY = 12;
const TIMEOUT_MS = 8000;
const MAX_FAIL_PCT = 5;
// Skip network verification during Lovable dev/preview builds; only run in CI
// or when the operator explicitly opts in via VERIFY_SITEMAP=1.
const RUN_NETWORK = process.env.VERIFY_SITEMAP === "1" || process.env.CI === "true";

interface Target { url: string; kind: "page" | "image" | "video-thumb" | "video-player" }

function extract(xml: string): Target[] {
  const out: Target[] = [];
  const grab = (tag: string, kind: Target["kind"]) => {
    const re = new RegExp(`<${tag}>([^<]+)</${tag}>`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml))) out.push({ url: m[1].trim(), kind });
  };
  grab("loc", "page");
  grab("image:loc", "image");
  grab("video:thumbnail_loc", "video-thumb");
  grab("video:player_loc", "video-player");
  return out;
}

function countUrlEntries(xml: string): number {
  return (xml.match(/<url>/g) || []).length;
}

async function head(url: string): Promise<number> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let r = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    // Some CDNs (TMDB image cache) reject HEAD — retry with a ranged GET.
    if (r.status === 405 || r.status === 403) {
      r = await fetch(url, { method: "GET", signal: ctrl.signal, headers: { Range: "bytes=0-0" }, redirect: "follow" });
    }
    return r.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(t);
  }
}

async function pool<T>(items: T[], n: number, worker: (t: T) => Promise<void>) {
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

async function main() {
  const path = resolve("public/sitemap.xml");
  const xml = readFileSync(path, "utf-8");
  const entries = countUrlEntries(xml);
  console.log(`sitemap: ${entries} <url> entries`);
  if (entries < MIN_ENTRIES) {
    console.error(`❌ sitemap has ${entries} entries, minimum is ${MIN_ENTRIES}`);
    process.exit(1);
  }
  if (!RUN_NETWORK) {
    console.log("verify-sitemap: skipping network probe (set VERIFY_SITEMAP=1 to enable)");
    return;
  }
  const targets = extract(xml);
  console.log(`verifying ${targets.length} URLs (pages + images + videos)…`);
  const failed: { t: Target; status: number }[] = [];
  await pool(targets, CONCURRENCY, async (t) => {
    const s = await head(t.url);
    if (s < 200 || s >= 400) failed.push({ t, status: s });
  });
  const failPct = (failed.length / targets.length) * 100;
  console.log(`verify-sitemap: ${failed.length} failures / ${targets.length} (${failPct.toFixed(2)}%)`);
  if (failed.length) {
    for (const f of failed.slice(0, 20)) console.log(`  ${f.status || "ERR"}  ${f.t.kind}  ${f.t.url}`);
    if (failed.length > 20) console.log(`  …and ${failed.length - 20} more`);
  }
  if (failPct > MAX_FAIL_PCT) {
    console.error(`❌ dead-link rate ${failPct.toFixed(2)}% exceeds ${MAX_FAIL_PCT}%`);
    process.exit(1);
  }
  console.log("✅ sitemap verified");
}

main().catch((e) => { console.error(e); process.exit(1); });
