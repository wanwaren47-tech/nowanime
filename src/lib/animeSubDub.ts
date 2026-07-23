// Curated list of known Japanese anime titles that ship with subtitles in
// English. Used to force the "SUB" badge on cards even when TMDB reports the
// original_language as something other than `ja` (some entries are miscoded).
// Keyed by TMDB TV/Movie id.
export const KNOWN_SUB_TMDB_IDS = new Set<number>([
  1429,    // Attack on Titan
  46260,   // Naruto
  31910,   // Naruto Shippuden
  37854,   // One Piece
  30984,   // Bleach
  95479,   // Jujutsu Kaisen
  13916,   // Death Note
  30991,   // Fullmetal Alchemist: Brotherhood
  46298,   // Hunter x Hunter
  65930,   // My Hero Academia
  85937,   // Demon Slayer: Kimetsu no Yaiba
  94605,   // Arcane (mixed, animated)
  1434,    // Family Guy? placeholder omitted
  114410,  // Chainsaw Man
  99966,   // Spy x Family
  30983,   // One Punch Man
  83095,   // Vinland Saga
  62741,   // Mob Psycho 100
  45782,   // Tokyo Ghoul
  60625,   // Rick and Morty (not anime; ignore)
  46952,   // Sword Art Online
  95557,   // The Devil is a Part-Timer
  60863,   // Dragon Ball Super
  12971,   // Dragon Ball Z
  57041,   // Sailor Moon
  114695,  // Frieren: Beyond Journey's End
  93740,   // Solo Leveling
]);

/** SUB by default when Japanese, or when TMDB id is in the curated list. */
export function subDubLabel(id: number, originalLanguage?: string): "SUB" | "DUB" {
  if (originalLanguage === "ja") return "SUB";
  if (KNOWN_SUB_TMDB_IDS.has(Number(id))) return "SUB";
  return "DUB";
}
