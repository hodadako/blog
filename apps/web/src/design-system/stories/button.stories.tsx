import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "@/components/ui";
const meta = {
  title: "Components/Actions/Button",
  component: Button,
  args: {
    children: "저장",
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Actions use Button. Navigation uses UiLink/TextLink. primary submits, secondary supports, outline selects values, ghost repeats/adjusts, destructive deletes. Keep native type/ref/form/events. Do not add page-only variants, pills, shadows or scale.",
      },
    },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const Variants: Story = {
  render: () => (
    <div className="catalog-row">
      {(
        ["primary", "secondary", "outline", "ghost", "destructive"] as const
      ).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  render: () => (
    <div className="catalog-row">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
export const KeyboardFocus: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = {
  globals: {
    viewport: {
      value: "mobile",
      isRotated: false,
    },
  },
};
