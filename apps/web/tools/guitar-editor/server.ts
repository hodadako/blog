import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { hasPublishErrors, parseChordPro } from "../../src/features/guitar/chordpro/parser";

const songsRoot = path.resolve(process.env.GUITAR_EDITOR_CONTENT_ROOT ?? path.resolve(import.meta.dirname, "../../../../content/guitar/songs"));
const origin = "http://127.0.0.1:4174";
const maxBytes = 1024 * 1024;
const pathPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\.chopro$/;
const locks = new Map<string, Promise<void>>();
const hash = (source: string): string => createHash("sha256").update(source).digest("hex");

function send(res: ServerResponse, status: number, value: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}

function validate(req: IncomingMessage, res: ServerResponse): boolean {
  const sameOriginRead = req.method === "GET" && req.headers.origin === undefined && req.headers["sec-fetch-site"] === "same-origin";
  if (req.headers.host !== "127.0.0.1:4174" || (req.headers.origin !== origin && !sameOriginRead)) {
    send(res, 403, { error: "허용된 로컬 Host와 Origin이 아닙니다." });
    return false;
  }
  if (req.method === "PUT" && req.headers["content-type"]?.split(";")[0] !== "application/json") {
    send(res, 415, { error: "JSON 요청만 저장할 수 있습니다." });
    return false;
  }
  if (Number(req.headers["content-length"] ?? 0) > maxBytes) {
    send(res, 413, { error: "요청이 너무 큽니다." });
    return false;
  }
  return true;
}

async function resolveSong(relative: string, allowMissing: boolean): Promise<string> {
  if (!pathPattern.test(relative) || relative.includes("..") || relative.includes("\\")) throw new Error("artist/song-id.chopro 형식의 경로가 필요합니다.");
  const parts = relative.split("/");
  const directory = path.join(songsRoot, parts[0]);
  const target = path.join(directory, parts[1]);
  const root = await lstat(songsRoot);
  if (!root.isDirectory() || root.isSymbolicLink()) throw new Error("콘텐츠 루트가 안전하지 않습니다.");
  for (const [candidate, kind] of [[directory, "directory"], [target, "file"]] as const) {
    try {
      const info = await lstat(candidate);
      if (info.isSymbolicLink() || (kind === "directory" ? !info.isDirectory() : !info.isFile())) throw new Error("심볼릭 링크나 잘못된 파일 경로는 사용할 수 없습니다.");
    } catch (error) {
      if (!allowMissing || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return target;
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > maxBytes) throw new Error("요청이 너무 큽니다.");
    chunks.push(part);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function serial<T>(key: string, action: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  let unlock!: () => void;
  const current = new Promise<void>((resolve) => { unlock = resolve; });
  locks.set(key, current);
  await previous;
  try { return await action(); }
  finally { unlock(); if (locks.get(key) === current) locks.delete(key); }
}

export async function handleEditorRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? "/", origin);
  if (!url.pathname.startsWith("/__editor/")) return false;
  if (!validate(req, res)) return true;
  try {
    if (req.method === "GET" && url.pathname === "/__editor/songs") {
      const songs = [];
      for (const artist of await readdir(songsRoot, { withFileTypes: true })) {
        if (!artist.isDirectory() || artist.isSymbolicLink() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artist.name)) continue;
        for (const file of await readdir(path.join(songsRoot, artist.name), { withFileTypes: true })) {
          if (!file.isFile() || file.isSymbolicLink() || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.chopro$/.test(file.name)) continue;
          const relative = artist.name + "/" + file.name;
          const source = await readFile(await resolveSong(relative, false), "utf8");
          const meta = parseChordPro(source).metadata;
          songs.push({ path: relative, slug: artist.name + "--" + file.name.slice(0, -7), title: meta.title ?? relative, artist: meta.artist ?? artist.name, revision: hash(source) });
        }
      }
      songs.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      send(res, 200, { songs });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/__editor/song") {
      const relative = url.searchParams.get("path") ?? "";
      const source = await readFile(await resolveSong(relative, false), "utf8");
      send(res, 200, { path: relative, source, revision: hash(source) });
      return true;
    }
    if (req.method === "PUT" && url.pathname === "/__editor/song") {
      const input = JSON.parse(await readBody(req)) as { path?: unknown; source?: unknown; revision?: unknown };
      if (typeof input.path !== "string" || typeof input.source !== "string" || (input.revision !== null && typeof input.revision !== "string")) {
        send(res, 400, { error: "path, source, revision 값이 필요합니다." });
        return true;
      }
      if (Buffer.byteLength(input.source, "utf8") > maxBytes) { send(res, 413, { error: "악보가 너무 큽니다." }); return true; }
      const document = parseChordPro(input.source);
      if (hasPublishErrors(document)) { send(res, 422, { error: "오류를 수정해야 저장할 수 있습니다.", diagnostics: document.diagnostics }); return true; }
      const target = await resolveSong(input.path, true);
      const savedHash = await serial(target, async () => {
        const current = await readFile(target).catch((error: NodeJS.ErrnoException) => error.code === "ENOENT" ? null : Promise.reject(error));
        if (input.revision === null ? current !== null : current === null || hash(current.toString("utf8")) !== input.revision) return null;
        await mkdir(path.dirname(target), { recursive: true });
        const parent = await lstat(path.dirname(target));
        if (!parent.isDirectory() || parent.isSymbolicLink()) throw new Error("저장 경로가 안전하지 않습니다.");
        const temp = path.join(path.dirname(target), ".guitar-" + randomUUID() + ".tmp");
        await writeFile(temp, input.source as string, { encoding: "utf8", flag: "wx", mode: 0o600 });
        await rename(temp, target);
        return hash(input.source as string);
      });
      if (savedHash === null) { send(res, 409, { error: "변경 충돌입니다. 최신 파일을 다시 열어 주세요." }); return true; }
      send(res, 200, { revision: savedHash, diagnostics: document.diagnostics });
      return true;
    }
    send(res, 404, { error: "알 수 없는 편집기 경로입니다." });
  } catch (error) {
    send(res, 400, { error: error instanceof Error ? error.message : "요청을 처리하지 못했습니다." });
  }
  return true;
}
