import {expect, test} from "@playwright/test";
import {selectControlValue} from "./helpers/select-control";

for (const width of [390, 768, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: production pages preserve their layout`, async ({page, baseURL}, testInfo) => {
      await page.setViewportSize({width, height: 900});
      await page.addInitScript(theme => localStorage.setItem("site-theme", theme), theme);
      await page.goto("/ko/records");
      const record = await page.locator(".record-tile__button").first().getAttribute("href");
      expect(record).toBeTruthy();
      const guitarOrigin = new URL(baseURL!);
      guitarOrigin.hostname = "guitar.localhost";
      const pages = [
        ["blog", "/ko/blog"],
        ["article", "/ko/blog/gave-up-bean-validation"],
        ["records", "/ko/records"],
        ["record", record!],
        ["songs", `${guitarOrigin.origin}/songs`],
        ["song", `${guitarOrigin.origin}/songs/vaundy--shiawase`],
      ];
      for (const [name, route] of pages) {
        const response = await page.goto(route);
        expect(response?.status(), route).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
        await expect(page.locator("main")).toBeVisible();
        if (!name.startsWith("record")) await expect(page.locator("footer")).toBeVisible();
        else await expect(page.locator("footer")).toHaveCount(0);
        if (name === "blog") {
          await expect(page.locator("h1")).toHaveClass("sr-only");
          await expect(page.locator(".site-shell__meteor")).toHaveCount(6);
        }
        if (name === "article") {
          expect(await page.locator(".blog-post-page__article").evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(704);
          await expect(page.locator("pre.shiki").first()).toBeVisible();
        }
        for (const image of await page.locator("img").all()) {
          const visible = await image.evaluate(element => {
            const box = element.getBoundingClientRect();
            return box.top < innerHeight && box.bottom > 0;
          });
          if (visible) await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
        }
        await page.screenshot({path: testInfo.outputPath(`${name}-${width}-${theme}.png`), animations: "disabled"});
      }
    });
  }
}

for (const theme of ["light", "dark"]) {
test(`${theme}: shared guitar actions retain keyboard, forms, presets and search behavior`, async ({page, baseURL}, testInfo) => {
  await page.addInitScript(theme => localStorage.setItem("site-theme", theme), theme);
  await page.setViewportSize({width: 390, height: 900});
  const guitarOrigin = new URL(baseURL!);
  guitarOrigin.hostname = "guitar.localhost";
  await page.goto(`${guitarOrigin.origin}/songs`);
  await page.getByRole("searchbox").fill("no-such-song");
  await expect(page.getByRole("status")).toHaveText("검색 결과가 없습니다.");
  await page.getByRole("button", {name: "검색 초기화"}).click();
  await page.locator("main a[href*='/songs/']").first().click();
  await page.getByRole("button", {name: "악보 설정 열기"}).click();
  const rail = page.getByRole("complementary", {name: "악보 설정"});
  const plus = rail.getByRole("button", {name: "한 음 높이기"});
  await page.keyboard.press("Tab");
  await plus.focus();
  await expect(plus).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(rail.getByRole("button", {name: "조옮김 원복 (현재 +1)", exact: true})).toBeEnabled();
  await selectControlValue(page, "카포 위치", "2");
  await rail.getByLabel("커버 이름").fill("공통 UI 검증");
  await rail.getByRole("button", {name: "현재 키·카포 저장"}).click();
  await page.reload();
  await page.getByRole("button", {name: "악보 설정 열기"}).click();
  await rail.getByRole("button", {name: /공통 UI 검증.*카포 2/}).click();
  await expect(rail.getByRole("combobox", {name: "카포 위치", exact: true})).toHaveAttribute("data-value", "2");
  await rail.screenshot({path: testInfo.outputPath(`settings-390-${theme}.png`), animations: "disabled"});
  for (const button of await rail.locator("button:visible").all()) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

}

test("one button token reaches blog forms and guitar actions", async ({page, baseURL}) => {
  const guitar = new URL(baseURL!);
  guitar.hostname = "guitar.localhost";
  for (const route of ["/ko/admin/login", `${guitar.origin}/songs/vaundy--shiawase`]) {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto(route);
    const buttons = page.locator("button.button:visible");
    expect(await buttons.count()).toBeGreaterThan(0);
    await page.addStyleTag({content: ":root { --button-radius: 12px; }"});
    for (const button of await buttons.all()) await expect(button).toHaveCSS("border-radius", "12px");
  }
});

test("Records keeps zoom restoration and roving tab keyboard behavior", async ({page}) => {
  await page.goto("/ko/records");
  const firstRecord = page.locator(".record-tile__button").first();
  await firstRecord.focus();
  await page.keyboard.press("Enter");
  const artwork = page.locator(".record-view__art-button");
  await artwork.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(artwork).toBeFocused();
  const detail = page.getByRole("tab", {name: "상세", exact: true});
  const profile = page.getByRole("tab", {name: "프로필", exact: true});
  await detail.focus();
  await page.keyboard.press("ArrowRight");
  await expect(profile).toBeFocused();
  await expect(profile).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/tab=profile/);
  await page.keyboard.press("Home");
  await expect(detail).toBeFocused();
  await expect(detail).toHaveAttribute("aria-selected", "true");
});
