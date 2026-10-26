"use client";

import type { ParsedChord } from "../chordpro/types";
import { getChordVoicing, type ChordVoicing } from "../chords/voicings";
import styles from "@/app/guitar/guitar.module.css";

export type OpenChord = (
  chord: ParsedChord,
  voicing: ChordVoicing,
  trigger: HTMLButtonElement,
) => void;

export function ChordControl({
  chord,
  onOpen,
}: {
  chord: ParsedChord;
  onOpen: OpenChord;
}) {
  const voicing = getChordVoicing(chord);
  if (!voicing) return <span className={styles.chordText}>{chord.raw}</span>;
  return (
    <button
      aria-label={`${chord.raw} 운지법 보기`}
      className={styles.chordButton}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse")
          onOpen(chord, voicing, event.currentTarget);
      }}
      onFocus={(event) => onOpen(chord, voicing, event.currentTarget)}
      onClick={(event) => onOpen(chord, voicing, event.currentTarget)}
      type="button"
    >
      {chord.raw}
    </button>
  );
}
