import type { ChordProDocument, ChordToken } from "../chordpro/types";

const PITCHES: Record<string, number> = {
  C: 0,
  "C#": 1, Db: 1,
  D: 2,
  "D#": 3, Eb: 3,
  E: 4,
  F: 5, "E#": 5,
  "F#": 6, Gb: 6,
  G: 7,
  "G#": 8, Ab: 8,
  A: 9,
  "A#": 10, Bb: 10,
  B: 11, Cb: 11,
};

const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const SUPPORTED_SUFFIXES = new Set([
  "", "m", "5", "6", "m6", "6/9", "7", "maj7", "m7", "mMaj7", "9", "maj9", "m9",
  "11", "m11", "13", "m13", "sus", "sus2", "sus4", "7sus2", "7sus4", "add2", "add4",
  "add9", "madd9", "dim", "dim7", "aug", "+", "m7b5", "7b5", "7#5", "7b9", "7#9",
  "7(b9)", "7(#9)",
]);

function mod12(value: number): number {
  return ((value % 12) + 12) % 12;
}

function normalizeAccidentals(note: string): string {
  return note.replaceAll("♯", "#").replaceAll("♭", "b");
}

export function parsePitch(note: string): number | undefined {
  return PITCHES[normalizeAccidentals(note)];
}

export interface ParsedChordName {
  root: number;
  suffix: string;
  bass?: number;
}

export function parseChordName(value: string): ParsedChordName | undefined {
  const match = value.match(/^([A-G](?:#|b|♯|♭)?)(.*?)(?:\/([A-G](?:#|b|♯|♭)?))?$/);
  if (!match) return undefined;
  const [, rootName, suffix, bassName] = match;
  const root = parsePitch(rootName);
  const bass = bassName ? parsePitch(bassName) : undefined;
  if (root === undefined || (bassName && bass === undefined) || !SUPPORTED_SUFFIXES.has(suffix)) return undefined;
  return { root, suffix, ...(bass === undefined ? {} : { bass }) };
}

export function parseKey(value: string): { pitch: number; minor: boolean } | undefined {
  const match = value.match(/^([A-G](?:#|b|♯|♭)?)(m?)$/);
  if (!match) return undefined;
  const pitch = parsePitch(match[1]);
  return pitch === undefined ? undefined : { pitch, minor: match[2] === "m" };
}

function keyHasFlatSpelling(key: string, shift: number): boolean {
  const parsed = parseKey(key);
  if (!parsed) return false;
  const target = mod12(parsed.pitch + shift);
  // Prefer the enharmonic key with the smaller signature. Ties follow the
  // original spelling family; C/A minor are neutral and use sharps.
  const sharpKey = parsed.minor ? NOTE_NAMES_SHARP[target] + "m" : NOTE_NAMES_SHARP[target];
  const flatKey = parsed.minor ? NOTE_NAMES_FLAT[target] + "m" : NOTE_NAMES_FLAT[target];
  const sharpCounts: Record<string, number> = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7,
    Am: 0, Em: 1, Bm: 2, "F#m": 3, "C#m": 4, "G#m": 5, "D#m": 6, "A#m": 7,
  };
  const flatCounts: Record<string, number> = {
    C: 0, F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7,
    Am: 0, Dm: 1, Gm: 2, Cm: 3, Fm: 4, Bbm: 5, Ebm: 6, Abm: 7,
  };
  const sharpCount = sharpCounts[sharpKey] ?? 99;
  const flatCount = flatCounts[flatKey] ?? 99;
  if (sharpCount !== flatCount) return flatCount < sharpCount;
  const originalUsesFlat = /b|♭/.test(key);
  return originalUsesFlat;
}

export function spellPitch(pitch: number, key: string, shift: number): string {
  const names = keyHasFlatSpelling(key, shift) ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return names[mod12(pitch)];
}

export function transposeChordToken(token: ChordToken, key: string, shift: number): ChordToken {
  if (token.kind !== "chord" || shift % 12 === 0) return token;
  return {
    ...token,
    raw: `${spellPitch(mod12(token.root + shift), key, shift)}${token.suffix}${token.bass === undefined ? "" : `/${spellPitch(mod12(token.bass + shift), key, shift)}`}`,
    root: mod12(token.root + shift),
    ...(token.bass === undefined ? {} : { bass: mod12(token.bass + shift) }),
  };
}

export interface SongViewOptions {
  transpose: number;
  capo: number;
}

export interface DerivedSongView {
  document: ChordProDocument;
  displayKey?: string;
  soundingKey?: string;
  fingeringShift: number;
  soundingShift: number;
}

export function deriveSongView(document: ChordProDocument, options: SongViewOptions): DerivedSongView {
  const { transpose, capo } = options;
  if (!Number.isInteger(transpose) || transpose < -12 || transpose > 12) throw new RangeError("transpose는 -12~12 정수여야 합니다.");
  if (!Number.isInteger(capo) || capo < 0 || capo > 12) throw new RangeError("capo는 0~12 정수여야 합니다.");

  const sourceCapo = document.metadata.capo;
  const fingeringShift = sourceCapo + transpose - capo;
  const soundingShift = sourceCapo + transpose;
  const parsedKey = document.metadata.key ? parseKey(document.metadata.key) : undefined;
  const displayPitch = parsedKey ? mod12(parsedKey.pitch + fingeringShift) : undefined;
  const soundingPitch = parsedKey ? mod12(parsedKey.pitch + soundingShift) : undefined;
  const displayKey = parsedKey && displayPitch !== undefined
    ? `${spellPitch(displayPitch, document.metadata.key!, fingeringShift)}${parsedKey.minor ? "m" : ""}`
    : undefined;
  const soundingKey = parsedKey && soundingPitch !== undefined
    ? `${spellPitch(soundingPitch, document.metadata.key!, soundingShift)}${parsedKey.minor ? "m" : ""}`
    : undefined;

  const lines = document.lines.map((line) => line.kind !== "lyrics" ? line : {
    ...line,
    segments: line.segments.map((segment) => ({
      ...segment,
      ...(segment.chord ? { chord: transposeChordToken(segment.chord, document.metadata.key ?? "C", fingeringShift) } : {}),
    })),
  });

  return {
    document: { ...document, lines },
    ...(displayKey ? { displayKey } : {}),
    ...(soundingKey ? { soundingKey } : {}),
    fingeringShift,
    soundingShift,
  };
}
