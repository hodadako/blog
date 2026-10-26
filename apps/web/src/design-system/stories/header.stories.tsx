import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SiteHeader } from "@/components/site-header";
const meta = {
  title: "Patterns/Header",
  component: SiteHeader,
  args: { locale: "ko" },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The production header: original wordmark, route links, locale menu and font/theme toggles. App Router pathname is mocked by the official framework. Use the viewport toolbar to inspect the mobile disclosure and keyboard focus restoration.",
      },
    },
  },
} satisfies Meta<typeof SiteHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blog: Story = {};
export const English: Story = {
  args: { locale: "en" },
  parameters: { nextjs: { navigation: { pathname: "/en/blog" } } },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = {
  globals: {
    viewport: {
      value: "mobile",
      isRotated: false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole("button", { name: "메뉴" });
    await userEvent.click(menu);
    await expect(canvas.getByRole("link", { name: "Posts" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(menu).toHaveFocus();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  },
};
export const Controls: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.queryByRole("button", { name: "메뉴" });
    if (menu) await userEvent.click(menu);
    const theme = canvas.getByRole("button", {
      name: "Snowy · Starry 테마로 전환",
    });
    await userEvent.click(theme);
    await expect(theme).toHaveAttribute("aria-pressed", "true");
    const font = canvas.getByRole("button", {
      name: "Ag기본 · Pretendard 글꼴로 전환",
    });
    await userEvent.click(font);
    await expect(font).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(font);
  },
};
