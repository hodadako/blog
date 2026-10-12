import { parseChordName, parseKey } from "../chords/music";
import type {
  ChordProDocument,
  ChordProLine,
  ChordToken,
  GuitarDiagnostic,
  LyricSegment,
  PerformanceComment,
  SongMetadata,
  SourceRange,
} from "./types";

const SECTION_STARTS: Record<string, { type: string; label: string }> = {
  start_of_verse: { type: "verse", label: "Verse" }, sov: { type: "verse", label: "Verse" },
  start_of_chorus: { type: "chorus", label: "Chorus" }, soc: { type: "chorus", label: "Chorus" },
  start_of_bridge: { type: "bridge", label: "Bridge" }, sob: { type: "bridge", label: "Bridge" },
};
const SECTION_ENDS: Record<string, string> = {
  end_of_verse: "verse", eov: "verse",
  end_of_chorus: "chorus", eoc: "chorus",
  end_of_bridge: "bridge", eob: "bridge",
};
const KNOWN_METADATA = new Set(["title", "t", "artist", "key", "capo", "album", "tempo", "time", "year", "copyright", "added", "updated", "tag"]);
const CRITICAL_DIRECTIVES = new Set(["transpose", "tuning", "new_song", "start_of_tab", "end_of_tab", "start_of_grid", "end_of_grid", "define"]);

function range(line: number, column: number, endColumn: number): SourceRange {
  return { line, column, endColumn };
}

function diagnostic(
  diagnostics: GuitarDiagnostic[],
  severity: GuitarDiagnostic["severity"],
  code: string,
  message: string,
  location: SourceRange,
): void {
  diagnostics.push({ severity, code, message, location });
}

function parseInline(source: string, lineNumber: number, section: string | undefined, diagnostics: GuitarDiagnostic[]): LyricSegment[] {
  const segments: LyricSegment[] = [];
  let cursor = 0;
  let text = "";
  let pendingChord: ChordToken | undefined;

  const flush = (force = false): void => {
    if (text || pendingChord || force) segments.push({ text, ...(pendingChord ? { chord: pendingChord } : {}) });
    text = "";
    pendingChord = undefined;
  };

  while (cursor < source.length) {
    if (source[cursor] !== "[") {
      text += source[cursor];
      cursor += 1;
      continue;
    }

    const close = source.indexOf("]", cursor + 1);
    if (close < 0) {
      diagnostic(diagnostics, "error", "unclosed-chord", "닫히지 않은 코드 괄호입니다.", range(lineNumber, cursor + 1, source.length + 1));
      text += source.slice(cursor);
      break;
    }

    const raw = source.slice(cursor + 1, close);
    if (pendingChord) flush(true);
    else if (text) flush();

    if (raw === "N.C.") {
      pendingChord = { kind: "no-chord", raw, location: range(lineNumber, cursor + 1, close + 2) };
    } else if (raw.startsWith("*")) {
      pendingChord = { kind: "annotation", raw: raw.slice(1), location: range(lineNumber, cursor + 1, close + 2) };
    } else {
      const chord = parseChordName(raw);
      if (chord) {
        pendingChord = { kind: "chord", raw, ...chord, supported: true, location: range(lineNumber, cursor + 1, close + 2) };
      } else {
        pendingChord = { kind: "unsupported-chord", raw, supported: false, location: range(lineNumber, cursor + 1, close + 2) };
        diagnostic(diagnostics, "warning", "unsupported-chord", `지원하지 않는 코드 표기입니다: ${raw}`, pendingChord.location);
      }
    }
    cursor = close + 1;
  }

  flush(text.length === 0 && segments.length === 0 && pendingChord !== undefined);
  if (segments.length === 0) segments.push({ text: "" });
  return segments;
}

function addMetadata(
  metadata: SongMetadata,
  name: string,
  value: string,
  bodyStarted: boolean,
  location: SourceRange,
  diagnostics: GuitarDiagnostic[],
): void {
  const key = name.toLowerCase();
  const normalizedKey = key === "t" ? "title" : key;
  if (!KNOWN_METADATA.has(key)) {
    diagnostic(diagnostics, "warning", "unknown-metadata", `알 수 없는 metadata입니다: ${name}`, location);
    return;
  }
  if ((normalizedKey === "key" || normalizedKey === "capo") && bodyStarted) {
    diagnostic(diagnostics, "error", "late-song-setting", `${normalizedKey}은 본문 시작 전에만 선언할 수 있습니다.`, location);
    return;
  }
  if (normalizedKey === "key" && !parseKey(value)) {
    diagnostic(diagnostics, "error", "invalid-key", `지원하지 않는 조성입니다: ${value}`, location);
    return;
  }
  if (normalizedKey === "capo") {
    const capo = Number(value);
    if (!/^\d+$/.test(value) || !Number.isInteger(capo) || capo < 0 || capo > 12) {
      diagnostic(diagnostics, "error", "invalid-capo", "capo는 0~12 사이의 정수여야 합니다.", location);
      return;
    }
    if (metadata.capo !== 0 || Object.prototype.hasOwnProperty.call(metadata, "_capoDeclared")) {
      diagnostic(diagnostics, "error", "duplicate-capo", "capo는 한 번만 선언할 수 있습니다.", location);
      return;
    }
    metadata.capo = capo;
    Object.defineProperty(metadata, "_capoDeclared", { value: true, enumerable: false });
    return;
  }
  if (normalizedKey === "tempo") {
    const tempo = Number(value);
    if (!/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(tempo) || tempo <= 0 || tempo > 400) {
      diagnostic(diagnostics, "error", "invalid-tempo", "tempo는 1~400 사이의 숫자여야 합니다.", location);
      return;
    }
  }
  if (normalizedKey === "year" && !/^\d{4}$/.test(value)) {
    diagnostic(diagnostics, "error", "invalid-year", "year는 네 자리 연도여야 합니다.", location);
    return;
  }
  if (normalizedKey === "time") {
    const meter = value.match(/^(\d+)\/(\d+)$/);
    if (!meter || Number(meter[1]) < 1 || Number(meter[1]) > 32 || ![1, 2, 4, 8, 16, 32].includes(Number(meter[2]))) {
      diagnostic(diagnostics, "error", "invalid-time", "time은 유효한 박자표(예: 4/4)여야 합니다.", location);
      return;
    }
  }
  if (normalizedKey === "tag") {
    metadata.tags.push(value);
    return;
  }
  const existing = metadata[normalizedKey as keyof SongMetadata];
  if (existing !== undefined && normalizedKey !== "title") {
    diagnostic(diagnostics, "error", `duplicate-${normalizedKey}`, `${normalizedKey}은 한 번만 선언할 수 있습니다.`, location);
    return;
  }
  if (normalizedKey === "added" || normalizedKey === "updated") {
    const date = new Date(`${value}T00:00:00.000Z`);
    const isDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
      && Number.isFinite(date.getTime())
      && date.toISOString().slice(0, 10) === value;
    if (!isDate) {
      diagnostic(diagnostics, "error", "invalid-date", `${normalizedKey}는 유효한 YYYY-MM-DD 날짜여야 합니다.`, location);
      return;
    }
  }
  (metadata as unknown as Record<string, unknown>)[normalizedKey] = value;
}

function readDirective(
  rawDirective: string,
  lineNumber: number,
  metadata: SongMetadata,
  bodyState: { started: boolean },
  lines: ChordProLine[],
  diagnostics: GuitarDiagnostic[],
  section: { value?: string; type?: string },
): boolean {
  const match = rawDirective.match(/^\{([^{}]+)\}$/);
  if (!match) return false;
  const raw = match[1].trim();
  const metaMatch = raw.match(/^meta\s*:\s*([\w-]+)\s+(.+)$/i);
  const standardMatch = raw.match(/^([\w-]+)\s*:\s*(.*)$/);
  if (metaMatch || standardMatch) {
    const name = metaMatch?.[1] ?? standardMatch![1];
    const value = (metaMatch?.[2] ?? standardMatch![2]).trim();
    const key = name.toLowerCase();
    if (key === "comment" || key === "c") {
      const node: PerformanceComment = { kind: "performance-comment", text: value, location: range(lineNumber, 1, rawDirective.length + 1) };
      lines.push(node);
      bodyState.started = true;
      return true;
    }
    if (KNOWN_METADATA.has(key)) {
      addMetadata(metadata, name, value, bodyState.started, range(lineNumber, 1, rawDirective.length + 1), diagnostics);
      return true;
    }
  }

  const [directive, ...labelParts] = raw.split(":");
  const normalized = directive.trim().toLowerCase();
  if (SECTION_STARTS[normalized]) {
    bodyState.started = true;
    if (section.value) {
      diagnostic(diagnostics, "error", "nested-section", "ChordPro 섹션은 중첩할 수 없습니다.", range(lineNumber, 1, rawDirective.length + 1));
    } else {
      const start = SECTION_STARTS[normalized];
      const label = labelParts.join(":").trim().replace(/^label\s*=\s*"(.*)"$/, "$1");
      section.value = label || start.label;
      section.type = start.type;
    }
    return true;
  }
  if (SECTION_ENDS[normalized]) {
    bodyState.started = true;
    if (!section.value) diagnostic(diagnostics, "error", "unexpected-section-end", "열린 섹션이 없는데 종료 지시어가 있습니다.", range(lineNumber, 1, rawDirective.length + 1));
    else if (section.type !== SECTION_ENDS[normalized]) {
      diagnostic(diagnostics, "error", "mismatched-section-end", `${section.type} 섹션과 맞지 않는 종료 지시어입니다.`, range(lineNumber, 1, rawDirective.length + 1));
    } else {
      section.value = undefined;
      section.type = undefined;
    }
    return true;
  }

  const directiveName = normalized;
  if (KNOWN_METADATA.has(directiveName)) {
    addMetadata(metadata, directiveName, labelParts.join(":").trim(), bodyState.started, range(lineNumber, 1, rawDirective.length + 1), diagnostics);
    return true;
  }

  const severity = CRITICAL_DIRECTIVES.has(directiveName) ? "error" : "warning";
  diagnostic(diagnostics, severity, "unsupported-directive", `지원하지 않는 ChordPro 지시어입니다: ${directiveName}`, range(lineNumber, 1, rawDirective.length + 1));
  lines.push({ kind: "unsupported-directive", raw: rawDirective, location: range(lineNumber, 1, rawDirective.length + 1) });
  bodyState.started = true;
  return true;
}

export function parseChordPro(source: string): ChordProDocument {
  const metadata: SongMetadata = { capo: 0, tags: [] };
  const lines: ChordProLine[] = [];
  const diagnostics: GuitarDiagnostic[] = [];
  const section: { value?: string; type?: string } = {};
  const bodyState = { started: false };

  source.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    const location = range(lineNumber, 1, line.length + 1);
    if (line.startsWith("#")) {
      lines.push({ kind: "source-comment", text: line.slice(1), location });
      return;
    }
    if (line.trim() === "") {
      lines.push({ kind: "blank", location });
      return;
    }
    if (line.includes("{") || line.includes("}")) {
      if (readDirective(line, lineNumber, metadata, bodyState, lines, diagnostics, section)) return;
      diagnostic(diagnostics, "error", "malformed-directive", "잘못되었거나 닫히지 않은 directive입니다.", location);
      lines.push({ kind: "unsupported-directive", raw: line, location });
      bodyState.started = true;
      return;
    }
    bodyState.started = true;
    lines.push({
      kind: "lyrics",
      segments: parseInline(line, lineNumber, section.value, diagnostics),
      ...(section.value ? { section: section.value } : {}),
      location,
    });
  });

  if (section.value) {
    diagnostic(diagnostics, "error", "unclosed-section", `종료되지 않은 ${section.value} 섹션입니다.`, range(source.split(/\r?\n/).length, 1, 1));
  }
  for (const required of ["title", "artist", "key"] as const) {
    if (!metadata[required]) diagnostic(diagnostics, "error", `missing-${required}`, `필수 metadata ${required}가 없습니다.`, range(1, 1, 1));
  }
  if (!metadata.added) diagnostic(diagnostics, "warning", "missing-added", "added 날짜가 없어 목록에서 날짜 지정 곡 뒤에 표시됩니다.", range(1, 1, 1));

  return { metadata, lines, diagnostics };
}

export function hasPublishErrors(document: ChordProDocument): boolean {
  return document.diagnostics.some(({ severity }) => severity === "error");
}
