# Frontend lookup

## Routes (`HashRouter`)

Browser URL shape: `https://host/#/<path>` (hash segment, not server path).

| Path | Page component |
|------|------------------|
| `/` | `SimpleLanding` |
| `/old-landing` | `LandingPage` |
| `/sign-up` | `SignUpPage` |
| `/sign-in` | `SignInPage` |
| `/verify-email` | `VerifyEmailPage` |
| `/reset-password` | `ResetPasswordPage` |
| `/onboarding` | `OnboardingPage` |
| `/dashboard` | `DashboardPage` |
| `/workspace` | `DashboardPage` |
| `/campaigns` | `CampaignsPage` |
| `/campaign/:id` | `CampaignDetailPage` |
| `/generate` | `GenerateAdsPage` |
| `/products` | `ProductsPage` |
| `/customer-data` | `CustomerDataPage` |
| `/customer-data/all-consumers` | `AllConsumersPage` |
| `/all-consumers` | Redirect → `/customer-data/all-consumers` |
| `/profile` | `ProfilePage` |
| `/settings` | `SettingsPage` |
| `/features` | `FeaturesPage` |
| `/how-it-works` | `HowItWorksPage` |
| `/pricing` | `PricingPage` |
| `/team` | `TeamPage` |

Source: `frontend/src/App.tsx`.

## API base URL (`src/api/config.ts`)

`ENV` is `import.meta.env.VITE_ENV` or **`local`** if unset. **`isLocal`** is true when `ENV === 'local'`.

| Condition | `API_BASE_URL` |
|-------------|----------------|
| **`isLocal`** (`VITE_ENV` unset or `local`) | `/api` |
| Else | `import.meta.env.VITE_API_URL` or `/api` fallback |

Same rules as [FRONTEND.md](../FRONTEND.md) (data-fetching section).

## Vite dev proxy

- Requests to **`/api/*`** → **`VITE_API_URL`** (or `http://localhost:8000`), path rewritten to drop `/api`.

## React Query cache keys

Canonical shapes live in **`src/api/queryKeys.ts`** (`queryKeys.auth.profile`, `queryKeys.consumers.list(skip, limit)`, etc.). Hooks re-export shortcuts:

| Export | Typical key |
|--------|----------------|
| `PROFILE_KEY` | `queryKeys.auth.profile` → `['auth','profile']` |
| `CAMPAIGNS_KEY` | `['campaigns']` |
| `PRODUCTS_KEY` | `['products']` |
| `CONSUMERS_KEY` | `queryKeys.consumers.all` → `['consumers']`; lists use `queryKeys.consumers.list(skip, limit)` |
| `PERSONAS_KEY` | `queryKeys.personas.all` → `['personas']` |
| `CHAT_MESSAGES_KEY` | `['chatMessages']` (often extended with `campaignId` in hook usage) |
| `AD_VARIANTS_KEY` | `['ad-variants']` |
| `useSocialConnection` | `['social','status']` (internal to hook) |

Invalidation often uses **prefix** queries—see `frontend/src/hooks/*.ts`.

## `localStorage` keys (`api/config.ts`)

| Key constant | Purpose |
|--------------|---------|
| `TOKEN_KEY` → `adgentic_token` | JWT |
| `USER_KEY` → `adgentic_current_user` | Email display |
| `CLIENT_ID_KEY` → `adgentic_client_id` | Numeric client id |

## Theme

- `localStorage` key: `theme` (`light` | `dark`)
- `document.documentElement` class: `dark` when dark mode
