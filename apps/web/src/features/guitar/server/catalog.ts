import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { hasPublishErrors, parseChordPro } from "../chordpro/parser";
import type { ChordProDocument } from "../chordpro/types";
import type { SongReadings } from "../chordpro/readings";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface GuitarSongSummary {
  slug: string;
  title: string;
  artist: string;
  key: string;
  added?: string;
  updated?: string;
  normalizedSearchText: string;
  tags?: string[];
}

export interface GuitarSong extends GuitarSongSummary {
  sourcePath: string;
  document: ChordProDocument;
  readings?: SongReadings;
}

function normalizeSearch(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

function resolveSongRoot(contentRoot?: string): string {
  return contentRoot ?? path.resolve(process.cwd(), "../../content/guitar/songs");
}

export function loadGuitarCatalog(contentRoot?: string): GuitarSong[] {
  const root = resolveSongRoot(contentRoot);
  let artistEntries;
  try {
    artistEntries = readdirSync(root, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Guitar 콘텐츠 디렉터리를 읽을 수 없습니다: ${root}`, { cause: error });
  }

  const songs: GuitarSong[] = [];
  const errors: string[] = [];
  const slugs = new Set<string>();

  for (const artistEntry of artistEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!artistEntry.isDirectory() || !ID_PATTERN.test(artistEntry.name)) {
      errors.push(`${artistEntry.name}: 아티스트 경로는 소문자 영숫자와 단일 하이픈으로 구성된 디렉터리여야 합니다.`);
      continue;
    }
    const artistDirectory = path.join(root, artistEntry.name);
    for (const songEntry of readdirSync(artistDirectory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!songEntry.isFile() || !songEntry.name.endsWith(".chopro")) {
        errors.push(`${path.relative(root, path.join(artistDirectory, songEntry.name))}: 일반 .chopro 파일이어야 합니다.`);
        continue;
      }
      const songId = songEntry.name.slice(0, -".chopro".length);
      if (!ID_PATTERN.test(songId)) {
        errors.push(`${path.relative(root, path.join(artistDirectory, songEntry.name))}: 곡 ID 형식이 잘못되었습니다.`);
        continue;
      }
      const slug = `${artistEntry.name}--${songId}`;
      if (slugs.has(slug)) {
        errors.push(`${slug}: 중복 slug입니다.`);
        continue;
      }
      slugs.add(slug);

      const sourcePath = path.join(artistDirectory, songEntry.name);
      const document = parseChordPro(readFileSync(sourcePath, "utf8"));
      if (hasPublishErrors(document)) {
        errors.push(...document.diagnostics
          .filter(({ severity }) => severity === "error")
          .map(({ code, message, location }) => `${path.relative(root, sourcePath)}:${location.line}:${location.column} ${code}: ${message}`));
        continue;
      }
      if (!document.metadata.title || !document.metadata.artist || !document.metadata.key) continue;
      const readingPath = path.join(root, "../readings", `${slug}.json`);
      const readings: SongReadings | undefined = existsSync(readingPath) ? JSON.parse(readFileSync(readingPath, "utf8")) : undefined;
      if (readings) {
        for (const line of document.lines) {
          if (line.kind !== "lyrics") continue;
          const text = line.segments.map(s => s.text).join("");
          for (const segment of line.segments) {
            if (segment.text.trim() && (!readings.segments?.[segment.text]?.romaji || !readings.segments?.[segment.text]?.korean)) {
              throw new Error(`${slug}:${line.location.line}: 가사 발음 데이터가 원문과 일치하지 않습니다: ${segment.text}`);
            }
          }
          if (text.trim() && !readings.english?.[text]) throw new Error(`${slug}:${line.location.line}: 영어 뜻 데이터가 없습니다: ${text}`);
        }
      }
      for (const warning of document.diagnostics.filter(({ severity }) => severity === "warning")) {
        console.warn(`${path.relative(root, sourcePath)}:${warning.location.line}:${warning.location.column} ${warning.code}: ${warning.message}`);
      }
      songs.push({
        slug,
        title: document.metadata.title,
        artist: document.metadata.artist,
        key: document.metadata.key,
        tags: [...document.metadata.tags],
        ...(document.metadata.added ? { added: document.metadata.added } : {}),
        ...(document.metadata.updated ? { updated: document.metadata.updated } : {}),
        normalizedSearchText: normalizeSearch(`${document.metadata.title} ${document.metadata.artist} ${document.metadata.tags.join(" ")}`),
        sourcePath,
        document,
        ...(readings ? { readings } : {}),
      });
    }
  }

  if (errors.length) throw new Error(`Guitar catalog 검증에 실패했습니다:\n${errors.join("\n")}`);
  return songs.sort((a, b) => {
    if (a.added && b.added) return b.added.localeCompare(a.added) || a.slug.localeCompare(b.slug);
    if (a.added) return -1;
    if (b.added) return 1;
    return a.slug.localeCompare(b.slug);
  });
}

export function searchGuitarSongs(songs: readonly GuitarSongSummary[], query: string): GuitarSongSummary[] {
  const needle = normalizeSearch(query);
  if (!needle) return [...songs];
  return songs.filter(({ normalizedSearchText }) => normalizedSearchText.includes(needle));
}

export function getGuitarSong(slug: string): GuitarSong | undefined {
  return loadGuitarCatalog().find((song) => song.slug === slug);
}

export function getGuitarSongSummaries(): GuitarSongSummary[] {
  return loadGuitarCatalog().map(({ document: _document, sourcePath: _sourcePath, readings: _readings, ...summary }) => summary);
}
