export interface SongReadings {
  segments: Record<string, { romaji: string; korean: string }>;
  english: Record<string, string>;
}

export type LyricMode = "original" | "romaji" | "english" | "korean";
