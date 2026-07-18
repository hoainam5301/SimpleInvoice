# SimpleInvoice

A production-ready React Native (CLI + TypeScript) invoicing app, built as
a Clean Architecture reference implementation: login, search/filter/sort/
paginate invoices, and create an invoice.

For the full architectural reasoning — diagrams, sequence flows, layer
responsibilities, and *why* behind every non-trivial choice — see:

- [ARCHITECTURE.md](./ARCHITECTURE.md) — diagrams, folder structure, data
  flow, auth/create-invoice sequences, state management, custom hooks,
  repository pattern, security, testing, git, CI/CD, roadmap.
- [DECISIONS.md](./DECISIONS.md) — technology decisions, trade-offs,
  assumptions.

---

## Architecture at a glance

```text
Presentation  →  Domain  →  Data  →  External APIs
     ↓
   Core (config, network, storage, utils — imported by all layers)
```

All API access flows through exactly one path:

```text
Screen → Hook → UseCase → Repository → API Service → axios → Backend
```

See [ARCHITECTURE.md §1](./ARCHITECTURE.md#1-high-level-architecture-diagram)
for the full diagram.

---

## Setup

### Prerequisites

- Node.js ≥ 22.11 (matches the `engines` field in `package.json`; an
  [`.nvmrc`](./.nvmrc) is provided — run `nvm use` in the repo root)
- Ruby + Bundler (iOS, CocoaPods) — `bundle install` inside `ios/` if a
  `Gemfile` is present in your React Native version's template
- Xcode ≥ 15 (iOS) / Android Studio + JDK 17 (Android)
- A configured RN CLI environment — see the official
  [React Native environment setup guide](https://reactnative.dev/docs/set-up-your-environment)

### Install

```bash
npm install

# iOS only
cd ios && pod install && cd ..
```

### Environment configuration

**`react-native-config` reads a file named `.env` by default.** So for the
standard "clone and run" path, copy the example to exactly `.env`:

```bash
cp .env.example .env
```

Then open `.env` and fill in the two blank credentials (`CLIENT_ID`,
`CLIENT_SECRET`). For this assessment they are the sandbox client
credentials in **Appendix A** of the assessment document — paste them into
your **local** `.env` only. The login username/password are entered on the
login screen at runtime, not in `.env`.

> **Never commit `.env` or any `.env.*`.** Everything except `.env.example`
> is git-ignored (see `.gitignore`), and `.env.example` intentionally ships
> with the secret fields blank. Treat the sandbox credentials as real
> secrets — do not commit them. See the [Secrets & git hygiene](#secrets--git-hygiene)
> section below.

| Variable | Purpose |
|---|---|
| `API_BASE_URL` | Base URL for the invoice/membership APIs |
| `AUTH_TOKEN_URL` | WSO2 IS `/oauth2/token` endpoint |
| `MEMBERSHIP_ME_URL` | `/membership-service/1.0.0/users/me` endpoint |
| `CLIENT_ID` / `CLIENT_SECRET` | OAuth client credentials (blank in `.env.example` — fill locally) — see [DECISIONS.md](./DECISIONS.md#client-secret-in-a-mobile-app) for the production caveat on shipping a client secret inside a mobile binary |
| `API_TIMEOUT_MS` | Axios request timeout |
| `ENV_NAME` | `development` / `staging` / `production` — read by `core/config/env.ts` |

> **Gotcha — env is baked in at *native build* time, not JS runtime.**
> `react-native-config` injects these values when the native app is compiled.
> If you edit `.env`, a Metro reload is **not** enough — you must rebuild the
> native app (`npm run ios` / `npm run android`). A missing or empty required
> variable makes the app throw on launch by design (`core/config/env.ts`
> fails fast rather than silently calling APIs with an undefined base URL).

**Multiple environments (optional).** To target `staging`/`production`
without overwriting `.env`, keep separate `.env.staging` / `.env.production`
files and select one at build time via the `ENVFILE` variable:

```bash
ENVFILE=.env.staging npm run android
ENVFILE=.env.staging npm run ios
```

For a more permanent setup, wire per-scheme build configurations (Xcode
build configurations / Gradle product flavors) that each point at their own
`.env.<environment>` — see
[react-native-config's docs](https://github.com/luggit/react-native-config).

## Run

From a fresh clone, in order:

```bash
nvm use                       # or ensure Node ≥ 22.11 yourself
npm install
cp .env.example .env          # then fill CLIENT_ID / CLIENT_SECRET in .env
cd ios && pod install && cd .. # iOS only

# Terminal 1 — start Metro and leave it running:
npm start

# Terminal 2 — build & launch onto a booted simulator/emulator or device:
npm run ios                   # iOS simulator
npm run android               # Android emulator/device
```

If you change `.env` afterwards, re-run `npm run ios` / `npm run android`
(a rebuild) — see the env gotcha above.
<img width="961" height="463" alt="image" src="https://github.com/user-attachments/assets/b126ddc0-5ed2-47f7-a5b8-14664613e695" />
<img width="967" height="467" alt="image" src="https://github.com/user-attachments/assets/b878b3f0-c082-4238-b91d-eb814d0f636a" />

## Test

```bash
npm test                # run once
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report (enforces the threshold in jest.config.js)
```

Test suites live in `tests/`, mirroring the source tree:

- `tests/unit/usecases` — domain business rules, no RN runtime required
- `tests/unit/hooks` — hook timing/memoization behavior
- `tests/unit/utils` — framework-free helpers
- `tests/component` — screen rendering + interaction (hooks mocked)
- `tests/integration` — full Data-layer chain against a mocked HTTP layer

See [ARCHITECTURE.md §10](./ARCHITECTURE.md#10-testing-strategy) for the
rationale behind what's tested at which level.

## Lint & type check

```bash
npm run lint
npm run typecheck
```

## Architecture

Full detail in [ARCHITECTURE.md](./ARCHITECTURE.md). Summary:

- **Presentation** (`src/presentation/`) — screens, components, hooks,
  navigation. Never imports `axios`, DTOs, or repository implementations.
- **Domain** (`src/domain/`) — entities, repository interfaces, use cases.
  Pure TypeScript; zero React/Axios/Redux imports; unit-testable without a
  React Native runtime.
- **Data** (`src/data/`) — API services, DTOs, mappers, repository
  implementations. The only layer allowed to import `axios` or
  Keychain/EncryptedStorage.
- **Core** (`src/core/`) — config, constants, network client + interceptors,
  secure storage, utils, shared types. Imported by all layers; imports
  nothing from them.
- **Store** (`src/store/`) — Redux Toolkit for auth/session/UI state; RTK
  Query for invoice server state, wired to call use cases (not the network
  directly) via a custom `queryFn` — see
  [DECISIONS.md](./DECISIONS.md#redux-toolkit-for-client-state-rtk-query-for-server-state).

### Custom hooks

| Hook | Responsibility |
|---|---|
| `useAuth()` | Session state + logout, gates navigation |
| `useLogin()` | Login form submission state |
| `useInvoices({ filters })` | Paginated, filtered, accumulated invoice list |
| `useInvoiceFilters()` | Search/status/sort UI state, debounced search |
| `useCreateInvoice()` | Create-invoice mutation, domain-shaped result |
| `usePagination()` | Reusable page/cursor bookkeeping |
| `useDebounce(value, ms)` | Generic value debouncing |
| `useSecureStorage(key)` | Encrypted key/value access for non-token UI preferences |

Full responsibility/why/performance breakdown:
[ARCHITECTURE.md §7](./ARCHITECTURE.md#7-custom-hooks-design).

### Security

- Tokens (`accessToken`, `orgToken`) are stored **only** in
  `react-native-keychain` — never `AsyncStorage`.
- Exactly one module (`core/storage/tokenStorage.ts`) reads/writes tokens.
- Auth headers are injected automatically by an Axios request interceptor
  — no API call can forget them.
- A 401 from any endpoint triggers an app-wide logout via a decoupled
  event bus (`core/network/sessionEvents.ts`), not ad-hoc per-screen
  handling.

Full write-up: [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-security-strategy).

## Secrets & git hygiene

What is safe to push and what must never be pushed:

| File | Tracked in git? | Why |
|---|---|---|
| `.env.example` | ✅ yes | Template only — secret fields (`CLIENT_ID`, `CLIENT_SECRET`) are intentionally **blank** |
| `.env`, `.env.development`, `.env.staging`, `.env.production` | ❌ no | Git-ignored (`.gitignore`) — hold real credentials, never commit |
| `ios/.xcode.env` | ✅ yes | Contains only `export NODE_BINARY=$(command -v node)` — no secrets (standard RN file) |
| `ios/.xcode.env.local` | ❌ no | Git-ignored — per-machine overrides |

Verify before your first push (all four should print `IGNORED`, and the
`git ls-files` check should return nothing):

```bash
for f in .env .env.development .env.staging .env.production; do
  printf "%-20s -> " "$f"; git check-ignore -q "$f" && echo IGNORED || echo "NOT IGNORED ⚠"
done
git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example'   # expect: no output
```

If you ever accidentally committed a real `.env`, removing it in a later
commit is **not** enough — the secret stays in git history. Rotate the
credential and scrub history (`git filter-repo` / BFG) before the repo is
shared.

## CI/CD

`.github/workflows/ci.yml`: Lint → Type Check → Test (with coverage) →
Build (Android debug APK / iOS simulator build), gated so build only runs
after lint/typecheck/test all pass. See
[ARCHITECTURE.md §12](./ARCHITECTURE.md#12-cicd-strategy).

## Project structure

```text
src/
├── app/            # Composition root: providers, DI container, App.tsx
├── presentation/   # screens, components, hooks, navigation
├── domain/         # entities, repository interfaces, use cases
├── data/           # api services, dto, mappers, repository implementations
├── core/           # config, constants, network, storage, utils, types
├── store/          # Redux Toolkit slices + RTK Query
└── types/          # ambient module declarations
tests/
├── unit/           # usecases, hooks, utils
├── component/      # screens (RNTL)
└── integration/    # data-layer wiring against a mocked HTTP layer
```

Full folder-by-folder responsibility table:
[ARCHITECTURE.md §2](./ARCHITECTURE.md#2-detailed-folder-structure).
