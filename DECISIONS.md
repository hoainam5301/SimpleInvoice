# DECISIONS.md — SimpleInvoice

Technology choices, the trade-offs behind them, and the assumptions this
codebase makes about requirements that weren't fully specified.

---

## Technology decisions

### Clean Architecture with 4 layers (Presentation / Domain / Data / Core)

**Decision:** strict layering with dependency inversion at the
repository boundary (domain defines the interface, data implements it).

**Trade-off:** more files and more indirection than a "screens call a
service directly" approach — a `GET /invoices` round trip touches 5 files
(hook → use case → repository interface → repository impl → API service)
instead of 1. For a Senior Mobile Engineer assessment this is the point:
it demonstrates the pattern at a scale where its benefits (testability
without a RN runtime, swappable data sources, enforceable dependency
direction) are visible without the codebase being large enough to *need*
them yet. In a real product, this structure earns its cost once the app
has more than ~2–3 features or more than one client for the domain layer
(e.g. a web app sharing use cases).

### Redux Toolkit for client state, RTK Query for server state

**Decision:** `authSlice`/`appSlice` (Redux Toolkit) for auth/session/UI
state; RTK Query for invoice data.

**Why not React Query instead of RTK Query:** the brief allows either.
RTK Query was chosen because the app already needs Redux Toolkit for
client state (auth is inherently global, imperative, event-driven — not
"data that goes stale and needs refetching," which is React Query's core
model). Using RTK Query for server state means **one store, one
DevTools timeline, one middleware chain** instead of two separate
state-management runtimes with different mental models. If this app had
no client-state need at all (e.g. everything server-derived), React Query
alone would have been the simpler choice.

**Trade-off resolved — RTK Query vs. Clean Architecture:** RTK Query's
default `fetchBaseQuery` would call the network directly from `store/`,
violating "no direct API calls outside Screen → Hook → UseCase →
Repository → API Service." Resolution: every endpoint uses a custom
`queryFn` that calls `container.useCases.*` instead of `fetchBaseQuery`
(`store/api/invoiceApi.rtk.ts`). RTK Query is used purely as a caching/
de-duplication layer sitting *in front of* the same use-case chain — not
as an alternate path to the network. `fakeBaseQuery()` makes this
structural (there is no default HTTP path to fall back to by accident).

### React Hook Form + Zod

**Decision:** RHF for form state/validation triggering, Zod for schema
definition, `@hookform/resolvers/zod` to bridge them.

**Why:** RHF avoids re-rendering the whole form on every keystroke
(uncontrolled-by-default via refs, `Controller` only where RN's
`TextInput` requires a controlled prop). Zod schemas
(`presentation/screens/*/schema.ts`) are shared as the single source of
truth for field constraints and are trivially unit-testable in isolation
from any component.

**Error handling strategy:** two layers, deliberately not merged into one:
1. **Zod schema** — instant, per-field UX feedback as the user types/blurs.
2. **Domain use case** (`CreateInvoiceUseCase.assertValid`,
   `LoginUseCase`'s guard) — re-asserts the same invariants as a
   non-bypassable business rule. The use case doesn't trust "the form
   already validated it," because use cases are reachable from anywhere
   (future deep links, admin tooling, tests) that skips the form.
3. **Network-level errors** (`ApiError` from `core/network`) surface as a
   screen-level `Alert`/banner — never a raw Axios error, never a raw
   server error body rendered verbatim.

### Axios (not `fetch`)

**Decision:** Axios for the HTTP client, wrapped in exactly one module
(`core/network/httpClient.ts`).

**Why:** built-in interceptor API (used for auth header injection and
error mapping), automatic JSON handling, and a distinguishable timeout
error (`ECONNABORTED`) that `fetch` doesn't provide without extra
plumbing (`AbortController` + manual timers). The cost — one more
dependency — is small and isolated: nothing outside `core/network`
imports `axios` directly, so switching to `fetch` later touches one file.

### `react-native-keychain` (not `react-native-encrypted-storage`) for tokens

**Decision:** tokens live in `react-native-keychain`; `react-native-encrypted-storage`
is kept for lower-sensitivity cached data (user profile).

**Why:** Keychain/Keystore is backed by hardware-level security on most
devices (Secure Enclave on iOS, StrongBox/TEE on Android where available)
and is the platform-idiomatic place for credentials specifically — it's
what iOS/Android review guidelines and most security audits expect to see
for auth tokens. `react-native-encrypted-storage` (AES-256 over
SharedPreferences/Keychain) is a fine, simpler API for everything else
that needs to be encrypted-at-rest but isn't a credential.

### `react-native-config` for environment configuration

**Decision:** three `.env.*` files (`development`/`staging`/`production`),
none committed except `.env.example`, injected at native build time.

**Trade-off / known limitation — see "Client secret in a mobile app"
below:** anything `react-native-config` injects ends up **inside the
compiled app binary**, extractable by anyone with the IPA/APK (it is not
a server-side secret store). It's still the right tool for
*environment-specific configuration* (API base URLs, timeouts); it is the
wrong tool for anything that must remain truly secret from the end user's
device.

### Manual DI (`src/app/di/container.ts`), not a DI framework

**Decision:** a single object of singletons, built by hand.

**Why:** at ~5 use cases / 2 repositories, a framework like InversifyJS or
tsyringe (decorators, reflect-metadata, container.resolve() indirection)
adds more ceremony than it removes. The manual container is a plain
object — anyone can `cmd+click` from a use case to its constructor call
and see exactly what's injected, with full TypeScript inference and no
runtime reflection. **Revisit if:** the dependency graph passes roughly
15–20 nodes, or per-request/per-scope lifetimes are needed (e.g.
request-scoped tracing IDs) that a plain singleton can't express cleanly.

---

## Trade-offs and things deliberately left out of scope

- **Refresh tokens.** The spec's login flow returns `access_token` only
  (no `refresh_token` handling is specified for the WSO2 endpoint used
  here). `AuthTokenPair`/`AuthSession` are shaped to make adding a
  refresh-token flow additive (a new field + a token-refresh interceptor
  branch in `errorInterceptor.ts`) rather than a rework.
- **Offline support for `createInvoice`.** A failed create today surfaces
  an error and the user retries manually. A production version would
  likely queue mutations offline (RTK Query supports this via
  `retry`/optimistic updates) — left out to keep the assessment's scope
  bounded to what's specified.
- **Biometric login.** `useSecureStorage` is deliberately generic enough
  to back a "Face ID / Touch ID unlock" preference toggle later, but
  actual biometric prompting (`react-native-keychain`'s
  `ACCESS_CONTROL.BIOMETRY_ANY`) isn't wired up — not in the stated
  requirements.
- **Release signing / store submission.** `ci.yml` builds debug/unsigned
  artifacts as a compile-smoke-test. Signing (Android keystore, iOS
  provisioning profiles) requires secrets and a release process outside
  this assessment's scope — flagged explicitly in `ARCHITECTURE.md §12`
  rather than silently omitted.
- **i18n.** All strings are hardcoded English. Structure (no string
  concatenation in the middle of JSX, centralized formatters for
  currency/date) makes extraction straightforward later.

### Client secret in a mobile app

**Assumption/flag:** the spec's login flow uses a `client_id` +
`client_secret` password grant against WSO2 IS. Embedding `client_secret`
in a distributed mobile binary is a known weak point — a "confidential
client" secret cannot actually stay confidential once shipped to end-user
devices, regardless of `react-native-config`/Keychain/obfuscation. This
codebase implements the flow **as specified** (`.env.*` → `env.ts` →
`authApi.requestToken`), but the production-correct fix is one of:
- Migrate to **Authorization Code + PKCE** (no client secret required for
  public/native clients — WSO2 IS supports this), or
- Proxy the token exchange through a thin backend-for-frontend that holds
  the secret server-side and hands the mobile app only short-lived tokens.

This is called out explicitly rather than silently "fixed" by inventing a
backend that wasn't asked for — see `.env.example`'s comment.

---

## Assumptions

1. **Backend contracts for `/invoices`** (list query params, response
   shape, create payload) are assumed/designed (`data/dto/InvoiceDto.ts`,
   `core/constants/api.constants.ts`) since the brief specifies only the
   two endpoints' existence, not their exact schema. Field names
   (`snake_case` wire format, `page`/`page_size`/`sort_by` query params)
   follow the same convention visible in the specified `/users/me`
   response (`memberships[0].token`), for internal consistency.
2. **Login credentials** are username/password against a `password` grant
   (`grant_type=password`) — the brief says "Login" without specifying the
   OAuth grant type; password grant is the simplest fit for a
   username/password login screen against WSO2 IS. See the PKCE note above
   for the production alternative.
3. **One membership per login is the common case**, but the API returns an
   array (`memberships[0].token` per the spec) — the code takes
   `memberships[0]` and treats "zero memberships" as an error state
   (`AuthRepositoryImpl.login`), rather than building a
   organization-switcher UI, which isn't in the stated requirements.
4. **Pagination is page-based** (`page`/`pageSize`), not cursor-based —
   chosen because "search/filter/sort" combined with pagination is far more
   natural to reason about (and to cache by args in RTK Query) as
   `(page, filters)` tuples than as opaque cursors, and the brief allows
   either "Infinite Scroll OR Pagination."
5. **Currency/amount** are assumed to arrive pre-computed from the backend
   (`amount` on the DTO) rather than derived client-side from
   `quantity * unitPrice` for the list view — the create-invoice flow still
   sends `quantity`/`unitPrice` and lets the server be the source of truth
   for computed totals, which is the safer default for anything
   invoice/money-related.
