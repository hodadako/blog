import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input, Textarea, Select } from "@/components/ui";
const meta = {
  title: "Components/Forms/Fields",
  component: Input,
  args: {
    "aria-label": "커버 이름",
    placeholder: "이름을 입력하세요",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Use visible labels in forms; aria-label is useful for icon-adjacent search. Preserve native validation, name, ref and form behavior. Compact fields share control typography and target size. Native Select remains for native forms; SelectControl is the shared popup value picker.",
      },
    },
  },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const InputField: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox");
    await userEvent.type(input, "어쿠스틱 커버");
    await expect(input).toHaveValue("어쿠스틱 커버");
  },
};
export const Appearances: Story = {
  render: () => (
    <div className="catalog-fields">
      <label className="field">
        Filled
        <Input placeholder="이름" />
      </label>
      <label className="field">
        Outline compact
        <Input appearance="outline" density="compact" />
      </label>
      <label className="field">
        Disabled
        <Input disabled defaultValue="수정 불가" />
      </label>
      <label className="field">
        Invalid
        <Input aria-invalid="true" aria-describedby="field-error" required />
      </label>
      <p id="field-error">이름을 입력해 주세요.</p>
    </div>
  ),
};
export const TextareaField: Story = {
  render: () => (
    <label className="field catalog-fields">
      댓글
      <Textarea rows={4} placeholder="내용" />
    </label>
  ),
};
export const NativeSelect: Story = {
  render: () => (
    <label className="field catalog-fields">
      카테고리
      <Select name="category" defaultValue="general">
        <option value="general">일반</option>
        <option value="music">음악</option>
      </Select>
    </label>
  ),
  play: async ({ canvasElement }) => {
    const select = within(canvasElement).getByRole("combobox");
    await userEvent.selectOptions(select, "music");
    await expect(select).toHaveValue("music");
  },
};
