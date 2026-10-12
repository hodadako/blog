import { rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

export default async function teardown(): Promise<void> {
  const root = process.env.GUITAR_EDITOR_CONTENT_ROOT;
  if (root && path.dirname(path.resolve(root)) === path.resolve(tmpdir()) && path.basename(root).startsWith("hodako-guitar-editor-e2e-")) {
    await rm(root, { recursive: true, force: true });
  }
}
