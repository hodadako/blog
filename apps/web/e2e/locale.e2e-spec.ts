import {expect, test} from "@playwright/test";

test.use({javaScriptEnabled: false});

for (const locale of ["ko", "en"] as const) {
  test(`${locale}: server HTML and redirects work without JavaScript`, async ({page, request}) => {
    const response = await request.get(`/${locale}`);
    expect(new URL(response.url()).pathname).toBe(`/${locale}/blog`);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toMatch(new RegExp(`<html[^>]*lang="${locale}"`));

    await page.goto(`/${locale}/blog`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator(".site-shell")).toHaveAttribute("lang", locale);
    await expect(page.locator("footer")).toBeVisible();
  });
}

test("article server HTML follows its locale", async ({page}) => {
  await page.goto("/ko/blog");
  const postLink = page.locator(".post-card__surface").first();
  await expect(postLink).toBeVisible();
  await postLink.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.locator("article h1")).toBeVisible();
});

test.describe("font preference", () => {
  test.use({javaScriptEnabled: true});

  test("Pretendard loads and survives CSS ordering, reload and locale switching", async ({page}) => {
    await page.goto("/ko/blog");
    await page.getByRole("button", {name: "Pretendard 글꼴로 전환", exact: true}).click();
    await expect(page.locator("html")).toHaveAttribute("data-font", "pretendard");

    const loaded = await page.evaluate(async () => {
      const faces = await document.fonts.load('16px "Pretendard Variable"', "한국어 English");
      return faces.some((face) => face.family === "Pretendard Variable" && face.status === "loaded");
    });
    expect(loaded).toBe(true);

    // Reproduce development CSS chunks arriving after the preference rule.
    await page.addStyleTag({content: ":root { --font-body: var(--font-body-default); --font-ui: var(--font-ui-default); }"});
    expect(await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Pretendard Variable");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-font", "pretendard");
    await page.locator(".locale-switcher__trigger").click();
    await page.getByRole("menuitemradio", {name: "English", exact: true}).click();
    await page.waitForURL("**/en/blog");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("data-font", "pretendard");
    expect(await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Pretendard Variable");

    await page.getByRole("button", {name: "Switch to default font", exact: true}).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-font", "pretendard");
    expect(await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Blog Korean Title");
  });
});
