# Frontend lookup

## Routes (`HashRouter`)

Browser URL shape: `https://host/#/<path>` (hash segment, not server path).

| Path | Page component |
|------|------------------|
| `/` | `SimpleLanding` |
| `/old-landing` | `LandingPage` |
| `/sign-up` | `SignUpPage` |
| `/sign-in` | `SignInPage` |
| `/onboarding` | `OnboardingPage` |
| `/dashboard` | `DashboardPage` |
| `/workspace` | `DashboardPage` |
| `/campaigns` | `CampaignsPage` |
| `/campaign/:id` | `CampaignDetailPage` |
| `/generate` | `GenerateAdsPage` |
| `/products` | `ProductsPage` |
| `/customer-data` | `CustomerDataPage` |
| `/all-consumers` | `AllConsumersPage` |
| `/profile` | `ProfilePage` |
| `/settings` | `SettingsPage` |
| `/features` | `FeaturesPage` |
| `/how-it-works` | `HowItWorksPage` |
| `/pricing` | `PricingPage` |
| `/team` | `TeamPage` |

Source: `frontend/src/App.tsx`.

## API base URL (`src/api/config.ts`)

| Condition | `API_BASE_URL` |
|-------------|----------------|
| `VITE_ENV === 'local'` (or logic treats as local) | `/api` |
| Else | `import.meta.env.VITE_API_URL` or `/api` fallback |

## Vite dev proxy

- Requests to **`/api/*`** → **`VITE_API_URL`** (or `http://localhost:8000`), path rewritten to drop `/api`.

## React Query cache keys

| Export | Key shape (conceptual) |
|--------|-------------------------|
| `PROFILE_KEY` | `['auth','profile']` |
| `CAMPAIGNS_KEY` | `['campaigns', businessClientId?, status?]` / detail `['campaigns', campaignId]` |
| `PRODUCTS_KEY` | `['products', businessClientId]` |
| `CONSUMERS_KEY` | `['consumers', skip, limit]` |
| `PERSONAS_KEY` | `['personas']` |
| `CHAT_MESSAGES_KEY` | `['chatMessages', campaignId]` |
| `AD_VARIANTS_KEY` | `['ad-variants', campaignId, status?, isPreview?]` / preview variant |

Invalidation often uses **prefix** `CAMPAIGNS_KEY` or `AD_VARIANTS_KEY` only—see hook files under `frontend/src/hooks/`.

## `localStorage` keys (`api/config.ts`)

| Key constant | Purpose |
|--------------|---------|
| `TOKEN_KEY` → `adgentic_token` | JWT |
| `USER_KEY` → `adgentic_current_user` | Email display |
| `CLIENT_ID_KEY` → `adgentic_client_id` | Numeric client id |

## Theme

- `localStorage` key: `theme` (`light` | `dark`)
- `document.documentElement` class: `dark` when dark mode
