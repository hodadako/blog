import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

export default async function setup(): Promise<void> {
  const root = process.env.GUITAR_EDITOR_CONTENT_ROOT;
  if (!root || path.dirname(path.resolve(root)) !== path.resolve(tmpdir()) || !path.basename(root).startsWith("hodako-guitar-editor-e2e-")) {
    throw new Error("테스트 콘텐츠 경로가 안전하지 않습니다.");
  }
  await mkdir(path.join(root, "hodako"), { recursive: true });
  await writeFile(path.join(root, "hodako", "seed-song.chopro"), [
    "# keep this source comment",
    "{title: 시작 제목}",
    "{meta: artist 원작자}",
    "{key: G}",
    "{capo: 0}",
    "",
    "[G]첫 번째 [D]가사",
    "",
  ].join("\n"));
}
