import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  staticDirs: ["../public"],
  typescript: { reactDocgen: "react-docgen-typescript" },
  core: { disableTelemetry: true },
};
export default config;
