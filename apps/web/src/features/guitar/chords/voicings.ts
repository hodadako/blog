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

// Standard-tuning shapes used by the current score. Frets are relative to capo.
const SCORE_SLASH_FORMS: Record<string, Array<number | null>> = {
  "5:/9": [null, 0, 3, 2, 1, 1],
  "5:/0": [null, 3, 3, 2, 1, 1],
  "10:/2": [null, null, 0, 3, 3, 1],
  "0:/4": [0, 3, 2, 0, 1, 0],
  "9:/1": [null, 4, 2, 2, 2, 0],
  "2:m/1": [null, 4, 3, 2, 3, null],
};

const EXTENDED_INTERVALS: Record<string, number[]> = {
  ...QUALITY_INTERVALS, "5": [0, 7], "6": [0, 4, 7, 9], m6: [0, 3, 7, 9],
  "6/9": [0, 4, 7, 9, 2], mMaj7: [0, 3, 7, 11], "9": [0, 4, 7, 10, 2],
  maj9: [0, 4, 7, 11, 2], m9: [0, 3, 7, 10, 2], "11": [0, 4, 7, 10, 2, 5],
  m11: [0, 3, 7, 10, 2, 5], "13": [0, 4, 7, 10, 2, 9], m13: [0, 3, 7, 10, 2, 9],
  sus: [0, 5, 7], sus2: [0, 2, 7], sus4: [0, 5, 7], "7sus2": [0, 2, 7, 10], "7sus4": [0, 5, 7, 10],
  add2: [0, 2, 4, 7], add4: [0, 4, 5, 7], add9: [0, 4, 7, 2], madd9: [0, 3, 7, 2],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], aug: [0, 4, 8], "+": [0, 4, 8],
  m7b5: [0, 3, 6, 10], "7b5": [0, 4, 6, 10], "7#5": [0, 4, 8, 10],
  "7b9": [0, 4, 7, 10, 1], "7(b9)": [0, 4, 7, 10, 1], "7#9": [0, 4, 7, 10, 3], "7(#9)": [0, 4, 7, 10, 3],
};

const generated = new Map<string, ChordVoicing | undefined>();
const TUNING_MIDI = [40, 45, 50, 55, 59, 64];

function voicingKey(chord: ParsedChord): string {
  return `${chord.root}:${chord.suffix}${chord.bass === undefined ? "" : `/bass:${chord.bass}`}`;
}

function createVoicing(chord: ParsedChord): ChordVoicing | undefined {
  const intervals = EXTENDED_INTERVALS[chord.suffix];
  if (!intervals) return undefined;
  const required = new Set(intervals.map(i => mod12(chord.root + i)));
  const allowed = new Set([...required, ...(chord.bass === undefined ? [] : [chord.bass])]);
  const curated = SCORE_SLASH_FORMS[`${chord.root}:${chord.suffix}/${chord.bass}`];
  if (curated) return {
    id: `score-${voicingKey(chord)}`, chordKey: voicingKey(chord), frets: curated,
    baseFret: Math.min(...curated.filter((n): n is number => n !== null && n > 0)),
  };
  let best: ChordVoicing | undefined;
  let bestCost = Infinity;
  // Bounded search for a compact, four-finger form. Every named tone must occur;
  // no missing-tone or slash-bass substitutions are presented as exact matches.
  for (let base = 1; base <= 12; base++) {
    const choices = TUNING_PITCHES.map(tuning => [null, ...Array.from({length: 16}, (_, n) => n)
      .filter(fret => (fret === 0 || (fret >= base && fret < base + 4)) && allowed.has(mod12(tuning + fret)))]);
    const visit = (frets: Array<number | null>, notes: number[], fingers: number): void => {
      if (fingers > 4) return;
      const index = frets.length;
      if (index === 6) {
        if (notes.length < Math.max(3, allowed.size)) return;
        if ([...required].some(note => !notes.some(midi => mod12(midi) === note))) return;
        if (mod12(Math.min(...notes)) !== (chord.bass ?? chord.root)) return;
        const positive = frets.filter((n): n is number => n !== null && n > 0);
        const cost = (positive.length ? Math.max(...positive) : 0) * 3 + (6-notes.length) * 4 + fingers;
        if (cost >= bestCost) return;
        bestCost = cost;
        best = { id: `generated-${voicingKey(chord)}`, chordKey: voicingKey(chord), frets: [...frets], baseFret: positive.length ? Math.min(...positive) : 1 };
        return;
      }
      for (const fret of choices[index]) {
        visit([...frets, fret], fret === null ? notes : [...notes, TUNING_MIDI[index] + fret], fingers + Number(fret !== null && fret > 0));
      }
    };
    visit([], [], 0);
  }
  return best;
}

export function getChordVoicing(chord: ParsedChord): ChordVoicing | undefined {
  const existing = chord.bass === undefined ? VOICINGS.get(`${chord.root}:${chord.suffix}`)
    : chord.suffix === "" ? VOICINGS.get(`${chord.root}/${chord.bass}`) : undefined;
  if (existing) return existing;
  const key = voicingKey(chord);
  if (!generated.has(key)) {
    const candidate = createVoicing(chord);
    generated.set(key, candidate && validateVoicing(candidate).valid ? candidate : undefined);
  }
  return generated.get(key);
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

  const legacySlash = voicing.chordKey.match(/^\d+\/(\d+)$/);
  const bassText = legacySlash?.[1] ?? voicing.chordKey.split("/bass:")[1];
  const quality = legacySlash ? "" : voicing.chordKey.slice(voicing.chordKey.indexOf(":") + 1).split("/bass:")[0];
  const expected = EXTENDED_INTERVALS[quality];
  if (bassText === undefined && !expected) errors.push("chord quality is not verifiable");
  const notes = voicing.frets.flatMap((fret, index) => fret === null ? [] : [mod12(TUNING_PITCHES[index] + fret + capo)]);
  const noteSet = new Set(notes);
  if (expected && expected.some((interval) => !noteSet.has(mod12(root + interval + capo)))) {
    errors.push("voicing omits a required chord tone");
  }
  if (expected && notes.some((note) => !expected.some((interval) => mod12(root + interval + capo) === note) && (bassText === undefined || note !== mod12(Number(bassText) + capo)))) {
    errors.push("voicing contains a non-chord tone");
  }
  if (bassText !== undefined) {
    const expectedBass = Number(bassText);
    const midi = voicing.frets.flatMap((fret,index) => fret === null ? [] : [TUNING_MIDI[index] + fret + capo]);
    if (!midi.length || mod12(Math.min(...midi)) !== mod12(expectedBass + capo)) {
      errors.push("lowest sounding string does not match slash bass");
    }
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
