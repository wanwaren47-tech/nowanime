import { Home, Flame, Library, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const ExploreSquares = ({ className = "" }: { className?: string }) => (
  <span className={`grid grid-cols-2 gap-[3px] ${className}`} aria-hidden="true">
    {Array.from({ length: 4 }).map((_, index) => (
      <span key={index} className="block h-[8px] w-[8px] rounded-[2px] border-[1.5px] border-current" />
    ))}
  </span>
);

const tabs = [
  { to: "/home", icon: Home, label: "Home", match: (p: string) => p === "/" || p === "/home" },
  { to: "/search", icon: ExploreSquares, label: "Explore", match: (p: string) => p.startsWith("/search") || p.startsWith("/anime") },
  { to: "/trending", icon: Flame, label: "Trending", match: (p: string) => p.startsWith("/trending") },
  { to: "/library", icon: Library, label: "Library", match: (p: string) => p.startsWith("/my-list") || p.startsWith("/library") || p.startsWith("/liked") },
  { to: "/profile", icon: User, label: "Profile", match: (p: string) => p.startsWith("/profile") || p.startsWith("/my-downloads") || p.startsWith("/download") || p.startsWith("/settings") },
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
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 text-[11px] font-semibold transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
                <span className="truncate max-w-full">{t.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2.5px] w-7 rounded-full bg-primary" />
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
