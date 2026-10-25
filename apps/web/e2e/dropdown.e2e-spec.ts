import {expect, test} from "@playwright/test";

for (const width of [390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`${width}px ${theme}: Blog and Guitar share dropdown styles and keyboard behavior`, async ({page, baseURL}, testInfo) => {
    await page.setViewportSize({width, height: 900});
    await page.addInitScript(theme => localStorage.setItem("site-theme", theme), theme);
    await page.goto("/ko/blog");
    if (width === 390) await page.getByRole("button", {name: "메뉴", exact: true}).click();
    const language = page.locator(".locale-switcher__trigger");
    await language.focus();
    await page.keyboard.press("ArrowDown");
    const currentLanguage = page.getByRole("menuitemradio", {name: "한국어", exact: true});
    await expect(currentLanguage).toBeFocused();
    const menu = page.getByRole("menu", {name: "언어", exact: true});
    const menuStyle = await menu.evaluate(element => {
      const s = getComputedStyle(element);
      return {background: s.backgroundColor, border: s.borderColor, radius: s.borderRadius, shadow: s.boxShadow, padding: s.padding};
    });
    await expect(language).toHaveAttribute("data-variant", "outline");
    await expect(language).toHaveText("한국어");
    await page.screenshot({path: testInfo.outputPath(`blog-menu-${width}-${theme}.png`), animations: "disabled"});
    await page.keyboard.press("Escape");
    await expect(language).toBeFocused();

    const guitar = new URL(baseURL!); guitar.hostname = "guitar.localhost";
    await page.goto(`${guitar.origin}/songs/vaundy--shiawase`);
    const settings = page.getByRole("button", {name: "악보 설정 열기", exact: true});
    if (await settings.isVisible()) await settings.click();
    const capo = page.getByRole("combobox", {name: "카포 위치", exact: true});
    for (const control of [capo, page.getByRole("combobox", {name: "가사 표기", exact: true}), page.getByRole("combobox", {name: "자동 스크롤 속도", exact: true})]) {
      await expect(control).toHaveCSS("font-size", "13px");
      await expect(control).toHaveCSS("font-weight", "500");
      await expect(control).toHaveCSS("border-radius", "8px");
      await expect(control).toHaveAttribute("data-variant", "outline");
      expect((await control.boundingBox())!.height).toBe(44);
    }
    await capo.focus();
    await page.keyboard.press("ArrowDown");
    const list = page.getByRole("listbox", {name: "카포 위치", exact: true});
    await expect(list).toBeVisible();
    const selected = page.getByRole("option", {name: "카포 없음", exact: true});
    await expect(selected).toHaveAttribute("data-state", "checked");
    await expect(selected).toHaveCSS("font-size", "13px");
    await expect(selected).toHaveCSS("font-weight", "500");
    expect((await selected.boundingBox())!.height).toBe(44);
    expect(await list.evaluate(element => {
      const s = getComputedStyle(element);
      return {background: s.backgroundColor, border: s.borderColor, radius: s.borderRadius, shadow: s.boxShadow, padding: s.padding};
    })).toEqual(menuStyle);
    const box = await list.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(900);
    await page.screenshot({path: testInfo.outputPath(`guitar-menu-${width}-${theme}.png`), animations: "disabled"});
    await page.keyboard.press("Escape");
    await expect(capo).toBeFocused();
    await expect(capo).toHaveAttribute("data-value", "0");
    await page.keyboard.press("Space");
    await page.keyboard.press("End");
    await expect(page.getByRole("option", {name: "12프렛", exact: true})).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("option", {name: "카포 없음", exact: true})).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", {name: "1프렛", exact: true})).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(capo).toHaveAttribute("data-value", "1");
    await expect(capo).toBeFocused();
    await page.reload();
    if (await settings.isVisible()) await settings.click();
    await expect(capo).toHaveText("1프렛");
    await expect(page.getByRole("button", {name: "곡 설정 초기화", exact: true})).toHaveAttribute("data-variant", "ghost");
    await expect(page.getByRole("button", {name: "현재 키·카포 저장", exact: true})).toHaveAttribute("data-variant", "secondary");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test("select typeahead chooses a lyric mode without changing score semantics", async ({page, baseURL}) => {
  const guitar = new URL(baseURL!); guitar.hostname = "guitar.localhost";
  await page.goto(`${guitar.origin}/songs/vaundy--shiawase`);
  const lyrics = page.getByRole("combobox", {name: "가사 표기", exact: true});
  await lyrics.focus();
  await page.keyboard.press("Space");
  await page.keyboard.type("Rom");
  await expect(page.getByRole("option", {name: "Romaji", exact: true})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(lyrics).toHaveText("Romaji");
  await expect(page.getByRole("region", {name: /しわあわせ 코드 악보/})).toBeVisible();
  await expect(page.locator('[data-chord-kind="no-chord"]')).toHaveCount(4);
});
