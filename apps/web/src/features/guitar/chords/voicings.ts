import type { ParsedChord } from "../chordpro/types";

export interface Barre {
  fret: number;
  fromString: number;
  toString: number;
  finger: number;
}

export interface ChordVoicing {
  id: string;
  chordKey: string;
  frets: Array<number | null>;
  fingers?: Array<number | null>;
  baseFret: number;
  barre?: Barre[];
}

const TUNING_PITCHES = [4, 9, 2, 7, 11, 4]; // 6번 현부터 E2 A2 D3 G3 B3 E4
const QUALITIES = ["", "m", "7", "maj7", "m7"] as const;
const QUALITY_INTERVALS: Record<(typeof QUALITIES)[number], number[]> = {
  "": [0, 4, 7],
  m: [0, 3, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
};

const SHAPES: Record<(typeof QUALITIES)[number], { offsets: number[]; fingers: number[] }> = {
  "": { offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] },
  m: { offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] },
  "7": { offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] },
  maj7: { offsets: [0, 2, 1, 1, 0, 0], fingers: [1, 3, 2, 2, 1, 1] },
  m7: { offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] },
};

function mod12(value: number): number {
  return ((value % 12) + 12) % 12;
}

function buildVoicings(): Map<string, ChordVoicing> {
  const voicings = new Map<string, ChordVoicing>();
  for (let root = 0; root < 12; root += 1) {
    const rootFret = mod12(root - TUNING_PITCHES[0]);
    for (const quality of QUALITIES) {
      const shape = SHAPES[quality];
      const frets = shape.offsets.map((offset) => rootFret + offset);
      const hasBarre = rootFret > 0;
      voicings.set(`${root}:${quality}`, {
        id: `pc-${root}-${quality || "major"}`,
        chordKey: `${root}:${quality}`,
        frets,
        fingers: frets.map((fret, index) => fret === 0 ? null : shape.fingers[index]),
        baseFret: rootFret || 1,
        ...(hasBarre ? { barre: [{ fret: rootFret, fromString: 0, toString: 5, finger: 1 }] } : {}),
      });
    }
  }

  // Manually selected common open forms exercise mute/open strings alongside
  // the complete, movable E-shape voicing set.
  voicings.set("0:", {
    id: "c-major-open",
    chordKey: "0:",
    frets: [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
    baseFret: 1,
  });
  voicings.set("9:", {
    id: "a-major-open",
    chordKey: "9:",
    frets: [null, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
    baseFret: 1,
  });
  voicings.set("2:", {
    id: "d-major-open",
    chordKey: "2:",
    frets: [null, null, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
    baseFret: 1,
  });

  voicings.set("2/6", {
    id: "d-over-f-sharp",
    chordKey: "2/6",
    frets: [2, 0, 0, 2, 3, 2],
    fingers: [1, null, null, 2, 3, 4],
    baseFret: 1,
  });
  voicings.set("4/8", {
    id: "e-over-g-sharp",
    chordKey: "4/8",
    frets: [4, 2, 2, 1, 0, 0],
    fingers: [4, 2, 3, 1, null, null],
    baseFret: 1,
  });
  return voicings;
}

const VOICINGS = buildVoicings();

export function getChordVoicing(chord: ParsedChord): ChordVoicing | undefined {
  if (chord.bass !== undefined) return chord.suffix === "" ? VOICINGS.get(`${chord.root}/${chord.bass}`) : undefined;
  if (!(QUALITIES as readonly string[]).includes(chord.suffix)) return undefined;
  return VOICINGS.get(`${chord.root}:${chord.suffix}`);
}

export interface VoicingValidation {
  valid: boolean;
  errors: string[];
}

export function validateVoicing(voicing: ChordVoicing, capo = 0): VoicingValidation {
  const errors: string[] = [];
  if (voicing.frets.length !== 6) errors.push("frets must contain six strings");
  if (!Number.isInteger(voicing.baseFret) || voicing.baseFret < 1 || voicing.baseFret > 24) errors.push("baseFret is outside 1..24");
  if (!Number.isInteger(capo) || capo < 0 || capo > 12) errors.push("capo is outside 0..12");
  const [rootText] = voicing.chordKey.split(/[/:]/);
  const root = Number(rootText);
  if (!Number.isInteger(root) || root < 0 || root > 11) errors.push("root pitch class is invalid");
  for (const fret of voicing.frets) {
    if (fret !== null && (!Number.isInteger(fret) || fret < 0 || fret > 24)) errors.push("fret must be null or an integer in 0..24");
  }
  if (voicing.fingers && (voicing.fingers.length !== 6 || voicing.fingers.some((finger) => finger !== null && (!Number.isInteger(finger) || finger < 1 || finger > 4)))) {
    errors.push("fingers must contain six valid finger numbers or null");
  }
  for (const barre of voicing.barre ?? []) {
    if (barre.fret < 1 || barre.fromString < 0 || barre.toString > 5 || barre.fromString > barre.toString || barre.finger < 1 || barre.finger > 4) {
      errors.push("barre definition is invalid");
    }
  }
  if (errors.length) return { valid: false, errors };

  const [, bassText] = voicing.chordKey.split("/");
  const quality = bassText === undefined ? voicing.chordKey.slice(voicing.chordKey.indexOf(":") + 1) : "";
  const expected = QUALITY_INTERVALS[quality as (typeof QUALITIES)[number]];
  if (bassText === undefined && !expected) errors.push("chord quality is not verifiable");
  const notes = voicing.frets.flatMap((fret, index) => fret === null ? [] : [mod12(TUNING_PITCHES[index] + fret + capo)]);
  const noteSet = new Set(notes);
  if (expected && expected.some((interval) => !noteSet.has(mod12(root + interval + capo)))) {
    errors.push("voicing omits a required chord tone");
  }
  if (expected && notes.some((note) => !expected.some((interval) => mod12(root + interval + capo) === note))) {
    errors.push("voicing contains a non-chord tone");
  }
  if (bassText !== undefined) {
    const expectedBass = Number(bassText);
    const lowest = voicing.frets.findIndex((fret) => fret !== null);
    if (lowest < 0 || mod12(TUNING_PITCHES[lowest] + voicing.frets[lowest]! + capo) !== mod12(expectedBass + capo)) {
      errors.push("lowest sounding string does not match slash bass");
    }
    const majorTones = [root, mod12(root + 4), mod12(root + 7)];
    if (majorTones.some((tone) => !noteSet.has(mod12(tone + capo)))) errors.push("slash voicing omits a required major-triad tone");
    if (notes.some((note) => !majorTones.some((tone) => mod12(tone + capo) === note))) errors.push("slash voicing contains a non-major-triad tone");
  }
  return { valid: errors.length === 0, errors };
}

export function validateVoicingCatalog(): VoicingValidation {
  const errors: string[] = [];
  for (const voicing of VOICINGS.values()) {
    const result = validateVoicing(voicing);
    if (!result.valid) errors.push(`${voicing.id}: ${result.errors.join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}

export function getAllChordVoicings(): ChordVoicing[] {
  return [...VOICINGS.values()];
}
