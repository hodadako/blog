import {expect, test} from "@playwright/test";

const article = "/ko/blog/gave-up-bean-validation";

for (const width of [320, 390, 768, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: list, article and keyboard focus stay within viewport`, async ({page}) => {
      await page.setViewportSize({width, height: 900});
      await page.addInitScript((theme) => localStorage.setItem("site-theme", theme), theme);
      for (const route of ["/ko/blog", article]) {
        await page.goto(route);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        expect(await page.locator(".site-shell__meteor").count()).toBe(6);
        await page.keyboard.press("Tab");
        await expect(page.getByRole("link", {name: "본문으로 건너뛰기"})).toBeFocused();
        expect(await page.locator(".skip-link").evaluate((element) => {
          const box = element.getBoundingClientRect();
          return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
        })).toBe(true);
        await page.keyboard.press("Enter");
        await expect(page.locator("main")).toBeFocused();
        await expect(page.locator("footer")).toBeVisible();
        if (route === article) {
          expect(await page.locator(".blog-post-page__article").evaluate((element) => getComputedStyle(element, "::before").content)).toBe("none");
          await expect.poll(() => page.evaluate(() => document.querySelector("h1")!.getBoundingClientRect().top - document.querySelector("header.site-header")!.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
        }
      }
      for (const image of await page.locator(".detail-content img").all()) {
        const box = await image.boundingBox();
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      await expect(page.locator("pre.shiki").first()).toBeVisible();
      const region = page.getByRole("region", {name: /코드$/}).first();
      await region.focus();
      await expect(region).toHaveCSS("outline-style", "solid");
    });
  }
}

test("mobile navigation: Escape restores focus, locale and theme persist", async ({page}) => {
  await page.setViewportSize({width: 320, height: 900});
  await page.goto("/ko/blog");
  const menu = page.locator(".mobile-header-shell__toggle");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const locale = page.locator(".locale-switcher__trigger");
  await locale.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(locale).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await page.locator(".theme-toggle__trigger").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // Records exists in both locales; an empty English blog intentionally falls back to Korean.
  await page.goto("/ko/records");
  await menu.click();
  await locale.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio").first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("menuitemradio").last()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en\/records$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("reduced motion freezes snow and stars, preserves their static rendering and disables smooth scroll", async ({page}) => {
  await page.emulateMedia({reducedMotion: "reduce"});
  await page.goto("/ko/blog");
  const canvas = page.locator(".site-shell__snowfall canvas");
  await expect(canvas).toBeVisible();
  const snapshot = () => canvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await expect.poll(() => canvas.evaluate((canvas: HTMLCanvasElement) => canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0))).toBe(true);
  const first = await snapshot();
  await page.waitForTimeout(200);
  expect(await snapshot()).toBe(first);
  expect(await canvas.evaluate((canvas: HTMLCanvasElement) => canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0))).toBe(true);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await page.emulateMedia({reducedMotion: "no-preference"});
  await expect.poll(snapshot).not.toBe(first);
  await page.locator(".theme-toggle__trigger").click();
  await expect(page.locator(".site-shell__meteor").first()).toHaveCSS("animation-name", "meteor-fall");
  await page.emulateMedia({reducedMotion: "reduce"});
  await expect(page.locator(".site-shell__meteor").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator(".site-shell__sky-layer--stars")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".site-shell__meteor").first()).toHaveCSS("opacity", "0.14");
});

test("code clipboard failure is announced and does not throw", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", {value: {writeText: () => Promise.reject(new Error("denied"))}}));
  await page.goto(article);
  await page.getByRole("button", {name: "복사", exact: true}).first().click();
  await expect(page.getByRole("status").filter({hasText: "복사 실패"})).toBeVisible();
  expect(errors).toEqual([]);
});

test("blocked storage preserves the header and its theme/font controls", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", {
    get() { throw new DOMException("Storage denied", "SecurityError"); },
  }));
  await page.goto("/ko/blog");
  await page.locator(".theme-toggle__trigger").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator(".font-toggle__trigger").click();
  await expect(page.locator("html")).toHaveAttribute("data-font", "pretendard");
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: background runs despite a legacy pause preference`, async ({page}) => {
      await page.setViewportSize({width, height: 900});
      await page.emulateMedia({reducedMotion: "no-preference"});
      await page.addInitScript((theme) => {
        localStorage.setItem("site-theme", theme);
        localStorage.setItem("site-motion", "paused");
      }, theme);
      const expectRunning = async (): Promise<void> => {
        await expect(page.locator("html")).not.toHaveAttribute("data-motion", "paused");
        await expect(page.locator(".motion-toggle__trigger")).toHaveCount(0);
        if (theme === "light") {
          const canvas = page.locator(".site-shell__snowfall canvas");
          await expect(canvas).toBeVisible();
          const first = await canvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
          await expect.poll(() => canvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).not.toBe(first);
        } else {
          await expect(page.locator(".site-shell__meteor").first()).toHaveCSS("animation-play-state", "running");
          await expect(page.locator(".site-shell__meteor").first()).toHaveCSS("animation-name", "meteor-fall");
        }
      };
      await page.goto("/ko/blog");
      if (width === 390) await page.locator(".mobile-header-shell__toggle").click();
      await expectRunning();
      await page.reload();
      await expectRunning();
      await page.goto("/ko/records");
      if (width === 390) await page.locator(".mobile-header-shell__toggle").click();
      await page.locator(".locale-switcher__trigger").click();
      await page.getByRole("menuitemradio", {name: "English", exact: true}).click();
      await page.waitForURL("**/en/records");
      await expectRunning();
    });
  }
}

test("background runs when persistent storage is blocked", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({reducedMotion: "no-preference"});
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", {
    get() { throw new DOMException("Storage denied", "SecurityError"); },
  }));
  await page.goto("/ko/blog");
  await expect(page.locator(".motion-toggle__trigger")).toHaveCount(0);
  const canvas = page.locator(".site-shell__snowfall canvas");
  await expect(canvas).toBeVisible();
  const first = await canvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await expect.poll(() => canvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).not.toBe(first);
  expect(errors).toEqual([]);
});

test("skip link closes an expanded mobile menu and reveals the article", async ({page}) => {
  await page.setViewportSize({width: 320, height: 900});
  await page.goto(article);
  await page.locator(".mobile-header-shell__toggle").click();
  const skip = page.getByRole("link", {name: "본문으로 건너뛰기"});
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".mobile-header-shell__toggle")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("main")).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.querySelector("h1")!.getBoundingClientRect().top - document.querySelector("header.site-header")!.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
});
