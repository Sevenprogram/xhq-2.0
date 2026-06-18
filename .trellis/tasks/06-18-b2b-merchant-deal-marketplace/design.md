# B2B Merchant Deal Marketplace Design

## Scope

Build the approved MVP for `小黄雀商单`:

- Public homepage at `/`
- Public deal marketplace at `/deals`
- Deal detail and no-login creator application at `/deals/[id]`
- Merchant login/workspace at `/merchant`
- Backend SQLite persistence for deals and applications
- Seeded marketplace data from the existing deal dataset
- Lightweight merchant applicant status management

Deployment, new domain setup, Huawei Cloud work, real authentication, payment, review approval, and electronic publishing house crawling are out of scope for this implementation task.

## Architecture

### Backend

Use the existing FastAPI + SQLAlchemy 2.x + SQLite pattern.

New persistence objects:

- `MarketplaceDeal`
  - Public campaign/deal source of truth.
  - Stores card/detail fields needed by public pages and merchant workspace.
  - Includes `status` for future review/offline support, but MVP-created deals default to `published`.
  - Includes `source` so seeded deals and merchant-created deals can be distinguished.

- `DealApplication`
  - Creator no-login application submitted from a deal detail page.
  - Stores WeChat, account link, optional quote, note, nickname, and applicant status.
  - Belongs to one `MarketplaceDeal`.

New backend API under the existing `marketplace` router:

- `GET /api/marketplace/deals`
  - Public list.
  - Defaults to `published` deals.
  - Supports `search`, `track`, `city`, `limit`, `offset`.

- `POST /api/marketplace/deals`
  - Merchant creates a deal.
  - Uses fixed merchant credential only at the frontend gate for MVP; backend is not production-authenticated.
  - Creates as `published`.

- `GET /api/marketplace/deals/{deal_id}`
  - Public detail.

- `POST /api/marketplace/deals/{deal_id}/applications`
  - Public no-login creator application.
  - Rejects duplicate `deal_id + wechat + profile_link`.

- `GET /api/marketplace/applications`
  - Merchant workspace list.
  - Optional `deal_id`.

- `PATCH /api/marketplace/applications/{application_id}`
  - Merchant updates applicant status.

Seed behavior:

- Run during FastAPI startup after `init_db()`.
- Insert seed deals idempotently by stable `external_id`.
- Use a backend seed list equivalent to the current frontend mock deals. A representative first-pass seed is acceptable for the MVP, with fields mapped to the backend contract.

### Frontend

Use Next App Router + Tailwind + lucide icons.

Routes:

- `frontend/app/page.tsx`
  - Homepage.
  - Product positioning, transparent value proposition, creator quote lookup, selected marketplace preview.
  - Does not import old all-in-one `/demo` page.

- `frontend/app/deals/page.tsx`
  - Standalone marketplace.
  - Loads backend deals, supports filters/search.
  - Cards link to `/deals/[id]` and expose share/copy action.

- `frontend/app/deals/[id]/page.tsx`
  - Deal detail.
  - Displays richer brief and requirements.
  - Includes no-login application form.
  - Copies ready-to-send share text.

- `frontend/app/merchant/page.tsx`
  - Fixed credential login: `admin / xiaohuangque2026`.
  - After login: publish form, deal list, applicant list, status update.
  - Login state can remain in localStorage because real auth is out of scope.

Shared frontend contracts:

- Add marketplace types to `frontend/lib/types.ts`.
- Add API methods to `frontend/lib/api.ts`.
- Keep quote calculation in one shared frontend utility module so homepage and deal pages do not drift.

Old demo handling:

- Update `frontend/middleware.ts` so `/` is the homepage.
- `/demo` may redirect to `/` for compatibility.
- Remove old monitoring routes from public nav.
- Do not expose old demo tabs in the customer-facing shell.

## Data Contract

### Deal

Fields used across backend and frontend:

- `id`
- `external_id`
- `brand_name`
- `title`
- `city`
- `budget_min`
- `budget_max`
- `target_tracks`
- `target_audience`
- `deliverable`
- `brief`
- `contact_wechat`
- `status`
- `source`
- `created_at`
- `updated_at`
- `application_count`

### Application

- `id`
- `deal_id`
- `nickname`
- `wechat`
- `profile_link`
- `expected_quote`
- `note`
- `status`
- `created_at`
- `updated_at`

Application statuses:

- `pending_contact`
- `contacted`
- `selected`
- `rejected`

Deal statuses:

- `published`
- `offline`
- `pending_review` reserved for future work

## Pricing

Public creator quote:

- Base anchor: `followers / 100`
- Low bound: `base * 0.8`
- High bound: `base * 2`
- Apply bounded interaction / track / content adjustments inside the range where useful.
- Display a range rather than a single fixed price.

Merchant-side value framing:

- Can show richer "投放参考价值" or seeded deal budgets.
- Should not expose inflated internal reference pricing as the creator-facing ask.

## UX Direction

Target tone: B2B utility with a polished marketplace feel. The UI should be direct, dense enough for work, and not look like a marketing-only landing page.

Navigation:

- Brand: `小黄雀商单`
- Links: `首页`, `商单广场`, `商家登录/工作台`

Share copy:

Copy text should include:

- Brand
- Campaign title
- Budget range
- Deliverable
- Application link

Creator lookup loading:

- Use progress/step animation for 3-8 second wait.
- Avoid only changing the button text.

## Validation

Backend:

- Unit/API tests for seed idempotency, list/detail, create deal, submit duplicate application, and status update.

Frontend:

- TypeScript build.
- Manual browser verification of route flow after implementation.

## Compatibility / Rollback

- Keep old `/demo` code untouched initially or make it redirect only after new routes are working.
- Backend table creation uses existing `create_all` startup behavior, so local SQLite can be recreated if needed.
- Seed data must be idempotent to avoid duplicate rows after restarts.
