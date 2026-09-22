import { useState } from "react";
import { Download } from "lucide-react";
import DownloadSourceSheet from "./DownloadSourceSheet";
import { Button } from "@/components/ui/button";

interface Props {
  type: "movie" | "tv" | "anime";
  tmdbId: string;
  title: string;
  year?: string;
  season?: number;
  episode?: number;
  id?: string;
  poster?: string | null;
  backdrop?: string | null;
  size?: "sm" | "md" | "icon";
}

const DownloadButton = ({ type, tmdbId, title, year, season, episode, poster, backdrop, size = "md" }: Props) => {
  const itemId = `${type}-${tmdbId}${season ? `-s${season}-e${episode ?? 1}` : ""}`;
  const [sourceOpen, setSourceOpen] = useState(false);

  const sheet = (
    <DownloadSourceSheet
      open={sourceOpen}
      onOpenChange={setSourceOpen}
      type={type}
      tmdbId={tmdbId}
      title={title}
      year={year}
      season={season}
      episode={episode}
      itemId={itemId}
      poster={poster}
      backdrop={backdrop}
    />
  );

  if (size === "icon") {
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSourceOpen(true); }}
          className="h-6 w-6 rounded-full"
          aria-label="Download episode"
        >
          <Download className="h-3 w-3" strokeWidth={2.5} />
        </Button>
        {sheet}
      </>
    );
  }

  const padding = size === "sm" ? "h-9 px-3 text-xs" : "h-11 px-3 text-xs md:px-5 md:text-sm";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <>
      <Button
        type="button"
        onClick={() => setSourceOpen(true)}
        className={`min-w-0 flex-1 rounded-md font-semibold ${padding}`}
      >
        <Download className={icon} />
        Download
      </Button>
      {sheet}
    </>
  );
};

export default DownloadButton;
