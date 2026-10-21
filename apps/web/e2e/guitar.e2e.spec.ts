import { expect, test, type Page } from "@playwright/test";

async function openSettings(page: Page) {
  const toggle = page.getByRole("button", {name: "악보 설정 열기", exact: true});
  if (await toggle.isVisible()) await toggle.click();
}

const blogOrigin = `http://blog.localhost:${new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://guitar.localhost:4317").port}`;

test("serves the song and initial chord lyrics in static HTML", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const response = await page.goto("/songs/vaundy--shiawase");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "しわあわせ" })).toBeVisible();
  await expect(page.getByRole("region", {name: /しわあわせ 코드 악보/})).toBeVisible();
  await expect(page.getByRole("button", { name: "F 운지법 보기" }).first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://guitar.hodako.dev/songs/vaundy--shiawase");
  await context.close();
});

test("shows non-modal fingering and returns focus to the score on close", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/songs/vaundy--shiawase");

  const chordButton = page.getByRole("button", { name: "F 운지법 보기" }).first();
  await chordButton.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("complementary", { name: "코드 운지법" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img", { name: "F 운지법" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(chordButton).toBeFocused();
  await chordButton.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "운지법 닫기" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("region", {name: /코드 악보, 긴 행/})).toBeFocused();
});

test("transposes and changes capo while keeping the original song model", async ({ page }) => {
  await page.goto("/songs/vaundy--shiawase");
  await openSettings(page);
  const status = page.locator("p[aria-live='polite']");
  await expect(status).toContainText("운지 조성 F · 실음 조성 F");

  await page.getByRole("button", { name: "한 음 높이기" }).click();
  await expect(status).toContainText("조옮김 +1");
  await page.getByLabel("카포 위치").selectOption("2");
  await expect(status).toContainText("실음 조성 F#");

  await page.reload();
  await openSettings(page);
  const restoredStatus = page.locator("p[aria-live='polite']");
  await expect(restoredStatus).toContainText("조옮김 +1");
  await expect(page.getByLabel("카포 위치")).toHaveValue("2");

  await page.getByRole("button", { name: "곡 설정 초기화" }).click();
  await expect(restoredStatus).toContainText("운지 조성 F · 실음 조성 F");
  await expect(restoredStatus).toContainText("조옮김 0");
});

test("pauses time-based scrolling on manual input and stays within mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/songs/vaundy--shiawase");
  await openSettings(page);
  await page.getByLabel("자동 스크롤 속도").selectOption("10");
  await page.keyboard.press("Escape");
  const scrollButton = page.getByRole("button", { name: "자동 스크롤 시작 / 재개" });
  await scrollButton.click();
  await expect(page.getByRole("button", { name: "자동 스크롤 일시정지" })).toBeVisible();
  await page.waitForTimeout(600);
  const moved = await page.evaluate(() => window.scrollY);
  expect(moved).toBeGreaterThan(0);
  await page.mouse.wheel(0, 80);
  await expect(page.getByRole("button", { name: "자동 스크롤 시작 / 재개" })).toBeVisible();

  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 740 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});

test("accumulates slow automatic scrolling between frames", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/songs/vaundy--shiawase");
  await openSettings(page);
  await page.getByLabel("자동 스크롤 속도").selectOption("1");

  await page.getByRole("button", { name: "자동 스크롤 시작 / 재개" }).click();
  const start = await page.evaluate(() => window.scrollY);
  await expect.poll(() => page.evaluate((startPosition) => window.scrollY - startPosition, start), { timeout: 2000 }).toBeGreaterThan(0);
});

test("returns 404 for Guitar locale prefixes and internal route paths", async ({ request }) => {
  for (const path of ["/ko", "/guitar", "/api/comments", "/__editor/songs"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("searches the catalog on the Guitar home and songs index", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/songs$/);
  await expect(page.getByRole("heading", {name: "Songs", exact: true})).toBeVisible();
  await page.getByLabel("곡 검색").fill("Vaundy");
  await expect(page.getByRole("link", { name: "しわあわせ" })).toBeVisible();

  await page.goto("/songs");
  await page.getByLabel("곡 검색").fill("missing");
  await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
});

test("serves host-specific robots and sitemaps", async ({ request }) => {
  const guitarSitemap = await request.get("/sitemap.xml");
  expect(guitarSitemap.status()).toBe(200);
  const guitarXml = await guitarSitemap.text();
  expect(guitarXml).not.toContain("<loc>https://guitar.hodako.dev</loc>");
  expect(guitarXml).not.toContain("<loc>https://guitar.hodako.dev/</loc>");
  expect(guitarXml).toContain("https://guitar.hodako.dev/songs");
  expect(guitarXml).toContain("https://guitar.hodako.dev/songs/vaundy--shiawase");

  expect(guitarXml).not.toContain("hodako--quiet-walk");
  // Next's streamed/cached not-found shell may use 200; verify removal and
  // noindex in the body too, on both the initial and cached response.
  // https://nextjs.org/docs/app/api-reference/file-conventions/not-found
  for (let attempt = 0; attempt < 2; attempt++) {
    const removedSong = await request.get("/songs/hodako--quiet-walk");
    expect([200, 404]).toContain(removedSong.status());
    const removedHtml = await removedSong.text();
    expect(removedHtml).toContain("404: This page could not be found.");
    expect(removedHtml).toContain('name="robots" content="noindex"');
    expect(removedHtml).not.toContain("저녁 산책");
  }

  const blogSitemap = await request.get(`${blogOrigin}/sitemap.xml`);
  expect(blogSitemap.status()).toBe(200);
  expect(await blogSitemap.text()).not.toContain("guitar.hodako.dev");
  const guitarRobots = await request.get("/robots.txt");
  expect(await guitarRobots.text()).toContain("guitar.hodako.dev/sitemap.xml");
  const blogRobots = await request.get(`${blogOrigin}/robots.txt`);
  expect(await blogRobots.text()).toContain("/ko/admin");
});

test("keeps system theme, preferences, and reading controls usable when storage is blocked", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await context.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new DOMException("Storage denied", "SecurityError"); },
    });
  });
  const page = await context.newPage();
  await page.goto("/songs/vaundy--shiawase");
  await openSettings(page);
  await expect(page.getByLabel("테마")).toHaveValue("light");
  await page.getByLabel("테마").selectOption("system");
  await page.getByRole("button", { name: "한 음 낮추기" }).click();
  await expect(page.locator("p[aria-live='polite']")).toContainText("조옮김 -1");
  await context.close();
});

test("follows OS theme changes only while the System preference is selected", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/songs/vaundy--shiawase");
  await page.getByLabel("테마").selectOption("system");
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("light");
  await page.getByLabel("테마").selectOption("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("dark");
});

test("preserves the blog locale redirect on a non-Guitar host", async ({ page }) => {
  const response = await page.goto(`${blogOrigin}/`);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/(ko|en)\/blog$/);
});

test("keeps blog locale pages, theme preference, Records, and admin login available", async ({ page }) => {
  await page.goto(`${blogOrigin}/ko/blog`);
  await expect(page.getByRole("heading", { name: "그래서 나는 Bean Validation을 그만두었다.", exact: true })).toBeVisible();
  const theme = page.locator("html");
  const toggle = page.getByRole("button", { name: "별 테마로 전환" });
  await toggle.click();
  await expect(theme).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(theme).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Pretendard 글꼴로 전환" }).click();
  await expect(theme).toHaveAttribute("data-font", "pretendard");
  await page.reload();
  await expect(theme).toHaveAttribute("data-font", "pretendard");

  await page.getByRole("button", { name: /언어/ }).click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page).toHaveURL(`${blogOrigin}/ko/blog`);
  expect(await page.context().cookies(blogOrigin)).toContainEqual(expect.objectContaining({ name: "site_locale", value: "ko" }));
  await expect(page.locator("main")).toBeVisible();

  await page.goto(`${blogOrigin}/en/blog`);
  await expect(page).toHaveURL(`${blogOrigin}/ko/blog`);
  await expect(page.locator("main")).toBeVisible();
  await page.goto(`${blogOrigin}/ko/blog/gave-up-bean-validation`);
  await expect(page.getByRole("heading", { name: "그래서 나는 Bean Validation을 그만두었다.", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "댓글", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "댓글 남기기" })).toBeVisible();

  const postIcon = await page.request.get(`${blogOrigin}/posts/gave-up-bean-validation/icon.png`);
  expect(postIcon.status()).toBe(200);
  expect(postIcon.headers()["content-type"]).toContain("image/png");

  await page.goto(`${blogOrigin}/ko/records`);
  await expect(page.locator("main")).toBeVisible();
  await page.goto(`${blogOrigin}/ko/records/album/the-book-for`);
  await expect(page.getByRole("heading", { name: "THE BOOK for," })).toBeVisible();

  const legacyRecords = await page.request.get(`${blogOrigin}/ko/inspirations`, { maxRedirects: 0 });
  expect(legacyRecords.status()).toBe(308);
  expect(legacyRecords.headers().location).toContain("/ko/records");

  await page.goto(`${blogOrigin}/ko/admin/login`);
  await expect(page.getByRole("heading", { name: "관리자 로그인" })).toBeVisible();
});
