# Code + Storybook workflow

## Modify UI

1. Read this guide and [inventory](components.md). Search the production component and all consumers across Blog/Guitar/Records/Admin/editor before editing.
2. Reuse the shared component. Actions are Button; navigation is UiLink/TextLink. Keep native props/ref/form semantics, labels and keyboard behavior. Use CVA for a justified shared variant, not page-specific class copies.
3. Change `tokens.css` for shared design values. Keep semantic aliases, existing fonts, palette and layout; do not introduce a second Storybook theme or token definition.
4. Update the component's story with the affected variant, state or interaction. Stories import production code. Use data fixtures; keep server I/O outside presentational components and use the official Next mock for router state.
5. Review the story in Light/Dark at 390/768/1440px. Inspect default, hover, active, keyboard focus, selected and disabled states as applicable. Check portal menus against the root theme. Use the production patterns to confirm Blog/Guitar agreement.
6. Run the applicable gates below and actual page regressions. Review screenshots before accepting changed baselines. Document technical exceptions and unverified areas.

Pen.dev is an optional archived reference. Everyday work and CI require no Pen app, MCP call, design subscription or synchronization step. Existing design artifacts and unported context stay intact.

## Commands

Use repository Node 24 and pnpm 10.17.1.

```sh
pnpm storybook
pnpm typecheck
pnpm lint
pnpm test
pnpm guitar:editor:typecheck
pnpm build
pnpm build-storybook
pnpm test:storybook
pnpm test:visual
pnpm guitar:editor:test:e2e
```

`test:storybook` runs production stories in headless Chromium through Storybook's Vitest addon. Accessibility violations fail through `a11y.test = error`; play functions validate behavior. This is automated coverage, not full WCAG or screen-reader certification. Existing Blog/Guitar/locale suites continue to validate routing, storage, score semantics and the real page layout.

## Add a story

Place `*.stories.tsx` under `src/design-system/stories` or beside its component. Use a typed Meta/StoryObj, a production import, meaningful args, controls and usage notes. Name it under Foundations, Components/{Actions,Forms,Navigation,Content,Overlay}, or Patterns. Explain when to use it and what must not change.

Use explicit visible labels, real button/link roles and keyboard interactions in play functions. Query portal options through the story document body. Await observable asynchronous focus/state changes, not fixed sleeps. Native browser defaults such as Escape on dialog need Playwright's real keyboard as well as synthetic story interactions.

Theme and viewport globals are available to every story. Add representative dark/mobile stories where the state benefits from a dedicated entry; use the toolbar for the full matrix. A component with no current consumer does not need to be invented to fill a category.

## Visual comparison

`test:visual` starts or reuses the local Storybook development server and uses Playwright screenshots at 390/768/1440px in Light/Dark. It requires no cloud account. See [migration record](storybook-migration.md) for baseline scope and platform notes. It also checks native dialog Escape/focus and menu focus behavior.

Generate or update candidates only after an intentional change:

```sh
pnpm build-storybook
pnpm --filter web test:visual --update-snapshots
```

Inspect each changed screenshot and diff; never accept a baseline just because the test failed. Baselines are platform-specific. Use the same Playwright/browser/OS combination for comparison; cross-platform first runs require reviewed candidates, or use the documented manual matrix in Storybook. CI runs interaction/accessibility tests and native browser smoke checks. The initial reviewed screenshots are macOS baselines; Ubuntu CI screenshot baselines remain unreviewed, so CI does not silently generate or accept them.

## Scope and regressions

Global changes require checking every consuming application surface. Component changes require stories plus all actual consumers. Experiments remain explicit and isolated. Verify the real app after layout, routing, storage, background or portal changes; an isolated story cannot prove those integrations.

No automatic deployment or main merge is part of this workflow. Preserve unrelated working tree edits.
