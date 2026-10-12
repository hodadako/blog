import { describe, expect, it } from "vitest";
import { getAllChordVoicings, getChordVoicing, validateVoicing, validateVoicingCatalog } from "./voicings";
import { parseChordPro } from "../chordpro/parser";

function parseSingleChord(value: string) {
  const document = parseChordPro(`{title: Sample}\n{artist: Writer}\n{key: C}\n[${value}]`);
  const line = document.lines.find((item) => item.kind === "lyrics");
  if (line?.kind !== "lyrics" || line.segments[0]?.chord?.kind !== "chord") throw new Error("expected parsed chord");
  return line.segments[0].chord;
}

describe("Chord voicings", () => {
  it("provides a verified representative form for all 60 required root and quality pairs", () => {
    expect(getAllChordVoicings()).toHaveLength(62);
    expect(validateVoicingCatalog()).toEqual({ valid: true, errors: [] });
    for (let root = 0; root < 12; root += 1) {
      for (const suffix of ["", "m", "7", "maj7", "m7"]) {
        const chord = parseSingleChord(`${["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"][root]}${suffix}`);
        expect(getChordVoicing(chord)).toBeDefined();
      }
    }
  });

  it("validates open strings, muted strings, barres, and capo-relative notes", () => {
    const cMajor = getChordVoicing(parseSingleChord("C"));
    expect(cMajor?.frets).toContain(null);
    expect(cMajor?.frets).toContain(0);
    expect(cMajor && validateVoicing(cMajor, 2).valid).toBe(true);

    const fMajor = getChordVoicing(parseSingleChord("F"));
    expect(fMajor?.barre?.[0]).toMatchObject({ fret: 1, fromString: 0, toString: 5 });
    expect(fMajor && validateVoicing(fMajor).valid).toBe(true);
  });

  it("provides exact D/F# and E/G# bass voicings and an explicit fallback for other slash chords", () => {
    const dOverFSharp = getChordVoicing(parseSingleChord("D/F#"));
    const eOverGSharp = getChordVoicing(parseSingleChord("E/G#"));
    expect(dOverFSharp && validateVoicing(dOverFSharp).valid).toBe(true);
    expect(eOverGSharp && validateVoicing(eOverGSharp).valid).toBe(true);
    expect(getChordVoicing(parseSingleChord("C/G"))).toBeUndefined();
    expect(getChordVoicing(parseSingleChord("Dmaj7/F#"))).toBeUndefined();
  });

  it("rejects malformed fret arrays and barre definitions", () => {
    expect(validateVoicing({ id: "bad", chordKey: "0:", frets: [0, 0], baseFret: 0 }).valid).toBe(false);
  });
});
