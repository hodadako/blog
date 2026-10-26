import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ToggleButton } from "@/components/ui";
const meta = {
  title: "Components/Actions/ToggleButton",
  component: ToggleButton,
  args: {
    pressed: false,
    children: "자동 스크롤",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Controlled pressed state maps to aria-pressed; storage belongs to the consumer. Use the same component for font, theme and Guitar playback state.",
      },
    },
  },
} satisfies Meta<typeof ToggleButton>;
export default meta;
export const Interactive: StoryObj<typeof meta> = {
  render: function Interactive(args) {
    const [pressed, setPressed] = useState(args.pressed);
    return (
      <ToggleButton
        {...args}
        pressed={pressed}
        onClick={() => setPressed(!pressed)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard(" ");
    await expect(button).toHaveAttribute("aria-pressed", "false");
  },
};
export const Pressed: StoryObj<typeof meta> = { args: { pressed: true } };
export const Disabled: StoryObj<typeof meta> = { args: { disabled: true } };
