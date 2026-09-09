import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronRight, ExternalLink } from "lucide-react";
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
              <DialogTitle className="text-sm font-bold">Choose download source</DialogTitle>
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
                    Opens a download site with the title pre-filled
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        )}

        {step === "redirect" && (
          <div className="p-5 text-center">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 grid place-items-center rounded-xl bg-sky-400/15 text-sky-400 mb-3">
                <ExternalLink className="w-5 h-5" />
              </div>
              <DialogTitle className="text-sm font-bold">You're being redirected</DialogTitle>
              <DialogDescription className="text-[11px] text-white/65 leading-relaxed mt-1">
                We'll open <span className="text-white font-semibold">videodownloader.site</span> in a new tab with the title pre-filled. Tap continue to proceed.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-left">
              <p className="text-[9.5px] uppercase tracking-wider text-white/40 font-semibold">Title</p>
              <p className="text-[12px] font-bold text-white mt-0.5 truncate">{title}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep("choose")}
                className="flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold bg-white/10 text-white hover:bg-white/15"
              >
                Back
              </button>
              <button
                onClick={continueToExternal}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white hover:opacity-90"
                style={{ background: "hsl(var(--primary))" }}
              >
                Continue <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DownloadSourceSheet;
