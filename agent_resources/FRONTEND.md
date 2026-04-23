# Frontend guide

This document answers: **“How do I make frontend changes in the house style?”** It describes the **`frontend/`** Vite + React app as implemented today.

---

## Framework and app structure

| Piece | Choice |
|--------|--------|
| **Bundler / dev** | [Vite](https://vitejs.dev/) 5 (`npm run dev`, `npm run build`) |
| **UI library** | React 18 |
| **Language** | TypeScript (`strict` in `tsconfig.json`; `src/` only) |
| **Entry** | `index.html` → `src/index.tsx` → `src/App.tsx` |

**`src/` layout (mental model)**

| Path | Purpose |
|------|---------|
| `pages/` | Route-level screens (compose layout + data hooks). |
| `components/layout/` | App chrome (e.g. `Sidebar`). |
| `components/ui/` | Reusable primitives (`Button`, `Input`, `Card`, `Select`, …). |
| `components/campaigns/` | Campaign-specific UI (tables, modals, analytics). |
| `components/generate/` | Generate / chat / variants experience; `index.ts` re-exports. |
| `api/` | Plain `fetch` wrappers — **no data caching here**. |
| `hooks/` | TanStack Query hooks (`use*`) + small UI hooks (`useFilterState`, `useResizablePanel`). |
| `contexts/` | React context providers (user, company shell, consumers, personas, sidebar, theme). |
| `types/` | Shared TS types aligned with API payloads. |
| `utils/` | Cross-cutting helpers (e.g. `auth.ts`). |

**Dependency note:** `@emotion/react` is listed in `package.json` but **not used** in `src/` today; prefer **Tailwind** for styling unless you intentionally introduce Emotion.

---

## Routing structure

- **Router:** `react-router-dom` **`HashRouter`** (URLs look like `/#/dashboard`, not `/dashboard`). This avoids server rewrite configuration for SPAs but changes deep-linking and analytics expectations.
- **Scroll restoration:** `ScrollToTop` in `App.tsx` scrolls to `(0,0)` on pathname change.
- **Route table:** All routes are declared in **`src/App.tsx`** (`<Routes>` / `<Route>`). Add new pages there and place the component under `pages/`.

**Main paths (non-exhaustive):** `/` (landing), `/sign-in`, `/sign-up`, `/onboarding`, `/dashboard`, `/workspace`, `/campaigns`, `/campaign/:id`, `/generate`, `/products`, `/customer-data`, `/all-consumers`, `/settings`, `/profile`, marketing pages (`/features`, `/pricing`, …).

---

## State management

| Layer | Use for |
|--------|---------|
| **TanStack React Query v5** | **Server state**: fetching, caching, mutations, invalidation, polling (`refetchInterval`). Default `QueryClient` is created inline in `App.tsx` (no custom defaults file yet). |
| **React Context** | **Auth-derived and UI shell state**: `UserProvider` (profile from API), `CompanyProvider` (derived “company profile” + local overrides), `ConsumerProvider`, `PersonasProvider`, `SidebarProvider`, `ThemeProvider` (`light` / `dark`). |
| **Local `useState` / `useRef`** | Form fields, modals, combobox open state, panel sizing — keep **close to the component** unless reused. |

**Conventions**

- Export **stable query keys** from hooks (e.g. `CAMPAIGNS_KEY`, `PROFILE_KEY`, `AD_VARIANTS_KEY`) and reuse them in `invalidateQueries`.
- Use `enabled: !!id` (or similar) so queries **do not fire** until required IDs exist.
- After mutations, **`invalidateQueries`** for every list/detail that should refresh (house style today; optimistic updates are rare).

---

## Data-fetching patterns

1. **`src/api/config.ts`** — `API_BASE_URL` is **`/api`** when **`isLocal`** is true (`VITE_ENV` unset or **`local`** per `ENV || 'local'`), otherwise **`VITE_API_URL`** (or `/api` fallback). **`apiUrl(path)`** prefixes paths. **`authHeaders()`** adds `Authorization: Bearer …` from `localStorage` and optional `Content-Type: application/json`.
2. **Vite proxy** — `vite.config.ts` proxies **`/api` → backend** (`VITE_API_URL` or `http://localhost:8000`), rewriting `/api` off the path so FastAPI sees `/campaigns`, `/auth`, etc.
3. **`src/api/*.ts`** — One module per domain (`auth`, `campaigns`, `products`, …). Functions **`throw Error`** with message from `body.detail` when `!res.ok`.
4. **`src/hooks/use*.ts`** — Wrap API calls with **`useQuery` / `useMutation`**. Prefer **`isLoading` / `isPending` / `isError` / `error`** from React Query in UI instead of re-implementing loading flags.

**Auth session:** `storeSession` / `clearSession` in `api/auth.ts` use **`localStorage`** keys (`adgentic_token`, etc.). `useProfile` is **disabled** when there is no token (`enabled: !!getToken()`).

---

## Component conventions

- **Pages** own routing concerns and **compose** sections; they should stay **thin** — delegate lists and forms to `components/*`.
- **Icons:** **`lucide-react`** (e.g. `Loader2Icon` for spinners).
- **Primitives:** Prefer **`components/ui/*`** (`Button` supports `isLoading`, `variant`, `size`, focus ring classes) before adding one-off `<button>` styles.
- **Barrel files:** `components/generate/index.ts` re-exports; follow the same pattern when a folder grows many entry points.
- **Exports:** Context hook + provider live in the same file; **`react-refresh/only-export-components`** may require an eslint disable when exporting both (see `UserContext.tsx`).

---

## Styling system

- **Tailwind CSS 3** with **`tailwind.config.js`** mapping theme colors to **CSS variables** (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, etc.).
- **`src/index.css`** defines `:root` and **`.dark`** token sets, font imports (**Inter**, **Playfair Display**), and global `html, body, #root` height/background.
- **Dark mode:** `darkMode: 'class'`; **`ThemeProvider`** toggles `document.documentElement.classList` and persists **`localStorage`** key `theme`.
- **Persona / marketing accents:** Extra variables (e.g. `--persona-accent`) for feature-specific theming.

**House style:** Use **semantic Tailwind tokens** (`bg-card`, `border-border`) over raw hex in new code so light/dark stays coherent.

---

## Form handling

There is **no** shared form library (no React Hook Form in dependencies). Typical pattern:

- **Controlled inputs** with `useState` (and sometimes module-level **`inputClass` / `labelClass`** strings shared inside one file, e.g. `CreateCampaignModal.tsx`).
- **Validation:** Inline checks before submit; surface errors via **local state** (`error`, `fieldErrors`) or **toast-less** message text (project-dependent).
- **Submit:** Call **`useMutation`**’s `mutate` / `mutateAsync`; use mutation **`isPending`** to disable buttons and show **`Loader2Icon`**.
- **Complex pickers:** Pattern of **ref + `mousedown` outside** to close dropdowns (see product selector in campaign modal).

When adding a large form, consider introducing **React Hook Form** + **Zod** in a **single** feature first and document the pattern here — until then, match existing modals.

---

## Error and loading patterns

| Situation | House approach |
|-----------|----------------|
| **Initial fetch** | `useQuery` → `isLoading`, `isError`, `error`; optional **`retry: false`** for auth (`useProfile`). |
| **Mutations** | `isPending` / `isError` on `useMutation`; `Loader2Icon` + disabled controls. |
| **API errors** | `fetch` helpers throw **`Error`**: in mutations, handle with **`onError`** or inline `try/catch` if using `mutateAsync`. |
| **Long-running backend jobs** | `useCampaignAdVariants` / `usePreviewVariants` support **`refetchInterval`** to poll until variants reach a terminal status. |

**`Button`:** Use **`isLoading`** prop for consistent disabled + spinner behavior.

---

## Accessibility expectations

- **Partial today:** Many icon-only controls use **`aria-label`** (theme toggle, send message, close filters). Prefer **labels** or **`aria-label`** on any non-text control.
- **Focus:** Shared `Button` uses **`focus:ring-2`** / **`focus:ring-offset-2`**; custom interactive divs should get **`tabIndex`**, **`onKeyDown`**, and visible focus if they behave like buttons.
- **Language:** `index.html` sets **`<html lang="en">`**.
- **New work:** Meet **WCAG contrast** using theme tokens; don’t rely on color alone for errors (add text); keep **heading order** sensible on marketing pages.

---

## Frontend testing strategy

**Today:** `package.json` has **no** `test` script — CI runs **`npm run lint`** and **`npm run build`** only ([`.github/workflows/lint.yaml`](../.github/workflows/lint.yaml), [`frontend-build.yaml`](../.github/workflows/frontend-build.yaml)).

**Recommended direction (not yet wired):**

1. **Vitest** + **React Testing Library** for components and hooks (with **MSW** or mocked `fetch` for `api/*`).
2. **One golden test** per critical flow (sign-in, create campaign, generate page happy path) before large refactors.
3. Keep **`typecheck`** in habit: `npx tsc --noEmit` locally (see [AGENTS.md](../AGENTS.md)).

Until tests exist, rely on **manual smoke** on `/#/…` routes and **lint + build** in CI.

---

## Common pitfalls

1. **`HashRouter` URLs** — Links must use **`HashRouter`’s paths** (`/#/dashboard`). Plain `<a href="/dashboard">` can hit the server and404.
2. **`VITE_ENV` and API base** — If `VITE_ENV` is not **`local`**, **`API_BASE_URL`** expects **`VITE_API_URL`**; misconfiguration causes silent wrong host or CORS issues.
3. **Duplicated hook names** — `useUpdateCampaign` exists in both **`useCampaigns.ts`** and **`useAdGeneration.ts`** with different **`invalidateQueries`** behavior. Import from the **correct** module for your feature.
4. **Query key drift** — Sub-keys (`status`, `isPreview`) change cache identity; after API changes, ensure **`invalidateQueries`** matches the keys your lists use.
5. **Auth and `enabled`** — Queries that need auth should stay **`enabled: !!businessClientId`** (or similar) so they don’t 401 before profile loads.
6. **`.next` in repo** — ESLint ignores **`.next`**; if present locally, it’s **not** the Vite app — don’t edit generated chunks.
7. **SAS video URLs** — Backend may return **time-limited** URLs; UI should **refetch** variant data if playback expires (see [PRODUCT.md](./PRODUCT.md)).
8. **Theme flash** — `ThemeProvider` reads `localStorage` in `useEffect`; expect a possible **first-paint** theme mismatch before hydration-style adjustment.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | How frontend fits in the full system. |
| [PRODUCT.md](./PRODUCT.md) | Product behavior the UI should reflect. |
| [BACKEND.md](./BACKEND.md) | API and auth patterns the client calls. |
| [TESTING.md](./TESTING.md) | Lint, build, and future frontend tests. |
| [references/frontend.md](./references/frontend.md) | Hash routes, query keys, storage keys (lookup). |
| [AGENTS.md](../AGENTS.md) | Commands: `npm run dev`, `lint`, `build`, `tsc`. |
