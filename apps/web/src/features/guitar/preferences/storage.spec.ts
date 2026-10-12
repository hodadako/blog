import { describe, expect, it } from "vitest";
import {
  GUITAR_PREFERENCES_KEY,
  normalizeGuitarPreferences,
  normalizeSongPreferences,
  readGuitarPreferences,
  readSongPreferences,
  songPreferencesKey,
  writeGuitarPreferences,
  writeSongPreferences,
} from "./storage";

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    read: (key: string) => data.get(key),
  };
}

describe("Guitar preference storage", () => {
  it("uses the versioned global key and keeps song settings isolated by slug", () => {
    const storage = memoryStorage();
    expect(writeGuitarPreferences({ fontSize: 22, scrollSpeed: 7 }, storage)).toBe(true);
    expect(storage.read(GUITAR_PREFERENCES_KEY)).toBe('{"fontSize":22,"scrollSpeed":7}');
    expect(writeSongPreferences("artist--song", { transpose: -4, capo: 2 }, storage)).toBe(true);
    expect(storage.read(songPreferencesKey("artist--song"))).toBe('{"transpose":-4,"capo":2}');
    expect(readSongPreferences("other--song", 5, storage)).toEqual({ transpose: 0, capo: 5 });
  });

  it("recovers malformed and out-of-range values using safe defaults", () => {
    const storage = memoryStorage({
      [GUITAR_PREFERENCES_KEY]: "{broken",
      [songPreferencesKey("broken")]: JSON.stringify({ transpose: 20, capo: -1 }),
    });
    expect(readGuitarPreferences(storage)).toEqual({ fontSize: 18, scrollSpeed: 3 });
    expect(readSongPreferences("broken", 4, storage)).toEqual({ transpose: 0, capo: 4 });
    expect(normalizeGuitarPreferences({ fontSize: 15, scrollSpeed: 0 })).toEqual({ fontSize: 18, scrollSpeed: 3 });
    expect(normalizeSongPreferences({ transpose: 12, capo: 0 }, 7)).toEqual({ transpose: 12, capo: 0 });
  });

  it("falls back when storage access is denied", () => {
    const denied = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(readGuitarPreferences(denied)).toEqual({ fontSize: 18, scrollSpeed: 3 });
    expect(readSongPreferences("song", 3, denied)).toEqual({ transpose: 0, capo: 3 });
    expect(writeGuitarPreferences({ fontSize: 18, scrollSpeed: 3 }, denied)).toBe(false);
    expect(writeSongPreferences("song", { transpose: 0, capo: 3 }, denied)).toBe(false);
  });
});
