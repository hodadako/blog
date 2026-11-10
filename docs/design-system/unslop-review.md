# Blog and Guitar polish

Applied the [unslop skill by Damir Sokolovsky](https://github.com/heydamir/unslop) in polish mode, in the approved order: blog listing, article, Guitar. Skill attribution and CC BY 4.0 license remain in `.agents/skills/unslop/`.

## Direction and audit

- Product: personal technical writing and a searchable Guitar songbook.
- Character: quiet, personal, readable.
- World: a reading desk and a music stand.
- Moments: actual post artwork and chord/lyric notation carry the detail.
- Signature: existing Korean typeface, blue palette, Blog sky backgrounds and Guitar score anchors.

These pages already use production components and semantic tokens. This is a small refinement rather than a new visual identity. The repository's existing font, wordmark, light/dark palette, Starry/Snowy/Shooting Stars, 44rem article measure, mobile layout and score geometry take precedence over generic skill recommendations about decoration and typography. No generated images or story video were needed.

## Changes, in order

1. Listing: remove the first-row padding exception; group title, summary and date at an 8px rhythm. Dates and reading time use the existing caption token and tabular numerals. Dates use semantic `time` elements; the separator is hidden from assistive technology.
2. Article: separate header groups by 16px while retaining the framed reading surface. Group each video and caption in a figure and offer a localized direct YouTube link. The link is always present so it remains usable when cross-origin video loading fails; this does not detect or repair an external player's failure. Post text is unchanged.
3. Guitar: use Korean labels for the list title, search placeholder, return link and footer. Settings groups use a 16px gap while label/control pairs retain 8px. Whole-row song links receive the accent on keyboard focus as well as hover. Numeric control readouts use tabular numerals. Search, categories, transpose, capo, scrolling and presets retain their behavior.

Scope is component-level: PostCard, ArticleReading/MarkdownArticle and Guitar navigation/settings. Existing spacing, caption, radius and color tokens are reused; no new palette or token source was added. Production Storybook descriptions were updated and an embedded-video example was added.

## Validation

- Web typecheck and ESLint: passed.
- Unit tests: 57 web + 7 Worker tests passed.
- Next.js production build: passed, 68 pages generated.
- Storybook production build: passed.
- Storybook browser interaction/accessibility: 65 stories passed, no assertions or a11y rules disabled.
- Existing Blog P2 Chromium regression suite: 18 passed.
- Existing Guitar Chromium regression suite: 22 passed, including mobile controls, source anchors, search, transpose/capo, autoscroll and blocked storage.
- Additional real-page checks: listing, article, song index and reader at 390/768/1440px in Light/Dark, 24 combinations passed with no page overflow. Confirmed direct video link with video requests blocked, search reset, keyboard focus and expanded mobile settings. Inspected captured mobile screenshots and tablet/desktop overview sheets. Existing platform-specific screenshot baselines were not overwritten.
- WebKit not run: downloaded browser requires system libraries absent from this environment (`libgtk-4`, Graphene, HarfBuzz ICU, Manette, Hyphen, GLES). Neither the scoped package helper nor sudo is available. Chromium completed successfully.

External YouTube playback is not claimed to work; the direct-link fallback was verified. No deployment, merge, environment configuration update or publication was performed.
