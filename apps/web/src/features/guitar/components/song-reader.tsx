"use client";

import {Button, IconButton, ToggleButton, Input, Select, TextLink} from "@/components/ui";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ChordProDocument, LyricLine, ParsedChord } from "../chordpro/types";
import { deriveSongView, parseKey } from "../chords/music";
import { getChordVoicing, type ChordVoicing } from "../chords/voicings";
import { useGuitarPreferences } from "../preferences/use-guitar-preferences";
import { useAutoScroll } from "../preferences/use-auto-scroll";
import { coverUrl, readCoverPresets, writeCoverPresets, type CoverPreset } from "../preferences/cover-presets";
import type { LyricMode, SongReadings } from "../chordpro/readings";
import styles from "@/app/guitar/guitar.module.css";

interface SongReaderProps {
  title: string;
  artist: string;
  keyName: string;
  sourceCapo: number;
  slug: string;
  document: ChordProDocument;
  backHref?: string;
  readings?: SongReadings;
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

type OpenChord = (chord: ParsedChord, voicing: ChordVoicing, trigger: HTMLButtonElement) => void;

function ChordControl({ chord, onOpen }: { chord: ParsedChord; onOpen: OpenChord }) {
  const voicing = getChordVoicing(chord);
  if (!voicing) return <span className={styles.chordText}>{chord.raw}</span>;
  return (
    <button aria-label={`${chord.raw} 운지법 보기`} className={styles.chordButton}
      onPointerEnter={event => { if (event.pointerType === "mouse") onOpen(chord, voicing, event.currentTarget); }}
      onFocus={event => onOpen(chord, voicing, event.currentTarget)}
      onClick={(event) => onOpen(chord, voicing, event.currentTarget)} type="button">
      {chord.raw}
    </button>
  );
}

function LyricRow({ line, onOpen, mode, readings }: { line: LyricLine; onOpen: OpenChord; mode: LyricMode; readings?: SongReadings }) {
  return (
    <p className={styles.lyricLine} data-has-lyrics={line.segments.some(({text}) => text.trim().length > 0)} data-source-line={line.location.line}>
      {line.segments.map((segment, index) => {
        let chordContent: ReactNode = null;
        if (segment.chord?.kind === "chord") chordContent = <ChordControl chord={segment.chord} onOpen={onOpen} />;
        else if (segment.chord?.kind === "unsupported-chord") chordContent = <span aria-label={`${segment.chord.raw}, 미지원 코드`} className={styles.chordFallback}>{segment.chord.raw}</span>;
        else if (segment.chord?.kind === "annotation") chordContent = <span className={styles.chordFallback}>({segment.chord.raw})</span>;
        else if (segment.chord?.kind === "no-chord") chordContent = <span aria-label="No Chord, 연주 쉼" className={styles.chordFallback}>{segment.chord.raw}</span>;

        return (
          <span className={styles.lyricSegment} data-chord-kind={segment.chord?.kind} data-source-column={segment.chord?.location.column} key={`segment-${index}`}>
            <span className={styles.chordCell}>{chordContent}</span>
            <span className={styles.lyricText} lang={mode === "korean" ? "ko" : mode === "romaji" ? "ja-Latn" : readings ? "ja" : undefined}>{
              mode === "romaji" || mode === "korean" ? readings?.segments[segment.text]?.[mode] ?? segment.text : segment.text
            }</span>
          </span>
        );
      })}
    </p>
  );
}

export function SongReader({ title, artist, keyName, sourceCapo, slug, document, backHref, readings }: SongReaderProps) {
  const preferences = useGuitarPreferences(slug, sourceCapo);
  const { transpose, capo, fontSize, scrollSpeed, ready } = preferences;
  const scroll = useAutoScroll(scrollSpeed, ready);
  const [selectedChord, setSelectedChord] = useState<ParsedChord | null>(null);
  const [selectedVoicing, setSelectedVoicing] = useState<ChordVoicing | undefined>();
  const sheetRef = useRef<HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lyricMode, setLyricMode] = useState<LyricMode>("original");
  const [presets, setPresets] = useState<CoverPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presetUrl, setPresetUrl] = useState("");
  const [presetNotice, setPresetNotice] = useState("");
  const settingsId = useId();
  const view = useMemo(() => deriveSongView(document, { transpose, capo }), [document, transpose, capo]);

  useEffect(() => { setPresets(readCoverPresets(slug)); setPresetNotice(""); setLyricMode("original"); }, [slug]);
  useEffect(() => { setSelectedChord(null); setSelectedVoicing(undefined); }, [transpose, capo, slug]);

  const openChord: OpenChord = (chord, voicing) => {
    setSelectedChord(chord);
    setSelectedVoicing(voicing);
  };

  const savePreset = (): void => {
    if (!presetName.trim()) { setPresetNotice("커버 이름을 입력해 주세요."); return; }
    if (presetUrl.trim() && !coverUrl(presetUrl)) { setPresetNotice("http 또는 https 커버 주소를 입력해 주세요."); return; }
    if (presets.length >= 20) { setPresetNotice("곡마다 20개까지 저장할 수 있습니다."); return; }
    const next = [...presets, {id: crypto.randomUUID(), name: presetName.trim(), url: coverUrl(presetUrl), transpose, capo, soundingKey: view.soundingKey ?? keyName}];
    if (!writeCoverPresets(slug, next)) { setPresetNotice("브라우저 저장이 차단되어 프리셋을 저장하지 못했습니다."); return; }
    setPresets(next); setPresetName(""); setPresetUrl(""); setPresetNotice("이 브라우저에 커버 설정을 저장했습니다.");
  };

  const applyPreset = (preset: CoverPreset): void => {
    const source = parseKey(keyName), target = parseKey(preset.soundingKey);
    if (source && target && source.minor !== target.minor) { setPresetNotice("원곡의 장·단조가 바뀌어 이 프리셋을 적용할 수 없습니다."); return; }
    const stillMatches = source && target && ((source.pitch + sourceCapo + preset.transpose) % 12 + 12) % 12 === target.pitch;
    const shift = stillMatches || !source || !target ? preset.transpose : ((target.pitch-source.pitch-sourceCapo+30)%12)-6;
    preferences.setTranspose(shift); preferences.setCapo(preset.capo);
    setPresetNotice(`${preset.name} 적용: 실음 ${preset.soundingKey}, 카포 ${preset.capo}프렛`);
  };

  let previousSection: string | undefined;
  let bodyStarted = false;
  let lastLine = view.document.lines.length - 1;
  while (lastLine >= 0 && ["blank", "source-comment"].includes(view.document.lines[lastLine].kind)) lastLine--;
  const warnings = [...new Set(document.diagnostics
    .filter(({severity, code}) => severity === "warning" && (code === "unsupported-chord" || code === "unsupported-directive"))
    .map(({message}) => message))];

  return (
    <article className={styles.reader} onKeyDown={event => { if (event.key === "Escape") { setSelectedChord(null); setSelectedVoicing(undefined); } }}>

      <aside aria-label="악보 설정" className={styles.settingsRail}>
        <h2 className={styles.railTitle}>악보 설정</h2>
        <Button variant="ghost" size="sm" aria-controls={settingsId} aria-expanded={settingsOpen} className={styles.settingsToggle} onClick={() => setSettingsOpen(!settingsOpen)} type="button">악보 설정 <span>{settingsOpen ? "접기" : "열기"}</span></Button>
        <div className={styles.settingsFields} data-open={settingsOpen} id={settingsId}>
        <div className={styles.controlGroup}>
          <span>조옮김 · 실음 {view.soundingKey ?? keyName}</span>
          <div aria-label="조옮김" className={styles.buttonRow}>
            <IconButton variant="secondary" aria-label="한 음 낮추기" disabled={!ready || transpose <= -12} onClick={() => preferences.setTranspose(transpose - 1)} type="button">−</IconButton>
            <Button variant="secondary" size="sm" aria-label={`조옮김 원복 (현재 ${transpose > 0 ? `+${transpose}` : transpose})`} disabled={!ready || transpose === 0} onClick={() => preferences.setTranspose(0)} type="button">{transpose > 0 ? `+${transpose}` : transpose}</Button>
            <IconButton variant="secondary" aria-label="한 음 높이기" disabled={!ready || transpose >= 12} onClick={() => preferences.setTranspose(transpose + 1)} type="button">＋</IconButton>
          </div>
        </div>
        <ToggleButton variant="secondary" size="sm" aria-label={scroll.running ? "자동 스크롤 일시정지" : "자동 스크롤 시작 / 재개"} pressed={scroll.running} disabled={!ready} onClick={scroll.toggle} type="button">
          {scroll.running ? "스크롤 정지" : "스크롤 시작"}
        </ToggleButton>
        <label className={styles.controlGroup}>
          <span>카포 위치</span>
          <Select appearance="outline" density="compact" aria-label="카포 위치" disabled={!ready} onChange={(event) => preferences.setCapo(Number(event.currentTarget.value))} value={capo}>
            {Array.from({ length: 13 }, (_, fret) => <option key={fret} value={fret}>{fret === 0 ? "카포 없음" : `${fret}프렛`}</option>)}
          </Select>
        </label>
        {readings && <label className={styles.controlGroup}>
          <span>가사 표기</span>
          <Select appearance="outline" density="compact" aria-label="가사 표기" onChange={event => setLyricMode(event.currentTarget.value as LyricMode)} value={lyricMode}>
            <option value="original">원문</option><option value="romaji">Romaji</option><option value="english">English · 영어 뜻</option><option value="korean">한글 발음</option>
          </Select>
          <small className={styles.dialogCopy}>{lyricMode === "english" ? "영어 뜻은 원문 아래에 표시합니다." : "발음은 연주를 위한 참고 표기입니다."}</small>
        </label>}
        <div className={styles.controlGroup}>
          <span>악보 글자 크기</span>
          <div className={styles.buttonRow}>
            <IconButton variant="secondary" aria-label="글자 작게" disabled={!ready || fontSize <= 14} onClick={() => preferences.setFontSize(fontSize - 2)} type="button">A−</IconButton>
            <span className={styles.controlValue}>{fontSize}px</span>
            <IconButton variant="secondary" aria-label="글자 크게" disabled={!ready || fontSize >= 28} onClick={() => preferences.setFontSize(fontSize + 2)} type="button">A＋</IconButton>
          </div>
        </div>
        <label className={styles.controlGroup}>
          <span>자동 스크롤 속도</span>
          <Select appearance="outline" density="compact" aria-label="자동 스크롤 속도" disabled={!ready} onChange={(event) => preferences.setScrollSpeed(Number(event.currentTarget.value))} value={scrollSpeed}>
            {Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
          </Select>
        </label>
        <Button variant="secondary" size="sm" disabled={!ready} onClick={preferences.resetSong} type="button">곡 설정 초기화</Button>
        <p aria-live="polite" className={styles.pitchSummary}>
          운지 조성 {view.displayKey ?? keyName} · 실음 조성 {view.soundingKey ?? keyName} · 원본 카포 {sourceCapo}프렛 · 조옮김 {transpose > 0 ? `+${transpose}` : transpose} · 자동 스크롤 {scrollSpeed * 5}px/s
        </p>
        <section className={styles.presetSection} aria-label="내 커버 프리셋">
          <h3>내 커버 프리셋</h3>
          <label className={styles.controlGroup}><span>커버 이름</span><Input appearance="outline" density="compact" maxLength={80} value={presetName} onChange={e => setPresetName(e.currentTarget.value)} placeholder="예: 어쿠스틱 커버" /></label>
          <label className={styles.controlGroup}><span>커버 URL · 선택</span><Input appearance="outline" density="compact" type="url" maxLength={1000} value={presetUrl} onChange={e => setPresetUrl(e.currentTarget.value)} placeholder="https://…" /></label>
          <Button variant="secondary" size="sm" disabled={!ready} onClick={savePreset} type="button">현재 키·카포 저장</Button>
          <p className={styles.dialogCopy}>이 브라우저에만 저장됩니다.</p>
          {presets.map(preset => <div className={styles.presetItem} key={preset.id}>
            <Button variant="secondary" size="sm" className={styles.presetApply} onClick={() => applyPreset(preset)} type="button">{preset.name}<small>{preset.soundingKey} · 카포 {preset.capo}</small></Button>
            <div className={styles.presetActions}>{preset.url && <TextLink href={preset.url} target="_blank" rel="noopener noreferrer">커버</TextLink>}
              <Button variant="destructive" size="sm" aria-label={`${preset.name} 프리셋 삭제`} onClick={() => {
                const next = presets.filter(p => p.id !== preset.id);
                if (writeCoverPresets(slug, next)) { setPresets(next); setPresetNotice("프리셋을 삭제했습니다."); }
                else setPresetNotice("브라우저 저장이 차단되어 삭제하지 못했습니다.");
              }} type="button">삭제</Button>
            </div>
          </div>)}
          <p role="status" className={styles.dialogCopy}>{presetNotice}</p>
        </section>
        </div>
      </aside>
      <div className={styles.readingColumn}>
      <header className={styles.songHeader}>
        {backHref && <TextLink className={styles.backLink} href={backHref}>Songs</TextLink>}
        <h1 className={`article-title ${styles.songHeading}`}>{title}</h1>
        <p className={styles.artist}>{artist}</p>
        <p className={styles.sourceMeta}>기본 운지 조성 {keyName} · 원본 카포 {sourceCapo}프렛</p>
      </header>

      <section aria-label={`${title} 코드 악보, 긴 행은 가로로 스크롤할 수 있습니다`} tabIndex={0} ref={sheetRef} className={styles.songSheet} style={{ "--song-font-size": `${fontSize}px` } as CSSProperties}>
        {view.document.lines.map((line, index) => {
          if (index > lastLine || line.kind === "source-comment") return null;
          if (line.kind === "blank") return bodyStarted ? <div aria-hidden="true" className={styles.blankLine} key={`blank-${index}`} /> : null;
          bodyStarted = true;
          if (line.kind === "performance-comment") return <p className={styles.performanceComment} key={`comment-${index}`}>{line.text}</p>;
          if (line.kind === "unsupported-directive") return <p className={styles.unsupportedLine} key={`unsupported-${index}`}>미지원 지시어: {line.raw}</p>;
          const heading = line.section && line.section !== previousSection ? line.section : undefined;
          previousSection = line.section;
          const english = lyricMode === "english" ? readings?.english[line.segments.map(s => s.text).join("")] : undefined;
          return <div key={`line-${index}`}>
            {heading && <h2 className={styles.sectionHeading}>{heading}</h2>}
            <LyricRow line={line} onOpen={openChord} mode={lyricMode} readings={readings} />
            {english && <p className={styles.translation} lang="en">{english}</p>}
          </div>;
        })}
      </section>
      {warnings.length > 0 && <details className={styles.warning}><summary>일부 원문 표기 안내</summary><ul>{warnings.map((message) => <li key={message}>{message}</li>)}</ul></details>}
      </div>

      <aside aria-label="코드 운지법" className={styles.chordInspector} data-active={Boolean(selectedVoicing)}>
        <div className={styles.dialogHeader}>
          <h2 aria-live="polite">{selectedChord?.raw ?? "코드 운지법"}</h2>
          {selectedVoicing && <Button variant="secondary" size="sm" aria-label="운지법 닫기" onClick={() => {setSelectedChord(null); setSelectedVoicing(undefined); sheetRef.current?.focus({preventScroll:true});}} type="button">닫기</Button>}
        </div>
        {selectedVoicing && (
          <Fretboard chordName={selectedChord?.raw ?? "코드"} voicing={selectedVoicing} />
        )}
        {selectedVoicing && <p className={styles.dialogCopy}>6번 현에서 1번 현 순서입니다. 카포는 새 너트로 보고 표시한 프렛부터 셉니다.</p>}
        {!selectedVoicing && <p className={styles.dialogCopy}>코드에 커서를 올리거나 키보드로 선택하면 운지법이 표시됩니다.</p>}
      </aside>
    </article>
  );
}
