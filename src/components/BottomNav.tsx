import { Home, Flame, CloudDownload, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/home", icon: Home, label: "Home", match: (p: string) => p === "/" || p === "/home" },
  { to: "/anime", icon: Flame, label: "Explore", match: (p: string) => p.startsWith("/anime") || p.startsWith("/search") },
  { to: "/my-downloads", icon: CloudDownload, label: "Downloads", match: (p: string) => p.startsWith("/my-downloads") || p.startsWith("/download") },
  { to: "/profile", icon: User, label: "Profile", match: (p: string) => p.startsWith("/profile") },
  { to: "/settings", icon: Settings, label: "Settings", match: (p: string) => p.startsWith("/settings") },
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
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.4 : 1.9}
                  style={t.label === "Explore" ? { filter: "drop-shadow(0 0 6px hsl(var(--accent)))" } : undefined}
                />
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
