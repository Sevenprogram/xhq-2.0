# Implementation Plan

## Preconditions

- Current task has approved PRD.
- This task is complex and cross-layer, so `design.md` and this `implement.md` are required before `task.py start`.
- Relevant specs and thinking guides have been read. Project specs are mostly templates, so existing code conventions are authoritative.

## Steps

### 1. Backend persistence and APIs

- Add marketplace models:
  - `MarketplaceDeal`
  - `DealApplication`
- Export models from `backend/app/models/__init__.py`.
- Add marketplace schemas for create/read/list/update payloads.
- Add seed service with idempotent seed data.
- Update FastAPI startup to run marketplace seed after DB init.
- Extend `backend/app/api/marketplace.py` with:
  - list deals
  - create deal
  - get deal detail
  - submit application
  - list applications
  - update application status
- Add focused backend tests.

Validation:

```powershell
cd backend
python -m pytest tests -q
```

### 2. Frontend contracts and utilities

- Add marketplace types to `frontend/lib/types.ts`.
- Add marketplace API methods to `frontend/lib/api.ts`.
- Add shared quote utility for public creator quote range and share text.
- Keep constants such as merchant credentials and status labels in one place.

Validation:

```powershell
cd frontend
npm run build
```

### 3. Route and navigation rebuild

- Update metadata to `小黄雀商单`.
- Update `AppNav`:
  - brand `小黄雀商单`
  - links to `/`, `/deals`, `/merchant`
  - remove `Demo` labels and old role language
- Update middleware:
  - stop redirecting `/` to `/demo`
  - optionally redirect `/demo` to `/`
- Build new `app/page.tsx` homepage without importing old demo page.

Validation:

- Open `/`.
- Confirm no old demo tabs or `样本达人` text.

### 4. Public marketplace and detail flow

- Build `/deals` from backend API.
- Add search/filter controls.
- Build `/deals/[id]` detail page.
- Add share/copy action with ready-to-send text.
- Add no-login application form.
- Handle duplicate application error clearly.

Validation:

- Open `/deals`.
- Open one detail page.
- Submit application.
- Confirm success and duplicate behavior.

### 5. Merchant workspace

- Build `/merchant` fixed credential login.
- On success show:
  - publish deal form
  - merchant deal list
  - applicant list
  - applicant status select/buttons
- Publishing creates a backend deal and makes it visible publicly.

Validation:

- Login with `admin / xiaohuangque2026`.
- Publish deal.
- Confirm it appears in `/deals`.
- Submit application from public detail.
- Confirm merchant workspace sees it.
- Change applicant status.

### 6. UX polish and performance pass

- Add creator lookup progress/step animation.
- Ensure public routes do not import old all-in-one demo page.
- Tune responsive layout for desktop and mobile.
- Ensure text does not overflow buttons/cards.

### 7. Final checks

- Backend tests.
- Frontend build.
- Manual route flow.
- Git status review.

## Rollback Points

- If backend API work blocks frontend, temporarily read seeded deals from backend only and defer merchant publishing.
- If application status update is slow, keep list read-only and preserve status API for follow-up.
- If `/demo` compatibility causes routing issues, leave `/demo` intact and hide it from navigation while `/` works.

## Out of Scope During Implementation

- Huawei Cloud deployment.
- Domain setup.
- GitHub remote sync.
- Electronic publishing house data crawling.
- Production authentication.
- Payment/escrow.
- Admin approval workflow.
