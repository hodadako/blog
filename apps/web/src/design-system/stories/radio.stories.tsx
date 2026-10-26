import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { QuizOptions } from "@/components/quiz-options";
const meta = {
  title: "Components/Forms/QuizRadio",
  component: QuizOptions,
  args: {
    label: "정답",
    value: "a",
    onValueChange: fn(),
    options: [
      {
        id: "a",
        text: "첫 번째",
        label: null,
        imageUrl: null,
        altText: null,
      },
      {
        id: "b",
        text: "두 번째",
        label: null,
        imageUrl: null,
        altText: null,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          "Existing quiz radio cards, used by QuizGate. One Tab stop, arrow keys select and move focus. Images keep meaningful alt text; preserve fieldset disabled behavior. A general Checkbox has no current consumer and is intentionally absent.",
      },
    },
  },
} satisfies Meta<typeof QuizOptions>;
export default meta;
export const Interactive: StoryObj<typeof meta> = {
  render: function Interactive(args) {
    const [value, setValue] = useState(args.value);
    return <QuizOptions {...args} value={value} onValueChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(
      canvas.getByRole("radio", { name: "두 번째" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("radio", { name: "두 번째" })).toHaveFocus();
  },
};
export const Disabled: StoryObj<typeof meta> = {
  render: (args) => (
    <fieldset disabled>
      <legend>정답 제출 중</legend>
      <QuizOptions {...args} />
    </fieldset>
  ),
};
