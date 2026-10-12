import { describe, expect, it } from "vitest";
import { deriveSongView, parseChordName } from "./music";
import { parseChordPro } from "../chordpro/parser";

function firstChordRaw(document: ReturnType<typeof parseChordPro>): string | undefined {
  const line = document.lines.find((item) => item.kind === "lyrics");
  return line?.kind === "lyrics" ? line.segments.find(({ chord }) => chord)?.chord?.raw : undefined;
}

describe("Guitar pitch and capo calculations", () => {
  it("parses supported chord roots, suffixes, and slash bass notes", () => {
    expect(parseChordName("D/F#")).toEqual({ root: 2, suffix: "", bass: 6 });
    expect(parseChordName("C♯m7")).toEqual({ root: 1, suffix: "m7" });
    expect(parseChordName("H7")).toBeUndefined();
    expect(parseChordName("Cunknown")).toBeUndefined();
  });

  it("reverses transposition from the original spelling across all pitch classes", () => {
    for (const chord of ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]) {
      const original = parseChordPro(`{title: Sample}\n{artist: Writer}\n{key: C}\n[${chord}7/G]line`);
      const raised = deriveSongView(original, { transpose: 5, capo: 0 });
      const restored = deriveSongView(original, { transpose: 0, capo: 0 });
      expect(firstChordRaw(raised.document)).not.toBeUndefined();
      expect(firstChordRaw(restored.document)).toBe(firstChordRaw(original));
    }
  });

  it("separates displayed fingering from sounding pitch using the source capo", () => {
    const document = parseChordPro("{title: Sample}\n{artist: Writer}\n{key: C}\n{capo: 2}\n[C]line");
    expect(deriveSongView(document, { transpose: 0, capo: 2 })).toMatchObject({ displayKey: "C", soundingKey: "D" });
    expect(deriveSongView(document, { transpose: 0, capo: 0 })).toMatchObject({ displayKey: "D", soundingKey: "D" });
    expect(deriveSongView(document, { transpose: 2, capo: 4 })).toMatchObject({ displayKey: "C", soundingKey: "E" });
  });

  it("does not mutate the source and preserves enharmonic spelling for a zero interval", () => {
    const document = parseChordPro("{title: Sample}\n{artist: Writer}\n{key: Db}\n[Dbmaj7]line");
    const view = deriveSongView(document, { transpose: 0, capo: 0 });
    expect(view.document).not.toBe(document);
    expect(firstChordRaw(view.document)).toBe("Dbmaj7");
    expect(firstChordRaw(document)).toBe("Dbmaj7");
  });

  it("validates transpose and capo ranges", () => {
    const document = parseChordPro("{title: Sample}\n{artist: Writer}\n{key: C}");
    expect(() => deriveSongView(document, { transpose: 13, capo: 0 })).toThrow(RangeError);
    expect(() => deriveSongView(document, { transpose: 0, capo: 13 })).toThrow(RangeError);
  });
});
