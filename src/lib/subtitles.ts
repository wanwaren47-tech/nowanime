// Subtitle helpers: convert SRT → WebVTT and resolve full language names.

export function srtToVtt(srt: string): string {
  const body = srt
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return "WEBVTT\n\n" + body;
}

/** Fetch a caption file (SRT or VTT) and return a same-origin blob URL of WebVTT. */
export async function loadCaptionAsVtt(url: string): Promise<string> {
  const r = await fetch(url);
  const text = await r.text();
  const vtt = text.trim().toUpperCase().startsWith("WEBVTT") ? text : srtToVtt(text);
  return URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
}

/** Convert language code or short name to a full readable name via Intl.DisplayNames. */
export function languageName(input: string): string {
  if (!input) return "Unknown";
  const raw = input.trim();
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    // Try lowercased code first (en, es, ja, zh-Hant, etc.)
    const code = raw.toLowerCase().replace(/_/g, "-");
    const hit = dn.of(code);
    if (hit && hit.toLowerCase() !== code) return hit;
  } catch { /* ignore */ }
  // Common short → full mapping for tokens MovieBox uses.
  const map: Record<string, string> = {
    en: "English", eng: "English",
    es: "Spanish", spa: "Spanish",
    pt: "Portuguese", por: "Portuguese",
    fr: "French", fra: "French", fre: "French",
    de: "German", deu: "German", ger: "German",
    it: "Italian", ita: "Italian",
    ja: "Japanese", jpn: "Japanese",
    ko: "Korean", kor: "Korean",
    zh: "Chinese", chi: "Chinese", zho: "Chinese",
    ar: "Arabic", ara: "Arabic",
    ru: "Russian", rus: "Russian",
    hi: "Hindi", hin: "Hindi",
    id: "Indonesian", ind: "Indonesian",
    ms: "Malay", msa: "Malay",
    th: "Thai", tha: "Thai",
    vi: "Vietnamese", vie: "Vietnamese",
    tr: "Turkish", tur: "Turkish",
    nl: "Dutch", nld: "Dutch",
    pl: "Polish", pol: "Polish",
    sv: "Swedish", swe: "Swedish",
    fa: "Persian", per: "Persian", fas: "Persian",
    sw: "Swahili", swa: "Swahili",
  };
  return map[raw.toLowerCase()] || raw.charAt(0).toUpperCase() + raw.slice(1);
}
