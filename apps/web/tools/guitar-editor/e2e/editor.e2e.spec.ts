import { expect, test } from "@playwright/test";

test("edits source metadata, creates a song, and reloads saved content", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /시작 제목/ }).click();
  await expect(page.getByLabel("저장 경로")).toHaveValue("hodako/seed-song.chopro");
  await page.getByLabel("ChordPro 원문").fill("{title: 시작 제목}\n{artist: 작곡가}\n{key: C}\n\n[C]미리보기 반영 확인");
  await expect(page.getByText("미리보기 반영 확인")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /시작 제목/ }).click();
  await expect(page.locator("textarea")).toContainText("# keep this source comment");
  await expect(page.getByRole("textbox", { name: "아티스트" })).toHaveValue("원작자");
  await page.getByRole("textbox", { name: "제목" }).fill("수정한 제목");
  await expect(page.getByRole("textbox", { name: "제목" })).toHaveValue("수정한 제목");
  const saveRequest = page.waitForRequest((request) => request.url().endsWith("/__editor/song") && request.method() === "PUT");
  await page.getByRole("button", { name: "파일 저장" }).click();
  const payload = JSON.parse((await saveRequest).postData() ?? "{}") as { source: string };
  expect(payload.source).toContain("{title: 수정한 제목}");
  await expect(page.locator("textarea")).toContainText("{title: 수정한 제목}");
  await expect(page.locator("textarea")).toContainText("# keep this source comment");
  await expect(page.locator("textarea")).toContainText("{meta: artist 원작자}");
  await expect(page.getByText(/저장했습니다/)).toBeVisible();
  await expect(page.getByRole("button", { name: /수정한 제목/ })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /수정한 제목/ }).click();
  await expect(page.getByRole("textbox", { name: "제목" })).toHaveValue("수정한 제목");
  await expect(page.locator("textarea")).toContainText("# keep this source comment");

  await page.getByRole("button", { name: "새 곡" }).click();
  await page.getByLabel("저장 경로").fill("hodako/created-song.chopro");
  await page.getByRole("textbox", { name: "제목" }).fill("새로 만든 곡");
  await page.getByRole("button", { name: "파일 저장" }).click();
  await expect(page.getByText(/저장했습니다/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /새로 만든 곡/ }).click();
  await expect(page.getByRole("textbox", { name: "제목" })).toHaveValue("새로 만든 곡");
});

test("rejects invalid paths, stale revisions, and foreign Origins", async ({ request }) => {
  const body = { path: "../outside.chopro", source: "{title: A}\n{artist: B}\n{key: C}\n", revision: null };
  const invalidPath = await request.put("/__editor/song", {
    headers: { Origin: "http://127.0.0.1:4174" },
    data: body,
  });
  expect(invalidPath.status()).toBe(400);

  const foreignOrigin = await request.get("/__editor/songs", { headers: { Origin: "https://example.com" } });
  expect(foreignOrigin.status()).toBe(403);

  const staleRevision = await request.put("/__editor/song", {
    headers: { Origin: "http://127.0.0.1:4174" },
    data: { ...body, path: "hodako/seed-song.chopro", revision: "stale" },
  });
  expect(staleRevision.status()).toBe(409);
});

test("keeps dropdowns in the light preview theme", async ({page}) => {
  await page.setViewportSize({width: 1000, height: 900});
  await page.goto("/");
  await page.getByRole("button", {name: /seed-song.chopro/}).click();
  await page.getByRole("button", {name: "악보 설정 열기", exact: true}).click();
  const capo = page.getByRole("combobox", {name: "카포 위치", exact: true});
  await capo.click();
  const list = page.getByRole("listbox", {name: "카포 위치", exact: true});
  await expect(list).toBeVisible();
  await expect(list).toHaveCSS("background-color", "rgb(254, 252, 251)");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("option", {name: "1프렛", exact: true}).click();
  await expect(capo).toHaveText("1프렛");
});
