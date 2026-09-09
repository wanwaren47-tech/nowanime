import adApp from "@/assets/ad-app.jpg";
import adWhatsapp from "@/assets/ad-whatsapp.jpg";
import adMovies from "@/assets/ad-movies.jpg";
import adOffline from "@/assets/ad-offline.jpg";
import appAsset from "@/assets/nowanime-app.apk.asset.json";

export const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbDgcpD90x34UNlo8R2U";
export const APP_DOWNLOAD_URL = appAsset.url;

export interface CuratedAd {
  img: string;
  alt: string;
  href: string;
  external: boolean;
}

export const CURATED_ADS: CuratedAd[] = [
  { img: adApp, alt: "Get the NowAnime app — free download", href: APP_DOWNLOAD_URL, external: true },
  { img: adWhatsapp, alt: "Join the NowAnime WhatsApp movie chat", href: WHATSAPP_CHANNEL, external: true },
  { img: adMovies, alt: "New movies daily — watch free", href: APP_DOWNLOAD_URL, external: true },
  { img: adOffline, alt: "Watch offline — install the app", href: APP_DOWNLOAD_URL, external: true },
];

/** 4-across grid of small curated image ads. */
const CuratedAdGrid = ({ count = 4, offset = 0 }: { count?: number; offset?: number }) => (
  <div className="grid grid-cols-4 gap-1">
    {Array.from({ length: count }).map((_, i) => {
      const ad = CURATED_ADS[(i + offset) % CURATED_ADS.length];
      return (
        <a
          key={`${ad.alt}-${i}`}
          href={ad.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block min-h-[56px] rounded-md overflow-hidden bg-surface-2/40"
        >
          <img
            src={ad.img}
            alt={ad.alt}
            loading="lazy"
            width={816}
            height={816}
            className="w-full h-full object-cover aspect-square"
          />
        </a>
      );
    })}
  </div>
);

export default CuratedAdGrid;
