import {expect, test} from "@playwright/test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {parseChordPro} from "../src/features/guitar/chordpro/parser";

const songs = [
  {slug: "vaundy--shiawase", path: "vaundy/shiawase.chopro", title: "しわあわせ"},
];

test("redirects the root permanently and uses one searchable editorial index", async ({page, request}) => {
  const response = await request.get("/", {maxRedirects: 0});
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/songs");
  await page.goto("/");
  await expect(page).toHaveURL(/\/songs$/);
  await expect(page.locator("h1")).toHaveText("Songs");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://guitar.hodako.dev/songs");
  await expect(page.getByRole("button", {name: "검색", exact: true})).toHaveCount(0);
  const originalSongCount = await page.locator("main li").count();
  expect(originalSongCount).toBeGreaterThanOrEqual(songs.length);
  await page.getByLabel("곡 검색").fill("Vaundy");
  await expect(page.locator("main li")).toHaveCount(1);
  await page.getByLabel("곡 검색").fill("없는 곡");
  await expect(page.getByRole("status")).toHaveText("검색 결과가 없습니다.");
  await page.getByRole("button", {name: "검색 초기화"}).click();
  await expect(page.locator("main li")).toHaveCount(originalSongCount);
  const row = page.getByRole("link", {name: /しわあわせ Vaundy/});
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/songs\/vaundy--shiawase$/);
  await expect(page.getByText("기본 운지 조성 F · 원본 카포 0프렛")).toBeVisible();
  await expect(page.locator('[data-chord-kind="no-chord"]')).toHaveCount(4);
  await expect(page.getByRole("button", {name: /등록된 운지법 없음/})).toHaveCount(0);
  await expect(page.getByText("일부 원문 표기 안내")).toHaveCount(0);
});

for (const width of [360, 390, 768, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: preserves source anchors, reading widths, and mobile controls`, async ({page}) => {
      await page.setViewportSize({width, height: 900});
      await page.addInitScript(theme => localStorage.setItem("site-theme", theme), theme);
      await page.goto("/songs");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("header .brand-lockup")).toHaveCount(0);
      await expect(page.locator("header").getByRole("combobox")).toHaveCount(0);
      await expect(page.locator("header").getByRole("link", {name: "악보", exact: true})).toBeVisible();
      const index = page.locator("main > section");
      expect((await index.boundingBox())!.width).toBeLessThanOrEqual(704);
      const colors = await index.evaluate((node) => ({
        title: getComputedStyle(node.querySelector('[class*="songTitle"]')!).color,
        artist: getComputedStyle(node.querySelector('[class*="artist"]')!).color,
        background: getComputedStyle(node.parentElement!.parentElement!).backgroundColor,
      }));
      const luminance = (color: string) => {
        const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const contrast = (foreground: string) => {
        const a = luminance(foreground), b = luminance(colors.background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
      expect(contrast(colors.title)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.artist)).toBeGreaterThanOrEqual(4.5);
      console.log(`Index contrast ${theme}: title ${contrast(colors.title).toFixed(2)}, artist ${contrast(colors.artist).toFixed(2)}`);
      await page.screenshot({animations: "disabled", path: test.info().outputPath(`songs-${width}-${theme}.png`)});
      for (const song of songs) {
        const source = parseChordPro(readFileSync(resolve(__dirname, "../../../content/guitar/songs", song.path), "utf8"));
        const expectedRows = source.lines.filter((line) => line.kind === "lyrics").map((line) => ({
          line: String(line.location.line),
          segments: line.segments.map((segment) => ({text: segment.text, column: segment.chord ? String(segment.chord.location.column) : null})),
        }));
        await page.goto(`/songs/${song.slug}`);
        await expect(page.getByRole("heading", {name: song.title, exact: true})).toBeVisible();
        await page.screenshot({animations: "disabled", path: test.info().outputPath(`${song.slug}-${width}-${theme}.png`)});
        const settingsToggle = page.getByRole("button", {name: "악보 설정 열기", exact: true});
        if (await settingsToggle.isVisible()) await settingsToggle.click();
        await page.getByRole("button", {name: "한 음 높이기"}).click();
        const options = page.getByRole("complementary", {name: "악보 설정"});
        await expect(options).toBeVisible();
        const larger = options.getByRole("button", {name: "A＋ · 글자 크게"});
        for (let i = 0; i < 7 && await larger.isEnabled(); i++) await larger.click();
        await expect(options.getByText("28px", {exact: true})).toBeVisible();
        await expect(page.getByRole("dialog")).toHaveCount(0);
        const actual = await page.locator("[data-source-line]").evaluateAll((rows) => rows.map((row) => ({
          line: row.getAttribute("data-source-line"),
          segments: Array.from(row.children).map((segment) => ({
            text: segment.lastElementChild!.textContent,
            column: segment.getAttribute("data-source-column"),
          })),
        })));
        expect(actual).toEqual(expectedRows);
        const geometry = await page.locator("[data-source-line]").evaluateAll((rows) => rows.every((row) => {
          const segments = Array.from(row.children);
          return segments.every((segment) => {
            const chord = segment.firstElementChild!.getBoundingClientRect();
            const lyrics = segment.lastElementChild!.getBoundingClientRect();
            return Math.abs(chord.left - lyrics.left) < 1 && Math.abs(lyrics.top - segments[0].lastElementChild!.getBoundingClientRect().top) < 1;
          });
        }));
        expect(geometry).toBe(true);
        const separatedChords = await page.locator('[data-has-lyrics="false"]').evaluateAll((rows) => rows.every((row) => {
          const segments = Array.from(row.children);
          return segments.slice(0, -1).every((segment, index) => {
            const chord = segment.firstElementChild!.firstElementChild;
            return !chord || segments[index + 1].getBoundingClientRect().left - chord.getBoundingClientRect().right >= 7;
          });
        }));
        expect(separatedChords).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        const sheet = page.getByRole("region", {name: /코드 악보, 긴 행/});
        expect((await sheet.boundingBox())!.width).toBeLessThanOrEqual(832);
        await sheet.focus();
        await page.keyboard.press("ArrowRight");
        const controls = page.getByRole("complementary", {name: "악보 설정"});
        await expect(controls.getByRole("button", {name: "스크롤 시작 · 자동 스크롤 시작 / 재개"})).toHaveCount(1);
        if (width < 720) {
          expect(await controls.evaluate((node) => getComputedStyle(node).position)).not.toBe("fixed");
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await expect.poll(async () => {
            const footer = await page.locator("footer").boundingBox();
            return footer!.y + footer!.height;
          }).toBeLessThanOrEqual(901);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await sheet.evaluate((node) => {node.scrollLeft = 0;});
        await page.screenshot({animations: "disabled", path: test.info().outputPath(`${song.slug}-large-${width}-${theme}.png`)});
      }
      await page.locator("h1").evaluate((title) => {title.textContent = "매우 긴 한국어 제목과 日本語の長い曲名이 함께 있는 악보 제목 줄바꿈 검사";});
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      const h1 = await page.locator("h1").boundingBox();
      const artist = await page.locator("article header > p").first().boundingBox();
      expect(h1!.y + h1!.height).toBeLessThanOrEqual(artist!.y);
    });
  }
}

test("retains manual playback in reduced motion with inline keyboard settings", async ({page}) => {
  await page.setViewportSize({width:390,height:900});
  await page.emulateMedia({reducedMotion: "reduce"});
  await page.goto("/songs/vaundy--shiawase");
  const optionsButton = page.getByRole("button", {name: "악보 설정 열기", exact: true});
  await optionsButton.focus();
  await page.keyboard.press("Enter");
  const expandedButton = page.getByRole("button", {name: "악보 설정 접기", exact: true});
  await expect(expandedButton).toHaveAttribute("aria-expanded", "true");
  await expect(expandedButton).toBeFocused();
  await page.getByRole("button", {name: "스크롤 시작 · 자동 스크롤 시작 / 재개"}).click();
  await expect(page.getByRole("button", {name: "스크롤 정지 · 자동 스크롤 일시정지"})).toBeVisible();
  await page.keyboard.press("PageDown");
  await expect(page.getByRole("button", {name: "스크롤 시작 · 자동 스크롤 시작 / 재개"})).toBeVisible();
});
