import { ArrowLeft, ExternalLink, MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const DOWNLOAD_OPTIONS = [
  {
    label: "Get APK on WhatsApp",
    href: "https://whatsapp.com/channel/0029VbD2CdHEwEjtJ5Utbo2n",
    icon: MessageCircle,
    primary: true,
  },
  {
    label: "Get APK on Telegram",
    href: "https://t.me/bingbloom",
    icon: Send,
    primary: false,
  },
  {
    label: "Text Us for the APK",
    href: "https://wa.me/254733541119?text=Hi%2C%20I%20would%20like%20to%20get%20the%20BingBloom%20APK",
    icon: MessageCircle,
    primary: false,
  },
];

const InstallAppPage = () => (
  <main className="min-h-svh bg-nowanime-app px-5 py-8 text-foreground sm:py-12">
    <SEO
      title="Get the BingBloom App"
      description="Join our community to get the latest APK, installation instructions, and app updates."
    />
    <div className="mx-auto w-full max-w-md">
      <Link
        to="/home"
        className="mb-8 inline-flex min-h-10 items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to BingBloom
      </Link>

      <header className="mb-8 text-center">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl border border-border/60 bg-card p-2 shadow-lg">
          <img src="/logo.png" alt="BingBloom app icon" className="h-full w-full object-contain" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase text-primary">BingBloom</p>
        <h1 className="text-2xl font-bold leading-tight">Get the BingBloom App</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Join our community to get the latest APK, installation instructions, and app updates. Choose your preferred option below.
        </p>
      </header>

      <div className="space-y-3">
        {DOWNLOAD_OPTIONS.map(({ label, href, icon: Icon, primary }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              primary
                ? "border-transparent bg-primary text-primary-foreground hover:brightness-110"
                : "border-border bg-card/80 text-foreground hover:bg-secondary"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
          </a>
        ))}
      </div>

      <p className="mt-7 text-center text-xs leading-relaxed text-muted-foreground">
        Having trouble installing the app?{" "}
        <a
          href="https://wa.me/254733541119?text=Hi%2C%20I%20need%20help%20installing%20the%20BingBloom%20app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
        >
          Contact our support team
        </a>{" "}
        and we&rsquo;ll help you.
      </p>
    </div>
  </main>
);

export default InstallAppPage;
