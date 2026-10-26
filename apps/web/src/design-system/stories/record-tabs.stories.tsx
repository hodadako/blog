import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { RecordView } from "@/app/[locale]/records/record-view";
import recordMeta from "./records.stories";
const meta = {
  title: "Components/Navigation/RecordTabs",
  component: RecordView,
  args: recordMeta.args,
  parameters: {
    docs: {
      description: {
        component:
          "Actual Records tablist and panel. Arrow keys/Home/End select and move focus; selection remains represented in URL state. Previous/next items remain links rather than disabled buttons.",
      },
    },
  },
} satisfies Meta<typeof RecordView>;
export default meta;
export const Keyboard: StoryObj<typeof meta> = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("tab", { name: args.labels.detailTabLabel }),
    );
    await userEvent.keyboard("{End}");
    await expect(
      canvas.getByRole("tab", { name: args.labels.profileTabLabel }),
    ).toHaveFocus();
    await expect(canvas.getByRole("tabpanel")).toBeVisible();
    await userEvent.keyboard("{Home}");
    await expect(
      canvas.getByRole("tab", { name: args.labels.detailTabLabel }),
    ).toHaveAttribute("aria-selected", "true");
  },
};
