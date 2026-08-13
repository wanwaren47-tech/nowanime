import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExternalLink, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Step = "choose" | "redirect";

const EXTERNAL_DOWNLOADER_URL = "https://videodownloader.site/";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "movie" | "tv" | "anime";
  tmdbId: string;
  title: string;
  year?: string;
  season?: number;
  episode?: number;
  itemId: string;
  poster?: string | null;
  backdrop?: string | null;
}

const DownloadSourceSheet = ({
  open,
  onOpenChange,
  type,
  title,
  year,
  season,
  episode,
  itemId,
}: Props) => {
  const [step, setStep] = useState<Step>("choose");

  const isSeries = type === "tv";
  const episodeLabel = isSeries ? `S${season ?? 1} · E${episode ?? 1}` : year || "Movie";

  const close = (v: boolean) => onOpenChange(v);

  useEffect(() => {
    if (open) setStep("choose");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemId]);

  const continueToExternal = () => {
    const url = `${EXTERNAL_DOWNLOADER_URL}?q=${encodeURIComponent(title)}&title=${encodeURIComponent(title)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening external downloader…");
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-sm bg-[#0f0f10] border-white/10 text-white p-0 overflow-hidden">
        {step === "choose" && (
          <div className="p-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Download</DialogTitle>
              <DialogDescription className="text-[11px] text-white/55">
                {title}
                {isSeries ? ` · ${episodeLabel}` : year ? ` · ${year}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => setStep("redirect")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition"
              >
                <span className="w-9 h-9 grid place-items-center rounded-lg bg-sky-400/15 text-sky-400">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-[12.5px] font-bold text-white">External Downloader</span>
                  <span className="block text-[10.5px] text-white/55">
                    Grab the file with a trusted downloader site
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        )}

        {step === "redirect" && (
          <div className="p-5 text-center">
            <div className="mx-auto w-11 h-11 grid place-items-center rounded-full bg-amber-400/15 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="mt-3 text-[13px] font-bold text-white">You're being redirected</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/55">
              We'll open <span className="text-white/80">videodownloader.site</span> in a new tab so you can
              download “{title}”. It's an external service outside NowAnime.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep("choose")}
                className="flex-1 h-10 rounded-xl border border-white/10 text-[12px] font-semibold text-white/70"
              >
                Back
              </button>
              <button
                onClick={continueToExternal}
                className="flex-1 h-10 rounded-xl text-[12px] font-bold text-white"
                style={{ background: "hsl(var(--primary))" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DownloadSourceSheet;
