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
- 저장소 전체(Blog/Guitar/Records/Admin/로컬 편집기)는 하나의 공통 컴포넌트 시스템으로 유지한다. 같은 역할의 UI는 공통 구현과 토큰을 재사용하며 페이지별 복제나 별도 button variant는 실제 기능상 근거 없이 만들지 않는다.
- UI 변경 전에 `docs/design-system/README.md`, `components.md`, `workflow.md`, `storybook-migration.md`와 실제 사용처를 확인한다.
- SSOT는 Git의 `tokens.css`와 운영 컴포넌트 코드다. Tailwind v4 `@theme inline`은 semantic token을 참조하며 CVA가 공통 variant/size를 관리한다. 임의 Hex/Magic Number와 중복 스타일 원본을 추가하지 않는다.
- 재사용 컴포넌트/토큰 변경 시 Storybook stories와 사용 문서를 함께 갱신한다. Stories는 운영 컴포넌트와 `app/site.css`를 그대로 불러오며 제품 UI를 재구현하지 않는다.
- 공통 변경은 모든 실제 소비자에 함께 반영·검증한다. Light/Dark, 390/768/1440px, hover/active/focus/disabled/selected, 키보드와 실제 Blog/Guitar 회귀를 변경 범위에 맞춰 확인한다.
- Action은 Button, 탐색은 UiLink/TextLink다. native props/ref/form/events, 의미 있는 HTML, 보이는 문구를 포함한 접근성 이름과 키보드 동작을 유지한다. 악보 코드·퀴즈·음반 아트의 도메인 조작을 억지로 Button variant로 바꾸지 않는다.
- 기본 서체 경기천년제목 Medium, Blog Korean Title alias/Light/Bold/Pretendard toggle, wordmark, Blog List 홈페이지/redirect, 44rem reading width, 모바일 배치, Starry/Snowy/Shooting Stars를 보존한다.
- 목적 없는 Card/Badge/Icon/Glow/Gradient/Shadow, hover scale, 임의 pill, 중복 컴포넌트·비주얼 편집기를 추가하지 않는다. 콘텐츠 가독성과 기존 정체성을 유지한다.
- 타입 검사·lint·단위 검사·production build·Storybook build·Storybook interaction/a11y 검사와 필요한 페이지 회귀를 실행한다. 시각 기준 이미지는 검토한 뒤 갱신하고 미검증 항목은 완료로 표시하지 않는다.
- Pen.dev는 선택적 보관 참고 자료다. 일상 개발·CI에 Pen 앱/MCP/결제/디자인 동기화를 요구하지 않으며 불필요한 MCP 호출을 하지 않는다. 기존 `.pen`·서체·이미지·미이관 정보는 보존한다. `.pen`을 일반 parser로 읽거나 직접 편집하지 않는다.
- Global/Component/Experimental 범위와 기술적 예외를 기록한다. 실험을 원본에 바로 섞지 않으며 자동 배포·병합하지 않는다.
