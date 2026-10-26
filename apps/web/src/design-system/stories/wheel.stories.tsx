import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { WheelPicker } from "@/components/wheel-picker";
const meta = {
  title: "Components/Forms/WheelPicker",
  component: WheelPicker,
  args: {
    label: "순서 선택",
    options: [
      {
        value: "1",
        label: "첫 번째",
      },
      {
        value: "2",
        label: "두 번째",
      },
      {
        value: "3",
        label: "세 번째",
      },
    ],
    value: "1",
    onValueChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Existing prepared component; no product deployment yet. Ordered, non-looping selection supports arrows/Home/End, scrolling and dragging. This story does not introduce a new product use.",
      },
    },
  },
} satisfies Meta<typeof WheelPicker>;
export default meta;
export const Interactive: StoryObj<typeof meta> = {
  render: function Interactive(args) {
    const [value, setValue] = useState(args.value);
    return <WheelPicker {...args} value={value} onValueChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard("{End}");
    await expect(
      canvas.getByRole("option", { name: "세 번째" }),
    ).toHaveAttribute("aria-selected", "true");
  },
};
export const Disabled: StoryObj<typeof meta> = { args: { disabled: true } };
