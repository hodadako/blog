import { describe, expect, it } from "vitest";
import { getGuitarSong, loadGuitarCatalog, searchGuitarSongs } from "./catalog";

describe("Guitar catalog", () => {
  it("loads the authored ChordPro sample in stable added-date order", () => {
    const songs = loadGuitarCatalog();
    expect(songs.map(({ slug }) => slug)).toContain("hodako--quiet-walk");
    expect(getGuitarSong("hodako--quiet-walk")?.document.metadata.title).toBe("저녁 산책");
    expect(getGuitarSong("hodako--quiet-walk")?.added).toBe("2026-10-09");
    for (let index = 1; index < songs.length; index += 1) {
      expect((songs[index - 1].added ?? "").localeCompare(songs[index].added ?? "")).toBeGreaterThanOrEqual(0);
    }
  });

  it("searches normalized title and artist text with partial matching", () => {
    const songs = loadGuitarCatalog();
    expect(searchGuitarSongs(songs, "  저녁  ").map(({ slug }) => slug)).toContain("hodako--quiet-walk");
    expect(searchGuitarSongs(songs, "호다코").map(({ slug }) => slug)).toContain("hodako--quiet-walk");
    expect(searchGuitarSongs(songs, "없는 곡")).toEqual([]);
  });
});
