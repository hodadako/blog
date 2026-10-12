import { describe, expect, it } from "vitest";
import { getGuitarSong, loadGuitarCatalog, searchGuitarSongs } from "./catalog";

describe("Guitar catalog", () => {
  it("loads published songs in stable added-date order without the removed sample", () => {
    const songs = loadGuitarCatalog();
    expect(getGuitarSong("hodako--quiet-walk")).toBeUndefined();
    expect(getGuitarSong("vaundy--shiawase")?.document.metadata.title).toBe("しわあわせ");
    expect(getGuitarSong("vaundy--shiawase")?.document.metadata.key).toBe("F");
    for (let index = 1; index < songs.length; index += 1) {
      expect((songs[index - 1].added ?? "").localeCompare(songs[index].added ?? "")).toBeGreaterThanOrEqual(0);
    }
  });

  it("searches normalized title and artist text with partial matching", () => {
    const songs = loadGuitarCatalog();
    expect(searchGuitarSongs(songs, "  VAUNDY  ").map(({ slug }) => slug)).toContain("vaundy--shiawase");
    expect(searchGuitarSongs(songs, "しわ").map(({ slug }) => slug)).toContain("vaundy--shiawase");
    expect(searchGuitarSongs(songs, "저녁 산책")).toEqual([]);
    expect(searchGuitarSongs(songs, "없는 곡")).toEqual([]);
  });
});
