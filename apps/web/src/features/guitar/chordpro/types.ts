export interface SourceRange {
  line: number;
  column: number;
  endColumn: number;
}

export interface GuitarDiagnostic {
  severity: "error" | "warning";
  code: string;
  message: string;
  location: SourceRange;
}

export interface SongMetadata {
  title?: string;
  artist?: string;
  key?: string;
  capo: number;
  album?: string;
  tempo?: string;
  time?: string;
  year?: string;
  copyright?: string;
  added?: string;
  updated?: string;
  tags: string[];
}

export interface ParsedChord {
  kind: "chord";
  raw: string;
  root: number;
  suffix: string;
  bass?: number;
  supported: true;
  location: SourceRange;
}

export interface UnsupportedChord {
  kind: "unsupported-chord";
  raw: string;
  supported: false;
  location: SourceRange;
}

export interface InlineAnnotation {
  kind: "annotation";
  raw: string;
  location: SourceRange;
}

/** A deliberate rest; it has no pitch and must never be transposed. */
export interface NoChord {
  kind: "no-chord";
  raw: string;
  location: SourceRange;
}

export type ChordToken = ParsedChord | UnsupportedChord | InlineAnnotation | NoChord;

export interface LyricSegment {
  text: string;
  chord?: ChordToken;
}

export interface LyricLine {
  kind: "lyrics";
  segments: LyricSegment[];
  section?: string;
  location: SourceRange;
}

export interface EmptyLine {
  kind: "blank";
  location: SourceRange;
}

export interface SourceComment {
  kind: "source-comment";
  text: string;
  location: SourceRange;
}

export interface PerformanceComment {
  kind: "performance-comment";
  text: string;
  location: SourceRange;
}

export interface UnsupportedDirective {
  kind: "unsupported-directive";
  raw: string;
  location: SourceRange;
}

export type ChordProLine = LyricLine | EmptyLine | SourceComment | PerformanceComment | UnsupportedDirective;

export interface ChordProDocument {
  metadata: SongMetadata;
  lines: ChordProLine[];
  diagnostics: GuitarDiagnostic[];
}
