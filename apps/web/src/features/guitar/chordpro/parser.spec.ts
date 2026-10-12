import { describe, expect, it } from "vitest";
import { hasPublishErrors, parseChordPro } from "./parser";

const base = "{title: Sample}\n{artist: Writer}\n{key: C}\n{meta: added 2026-10-09}\n";

describe("parseChordPro", () => {
  it("parses metadata, sections, chords, annotations, comments, and original whitespace", () => {
    const document = parseChordPro(`${base}\n# source note\n{start_of_chorus: label=\"Hook\"}\n[C][G]한글  lyric [*hold] tail\n{comment: 천천히}\n{end_of_chorus}`);
    expect(hasPublishErrors(document)).toBe(false);
    expect(document.metadata).toMatchObject({ title: "Sample", artist: "Writer", key: "C", capo: 0, added: "2026-10-09" });
    const lyric = document.lines.find((line) => line.kind === "lyrics");
    expect(lyric?.kind).toBe("lyrics");
    if (lyric?.kind !== "lyrics") return;
    expect(lyric.section).toBe("Hook");
    expect(lyric.segments.map(({ chord }) => chord?.raw ?? null)).toContain("C");
    expect(lyric.segments.map(({ chord }) => chord?.raw ?? null)).toContain("G");
    expect(lyric.segments.map(({ text }) => text).join("")).toContain("한글  lyric ");
    expect(lyric.segments.find(({ chord }) => chord?.kind === "annotation")?.chord?.raw).toBe("hold");
    expect(document.lines.some((line) => line.kind === "source-comment")).toBe(true);
    expect(document.lines.some((line) => line.kind === "performance-comment")).toBe(true);
  });

  it("rejects malformed chords, late settings, invalid metadata, and music-changing directives", () => {
    const document = parseChordPro(`${base}{capo: 13}\n{meta: updated 2026-99-30}\n[C\n{transpose: 2}\n[G]verse\n{key: D}`);
    expect(hasPublishErrors(document)).toBe(true);
    expect(document.diagnostics.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "invalid-capo", "invalid-date", "unclosed-chord", "unsupported-directive", "late-song-setting",
    ]));
  });

  it("warns and preserves unknown chords and directives", () => {
    const document = parseChordPro(`${base}{unknown: value}\n[H13]unknown`);
    expect(hasPublishErrors(document)).toBe(false);
    expect(document.diagnostics.filter(({ severity }) => severity === "warning")).toHaveLength(2);
  });

  it("preserves No Chord rests and their character anchors without unsupported warnings", () => {
    const document = parseChordPro(`${base}[N.C.]쉼  [D/F#]다음[N.C.]尾`);
    const line = document.lines.find((item) => item.kind === "lyrics");
    if (line?.kind !== "lyrics") throw new Error("Missing lyric row");
    expect(line.segments.map(({text}) => text).join("")).toBe("쉼  다음尾");
    expect(line.segments.map(({chord}) => chord?.kind)).toEqual(["no-chord", "chord", "no-chord"]);
    expect(line.segments[0].chord?.location.column).toBe(1);
    expect(document.diagnostics).toEqual([]);
  });

  it("detects unclosed and nested sections", () => {
    const document = parseChordPro(`${base}{sov}\n{soc}\ntext`);
    expect(document.diagnostics.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "nested-section", "unclosed-section",
    ]));
  });

  it("rejects a closing directive for a different section type", () => {
    const document = parseChordPro(`${base}{soc}\ntext\n{eov}`);
    expect(document.diagnostics.some(({ code }) => code === "mismatched-section-end")).toBe(true);
  });
});
