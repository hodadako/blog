import type {Page} from "@playwright/test";

export async function selectControlValue(page: Page, name: string, value: string): Promise<void> {
  await page.getByRole("combobox", {name, exact: true}).click();
  await page.getByRole("option").and(page.locator(`[data-value="${value}"]`)).click();
}
