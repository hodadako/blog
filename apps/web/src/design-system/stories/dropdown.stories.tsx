import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DropdownMenu } from "@/components/dropdown-menu";
const meta = {
  title: "Components/Overlay/DropdownMenu",
  component: DropdownMenu,
  args: {
    label: "언어",
    value: "ko",
    options: [
      {
        value: "ko",
        label: "한국어",
      },
      {
        value: "en",
        label: "English",
      },
    ],
    onValueChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Single-choice action menu used by LocaleSwitcher. Escape/outside click/blur close; arrows and Home/End move focus. A selection delegates routing to its consumer. Guitar SelectControl shares visual styles while preserving listbox semantics. Native title hints do not justify an unused Tooltip or Popover abstraction.",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;
export default meta;
export const Interactive: StoryObj<typeof meta> = {
  render: function Interactive(args) {
    const [value, setValue] = useState(args.value);
    return <DropdownMenu {...args} value={value} onValueChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /언어 한국어/ });
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(
        canvas.getByRole("menuitemradio", { name: "한국어" }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard("{End}{Enter}");
    await expect(trigger).toHaveTextContent("English");
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveFocus();
  },
};
export const Dark: StoryObj<typeof meta> = {
  ...Interactive,
  globals: { theme: "dark" },
};
