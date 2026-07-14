import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OfflineBanner from "@/components/OfflineBanner";
import HomePage from "./pages/HomePage";
import FollowUsPage from "./pages/FollowUsPage";
import SearchPage from "./pages/SearchPage";
import WatchPage from "./pages/WatchPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import TVDetailPage from "./pages/TVDetailPage";
import MovieWatchPage from "./pages/MovieWatchPage";
import TvWatchPage from "./pages/TvWatchPage";
import GenrePage from "./pages/GenrePage";
import ProfilePage from "./pages/ProfilePage";
import MyListPage from "./pages/MyListPage";
import LibraryPage from "./pages/LibraryPage";
import LikedVideosPage from "./pages/LikedVideosPage";
import RegisterPage from "./pages/RegisterPage";
import AnimePage from "./pages/AnimePage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";

import MyDownloadsPage from "./pages/MyDownloadsPage";
import DownloadPage from "./pages/DownloadPage";
import InstallAppPage from "./pages/InstallAppPage";
import Welcome from "./pages/Welcome";
import OnboardingGenres from "./pages/OnboardingGenres";
import OnboardingTitles from "./pages/OnboardingTitles";
import OnboardingDone from "./pages/OnboardingDone";
import Contact from "./pages/Contact";
import AuthGuard from "./components/AuthGuard";
import NotFound from "./pages/NotFound";

import FAQ from "./pages/FAQ";
import LegalNotices from "./pages/LegalNotices";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import SpeedTest from "./pages/SpeedTest";
import CookiePreferences from "./pages/CookiePreferences";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "nowanime-query-cache",
  throttleTime: 1000,
});

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
  >
    <OfflineBanner />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/signin" element={<Navigate to="/welcome" replace />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding/phone" element={<Navigate to="/onboarding/genres" replace />} />
            <Route path="/onboarding/genres" element={<OnboardingGenres />} />
            <Route path="/onboarding/titles" element={<OnboardingTitles />} />
            <Route path="/onboarding/social" element={<Navigate to="/onboarding/done" replace />} />
            <Route path="/onboarding/done" element={<OnboardingDone />} />

            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/follow-us" element={<FollowUsPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/tv/:id" element={<TVDetailPage />} />
            <Route path="/watch/movie/:tmdbId" element={<MovieWatchPage />} />
            <Route path="/watch/tv/:tmdbId/:season/:episode" element={<TvWatchPage />} />
            <Route path="/movie/:tmdbId/watch" element={<MovieWatchPage />} />
            <Route path="/genre/:genre" element={<GenrePage />} />
            <Route path="/anime" element={<AnimePage />} />
            <Route path="/anime/:id" element={<AnimeDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/watch/:videoId" element={<WatchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-list" element={<MyListPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/liked" element={<LikedVideosPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/my-downloads" element={<MyDownloadsPage />} />
            <Route path="/downloads" element={<Navigate to="/my-downloads" replace />} />
            <Route path="/download/:mediaType/:id" element={<DownloadPage />} />
            <Route path="/download/:mediaType/:id/:s/:e" element={<DownloadPage />} />
            <Route path="/install" element={<InstallAppPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Navigate to="/help" replace />} />

            <Route path="/faq" element={<FAQ />} />
            <Route path="/legal-notices" element={<LegalNotices />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/speed-test" element={<SpeedTest />} />
            <Route path="/cookie-preferences" element={<CookiePreferences />} />

            {/* Legacy/removed routes → home */}
            <Route path="/movies" element={<Navigate to="/anime" replace />} />
            <Route path="/tv" element={<Navigate to="/anime" replace />} />
            <Route path="/live-tv" element={<Navigate to="/home" replace />} />
            <Route path="/animation" element={<Navigate to="/anime" replace />} />
            <Route path="/documentary" element={<Navigate to="/anime" replace />} />
            <Route path="/podcasts" element={<Navigate to="/home" replace />} />
            <Route path="/watch" element={<Navigate to="/home" replace />} />
            <Route path="/music" element={<Navigate to="/home" replace />} />
            <Route path="/b-music" element={<Navigate to="/home" replace />} />
            <Route path="/b-apps" element={<Navigate to="/home" replace />} />
            <Route path="/novels" element={<Navigate to="/home" replace />} />
            <Route path="/only-on-nowanime" element={<Navigate to="/home" replace />} />
            <Route path="/investors" element={<Navigate to="/settings" replace />} />
            <Route path="/jobs" element={<Navigate to="/settings" replace />} />
            <Route path="/corporate" element={<Navigate to="/settings" replace />} />
            <Route path="/media" element={<Navigate to="/settings" replace />} />
            <Route path="/gift-cards" element={<Navigate to="/settings" replace />} />
            <Route path="/redeem" element={<Navigate to="/settings" replace />} />
            <Route path="/ad-choices" element={<Navigate to="/privacy" replace />} />
            <Route path="/ways-to-watch" element={<Navigate to="/install" replace />} />
            <Route path="/legal-guarantee" element={<Navigate to="/legal-notices" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthGuard>
      </BrowserRouter>
    </TooltipProvider>
  </PersistQueryClientProvider>
);

export default App;
