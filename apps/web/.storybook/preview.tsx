import type { Preview } from "@storybook/nextjs-vite";
import { ThemeProvider } from "../src/components/theme-context";
import "../src/app/site.css";
import "./preview.css";

const preview: Preview = {
  tags: ["autodocs"],
  initialGlobals: { theme: "light" },
  globalTypes: {
    theme: {
      description: "Production theme",
      toolbar: {
        icon: "circlehollow",
        dynamicTitle: true,
        items: ["light", "dark"],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <ThemeProvider
        key={context.globals.theme}
        persist={false}
        initialPreference={context.globals.theme === "dark" ? "dark" : "light"}
      >
        <Story />
      </ThemeProvider>
    ),
  ],
  beforeEach: () => {
    // This origin belongs to Storybook; production host preferences are separate.
    localStorage.clear();
    document.documentElement.lang = "ko";
    delete document.documentElement.dataset.font;
    return () => {
      delete document.documentElement.dataset.font;
    };
  },
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/ko/blog", query: {} },
    },
    a11y: { test: "error" },
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    options: {
      storySort: {
        order: [
          "Foundations",
          ["Colors", "Typography", "Spacing", "Radius", "Motion"],
          "Components",
          ["Actions", "Forms", "Navigation", "Content", "Overlay"],
          "Patterns",
        ],
      },
    },
    viewport: {
      options: {
        mobile: {
          name: "Mobile · 390px",
          styles: { width: "390px", height: "844px" },
        },
        tablet: {
          name: "Tablet · 768px",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop · 1440px",
          styles: { width: "1440px", height: "900px" },
        },
      },
    },
  },
};
export default preview;
