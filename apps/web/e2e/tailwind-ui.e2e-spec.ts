import {expect, test} from "@playwright/test";

// Variant/state coverage lives in Storybook; the temporary /ui-review fixture is retired.

test("header controls and guitar controls share geometry and keyboard focus", async ({page, baseURL}) => {
  await page.setViewportSize({width: 390, height: 900});
  await page.goto("/ko/blog");
  await page.getByRole("button", {name: "메뉴", exact: true}).click();
  const header = page.locator("header");
  await expect(header.getByRole("link", {name: "Posts", exact: true})).toBeVisible();
  await expect(header.getByRole("link", {name: "Records", exact: true})).toBeVisible();
  const theme = header.locator(".theme-toggle__trigger");
  await expect(theme).toHaveText("Snowy");
  await theme.click();
  await expect(theme).toHaveText("Starry");
  await theme.click();
  await expect(theme).toHaveText("Snowy");
  for (const control of await header.locator(".button:visible").all()) {
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(control).toHaveCSS("border-radius", "8px");
  }
  const locale = page.getByRole("button", {name: /언어/});
  await expect(locale).toHaveText("한국어");
  await locale.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", {name: /한국어/})).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", {name: /English/})).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(locale).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", {name: "메뉴", exact: true})).toBeFocused();
  const guitar = new URL(baseURL!); guitar.hostname = "guitar.localhost";
  await page.goto(`${guitar.origin}/songs`);
  const songsLink = page.getByRole("navigation", {name: "주요 탐색"}).getByRole("link", {name: "악보", exact: true});
  await expect(songsLink).toHaveAttribute("data-slot", "link");
  await expect(songsLink).not.toHaveClass(/\bbutton\b/);
  const category = page.getByRole("radiogroup", {name: "곡 카테고리"});
  await expect(category).toBeVisible();
  const all = category.getByRole("radio", {name: "모든 곡"});
  await all.focus();
  await page.keyboard.press("End");
  await expect(category.getByRole("radio").last()).toBeFocused();
  await page.keyboard.press("Space");
  await expect(category.getByRole("radio").last()).toHaveAttribute("aria-checked", "true");
  await all.click();
  await expect(all).toHaveAttribute("aria-checked", "true");
});
