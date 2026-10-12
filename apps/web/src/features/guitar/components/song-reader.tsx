"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ChordProDocument, LyricLine, ParsedChord } from "../chordpro/types";
import { deriveSongView } from "../chords/music";
import { getChordVoicing, type ChordVoicing } from "../chords/voicings";
import { useGuitarPreferences } from "../preferences/use-guitar-preferences";
import { useAutoScroll } from "../preferences/use-auto-scroll";
import styles from "@/app/guitar/guitar.module.css";

interface SongReaderProps {
  title: string;
  artist: string;
  keyName: string;
  sourceCapo: number;
  slug: string;
  document: ChordProDocument;
}

function Fretboard({ voicing, chordName }: { voicing: ChordVoicing; chordName: string }) {
  const xStart = 28;
  const xGap = 30;
  const yStart = 42;
  const fretGap = 42;
  const fretCount = 5;

  return (
    <svg aria-label={`${chordName} 운지법`} className={styles.diagram} role="img" viewBox="0 0 220 280">
      <title>{chordName} 운지법, 6번 현부터 표시</title>
      {Array.from({ length: 6 }, (_, index) => (
        <line key={`string-${index}`} x1={xStart + index * xGap} x2={xStart + index * xGap} y1={yStart} y2={yStart + fretCount * fretGap} stroke="currentColor" strokeWidth={index === 0 || index === 5 ? 2 : 1} />
      ))}
      {Array.from({ length: fretCount + 1 }, (_, index) => (
        <line key={`fret-${index}`} x1={xStart} x2={xStart + 5 * xGap} y1={yStart + index * fretGap} y2={yStart + index * fretGap} stroke="currentColor" strokeWidth={index === 0 && voicing.baseFret === 1 ? 4 : 1.5} />
      ))}
      {voicing.baseFret > 1 && <text x="5" y={yStart + 0.65 * fretGap} fill="currentColor" fontSize="15">{voicing.baseFret}fr</text>}
      {voicing.frets.map((fret, index) => {
        const x = xStart + index * xGap;
        if (fret === null) return <text key={`mute-${index}`} x={x} y={yStart - 12} fill="currentColor" fontSize="18" textAnchor="middle">×</text>;
        if (fret === 0) return <circle key={`open-${index}`} cx={x} cy={yStart - 12} r="5" fill="none" stroke="currentColor" strokeWidth="2" />;
        if (voicing.barre?.some((barre) => barre.fret === fret && index >= barre.fromString && index <= barre.toString)) return null;
        const relative = fret - voicing.baseFret;
        const y = yStart + (relative + 0.5) * fretGap;
        return (
          <g key={`finger-${index}`}>
            <circle cx={x} cy={y} r="10" fill="currentColor" />
            {voicing.fingers?.[index] && <text x={x} y={y + 4} fill="var(--color-bg)" fontSize="10" fontWeight="700" textAnchor="middle">{voicing.fingers[index]}</text>}
          </g>
        );
      })}
      {voicing.barre?.map((barre, index) => {
        const y = yStart + (barre.fret - voicing.baseFret + 0.5) * fretGap;
        return <rect key={`barre-${index}`} x={xStart + barre.fromString * xGap - 9} y={y - 7} width={(barre.toString - barre.fromString) * xGap + 18} height="14" rx="7" fill="currentColor" />;
      })}
    </svg>
  );
}

function ChordControl({ chord, onOpen }: { chord: ParsedChord; onOpen: (chord: ParsedChord, voicing: ChordVoicing | undefined, trigger: HTMLButtonElement) => void }) {
  const voicing = getChordVoicing(chord);
  const label = voicing ? `${chord.raw} 운지법 보기` : `${chord.raw}, 등록된 운지법 없음`;
  return (
    <button aria-label={label} className={styles.chordButton} onClick={(event) => onOpen(chord, voicing, event.currentTarget)} type="button">
      {chord.raw}
    </button>
  );
}

function LyricRow({ line, onOpen }: { line: LyricLine; onOpen: (chord: ParsedChord, voicing: ChordVoicing | undefined, trigger: HTMLButtonElement) => void }) {
  return (
    <p className={styles.lyricLine}>
      {line.segments.map((segment, index) => {
        let chordContent: ReactNode = null;
        if (segment.chord?.kind === "chord") chordContent = <ChordControl chord={segment.chord} onOpen={onOpen} />;
        else if (segment.chord?.kind === "unsupported-chord") chordContent = <span aria-label={`${segment.chord.raw}, 미지원 코드`} className={styles.chordFallback}>{segment.chord.raw}</span>;
        else if (segment.chord?.kind === "annotation") chordContent = <span className={styles.chordFallback}>({segment.chord.raw})</span>;

        return (
          <span className={styles.lyricSegment} key={`segment-${index}`}>
            <span className={styles.chordCell}>{chordContent}</span>
            <span>{segment.text || "\u00a0"}</span>
          </span>
        );
      })}
    </p>
  );
}

export function SongReader({ title, artist, keyName, sourceCapo, slug, document }: SongReaderProps) {
  const preferences = useGuitarPreferences(slug, sourceCapo);
  const { transpose, capo, fontSize, scrollSpeed, ready } = preferences;
  const scroll = useAutoScroll(scrollSpeed, ready);
  const [selectedChord, setSelectedChord] = useState<ParsedChord | null>(null);
  const [selectedVoicing, setSelectedVoicing] = useState<ChordVoicing | undefined>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const view = useMemo(() => deriveSongView(document, { transpose, capo }), [document, transpose, capo]);

  const openChord = (chord: ParsedChord, voicing: ChordVoicing | undefined, trigger: HTMLButtonElement): void => {
    scroll.pause();
    setSelectedChord(chord);
    setSelectedVoicing(voicing);
    triggerRef.current = trigger;
    dialogRef.current?.showModal();
  };

  const closeDialog = (): void => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger) window.setTimeout(() => trigger.focus({ preventScroll: true }), 0);
  };

  let previousSection: string | undefined;
  const warningDiagnostics = document.diagnostics.filter(({ severity }) => severity === "warning");

  return (
    <article>
      <header>
        <p>{artist} · 코드 악보</p>
        <h1>{title}</h1>
      </header>

      <section aria-label="악보 조작" className={styles.toolbar}>
        <div className={styles.controlGroup}>
          <span>조옮김</span>
          <div className={styles.buttonRow}>
            <button aria-label="한 음 낮추기" disabled={!ready || transpose <= -12} onClick={() => preferences.setTranspose(transpose - 1)} type="button">−</button>
            <button aria-label="조옮김 원복" disabled={!ready || transpose === 0} onClick={() => preferences.setTranspose(0)} type="button">원복</button>
            <button aria-label="한 음 높이기" disabled={!ready || transpose >= 12} onClick={() => preferences.setTranspose(transpose + 1)} type="button">＋</button>
          </div>
        </div>
        <label className={styles.controlGroup}>
          <span>카포 위치</span>
          <select aria-label="카포 위치" disabled={!ready} onChange={(event) => preferences.setCapo(Number(event.currentTarget.value))} value={capo}>
            {Array.from({ length: 13 }, (_, fret) => <option key={fret} value={fret}>{fret === 0 ? "카포 없음" : `${fret}프렛`}</option>)}
          </select>
        </label>
        <div className={styles.controlGroup}>
          <span>악보 글자 크기</span>
          <div className={styles.buttonRow}>
            <button aria-label="글자 작게" disabled={!ready || fontSize <= 14} onClick={() => preferences.setFontSize(fontSize - 2)} type="button">A−</button>
            <span className={styles.controlValue}>{fontSize}px</span>
            <button aria-label="글자 크게" disabled={!ready || fontSize >= 28} onClick={() => preferences.setFontSize(fontSize + 2)} type="button">A＋</button>
          </div>
        </div>
        <label className={styles.controlGroup}>
          <span>자동 스크롤 속도</span>
          <select aria-label="자동 스크롤 속도" disabled={!ready} onChange={(event) => preferences.setScrollSpeed(Number(event.currentTarget.value))} value={scrollSpeed}>
            {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </select>
        </label>
        <button aria-pressed={scroll.running} className={styles.readerButton} disabled={!ready} onClick={scroll.toggle} type="button">
          {scroll.running ? "자동 스크롤 일시정지" : "자동 스크롤 시작 / 재개"}
        </button>
        <button className={styles.readerButton} disabled={!ready} onClick={preferences.resetSong} type="button">곡 설정 초기화</button>
        <p aria-live="polite" className={styles.pitchSummary}>
          운지 조성 {view.displayKey ?? keyName} · 실음 조성 {view.soundingKey ?? keyName} · 원본 카포 {sourceCapo}프렛 · 조옮김 {transpose > 0 ? `+${transpose}` : transpose} · 자동 스크롤 {scrollSpeed * 5}px/s
        </p>
      </section>

      {warningDiagnostics.length > 0 && (
        <aside className={styles.warning} role="status">
          일부 표기를 그대로 표시합니다: {warningDiagnostics.map(({ message }) => message).join(" · ")}
        </aside>
      )}

      <section aria-label={`${title} 코드 악보`} className={styles.songSheet} style={{ "--song-font-size": `${fontSize}px` } as CSSProperties}>
        {view.document.lines.map((line, index) => {
          if (line.kind === "source-comment") return null;
          if (line.kind === "blank") return <div aria-hidden="true" className={styles.blankLine} key={`blank-${index}`} />;
          if (line.kind === "performance-comment") return <p className={styles.performanceComment} key={`comment-${index}`}>{line.text}</p>;
          if (line.kind === "unsupported-directive") return <p className={styles.unsupportedLine} key={`unsupported-${index}`}>미지원 지시어: {line.raw}</p>;
          const heading = line.section && line.section !== previousSection ? line.section : undefined;
          previousSection = line.section;
          return (
            <div key={`line-${index}`}>
              {heading && <h2 className={styles.sectionHeading}>{heading}</h2>}
              <LyricRow line={line} onOpen={openChord} />
            </div>
          );
        })}
      </section>

      <dialog
        aria-labelledby="guitar-chord-dialog-title"
        className={styles.dialog}
        onClose={closeDialog}
        ref={dialogRef}
      >
        <div className={styles.dialogHeader}>
          <h2 id="guitar-chord-dialog-title">{selectedChord?.raw ?? "코드 운지법"}</h2>
          <button aria-label="운지법 닫기" className={styles.readerButton} onClick={() => dialogRef.current?.close()} type="button">닫기</button>
        </div>
        {selectedVoicing ? (
          <Fretboard chordName={selectedChord?.raw ?? "코드"} voicing={selectedVoicing} />
        ) : (
          <p className={styles.dialogCopy}>등록된 운지법이 없습니다. 코드 표기는 악보에 그대로 표시됩니다.</p>
        )}
        {selectedVoicing && <p className={styles.dialogCopy}>6번 현에서 1번 현 순서입니다. 카포는 새 너트로 보고 표시한 프렛부터 셉니다.</p>}
      </dialog>
      <div aria-hidden="true" className={styles.scrollSpace} />
    </article>
  );
}
