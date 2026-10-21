import {expect, test} from "@playwright/test";

for (const width of [390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`${width}px ${theme}: control variants, sizes and native states`, async ({page}, testInfo) => {
    test.skip(process.env.UI_REVIEW_FIXTURE !== "1", "Requires the isolated control-gallery route; see docs/design-system/tailwind-ui-integration.md");
    await page.setViewportSize({width, height: 1000});
    await page.addInitScript(theme => localStorage.setItem("site-theme", theme), theme);
    await page.goto("/ko/ui-review");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    for (const variant of ["primary", "secondary", "outline", "ghost", "destructive"]) {
      const section = page.getByRole("region", {name: variant, exact: true});
      for (const [label, height] of [["작게", 44], ["기본", 48], ["크게", 56]] as const) {
        const button = section.getByRole("button", {name: label, exact: true});
        expect((await button.boundingBox())!.height).toBe(height);
        await expect(button).toHaveCSS("border-radius", "8px");
        await expect(button).toHaveCSS("font-family", /Blog Korean Title/);
      }
      const icon = section.getByRole("button", {name: `${variant} 추가`});
      expect((await icon.boundingBox())!.width).toBe(44);
      expect((await icon.boundingBox())!.height).toBe(44);
      const disabled = section.getByRole("button", {name: "사용 불가"});
      await expect(disabled).toBeDisabled();
      await expect(disabled).toHaveCSS("opacity", "0.55");
    }
    const primary = page.getByRole("region", {name: "primary", exact: true}).getByRole("button", {name: "기본", exact: true});
    await page.mouse.move(0, 0);
    const idle = await primary.evaluate(el => getComputedStyle(el).backgroundColor);
    await primary.hover();
    await expect.poll(() => primary.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(idle);
    await page.mouse.down();
    await expect(primary).toHaveCSS("transform", "none");
    await page.mouse.up();
    await primary.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(primary).toHaveCSS("outline-style", "solid");
    await expect(primary).toHaveCSS("outline-width", "2px");
    const toggle = page.getByRole("button", {name: "상태 전환"});
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    const first = page.getByRole("radio", {name: "첫 번째"});
    const last = page.getByRole("radio", {name: "마지막"});
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(last).toBeFocused();
    await page.keyboard.press("Space");
    await expect(last).toHaveAttribute("aria-checked", "true");
    await last.click();
    await expect(last).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Home");
    await expect(first).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({path: testInfo.outputPath(`controls-${width}-${theme}.png`), fullPage: true, animations: "disabled"});
  });
}

test("header controls and guitar controls share geometry and keyboard focus", async ({page, baseURL}) => {
  await page.setViewportSize({width: 390, height: 900});
  await page.goto("/ko/blog");
  await page.getByRole("button", {name: "메뉴", exact: true}).click();
  const header = page.locator("header");
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
