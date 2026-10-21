# AGENTS.md

Repository operating guide for agentic coding assistants.
Use this file as the default behavior contract when changing code.

## 0) First Rule
- 모든 구현이나 변경 전에 `docs/` 문서를 먼저 확인한다.
- Work must start with docs review, then code analysis, then edits.
- If scope changes mid-task, re-check docs before continuing.
- Current required doc:
  - `docs/git-rules.md`

## 1) Repository Topology
- Monorepo using `pnpm` workspaces.
- Workspace globs:
  - `apps/*`
  - `packages/*`
  - `infra/*`
- Current runtime target:
  - `apps/web` — Next.js App Router app for public pages, admin routes, and API handlers
- Content source:
  - `content/posts/{slug}/{locale}.md`
- Infrastructure code:
  - `infra/cloudflare-worker`
  - `infra/pulumi`
  - `infra/supabase`

## 2) Toolchain Baseline
- Package manager: `pnpm@10.17.1`
- Install all deps from root: `pnpm install`

## 3) Build/Lint/Test Commands
Run from root unless command says otherwise.

### Root scripts
- Dev web app: `pnpm dev`
- Build web app: `pnpm build`
- Typecheck web app: `pnpm typecheck`

### Web scripts (`--filter web`)
- Dev: `pnpm --filter web dev`
- Build: `pnpm --filter web build`
- Start production build: `pnpm --filter web start`
- Typecheck: `pnpm --filter web typecheck`

### Infrastructure scripts
- Worker dev: `pnpm --dir infra/cloudflare-worker dev`
- Worker deploy: `pnpm --dir infra/cloudflare-worker deploy`
- Pulumi preview: `pnpm --dir infra/pulumi preview`
- Pulumi apply: `pnpm --dir infra/pulumi up`

## 4) Preferred Validation Order
- For `apps/web` changes, prefer:
  1. `pnpm --filter web typecheck`
  2. `pnpm --filter web build`
- For `infra/cloudflare-worker` changes:
  1. `pnpm --dir infra/cloudflare-worker exec tsc --noEmit`
- For `infra/pulumi` changes:
  1. `pnpm --dir infra/pulumi exec tsc --noEmit`

## 5) Commit Message Rules
From `docs/git-rules.md`:
- Use semantic format: `<type>(<scope>): <short summary>`
- `<scope>` is optional.
- Write commit messages in Korean.
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `cd`, `ci/cd`

## 6) Architecture Guidance
- Prefer the current production path: `apps/web` + `content` + `infra`.
- Posts are file-backed content, not database-backed entities.
- Comments are dynamic and belong to the Supabase-backed path in `apps/web`.
- Keep locale handling explicit and route-based.
- Prefer low-ops, serverless-friendly choices over always-on infrastructure.

## 7) Imports and Paths
- In `apps/web`, prefer the local alias:
  - `@/*` -> `apps/web/src/*`
- Use relative imports only for local-neighbor files.

## 8) TypeScript Guidelines
- Keep strict typing.
- Avoid introducing new `any`.
- Use explicit return types for public helpers, route handlers, and service boundaries when they improve clarity.
- Prefer schema-backed validation where input crosses a trust boundary.

## 9) Local Quality Gates
- Pre-commit (`.husky/pre-commit`): `pnpm exec lint-staged`
- Keep `lint-staged` aligned with active workspaces; do not assume removed workspaces are still checked by hooks.

## 10) Naming Conventions
- Classes/types/interfaces: PascalCase
- Variables/functions/methods: camelCase
- Test files:
  - unit/default: `*.spec.ts`
  - e2e: `*.e2e-spec.ts`
  - integration: `*.integration-spec.ts`

## 11) Change Checklist
1. Read `docs/git-rules.md` first.
2. Check whether the task belongs in `apps/web`, `content`, or `infra`.
3. Apply minimal, scoped edits.
4. Run the narrowest relevant validation commands.
5. Update docs when workflow or architecture changes.

## 12) Design System
- UI 변경 전에 `docs/design-system/README.md`, `audit.md`, `components.md`, `workflow.md`와 `design/hodako.lib.pen`을 확인한다.
- 시각 SSOT는 pen.dev 라이브러리다. 대응 component와 Variables를 먼저 확인하고 승인된 디자인 사양을 구현한다.
- 기존 토큰/컴포넌트를 우선 재사용한다. 기존 토큰으로 해결할 수 있는 스타일에 임의 Hex/Magic Number를 추가하지 않는다.
- 시각 사양은 원칙적으로 `.lib.pen`을 먼저 수정한다. 코드에서 의도적으로 변경했다면 기존 origin/Variables에 반영한다.
- UI를 대량 재생성하거나 유사 컴포넌트를 중복 구현하지 않는다. Variant와 준비 컴포넌트의 실제 목적을 registry에 기록한다.
- 목적 없는 Card/Badge/Icon/Glow/Gradient/Shadow를 추가하지 않는다. 콘텐츠 가독성과 의도된 개인적 정체성을 함께 유지한다.
- 기본 서체는 경기천년제목 Medium (`design/fonts/gyeonggi/Title_Medium.otf`). 웹의 기존 Blog Korean Title alias와 Light/Bold/font toggle를 임의 교체하지 않는다.
- Blog List 홈페이지/redirect/wordmark/Starry/Snowy/Shooting Stars, 완료된 P0/P1 구조를 유지한다. Records/Guitar 대규모 리디자인을 섞지 않는다.
- Global/Component/Experimental 변경을 구분하고 기존 승인 범위에 따라 진행한다. 실험을 확정 원본에 바로 섞지 않는다.
- MCP 실행 전 활성 파일을 확인한다. `.pen` 내부를 일반 parser로 읽거나 serialized IDs/references를 수동 수정하지 않는다.
- 디자인과 코드가 자동 동기화된다고 가정하지 않는다. 최소 Diff, 브라우저 rendering, 타입/테스트/빌드로 검증하고 기술적 예외를 문서화한다.
- 자체 Design Lab/별도 비주얼 편집기/중복 토큰 원본을 추가하지 않는다. Storybook은 필요 시 구현 검증 도구로만 검토한다.
- 새 UI 전에 `@/components/ui`와 `docs/design-system/components.md`의 실제 사용처를 검색한다. 같은 의미/디자인이면 기존 구현을 재사용하고 이름만 바꾼 복제는 만들지 않는다.
- Action은 Button, 탐색은 UiLink/TextLink를 쓴다. native props/ref/events를 유지하고 도메인 전용 조작을 억지로 Button variant로 통합하지 않는다.
- 공통 컴포넌트는 실제 소비자와 함께 추가한다. `primitives.css`와 Pen origin을 함께 확인하고 영향 페이지·키보드·테마·반응형 검증을 남긴다.
