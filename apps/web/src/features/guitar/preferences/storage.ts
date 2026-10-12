export const GUITAR_PREFERENCES_KEY = "guitar:preferences:v1";
export const DEFAULT_FONT_SIZE = 18;
export const DEFAULT_SCROLL_SPEED = 3;

export interface GuitarPreferences {
  fontSize: number;
  scrollSpeed: number;
}

export interface SongPreferences {
  transpose: number;
  capo: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const DEFAULT_PREFERENCES: GuitarPreferences = { fontSize: DEFAULT_FONT_SIZE, scrollSpeed: DEFAULT_SCROLL_SPEED };

export function songPreferencesKey(slug: string): string {
  return `guitar:song:v1:${slug}`;
}

export function normalizeGuitarPreferences(value: unknown): GuitarPreferences {
  if (!value || typeof value !== "object") return DEFAULT_PREFERENCES;
  const input = value as Record<string, unknown>;
  const fontSize = input.fontSize;
  const scrollSpeed = input.scrollSpeed;
  return {
    fontSize: typeof fontSize === "number" && Number.isInteger(fontSize) && fontSize >= 14 && fontSize <= 28 && (fontSize - 14) % 2 === 0
      ? fontSize
      : DEFAULT_FONT_SIZE,
    scrollSpeed: typeof scrollSpeed === "number" && Number.isInteger(scrollSpeed) && scrollSpeed >= 1 && scrollSpeed <= 10
      ? scrollSpeed
      : DEFAULT_SCROLL_SPEED,
  };
}

export function normalizeSongPreferences(value: unknown, sourceCapo: number): SongPreferences {
  if (!value || typeof value !== "object") return { transpose: 0, capo: sourceCapo };
  const input = value as Record<string, unknown>;
  const transpose = input.transpose;
  const capo = input.capo;
  return {
    transpose: typeof transpose === "number" && Number.isInteger(transpose) && transpose >= -12 && transpose <= 12 ? transpose : 0,
    capo: typeof capo === "number" && Number.isInteger(capo) && capo >= 0 && capo <= 12 ? capo : sourceCapo,
  };
}

function readJson(storageKey: string, storage?: StorageLike): unknown {
  try {
    const target = storage ?? window.localStorage;
    const stored = target.getItem(storageKey);
    return stored ? JSON.parse(stored) as unknown : undefined;
  } catch {
    return undefined;
  }
}

export function readGuitarPreferences(storage?: StorageLike): GuitarPreferences {
  return normalizeGuitarPreferences(readJson(GUITAR_PREFERENCES_KEY, storage));
}

export function readSongPreferences(slug: string, sourceCapo: number, storage?: StorageLike): SongPreferences {
  return normalizeSongPreferences(readJson(songPreferencesKey(slug), storage), sourceCapo);
}

export function writeGuitarPreferences(preferences: GuitarPreferences, storage?: StorageLike): boolean {
  try {
    (storage ?? window.localStorage).setItem(GUITAR_PREFERENCES_KEY, JSON.stringify(normalizeGuitarPreferences(preferences)));
    return true;
  } catch {
    return false;
  }
}

export function writeSongPreferences(slug: string, preferences: SongPreferences, storage?: StorageLike): boolean {
  try {
    (storage ?? window.localStorage).setItem(songPreferencesKey(slug), JSON.stringify(normalizeSongPreferences(preferences, 0)));
    return true;
  } catch {
    return false;
  }
}
