# Storybook migration

## Repository audit and implementation plan

Baseline: `e39fb4f`, dedicated branch `feat/storybook-design-system`. Preserve unrelated privacy edits, new song content, local browser artifacts and Supabase files.

- pnpm 10 workspaces; Blog and Guitar are routes/hosts in the same Next.js 15 / React 19 application. Vite also renders the shared SongReader in the local editor. Keep the library in `apps/web/src/components`; a new workspace would add a boundary without another independent application consumer.
- Tailwind v4 uses utilities without Preflight, `@theme inline` aliases existing semantic CSS variables, and CVA owns button variants. `tokens.css`, `tailwind.css`, `primitives.css`, `dropdown.css`, then `globals.css` are the production cascade. Preserve it in Storybook, including local font assets and CSS modules.
- Existing actions/fields/links/tags/empty states, Radix Select/ToggleGroup and PostCard are shared. Locale menu, Records tabs/dialog, quiz radio options and Guitar chord controls contain purpose-specific interaction code. Extract only presentational/interactive boundaries with real product consumers. Checkbox, generic tooltip, breadcrumb and pagination have no current consumer and will not be manufactured for the catalog.
- Vitest 4 unit tests, Playwright Blog/Guitar/editor suites and a GitHub quality workflow exist. No Storybook or standalone lint command exists.
- Pen artifacts live under `design/`; no runtime package or CI job requires Pen. Obsolete requirements are in AGENTS/design workflow documentation. Keep artifacts and historical evidence, retire mandatory MCP/origin/sync steps.

Implementation sequence:

1. Install latest compatible stable Storybook (`10.6.3`, verified against npm peers: Next 14–16, React 19, Vite 8, Vitest 4). Use official `@storybook/nextjs-vite`, docs/controls, accessibility and Vitest addons.
2. Configure shared CSS/fonts, root theme and existing ThemeProvider, App Router mocks and 390/768/1440 viewports. Foundations show actual token values rather than storing another palette.
3. Document existing production components and extract useful menu/article/chord boundaries with their real consumers. Add stories for actions/forms/navigation/content/overlay and Header/Article/Blog/Guitar patterns. Preserve semantics, layout and backgrounds.
4. Run stories as browser interaction/accessibility tests; add locally runnable screenshot comparisons with an explicit review/update workflow. Add lint and CI gates, without a paid service.
5. Replace active Pen-centered instructions with code + Storybook workflow; retain archived design artifacts. Record completed inventory, commands, verification and limitations below after implementation.

## Verification record

Verified locally on macOS, Node 24.18.0 / pnpm 10.17.1 (2026-10-26–27).

| Gate | Result |
| --- | --- |
| Web / editor typecheck | Passed |
| ESLint 10 (production + Storybook) | Passed |
| Unit tests | Web: 13 files / 57 tests; Worker: 1 file / 7 tests passed |
| Production build | Passed, 68 pages, isolated clean snapshot excluding unrelated edits |
| Storybook 10.6.3 build | Passed |
| Storybook browser interactions + axe | 64 stories passed; accessibility violations fail, no rules disabled |
| Screenshot comparison / native keyboard | 18 screenshots across 390/768/1440 × Light/Dark; dialog Escape/focus and header menu keyboard passed |
| Guitar production Chromium + WebKit | 44 passed |
| Blog P2 | 18 passed, including article layout, backgrounds, reduced motion and blocked storage |
| Shared UI / dropdown / Records | 18 passed, no skips on final full run |
| Locale/font | 4 passed |
| Local Guitar editor | 3 passed |

The initial full shared-UI run had a Records focus failure during navigation; the isolated retry passed. The final full run passed all 18 tests without skips. This is distinct from Storybook's stable native dialog/tab coverage. The six skipped tests requiring a temporary `/ui-review` route were retired; Storybook now owns component state and screenshot coverage. Accessible-name test selectors were updated after axe found that font/theme/Guitar labels omitted their visible text.

## Final architecture and migration scope

- `src/app/site.css` is the shared production cascade entry. Next and Storybook import the same CSS, local fonts, semantic tokens, Tailwind utilities and component rules. No duplicate palette or UI workspace was introduced.
- `src/components/ui.tsx` and `control-variants.ts` remain the shared native-prop/CVA primitives. Existing Radix Select/ToggleGroup remain in place. No unused shadcn catalog or new production dependency was added.
- `DropdownMenu` owns locale-menu rendering, outside-click/Escape and roving keyboard focus. `LocaleSwitcher` owns URL/locale behavior. Generic menu CSS moved from global locale-specific selectors to `dropdown.css`.
- `ArticleReading` owns the existing article frame/title/meta/tags; the server page keeps content loading and Markdown rendering. The reading width and card appearance are preserved.
- `QuizOptions` owns the existing radio options and keyboard/image states, consumed by QuizGate. `ChordControl` owns existing score chord interaction, consumed by SongReader in both website and editor.
- Header, font/theme controls, blog listing/cards/tags, fields, Records tabs/dialog, Guitar navigation/transpose/select/chords and editor all reuse their production components in stories. Domain controls retain their semantics instead of being forced into generic variants.
- Font/theme/Guitar accessible names now include visible labels; the visual text is unchanged. Existing font family, wordmark, backgrounds, animation and layout CSS were preserved.

## Storybook configuration and inventory

`.storybook/main.ts` selects official Next Vite integration, aliases, public assets, docs, a11y and Vitest. `preview.tsx` imports production styling and ThemeProvider, sets App Router mocks, Light/Dark toolbar, 390/768/1440 viewports, isolated preferences and autodocs. Preview CSS only arranges documentation examples.

26 story files expose 64 stories. [Component inventory](components.md) maps components to real consumers and story coverage. Foundations cover Colors, Typography, Spacing, Radius and Motion. Components cover Actions, Forms, Navigation, Content and Overlay; Patterns cover Header, Article, Blog Listing and Guitar controls/navigation. Existing prepared WheelPicker is identified as such. Checkbox, generic tooltip, breadcrumb and pagination were not invented without consumers.

## Pen retirement

No Pen package, build script or CI dependency existed to uninstall. Mandatory MCP/origin/synchronization instructions were replaced in AGENTS and current design docs. Old workflow/inventory are preserved under `archive/`; old implementation reports are explicitly historical. All `.pen` and design assets remain intact. Global user MCP configuration was not changed. Code and Git-managed tokens are the implementation source of truth; Pen is optional reference only.

## Visual baseline review and limits

All 18 new macOS PNGs were opened and reviewed for font, palette, wrapping, article card/reading width, Guitar mobile collapse and desktop rails before accepting the baseline. A subsequent run compared against those files. They cover Button variants, Article and Guitar workspace, not every page or story. Mobile Guitar settings remain collapsed in the workspace screenshot; interaction stories and production tests cover opening/using them.

Baselines are macOS-specific; Linux CI screenshot references have not been reviewed. CI builds Storybook and runs browser interaction/axe/native-keyboard gates, without a paid cloud service. For Linux visual comparisons, generate candidates with `pnpm --filter web test:visual --update-snapshots`, inspect every image/diff, then accept explicitly. For manual review, run `pnpm storybook`, select each affected component/pattern, switch Light/Dark and all three viewport presets, inspect states and repeat in actual Blog/Guitar pages. Automated axe checks do not constitute full screen-reader/WCAG certification.

Storybook's Shiki/docs chunks produce a bundle-size advisory; this affects the development catalog, not a new production dependency. Remote CI was configured but not executed in this unpushed branch. No deployment, merge, commit or push was performed. Existing unrelated privacy, Pen, song and local artifacts were preserved.

## Changed files

The list below excludes unrelated existing changes. Screenshot files are grouped by their platform directory.


- `.github/workflows/quality.yml`
- `.gitignore`
- `AGENTS.md`
- `apps/web/.storybook/main.ts`
- `apps/web/.storybook/preview.css`
- `apps/web/.storybook/preview.tsx`
- `apps/web/e2e/blog-p2.e2e-spec.ts`
- `apps/web/e2e/design-system.e2e-spec.ts`
- `apps/web/e2e/dropdown.e2e-spec.ts`
- `apps/web/e2e/guitar-editorial.e2e-spec.ts`
- `apps/web/e2e/guitar.e2e.spec.ts`
- `apps/web/e2e/locale.e2e-spec.ts`
- `apps/web/e2e/storybook.e2e-spec.ts`
- `apps/web/e2e/tailwind-ui.e2e-spec.ts`
- `apps/web/eslint.config.mjs`
- `apps/web/package.json`
- `apps/web/src/app/[locale]/blog/[slug]/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/site.css`
- `apps/web/src/components/article-reading.tsx`
- `apps/web/src/components/dropdown-menu.tsx`
- `apps/web/src/components/font-toggle.tsx`
- `apps/web/src/components/locale-switcher.tsx`
- `apps/web/src/components/project-link-card.tsx`
- `apps/web/src/components/quiz-gate.tsx`
- `apps/web/src/components/quiz-options.tsx`
- `apps/web/src/components/site-document.tsx`
- `apps/web/src/components/theme-context.tsx`
- `apps/web/src/components/theme-toggle.tsx`
- `apps/web/src/design-system/dropdown.css`
- `apps/web/src/design-system/stories/article.stories.tsx`
- `apps/web/src/design-system/stories/blog-listing.stories.tsx`
- `apps/web/src/design-system/stories/button.stories.tsx`
- `apps/web/src/design-system/stories/chord.stories.tsx`
- `apps/web/src/design-system/stories/code-block.stories.tsx`
- `apps/web/src/design-system/stories/colors.stories.tsx`
- `apps/web/src/design-system/stories/content.stories.tsx`
- `apps/web/src/design-system/stories/dropdown.stories.tsx`
- `apps/web/src/design-system/stories/empty-state.stories.tsx`
- `apps/web/src/design-system/stories/fields.stories.tsx`
- `apps/web/src/design-system/stories/fixtures.ts`
- `apps/web/src/design-system/stories/foundation-examples.tsx`
- `apps/web/src/design-system/stories/guitar.stories.tsx`
- `apps/web/src/design-system/stories/header.stories.tsx`
- `apps/web/src/design-system/stories/icon-button.stories.tsx`
- `apps/web/src/design-system/stories/motion.stories.tsx`
- `apps/web/src/design-system/stories/navigation.stories.tsx`
- `apps/web/src/design-system/stories/radio.stories.tsx`
- `apps/web/src/design-system/stories/radius.stories.tsx`
- `apps/web/src/design-system/stories/record-tabs.stories.tsx`
- `apps/web/src/design-system/stories/records.stories.tsx`
- `apps/web/src/design-system/stories/select.stories.tsx`
- `apps/web/src/design-system/stories/song-search.stories.tsx`
- `apps/web/src/design-system/stories/spacing.stories.tsx`
- `apps/web/src/design-system/stories/tag.stories.tsx`
- `apps/web/src/design-system/stories/toggle-button.stories.tsx`
- `apps/web/src/design-system/stories/typography.stories.tsx`
- `apps/web/src/design-system/stories/wheel.stories.tsx`
- `apps/web/src/design-system/tokens.css`
- `apps/web/src/features/guitar/chordpro/parser.spec.ts`
- `apps/web/src/features/guitar/components/chord-control.tsx`
- `apps/web/src/features/guitar/components/song-reader.tsx`
- `apps/web/src/lib/comments.ts`
- `apps/web/src/lib/content.ts`
- `apps/web/storybook.playwright.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/vitest.storybook.config.mts`
- `docs/design-system/README.md`
- `docs/design-system/archive/pen-components.md`
- `docs/design-system/archive/pen-workflow.md`
- `docs/design-system/audit.md`
- `docs/design-system/components.md`
- `docs/design-system/production-review.md`
- `docs/design-system/shared-dropdowns.md`
- `docs/design-system/storybook-migration.md`
- `docs/design-system/tailwind-ui-integration.md`
- `docs/design-system/workflow.md`
- `package.json`
- `pnpm-lock.yaml`
- `apps/web/e2e/storybook-snapshots/darwin/*.png (18 reviewed images)`
