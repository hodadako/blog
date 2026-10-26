import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ChordControl } from "@/features/guitar/components/chord-control";
const meta = {
  title: "Components/Actions/ChordControl",
  component: ChordControl,
  args: {
    chord: {
      kind: "chord",
      raw: "C",
      root: 0,
      suffix: "",
      supported: true,
      location: {
        line: 1,
        column: 1,
        endColumn: 4,
      },
    },
    onOpen: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Domain notation button used by SongReader. Hover/focus/tap opens the chord inspector. Keep original chord anchors, typography and transparent appearance; do not force a standard Button variant onto score notation.",
      },
    },
  },
} satisfies Meta<typeof ChordControl>;
export default meta;
export const Keyboard: StoryObj<typeof meta> = {
  play: async ({ canvasElement, args }) => {
    await userEvent.tab();
    await expect(
      within(canvasElement).getByRole("button", { name: "C 운지법 보기" }),
    ).toHaveFocus();
    await expect(args.onOpen).toHaveBeenCalled();
  },
};
