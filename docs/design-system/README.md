# hodako.dev Design System

**SSOT: Git-managed tokens + production UI components. Documentation and validation: Storybook.**

Blog, Guitar, Records, Admin and the local Guitar editor share one component system inside `apps/web`. Do not create a second UI package or reimplement production components in stories.

## Start

```sh
pnpm install
pnpm storybook
```

Open `http://127.0.0.1:6006`. The catalog has Foundations, Components and Patterns. The toolbar selects Light/Dark and 390/768/1440px viewports. Controls and autodocs explain props; interaction and accessibility results appear with each story.

- [Workflow and quality gates](workflow.md)
- [Component inventory and actual consumers](components.md)
- [Migration audit, decisions and verification](storybook-migration.md)

## Production structure

- `apps/web/src/design-system/tokens.css`: palette, semantic roles, typography, spacing, radius, borders, shadow and motion.
- `tailwind.css`: Tailwind v4 utilities without Preflight; `@theme inline` references the existing semantic variables.
- `control-variants.ts`: CVA variants/sizes for Button and button-shaped links.
- `primitives.css`, `dropdown.css`: shared field, content and menu styles.
- `apps/web/src/app/site.css`: single Blog/Guitar/Storybook cascade entry, including existing `globals.css` and local fonts. The local editor keeps its intentional editor shell and imports the same primitive layers.
- `apps/web/src/components`: production primitives and patterns. Guitar domain controls remain under `features/guitar` and share the same tokens.
- `apps/web/src/design-system/stories`: stories importing production components, data fixtures and documentation-only layouts.
- `apps/web/.storybook`: official Next.js/Vite integration, App Router mock, theme/provider configuration and responsive presets.

## Identity

Preserve the Deep Ocean Blue primitives: Ink `#0a1128`, Navy `#001f54`, Blue `#034078`, Cyan `#1282a2`, Paper `#fefcfb`. Use semantic roles rather than copying hex values. Keep existing light/dark contrast relationships and support colors.

Keep 경기천년제목 Medium, the `Blog Korean Title` alias, Light/Bold, Pretendard toggle, wordmark, Blog List homepage/redirect, 44rem reading measure, article surface, mobile layout intent, Starry/Snowy and Shooting Stars. Keep Records art and Guitar score notation as domain patterns. Add no decorative gradients, hover scale, excessive shadows or arbitrary pills.

## Archived design references

Pen.dev is optional. Existing `.pen` files, fonts, imported images and evidence remain in `design/` and `designs/`; they contain historical visual context and are not deleted or automatically synchronized. They are not development or CI dependencies. No routine MCP call, subscription, origin lookup or Pen update is required. Archived instructions are in [archive](archive/pen-workflow.md); current code and Storybook take precedence.
