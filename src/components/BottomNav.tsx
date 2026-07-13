import { Home, Compass, Sparkles, Tv, CloudDownload, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/home", icon: Home, label: "Home", match: (p: string) => p === "/" || p === "/home" },
  { to: "/anime", icon: Sparkles, label: "Anime", match: (p: string) => p.startsWith("/anime") || p.startsWith("/movies") || p.startsWith("/tv") },
  { to: "/search", icon: Compass, label: "Explore", match: (p: string) => p.startsWith("/search") },
  { to: "/live-tv", icon: Tv, label: "Anime TV", match: (p: string) => p.startsWith("/live-tv") },
  { to: "/my-downloads", icon: CloudDownload, label: "Downloads", match: (p: string) => p.startsWith("/my-downloads") || p.startsWith("/download") },
  { to: "/profile", icon: User, label: "Profile", match: (p: string) => p.startsWith("/profile") },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex items-stretch justify-between px-1">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1 min-w-0">
              <Link
                to={t.to}
                className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-0.5 pt-1.5 pb-1 text-[9px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                <span className="truncate max-w-full">{t.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
