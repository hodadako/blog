import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { hasPublishErrors, parseChordPro } from "../../src/features/guitar/chordpro/parser";
import { SongReader } from "../../src/features/guitar/components/song-reader";
import type { ChordProDocument } from "../../src/features/guitar/chordpro/types";
import "../../src/design-system/tokens.css";
import "../../src/design-system/tailwind.css";
import "../../src/design-system/primitives.css";
import "../../src/design-system/dropdown.css";
import "./editor.css";

interface SongItem { path: string; slug: string; title: string; artist: string; revision: string }
const starter = "{title: 새 곡}\n{artist: 아티스트}\n{key: C}\n{capo: 0}\n{added: 2026-10-09}\n\n{start_of_verse}\n[C]가사를 입력하고 [G]코드를 넣으세요.\n{end_of_verse}\n";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "요청 실패 (" + response.status + ")");
  return payload;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);
  return debouncedValue;
}

function patchMetadata(source: string, key: string, value: string): string {
  const lines = source.split(/\r?\n/);
  const standard = new RegExp("^\\{" + key + "\\s*:\\s*.*\\}$", "i");
  const meta = new RegExp("^\\{meta\\s*:\\s*" + key + "\\s+.*\\}$", "i");
  const index = lines.findIndex((line) => standard.test(line) || meta.test(line));
  if (index >= 0) lines[index] = meta.test(lines[index]) ? "{meta: " + key + " " + value + "}" : "{" + key + ": " + value + "}";
  else lines.splice(key === "title" ? 0 : Math.max(0, lines.findIndex((line) => line.trim() === "")), 0, "{" + key + ": " + value + "}");
  return lines.join("\n");
}

function Editor() {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [path, setPath] = useState("hodako/new-song.chopro");
  const [source, setSource] = useState(starter);
  const [revision, setRevision] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const artistRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const capoRef = useRef<HTMLInputElement>(null);
  const previewSource = useDebouncedValue(source, 180);
  const document: ChordProDocument = useMemo(() => parseChordPro(previewSource), [previewSource]);
  const invalid = hasPublishErrors(document);
  const metadata = document.metadata;
  const slug = path.replace(/\.chopro$/, "").replace("/", "--");
  const visibleSongs = songs.filter((song) => (song.title + " " + song.artist + " " + song.slug).toLocaleLowerCase("ko").includes(query.trim().toLocaleLowerCase("ko")));

  async function refresh(): Promise<void> {
    const result = await request<{ songs: SongItem[] }>("/__editor/songs");
    setSongs(result.songs);
  }
  useEffect(() => { void refresh().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "목록을 불러오지 못했습니다.")); }, []);

  async function openSong(songPath: string): Promise<void> {
    setBusy(true);
    try {
      const result = await request<{ path: string; source: string; revision: string }>("/__editor/song?path=" + encodeURIComponent(songPath));
      setPath(result.path); setSource(result.source); setRevision(result.revision); setMessage("파일을 열었습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "파일을 열지 못했습니다."); }
    finally { setBusy(false); }
  }
  async function save(): Promise<void> {
    setBusy(true);
    try {
      const pendingSource = [
        ["title", titleRef.current?.value ?? metadata.title ?? ""],
        ["artist", artistRef.current?.value ?? metadata.artist ?? ""],
        ["key", keyRef.current?.value ?? metadata.key ?? ""],
        ["capo", capoRef.current?.value ?? String(metadata.capo)],
      ].reduce((current, [field, value]) => patchMetadata(current, field, value), source);
      const pendingDocument = parseChordPro(pendingSource);
      if (hasPublishErrors(pendingDocument)) {
        setSource(pendingSource);
        setMessage("오류를 수정해야 저장할 수 있습니다.");
        return;
      }
      const result = await request<{ revision: string; diagnostics: ChordProDocument["diagnostics"] }>("/__editor/song", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, source: pendingSource, revision }),
      });
      setSource(pendingSource);
      setRevision(result.revision); await refresh();
      setMessage(result.diagnostics.length ? "저장했습니다. 경고 항목을 확인하세요." : "저장했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "저장하지 못했습니다."); }
    finally { setBusy(false); }
  }
  function createSong(): void {
    setBusy(false); setPath("hodako/new-song.chopro"); setSource(starter); setRevision(null); setMessage("신규 파일입니다. 저장하면 생성됩니다.");
  }

  return (
    <main className="editor">
      <header className="editorHeader"><div><p>Hodako Guitar</p><h1>로컬 악보 편집기</h1></div><button disabled={busy} onClick={createSong} type="button">새 곡</button></header>
      <div className="editorLayout">
        <aside className="songList">
          <label>곡 검색<input onChange={(event) => setQuery(event.target.value)} value={query} /></label>
          <ul>{visibleSongs.map((song) => <li key={song.path}><button className="songLink" disabled={busy} onClick={() => void openSong(song.path)} type="button">{song.title}<small>{song.artist} · {song.path}</small></button></li>)}</ul>
        </aside>
        <section className="workbench">
          <div className="editPane">
            <label>저장 경로<input autoComplete="off" disabled={busy} onChange={(event) => setPath(event.target.value)} placeholder="artist/song-id.chopro" value={path} /></label>
            <div className="metadata" key={[path, revision ?? "new", metadata.title, metadata.artist, metadata.key, metadata.capo].join("|")}>
              <label>제목<input defaultValue={metadata.title ?? ""} disabled={busy} ref={titleRef} /></label>
              <label>아티스트<input defaultValue={metadata.artist ?? ""} disabled={busy} ref={artistRef} /></label>
              <label>조성<input defaultValue={metadata.key ?? ""} disabled={busy} ref={keyRef} /></label>
              <label>카포<input defaultValue={metadata.capo} disabled={busy} min="0" max="12" ref={capoRef} type="number" /></label>
            </div>
            <label className="sourceLabel">ChordPro 원문<textarea disabled={busy} spellCheck={false} onChange={(event) => setSource(event.target.value)} value={source} /></label>
            <div className="diagnostics" role="status">{document.diagnostics.map((item, index) => <p className={item.severity} key={index}>줄 {item.location.line}:{item.location.column} · {item.severity === "error" ? "오류" : "경고"} · {item.message}</p>)}</div>
            <footer><span>{message || (invalid ? "오류를 해결해야 저장할 수 있습니다." : "미리보기를 확인한 뒤 저장하세요.")}</span><button disabled={busy || invalid} onClick={() => void save()} type="button">파일 저장</button></footer>
          </div>
          <div className="previewPane" data-theme="light"><h2>실시간 미리보기</h2><SongReader artist={metadata.artist ?? "아티스트"} document={document} keyName={metadata.key ?? "C"} slug={slug} sourceCapo={metadata.capo} title={metadata.title ?? "새 곡"} /></div>
        </section>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Editor />);
