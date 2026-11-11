import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStoryServer } from "./story-server.mjs";

test("story server confines files and survives invalid requests", async () => {
  const temp = mkdtempSync(join(tmpdir(), "unslop-server-"));
  const root = join(temp, "story");
  mkdirSync(root);
  mkdirSync(join(temp, "story-secret"));
  writeFileSync(join(temp, "story-secret", "secret.txt"), "secret");
  writeFileSync(join(root, "story.html"), "story");
  mkdirSync(join(root, "directory"));
  symlinkSync(join(temp, "story-secret"), join(root, "escape"));
  const server = createStoryServer(root, "stage");
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ["/__story/..%2Fstory-secret%2Fsecret.txt", "/__story/escape/secret.txt", "/__story/directory", "/missing", "/__story/%00"]) {
      assert.equal((await fetch(base + path)).status, 404, path);
    }
    assert.equal((await fetch(base + "/__story/%ZZ")).status, 400);
    assert.equal(await (await fetch(base + "/__stage.html")).text(), "stage");
    const file = await fetch(base + "/__story/story.html");
    assert.equal(file.status, 200);
    assert.equal(file.headers.get("content-type"), "text/html");
    assert.equal(await file.text(), "story");
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(temp, { recursive: true, force: true });
  }
});
