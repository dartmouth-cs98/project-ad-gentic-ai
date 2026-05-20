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

## Campaigns list (`CampaignsPage`)

| Area | Path / symbol |
|------|----------------|
| Page | `src/pages/CampaignsPage.tsx` |
| Grid card | `src/components/campaigns/CampaignGridCard.tsx` |
| Table row delete | `src/components/campaigns/CampaignTable.tsx` |
| Delete confirm modal | `src/components/campaigns/DeleteCampaignModal.tsx` (portal to `document.body`) |

**Selection (grid view):** Checkbox top-left toggles selection; clicking the card body navigates to **`#/campaign/:id`** (campaign name is a link). Selected cards use blue border/ring/background. Selection persists across date/search filters; bulk delete resolves names from the full loaded list (`rawCampaigns`), not the date-filtered view.

**Selection (table view):** Row checkbox + row highlight; per-row **Delete** opens the same modal as bulk.

**Delete flows:**

| Action | API |
|--------|-----|
| 1 campaign (detail or list) | `DELETE /campaigns/{id}` — `deleteCampaign` / `useDeleteCampaign` |
| 2+ campaigns (list, **Delete Selected**) | `POST /campaigns/bulk-delete` — `deleteCampaignsBulk` / `useDeleteCampaignsBulk` |

Modal lists campaign name(s) and data removed (campaign, chat, variants, metrics, consumer events). Confirm via **Cancel** / **Delete** (no type-to-confirm). Bulk delete capped at **50** (`BULK_DELETE_MAX_CAMPAIGNS`). Partial bulk: amber banner when some `not_found_ids`; modal stays open if none were deleted.
