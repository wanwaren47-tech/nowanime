import { Link } from "react-router-dom";

const COLS = [
  {
    title: "Explore",
    links: [
      { label: "Home", to: "/home" },
      { label: "Anime", to: "/anime" },
      { label: "Explore", to: "/search" },
      { label: "Downloads", to: "/my-downloads" },
    ],
  },
  {
    title: "App",
    links: [
      { label: "Install the App", to: "/install" },
      { label: "Speed Test", to: "/speed-test" },
      { label: "Follow Us", to: "/follow-us" },
      { label: "Settings", to: "/settings" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "FAQ", to: "/faq" },
      { label: "Contact Us", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Use", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Cookie Preferences", to: "/cookie-preferences" },
      { label: "Legal Notices", to: "/legal-notices" },
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-white/10 bg-black/95 text-white/55 pb-6">
    <div className="max-w-6xl mx-auto px-5 pt-4">
      <a href="mailto:hello.nowanime@gmail.com" className="text-[12px] underline hover:text-white">
        Questions? Email hello.nowanime@gmail.com
      </a>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-5 mt-5 text-[12px]">
        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-[10.5px] uppercase tracking-widest text-white/40 mb-2">{col.title}</h4>
            <ul className="space-y-1.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="hover:text-white hover:underline transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[10.5px] text-white/45">NowAnime · Stream anime free, anytime.</p>
      <p className="mt-1 text-[10.5px] text-white/40">
        © {new Date().getFullYear()} NowAnime. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
