# Component inventory

Code and tokens are the SSOT; Storybook renders the same production components. Paths below are relative to `apps/web/src`. Pen node mappings remain [archived](archive/pen-components.md), not a prerequisite for UI work.

| Component | Implementation / actual consumer | Storybook |
| --- | --- | --- |
| Button / ActionButton alias | `components/ui.tsx`, CVA `control-variants.ts`; comments, Admin, Header, Records, Guitar | Components/Actions/Button: variants, sizes, disabled, focus, mobile, dark |
| IconButton | Same Button; Guitar adjust, Records close/play | Components/Actions/IconButton |
| ToggleButton | Same Button, controlled pressed; font/theme/autoscroll | Components/Actions/ToggleButton, Patterns/Header |
| Input / Textarea / native Select | `components/ui.tsx`, `primitives.css`; comment/quiz/Admin/Guitar forms | Components/Forms/Fields |
| SelectControl | `components/select-control.tsx`, Radix; Guitar capo/lyrics/speed | Components/Forms/SelectControl |
| QuizOptions | `components/quiz-options.tsx`; QuizGate radio cards, native fieldset disabled | Components/Forms/QuizRadio |
| WheelPicker | `components/wheel-picker.tsx`; existing prepared component, not deployed to product | Components/Forms/WheelPicker |
| UiLink / TextLink | Next adapter `ui-link.tsx` / native anchor `ui.tsx`; site navigation, Footer, article links, Guitar | Components/Navigation/LinksAndSegments |
| SegmentedControl | `components/segmented-control.tsx`, Radix single choice; Guitar categories | Components/Navigation/LinksAndSegments |
| Records tabs | `app/[locale]/records/record-view.tsx`; semantic tablist/panel with URL state | Components/Navigation/RecordTabs |
| Tag / EmptyState | `components/ui.tsx`; cards, comments, Admin, Guitar | Components/Content/PostCard → TagsAndEmptyStates |
| PostCard | `components/post-card.tsx`; Blog List | Components/Content/PostCard, Patterns/Blog Listing |
| CodeBlock | `components/code-block.tsx`; MarkdownArticle | Components/Content/CodeBlock |
| DropdownMenu | `components/dropdown-menu.tsx`, `dropdown.css`; LocaleSwitcher delegates routing | Components/Overlay/DropdownMenu |
| Native Record dialog | `app/[locale]/records/record-view.tsx`; existing zoom and focus restoration | Components/Overlay/RecordDialog |
| SiteHeader / MobileHeaderShell / nav / locale / font / theme | `components/site-header.tsx` and existing consumers | Patterns/Header |
| ArticleReading / MarkdownArticle | `components/article-reading.tsx`, `lib/markdown.tsx`; Blog article route | Patterns/Article |
| SongReader / transpose, capo, scrolling, presets | `features/guitar/components/song-reader.tsx`; Guitar route and Vite editor | Patterns/Guitar Controls |
| ChordControl | `features/guitar/components/chord-control.tsx`; SongReader score notation | Components/Actions/ChordControl |
| SongSearch / song navigation | `features/guitar/components/song-search.tsx`; Guitar listing | Patterns/Guitar Song Navigation |

## Intentional boundaries

- Action, navigation, value selection and routing menu keep their distinct HTML semantics. SelectControl and DropdownMenu share visual styles, not incorrect roles.
- Quiz radio cards, record art and chord notation preserve domain geometry. Do not force them into generic Button variants.
- Native title hints and the existing non-modal Guitar inspector do not require a new generic Tooltip/Popover. There is no current Checkbox, Breadcrumb or Pagination consumer; those components are intentionally absent. Tag is the existing read-only badge treatment.
- Server content loading, comments authorization and file I/O stay outside the presentational stories. Page tests validate those integration boundaries.
- Story-only layout helpers and fixtures are not production UI or another token source. New reusable production components need a real consumer and an updated story/inventory.
