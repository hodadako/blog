import { expect, test } from "@playwright/test";

for (const width of [390, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`visual ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const id of [
        "components-actions-button--variants",
        "patterns-article--reading",
        "patterns-guitar-controls--workspace",
      ]) {
        await page.goto(
          `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`,
        );
        const root = page.locator("#storybook-root");
        await expect(root).not.toBeEmpty();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.evaluate(() => document.fonts.ready);
        await expect(root).toHaveScreenshot(`${id}-${width}-${theme}.png`);
        if (id === "components-actions-button--variants") {
          const primary = page.getByRole("button", { name: "primary", exact: true });
          await expect(primary).toHaveCSS("border-radius", "8px");
          const idle = await primary.evaluate(el => getComputedStyle(el).backgroundColor);
          await primary.hover();
          await expect.poll(() => primary.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(idle);
          await page.mouse.down();
          await expect(primary).toHaveCSS("transform", "none");
          await page.mouse.up();
          await primary.focus();
          await page.keyboard.press("Tab");
          await page.keyboard.press("Shift+Tab");
          await expect(primary).toBeFocused();
          await expect(primary).toHaveCSS("outline-style", "solid");
          await expect(primary).toHaveCSS("outline-width", "2px");
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
        ).toBeLessThanOrEqual(1);
      }
    });
  }

test("native dialog Escape and focus restoration", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-overlay-recorddialog--detail&viewMode=story",
  );
  const trigger = page.getByRole("button", {
    name: "기록과 음악 이미지 크게 보기",
  });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("header language menu keeps keyboard navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/iframe.html?id=patterns-header--blog&viewMode=story");
  const language = page.getByRole("button", { name: "언어 한국어" });
  await language.focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitemradio", { name: "한국어", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitemradio", { name: "English", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(language).toBeFocused();
});
