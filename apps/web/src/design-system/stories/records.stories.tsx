import type { Route } from "next";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { RecordView } from "@/app/[locale]/records/record-view";
import { getDictionary } from "@/lib/site";
const meta = {
  title: "Components/Overlay/RecordDialog",
  component: RecordView,
  args: {
    item: {
      id: "storybook-record",
      type: "album",
      publishedOn: "2026-10-25",
      href: "https://hodako.dev",
      source: "Hodako",
      title: "기록과 음악",
      summary: "기존 Records 패턴을 그대로 확인합니다.",
      imageUrl: "/images/profile-photo.jpg",
    },
    index: 0,
    total: 1,
    initialTab: "detail",
    initialPlaying: false,
    backHref: "/ko/records" as Route,
    labels: getDictionary("ko").recordsPage,
  },
  parameters: {
    docs: {
      description: {
        component:
          "The existing native dialog and Records tabs, without a new generic overlay package. Native Escape, close-button naming and focus restoration are tested. Art/disc effects keep their domain layout and motion.",
      },
    },
  },
} satisfies Meta<typeof RecordView>;
export default meta;
export const Detail: StoryObj<typeof meta> = {};
export const Dialog: StoryObj<typeof meta> = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", {
      name: args.labels.zoomLabel.replace("{title}", args.item.title),
    });
    await userEvent.click(trigger);
    const dialog = canvas.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: args.labels.closeLabel }),
    );
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toHaveFocus();
  },
};
export const Tabs: StoryObj<typeof meta> = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("tab", { name: args.labels.detailTabLabel }),
    );
    await userEvent.keyboard("{End}");
    await expect(
      canvas.getByRole("tab", { name: args.labels.profileTabLabel }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toBeVisible();
  },
};
