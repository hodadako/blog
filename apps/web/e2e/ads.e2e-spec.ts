import { expect, test, type Page } from "@playwright/test";

const article = "/ko/blog/gave-up-bean-validation";
const testPublisher = "ca-pub-1234567890123456";

async function consent(page: Page, value: "granted" | "denied") {
  await page.evaluate(value => {
    window.hodakoAdvertisingConsent = value;
    window.dispatchEvent(new Event("hodako:advertising-consent"));
  }, value);
}

test.beforeEach(async ({ page }) => {
  // Absolutely no real impressions or Google network traffic in tests.
  await page.route(/googlesyndication\.com|doubleclick\.net|googleadservices\.com/, route => route.abort());
});

test("verification on both hosts; unknown/denied consent sends no ad request or DOM", async ({ page, request, baseURL }) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("adsbygoogle.js")) requests.push(request.url()); });
  await page.goto(article);
  await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute("content", testPublisher);
  await expect(page.locator("[data-ad-placement], script#hodako-adsense")).toHaveCount(0);
  await consent(page, "denied");
  await expect(page.locator("[data-ad-placement], script#hodako-adsense")).toHaveCount(0);
  expect(requests).toHaveLength(0);
  const port = new URL(baseURL!).port;
  for (const origin of [baseURL!, `http://guitar.localhost:${port}`]) {
    const response = await request.get(`${origin}/ads.txt`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    expect(await response.text()).toContain("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0");
  }
});

for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
  test(`${width}px ${theme}: only article end, single initialization, bounded geometry`, async ({ page }, info) => {
    let scripts = 0;
    await page.route("**/pagead/js/adsbygoogle.js?**", route => {
      scripts++;
      return route.fulfill({contentType:"text/javascript", body:`window.__adPushes=0;window.adsbygoogle={push:function(){window.__adPushes++;document.querySelectorAll('ins.adsbygoogle').forEach(n=>n.setAttribute('data-adsbygoogle-status','done'));}};`});
    });
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(theme => localStorage.setItem("site-theme", theme), theme);
    await page.goto(article);
    await consent(page, "granted");
    const slot = page.locator('[data-ad-placement="article-end"]');
    await expect(slot).toBeVisible();
    await expect(page.locator("ins.adsbygoogle")).toHaveAttribute("data-adsbygoogle-status", "done");
    await expect(page.locator("ins")).toHaveAttribute("data-full-width-responsive", "false");
    expect(scripts).toBe(1);
    expect(await page.evaluate(() => (window as Window & { __adPushes: number }).__adPushes)).toBe(1);
    expect((await slot.boundingBox())!.width).toBeLessThanOrEqual(Math.min(width,704));
    const reading = await page.locator("article").boundingBox();
    expect((await slot.boundingBox())!.x).toBeCloseTo(reading!.x,0);
    expect((await slot.boundingBox())!.width).toBeCloseTo(reading!.width,0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    expect(await slot.evaluate(n => Boolean(n.previousElementSibling?.querySelector("article")))).toBe(true);
    await slot.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`ad-${width}-${theme}.png`), animations: "disabled" });
    // SPA leave/back creates one new physical unit, while keeping one script.
    await page.locator('footer a[href="/ko/blog"]').click();
    await expect(slot).toHaveCount(0);
    await page.goBack();
    await expect(page.locator("ins.adsbygoogle")).toHaveAttribute("data-adsbygoogle-status", "done");
    expect(scripts).toBe(1);
    expect(await page.evaluate(() => (window as Window & { __adPushes: number }).__adPushes)).toBe(2);
    await consent(page,"denied");
    await expect(slot).toHaveCount(0);
  });
}

test("list, Records, English list and Guitar never gain placements", async ({ page, baseURL }) => {
  const port = new URL(baseURL!).port;
  await page.addInitScript(() => { window.hodakoAdvertisingConsent = "granted"; });
  for (const route of ["/ko/blog", "/en/blog", "/ko/records", `http://guitar.localhost:${port}/songs`, `http://guitar.localhost:${port}/songs/vaundy--shiawase`]) {
    await page.goto(route);
    await expect(page.locator("[data-ad-placement], script#hodako-adsense")).toHaveCount(0);
  }
});

test("blocked script fails once without retries or broken content", async ({ page }) => {
  let attempts = 0;
  await page.route("**/pagead/js/adsbygoogle.js?**", route => { attempts++; return route.abort(); });
  await page.goto(article);
  await consent(page,"granted");
  await expect.poll(() => attempts).toBe(1);
  await expect(page.locator("[data-ad-placement]")).toHaveCount(0);
  await consent(page,"denied");
  await consent(page,"granted");
  await expect(page.locator("[data-ad-placement]")).toHaveCount(0);
  expect(attempts).toBe(1);
  await expect(page.locator("h1")).toBeVisible();
});
