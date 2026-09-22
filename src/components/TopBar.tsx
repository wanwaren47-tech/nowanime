import { Link, useLocation, useNavigate, NavLink } from "react-router-dom";
import { Search, X, Menu, Home, Flame, Library, User, Bookmark, Heart, Settings, Shield, Download } from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import logoMark from "@/assets/nowanime-noir-mark.png";
import { supabase } from "@/integrations/supabase/client";

const primaryNav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Explore", icon: ExploreSquares },
  { to: "/trending", label: "Trending", icon: Flame },
  { to: "/library", label: "Library", icon: Library },
  { to: "/profile", label: "Profile", icon: User },
];

const mobileNav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Explore", icon: ExploreSquares },
  { to: "/trending", label: "Trending", icon: Flame },
  { to: "/library", label: "Library", icon: Library },
  { to: "/profile", label: "Profile", icon: User },
];

function ExploreSquares({ className = "" }: { className?: string }) {
  return (
    <span className={`grid grid-cols-2 gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={index} className="block h-[6px] w-[6px] rounded-[1px] border border-current" />
      ))}
    </span>
  );
}

const drawerExtras = [
  { to: "/my-downloads", label: "Downloads", icon: Download },
  { to: "/my-list", label: "Watchlist", icon: Bookmark },
  { to: "/liked", label: "Liked", icon: Heart },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/privacy", label: "Privacy", icon: Shield },
  { to: "/follow-us", label: "Follow Us", icon: Heart },
];

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  const isHome = location.pathname === "/home" || location.pathname === "/";
  const bgClass = scrolled || !isHome
    ? "bg-background/95 backdrop-blur-md border-b border-border/60"
    : "bg-gradient-to-b from-background/90 to-transparent";

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${bgClass}`}>
        <div className="flex items-center gap-2 md:gap-4 px-2 md:px-6 h-12 md:h-16 max-w-[1600px] mx-auto">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="md:hidden grid place-items-center h-8 w-8 rounded-md text-foreground/80 hover:text-primary flex-shrink-0"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          {/* Logo — left */}
          <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
            <img src={logoMark} alt="NowAnime" className="h-8 w-8 md:h-10 md:w-10" />
            <span className="hidden md:inline font-serif text-lg tracking-tight text-foreground">NowAnime</span>
          </Link>

          {/* Centered pill nav — desktop */}
          <nav className="hidden md:flex items-center gap-0.5 mx-4 rounded-full bg-white/[0.04] backdrop-blur border border-white/[0.06] px-1.5 py-1">
            {primaryNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`
                }
                style={({ isActive }: any) =>
                  isActive ? { background: "var(--gradient-primary)" } : undefined
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Inline ad slot — desktop only, between nav and search */}
          <div className="hidden lg:flex flex-1 justify-center min-w-0 px-2">
            <div
              aria-label="Advertisement"
              className="w-full max-w-[468px] h-10 rounded-md bg-white/[0.03] border border-white/[0.05] flex items-center justify-center overflow-hidden"
            >
              <iframe
                title="topnav-ad"
                scrolling="no"
                frameBorder={0}
                srcDoc={`<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;height:100%}#c{width:100%;height:100%;display:flex;align-items:center;justify-content:center}</style></head><body><script async data-cfasync='false' src='https://disturbknockedcaterpillar.com/ba3fd22b78c6d97f709385e2e0894584/invoke.js'><\/script><div id='container-ba3fd22b78c6d97f709385e2e0894584'></div></body></html>`}
                className="w-full h-full block border-0"
              />
            </div>
          </div>

          {/* Spacer for md-only (no ad) */}
          <div className="hidden md:block lg:hidden flex-1" />
          <div className="flex-1 md:hidden" />

          {/* Search — always visible on desktop */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="hidden md:flex flex-shrink-0"
          >
            <div className="flex items-center rounded-full bg-white/[0.06] px-3 py-1.5 ring-1 ring-transparent focus-within:ring-primary transition">
              <Search className="mr-2 h-3.5 w-3.5 text-foreground/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime…"
                className="w-40 lg:w-56 bg-transparent text-sm outline-none placeholder:text-foreground/50"
                aria-label="Search anime"
              />
            </div>
          </form>

          {/* Right cluster (install + search + account) */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <Link
              to="/install"
              className="inline-flex items-center gap-1 md:gap-1.5 rounded-full bg-primary px-2.5 md:px-3.5 py-1 md:py-2 text-[10px] md:text-[12px] font-bold uppercase tracking-wide text-primary-foreground whitespace-nowrap"
              aria-label="Download App"
            >
              <Download className="h-3 w-3 md:h-4 md:w-4" />
              <span className="md:hidden">Install</span>
              <span className="hidden md:inline">Download App</span>
            </Link>

            <Link
              to="/search"
              aria-label="Search"
              className="md:hidden grid place-items-center h-8 w-8 rounded-full bg-secondary/70 text-foreground/80 hover:text-primary"
            >
              <Search className="h-4 w-4" />
            </Link>

            {signedIn ? (
              <Link
                to="/profile"
                aria-label="Profile"
                className="grid place-items-center h-8 w-8 rounded-full bg-secondary/70 text-foreground/80 hover:text-primary"
              >
                <User className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] pl-1 pr-2.5 md:pr-3 py-1 text-[11px] md:text-[12px] font-semibold text-foreground whitespace-nowrap hover:bg-white/[0.1]"
              >
                <span className="grid place-items-center h-6 w-6 rounded-full bg-secondary/80">
                  <User className="h-3.5 w-3.5" />
                </span>
                Sign in
              </Link>
            )}
            <div className="hidden md:block"><ThemeToggle /></div>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 z-[70] w-[82%] max-w-[300px] bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <Link to="/home" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2">
                <img src={logoMark} alt="" className="w-9 h-9" />
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg hover:bg-secondary"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-0.5">
              {mobileNav.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium min-h-[44px] ${
                      active ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    {label}
                  </Link>
                );
              })}
              <div className="h-px bg-border my-2" />
              {drawerExtras.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:bg-secondary min-h-[44px]"
                >
                  <Icon className="w-[18px] h-[18px]" /> {label}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <div className="flex items-center justify-between px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-foreground/80">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default TopBar;
