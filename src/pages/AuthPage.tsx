import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import BrandLogo from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/home", { replace: true });
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate("/home", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5 py-12">
      <SEO
        title="Sign up or sign in – NowAnime"
        description="Create a free NowAnime account to sync your watchlist, downloads and continue watching across devices."
      />
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <BrandLogo size={64} wordmarkSize="md" />
          <h1 className="mt-4 text-xl font-bold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Sync your watchlist, downloads and progress.
          </p>
        </div>

        <button
          onClick={google}
          disabled={busy}
          className="mt-6 w-full h-11 rounded-lg bg-white text-black text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24c0-1.6-.2-3.2-.5-4.7H24v9h12.6c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.4z" />
            <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" />
            <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {sent ? (
          <div className="rounded-lg border border-border bg-card p-4 text-center text-xs text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground font-semibold">{email}</span>. Click it to
            finish signing up.
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 h-11">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 h-11">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signup" ? "Sign up" : "Sign in"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New to NowAnime?"}{" "}
          <button
            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setSent(false); }}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Sign up"}
          </button>
        </p>
        <button
          onClick={() => navigate("/home")}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Continue without an account
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
