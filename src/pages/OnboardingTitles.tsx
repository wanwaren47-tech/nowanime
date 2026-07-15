import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import StepProgress from "@/components/StepProgress";
import BrandLogo from "@/components/BrandLogo";
import SEO from "@/components/SEO";
import { saveOnboardingStep } from "@/lib/onboarding";

// Popular anime titles (TMDB posters)
const TITLES = [
  { t: "Naruto", img: "https://image.tmdb.org/t/p/w300/xppeysfvDKVx5MsTnJzCFhVAk1F.jpg" },
  { t: "One Piece", img: "https://image.tmdb.org/t/p/w300/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg" },
  { t: "Attack on Titan", img: "https://image.tmdb.org/t/p/w300/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg" },
  { t: "Demon Slayer", img: "https://image.tmdb.org/t/p/w300/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg" },
  { t: "Jujutsu Kaisen", img: "https://image.tmdb.org/t/p/w300/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg" },
  { t: "My Hero Academia", img: "https://image.tmdb.org/t/p/w300/ivOLM47yJt90P19RH1NvJrAJz9F.jpg" },
  { t: "Bleach", img: "https://image.tmdb.org/t/p/w300/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg" },
  { t: "Death Note", img: "https://image.tmdb.org/t/p/w300/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg" },
  { t: "Chainsaw Man", img: "https://image.tmdb.org/t/p/w300/npdB6eFzizki0WaZ1OvKcJrWe97.jpg" },
  { t: "Spy x Family", img: "https://image.tmdb.org/t/p/w300/l4NBB2j5NBb5aoR9ZOhKbXOgQhs.jpg" },
  { t: "Fullmetal Alchemist", img: "https://image.tmdb.org/t/p/w300/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg" },
  { t: "Tokyo Ghoul", img: "https://image.tmdb.org/t/p/w300/wl4y7CcpApZBteVpuMYcYSHRUFn.jpg" },
];

const OnboardingTitles = () => {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (t: string) =>
    setPicked((p) =>
      p.includes(t) ? p.filter((x) => x !== t) : p.length >= 10 ? p : [...p, t],
    );

  const submit = () => {
    if (picked.length < 3) return;
    saveOnboardingStep("titles", picked);
    navigate("/onboarding/done");
  };

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <SEO title="Personalize – NowAnime" />
      <StepProgress current={3} total={4} />
      <div className="flex flex-col items-center mt-2">
        <BrandLogo size={36} wordmarkSize="sm" />
      </div>

      <div className="px-5 mt-3 md:mt-8">
        <h1 className="text-base md:text-3xl font-bold text-center leading-tight">
          Pick anime you love
        </h1>
        <p className="text-center text-white/55 text-[11px] md:text-sm mt-1">Choose 3–10 titles.</p>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 mt-4 md:mt-6 max-w-md md:max-w-4xl mx-auto">
          {TITLES.map((m) => {
            const on = picked.includes(m.t);
            return (
              <button
                key={m.t}
                onClick={() => toggle(m.t)}
                className="aspect-[2/3] rounded-lg overflow-hidden bg-[#0f0f10] relative transition-all"
                style={on ? { boxShadow: "0 0 10px rgba(220,80,40,0.7)", outline: "1.5px solid hsl(var(--primary))" } : { border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <img src={m.img} alt={m.t} className="w-full h-full object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/95 to-transparent">
        <button
          onClick={submit}
          disabled={picked.length < 3}
          className="w-full max-w-md md:max-w-sm mx-auto h-10 md:h-12 rounded-lg text-white text-xs md:text-sm font-semibold flex items-center justify-center relative disabled:opacity-50"
          style={{ background: "linear-gradient(180deg,hsl(var(--primary)) 0%,#c084fc 100%)", boxShadow: "0 4px 14px rgba(220,80,40,0.35)" }}
        >
          Continue ({picked.length} selected)
          <ChevronRight className="w-4 h-4 absolute right-4" />
        </button>
      </div>
    </div>
  );
};

export default OnboardingTitles;
