// Central registry of stream providers used by MoviePlayer.
// Order: FastStreams (#1 default) → HD (MovieBox direct) → Mirror (NetMirror).
// All three resolve through the `resolve-stream` edge function.

export type ServerId = "faststreams" | "hd" | "mirror";

export interface ProviderCtx {
  tmdbId: string;
  imdbId?: string | null;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  title?: string;
  year?: string;
}

export interface Provider {
  id: ServerId;
  label: string;
  short: string;
  /** Passed as `provider` to the resolve-stream edge function. */
  resolveProvider: ServerId;
}

export const PROVIDERS: Provider[] = [
  { id: "faststreams", label: "FastStreams", short: "Fast", resolveProvider: "faststreams" },
  { id: "hd", label: "HD", short: "HD", resolveProvider: "hd" },
  { id: "mirror", label: "Mirror", short: "Mirror", resolveProvider: "mirror" },
];

export const getProvider = (id: ServerId) =>
  PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
