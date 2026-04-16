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
