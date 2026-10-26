import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SelectControl } from "@/components/select-control";
const meta = {
  title: "Components/Forms/SelectControl",
  component: SelectControl,
  args: {
    "aria-label": "카포 위치",
    value: "0",
    options: Array.from({ length: 13 }, (_, i) => ({
      value: String(i),
      label: i ? `${i}프렛` : "카포 없음",
    })),
    onValueChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Radix combobox/listbox shares dropdown.css with the language menu. Arrow/Home/End, Enter/Space, Escape, typeahead and focus restoration are part of the contract. Do not apply routing semantics to a value picker.",
      },
    },
  },
} satisfies Meta<typeof SelectControl>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Interactive: Story = {
  render: function Interactive(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="catalog-fields">
        <SelectControl {...args} value={value} onValueChange={setValue} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("combobox");
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole("option", { name: "2프렛" }));
    await expect(trigger).toHaveTextContent("2프렛");
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveTextContent("2프렛");
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = {
  ...Interactive,
  globals: { theme: "dark" },
};
