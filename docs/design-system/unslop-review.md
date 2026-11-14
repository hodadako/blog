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

## CodeRabbit follow-up

All seven actionable findings were verified and addressed: required final viewport/theme checks are exempt from the skill's intermediate render limit; production tokens and brand Bold weights take precedence; the glyph example supports reduced motion and live preference changes; light positive text uses a darker green; the story server confines regular files using real paths and handles malformed requests; videoseries embeds link to their original playlists. The snapshot CLI also rejects non-HTML output names and handles uppercase HTML extensions, addressing the additional filename suggestion (the originally claimed overwrite could not occur because `.live.png` was appended).

Validation: web typecheck and lint passed; 59 web + 7 Worker unit tests passed, including direct video and playlist-link regressions. The story server's Node test covers encoded traversal, symlink escape, directory/missing/NUL paths, malformed encoding, valid files and the stage response. The glyph example was exercised with a mocked animation/media environment to verify static reduced-motion rendering, live toggling and cleanup. JavaScript syntax checks and invalid snapshot-output rejection passed. The production build passed with 68 generated pages.

The subsequent two findings are also addressed: the blog-token instructions now apply only to this repository's `apps/web`; external products retain their own design system. Direct YouTube links preserve a valid embedded `start` value as `t`, including zero, while missing or invalid values retain the untimed link. Web unit coverage now includes both timed and untimed links: 64 tests passed, along with typecheck and lint.

## Re-audit (2026-11-14)

A second polish pass over the same Blog and Guitar screens, with the direction unchanged. The audit found no color, type, icon or motion signs; the remaining items were spacing and alignment.

1. Header: the wordmark and navigation now share the content column on desktop. `.site-header__inner` no longer applies the container inset a second time inside `MobileHeaderShell`.
2. Blog footer: on short pages the footer sits at the bottom of the viewport, as it already does on Guitar. The gap above it is the page's own bottom padding only, so the last post rule and the footer rule no longer frame an empty band.
3. PostCard with thumbnail: title, date and tags keep the plain card's 12px rhythm; the thumbnail spans the row and is centered against the text. Markup is unchanged.
4. Guitar settings: the autoscroll toggle uses the existing `secondary` variant; reset stays `ghost` and aligns with the label column. The summary reports the scroll speed in the same unit as its select. Helper and summary copy break between words.
5. Guitar score: chord-only rows no longer reserve an empty lyric row. Segment widths, chord spacing and source anchors are unchanged.
6. Parser: `parseChordPro` returns plain metadata without the non-enumerable capo marker, which removes the Server-to-Client serialization error on song pages.

Scope is Global for the header and shell layout rules (Blog, Records, Admin share `SiteShell`), Component for PostCard and the Guitar reader.

Validation: web typecheck, lint and 64 unit tests passed; production build passed; Storybook interaction/a11y 65 passed; Chromium e2e passed for Guitar (22), Blog P2 (18), locale (4) and design-system/dropdown (18). Real Blog and Guitar pages were inspected at 390px Dark, 768px Light and 1440px Light/Dark with no horizontal overflow; Records was checked for overflow at the same widths. The remaining theme/width combinations and Admin were not inspected. `test:visual` fails on `patterns-article--reading` with and without these changes (image 11px taller than the macOS baseline), so the Guitar controls baseline was not reached; baselines were not updated. WebKit was not run.
