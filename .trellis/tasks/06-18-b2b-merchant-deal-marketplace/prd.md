# B2B Merchant Deal Marketplace Iteration

## Goal

Reposition the current Xiaohuangque demo from a mixed creator/brand demo into a B2B-first merchant deal marketplace MVP. The immediate goal is to make the product convincing for merchant-side customers while keeping creator-side participation frictionless: creators can browse public deals, view estimated creator value, open/share a deal detail page, and apply without registration.

## What I already know

- The product direction should be merchant-led, not a symmetric creator/merchant platform.
- Creator login/registration should be removed from the MVP. Creators should be able to view deal opportunities and apply with simple contact fields.
- Merchant login should exist as a simple entry point. Merchant approval/account review can be controlled manually for now and does not need a visible admin workflow in this MVP.
- The public navigation should be simplified to homepage, deal marketplace, and merchant login.
- Demo wording should be removed from user-facing product surfaces.
- The user-facing product name for this MVP should be `小黄雀商单`.
- The homepage should focus on the transparent matching value proposition: creators understand their real value, merchants understand where the money goes, and no hidden middleman spread exists.
- The deal marketplace should become a standalone page, not only a lower section on the homepage.
- Each deal should have a share button/link so the team can send opportunities to creators through WeChat, Xiaohongshu DM, or groups.
- Each deal should have a detailed page with richer campaign requirements and an application form.
- Creator application should ask for at least WeChat and Xiaohongshu/Douyin profile link.
- Merchant workspace should eventually show candidate/applicant information for each deal.
- Existing creator value lookup can take about 5 seconds, so the UX should show a deliberate progress/loading state instead of a simple spinner or disabled button.
- Creator valuation should be biased lower for public-facing creator quotes, especially small creators. Use `followers / 100` as the base anchor, then show a range around it, e.g. `(followers / 100) * 0.8` to `(followers / 100) * 2`, with bounded adjustments for interaction quality, track fit, and content quality.
- Follow-up planning image mentioned merchant review before publishing, but the user clarified that review can be skipped for the current MVP.
- Follow-up planning image also calls out urgent deployment to Huawei Cloud, slow page loading, GitHub sync, new domain deployment, and a separate electronic publishing house data crawling task.
- Existing local code currently places most demo behavior in `frontend/app/demo/page.tsx`.
- Current app navigation is `商单 Demo`, `商单广场`, `商家登录` in `frontend/components/app-nav.tsx`.
- Current demo page still contains old role/tab concepts: creator view, brand view, industry board, transparent trade, and one-click report.
- Current mock deals live in `frontend/src/data/mockDeals.ts` and already include many merchant campaigns.
- Current mock creators live in `frontend/src/data/mockCreators.ts`.
- Current creator quote formula lives in `frontend/app/demo/page.tsx` around `estimateQuote`, `estimateQuoteComponents`, `quoteFloorByFollowers`, and `quoteCapByFollowers`.
- Current global layout is a simple app shell in `frontend/app/layout.tsx`.

## Assumptions (temporary)

- This iteration should prioritize a polished demo for near-term customer conversations over production-grade auth, persistence, and admin moderation.
- Published deals and creator applications should persist in the backend SQLite database.
- Merchant deal publishing should be a real backend-backed MVP flow; full review and permissions can come later.
- Existing pages outside `/demo` are older internal monitoring product pages and should not be part of the new public MVP navigation unless requested.

## Requirements

- Rework the product surface around a merchant-first deal marketplace.
- Use `小黄雀商单` as the user-facing product name.
- Use formal product routes: homepage `/`, marketplace `/deals`, deal detail `/deals/[id]`, merchant workspace `/merchant`.
- Remove or hide old creator-side role workspace and old demo labels from the public experience.
- Keep the homepage focused on product positioning and creator valuation/deal discovery.
- Move the deal marketplace into a standalone route/view with searchable/filterable deal cards.
- Add shareable deal detail pages with clear campaign requirements.
- Deal share action should copy both the detail URL and a ready-to-send share text block.
- Add creator application flow with minimal fields and no login requirement.
- Add merchant login/workspace path for publishing deals and viewing applicants.
- Use a simple fixed username/password merchant login for the MVP.
- Use fixed merchant credentials: username `admin`, password `xiaohuangque2026`.
- Persist published deals and creator applications in backend SQLite.
- Add backend APIs for listing/creating deals, reading deal details, submitting creator applications, and listing applications for merchant workspace.
- Seed the backend SQLite marketplace from the existing frontend `mockDeals` dataset so the public marketplace is populated immediately.
- Merchant deal publishing form requires: brand name, deal title, city, budget minimum, budget maximum, target tracks, target audience, deliverable requirements, detailed brief, and contact WeChat.
- Creator deal application form requires WeChat and Xiaohongshu/Douyin profile link, with optional expected quote, note, and nickname.
- Merchant workspace applicant management includes applicant list plus simple status marking: pending contact, contacted, selected, rejected.
- Merchant-created deals should be published immediately in the MVP; reserve a status field for future review/offline workflows.
- Reduce public page load weight by removing old demo modules from the main customer-facing route and keeping only the MVP surfaces.
- Improve creator lookup loading state with a progress-style animation tuned for the 3-8 second wait range.
- Adjust creator valuation logic so public creator quotes use a conservative range: base anchor `followers / 100`, low bound `base * 0.8`, high bound `base * 2`, then apply bounded quality/track/interaction adjustments where appropriate.
- Distinguish merchant/demo-facing internal valuation from creator-facing external quotation when needed: internal examples may look more attractive, while public creator quotes use the conservative low-price anchor.
- Use local/static data for enough sample creators and merchant deals to make the demo feel populated.

## Acceptance Criteria

- [ ] Public navigation no longer exposes old demo terminology or irrelevant dashboard sections.
- [ ] User-facing page titles, navigation labels, and metadata use `小黄雀商单` without `Demo`.
- [ ] Homepage is served at `/`, marketplace at `/deals`, deal detail at `/deals/[id]`, and merchant workspace at `/merchant`.
- [ ] A first-time visitor can understand within one screen that this is a B2B creator deal marketplace for merchants and creators.
- [ ] Creators can browse public deals without logging in.
- [ ] A deal can be opened on its own detail URL and shared via a visible share/copy action.
- [ ] Share/copy action copies a WeChat/group/private-message friendly text block including brand, budget, deliverable, and application link.
- [ ] The deal detail page contains richer requirements than a single short deliverable line.
- [ ] A creator can submit interest with WeChat and Xiaohongshu/Douyin profile link without registration.
- [ ] Creator application form requires WeChat and Xiaohongshu/Douyin profile link, and supports optional expected quote, note, and nickname.
- [ ] Merchant login path exists and leads to a merchant-side workspace or publishing entry.
- [ ] Merchant login accepts the agreed fixed demo credential and rejects incorrect credentials with a clear error.
- [ ] The accepted merchant credential is `admin / xiaohuangque2026`.
- [ ] The backend seeds initial marketplace deals idempotently from existing mock deal data.
- [ ] The public marketplace shows seeded deals immediately after backend startup.
- [ ] Merchant can publish a new deal with brand name, title, city, budget range, target tracks, target audience, deliverable requirements, detailed brief, and contact WeChat.
- [ ] Merchant-created deals are visible publicly after publishing in the MVP.
- [ ] Deal data model leaves room for future review/offline status.
- [ ] Merchant side can see submitted candidate/applicant information in the demo flow if applicant handling is included in MVP.
- [ ] Merchant side can change applicant status among pending contact, contacted, selected, and rejected.
- [ ] Creator value lookup displays an intentional progress/loading state while waiting.
- [ ] Homepage/customer-facing routes do not import the old all-in-one demo module unnecessarily.
- [ ] Creator lookup uses progress/step animation during API wait instead of only a button text change.
- [ ] Public creator valuation displays a quote range, not a single fixed price, based on `followers / 100` with approximately `0.8x - 2x` bounds.
- [ ] Small creator valuation does not over-anchor creators above merchant-friendly budgets.
- [ ] Customer-facing routes do not load or expose old demo-only modules such as industry board, transparent trade, and one-click report.
- [ ] Frontend build/type checks pass.

## Open Questions

- None blocking. Confirm final PRD and proceed to design/implementation planning.

## Decisions

### MVP Scope

**Context**: The near-term demo must be convincing for merchant-side customers while still shipping quickly enough for tomorrow's customer conversations.

**Decision**: Use Slice 1-4 as the MVP: public product surface, standalone marketplace/deal detail, creator no-login application flow, and a lightweight merchant workspace for publishing deals and viewing applicants.

**Consequences**: Full audit/review workflow, payment/escrow state machine, production authentication, and richer reporting can be added only if progress allows. The first implementation should keep those extension points visible but avoid spending the first pass on them.

### Persistence

**Context**: Published deals and creator applications need to survive refreshes and be visible from the merchant workspace in the same local MVP.

**Decision**: Persist merchant deals and creator applications through the FastAPI backend using the existing SQLite database.

**Consequences**: This is more realistic than localStorage and supports multi-browser local demos, but it requires backend models, schemas, API routes, and frontend API integration. Production authentication and permission isolation remain out of scope for the first pass.

### Merchant Login

**Context**: Merchant customers may want to try entering the workspace, but the meeting deprioritized visible approval/admin work for the immediate demo.

**Decision**: Use a simple fixed username/password login for the MVP.

**Credential**: `admin / xiaohuangque2026`.

**Consequences**: The flow feels closer to a real merchant login than a one-click demo gate, while avoiding production-grade account creation, password storage, sessions, role permissions, and approval workflows. The credential can be changed later or replaced with real auth.

### Initial Marketplace Data

**Context**: The marketplace needs to look populated immediately for demos, while still allowing merchant-created deals to be shown in the same backend-backed flow.

**Decision**: Seed backend SQLite from the existing `mockDeals` dataset on startup or through an idempotent initialization path.

**Consequences**: The marketplace opens with realistic content, and newly published merchant deals append to the same source of truth. The seed operation must be idempotent so restarting the backend does not duplicate deals.

### Product Naming

**Context**: The meeting explicitly called out removing `Demo` labels and using a real product name for customer-facing surfaces.

**Decision**: Use `小黄雀商单` as the MVP product name.

**Consequences**: Navigation, metadata, page headings, and share text should remove `Demo`. A future domain/brand rename can be handled as a copy/config pass later.

### Route Structure

**Context**: The MVP should feel like a real product rather than a demo path, especially when links are shared with customers and creators.

**Decision**: Use formal product routes: `/` for the homepage, `/deals` for the marketplace, `/deals/[id]` for deal detail/application, and `/merchant` for the merchant workspace.

**Consequences**: Existing middleware should stop redirecting `/` to `/demo`. The old `/demo` route can either redirect to `/` or remain hidden as a temporary compatibility path during implementation.

### Merchant Deal Publishing Fields

**Context**: Merchant-side customers should be able to try publishing a campaign without a heavy admin workflow.

**Decision**: Require brand name, deal title, city, budget minimum, budget maximum, target tracks, target audience, deliverable requirements, detailed brief, and contact WeChat.

**Consequences**: This is enough to render public deal cards, detail pages, and internal follow-up context. The detailed brief can hold product selling points, shooting requirements, schedule, and notes without over-modeling those fields in the first pass.

### Creator Application Fields

**Context**: Creator-side participation should stay lightweight and should not require registration in the MVP.

**Decision**: Require WeChat and Xiaohongshu/Douyin profile link. Support optional expected quote, note, and nickname.

**Consequences**: Merchants can identify and contact applicants while creators avoid a heavy onboarding flow. Expected quote and notes support screening, but not requiring them keeps the application friction low.

### Applicant Management

**Context**: The merchant workspace should demonstrate that applications are actionable after creators submit interest.

**Decision**: Include applicant list plus simple status marking in the MVP. Status values: pending contact, contacted, selected, rejected.

**Consequences**: This gives the merchant side a credible workflow without implementing full CRM features such as search, export, historical notes, assignment, messaging, or notifications.

### Additional Requirements From Follow-Up Planning Image

**Context**: The follow-up image restates the toB direction and adds operational priorities.

**New requirements captured**:

- Home should only retain homepage, standalone deal marketplace, and merchant login as the core user-facing modules.
- Remove all creator-side entry points, not just creator login.
- Merchant-submitted deals can skip review in this MVP after user clarification; future review/offline states should remain easy to add.
- Deal sharing should copy a community/private-message friendly link and copy block.
- Creator application should stay minimal, with WeChat and account link as the main visible fields.
- Query latency should be handled through speed optimization or a loading animation.
- Public-facing creator quote should use the 1/100 follower low-anchor strategy as a quote range, e.g. base `followers / 100`, low `base * 0.8`, high `base * 2`, while internal/demo valuation can remain more attractive where useful.
- Page loading performance is a high-priority issue.

**Separate operational tasks**:

- Deploy the finished MVP to Huawei Cloud and connect the new domain.
- Keep code synchronized through GitHub before deployment.
- Complete electronic publishing house data crawling as a separate workstream.

## Out of Scope

- Visible merchant approval/admin review workflow for the first pass.
- Production-grade authentication, account creation, password storage, sessions, and role permissions.
- Real payment, escrow, settlement, or invoice workflows.
- Full analytics/report generation unless progress after the MVP is ahead of schedule.
- Huawei Cloud deployment and new-domain setup for this task's coding scope unless explicitly promoted into the implementation task.
- Electronic publishing house data crawling; user confirmed this is a later separate task, not the current MVP.

## Follow-Up Tasks After Development And Testing

- Deploy the completed and locally tested MVP to Huawei Cloud.
- Configure the new domain after it is purchased.
- Sync finalized code through GitHub before deployment.
- Create a separate later task for electronic publishing house data crawling when needed.

### Merchant Deal Review

**Context**: The follow-up planning image mentioned that merchant login/publishing should require review before a deal becomes public.

**Decision**: Skip merchant deal review in the current MVP. Merchant-created deals publish immediately.

**Consequences**: The demo can show the publish-to-marketplace loop quickly. The backend model should still keep a simple status field so future review/offline workflows do not require a data model rewrite.

### Deal Sharing

**Context**: The team wants to send deal opportunities to creators through WeChat groups, Xiaohongshu DMs, and direct messages.

**Decision**: Add share/copy actions that copy both the deal detail URL and a ready-to-send text block with brand, budget, deliverable, and application link.

**Consequences**: The MVP does not need native mobile share APIs. A copy-text workflow is enough for desktop operations and avoids browser compatibility work.

### Page Loading And Query Feedback

**Context**: The current page can feel heavy because the old demo concentrates many modules in one route, and creator lookup may take several seconds.

**Decision**: Reduce load weight by splitting/removing old demo modules from customer-facing routes, and add a progress/step animation for creator lookup waits.

**Consequences**: This targets the visible performance issues without spending the first pass on deeper performance engineering, profiling, code splitting strategy, or infrastructure tuning.

## Current Frontend Assessment

- The app is already effectively routed into the demo surface. `frontend/middleware.ts` redirects `/`, `/projects`, `/keywords`, `/posts`, `/creators`, `/analytics`, and `/jobs` to `/demo`.
- The current public header is close to the requested structure, but still uses demo naming: `小黄雀商单 Demo`, `商单 Demo`, and the local storage key `xiaohuangque-demo-role`.
- The actual homepage still exposes an internal demo tab row. Guests currently see at least `达人视角`, and the source still contains `品牌方视角`, `赛道看板`, `透明交易`, and `一键报告`.
- The current first screen has useful product substance: creator base info, creator valuation, creator lookup, matched deals, and transparent payout explanation.
- The homepage still says `样本达人`, which the meeting explicitly said should not be shown to users.
- The deal marketplace already exists as `DealPlaza` inside the homepage, with search, track filter, city filter, cards, budget range, deliverable, target audience, estimated payout, and apply button.
- The deal marketplace is not yet a standalone page. `商单广场` in navigation is only an anchor to `/demo#deal-plaza`.
- Deal cards do not yet have detail URLs, share/copy buttons, or formal campaign pages.
- `申请合作` / `接受合作` currently routes into the transparent trade flow through `acceptDeal`, not into a creator application form.
- Merchant login is currently a local role toggle. After login, the merchant workspace links to old demo modules rather than deal publishing and applicant management.
- The existing creator valuation formula is too high for the new merchant-friendly pricing direction. Current minimum floors start at RMB 100/200/300/500 depending on follower count, and add traffic/interaction/tag premiums.
- Creator lookup loading currently only changes button text to `查询中`; it does not show the requested progress-style loading experience.
- Report generation already has an intentional 5-second wait pattern, which can be reused as the interaction model for creator lookup.

## Recommended MVP Slices

### Slice 1: Public product surface

- Rename user-facing product copy to remove `Demo`.
- Make `/demo` behave as the new homepage.
- Remove old demo tabs from the public page.
- Keep creator valuation + public deal discovery on the homepage.
- Remove `样本达人` label from public copy.

### Slice 2: Standalone marketplace and deal detail

- Add a standalone marketplace route, likely `/deals`.
- Reuse `mockDeals` as the first local dataset.
- Add share/copy link on deal cards and detail pages.
- Add a detail page route, likely `/deals/[id]`, with richer requirements and application CTA.

### Slice 3: Creator application flow

- Add no-login application form on deal detail pages.
- Required fields: WeChat, Xiaohongshu/Douyin profile link.
- Optional fields: expected quote, note, phone.
- Store submissions through backend SQLite and show them in the merchant workspace.

### Slice 4: Merchant workspace

- Keep merchant login lightweight for MVP unless the login decision requires an account request flow.
- Replace old brand/industry/trade/report links with deal publish and applicants.
- Add a publish deal form if included in the demo scope.
- Add candidate/applicant list if included in the demo scope.

### Slice 5: Valuation and loading

- Re-anchor small creator pricing around the meeting's low-price formula.
- Public quote output should be a range based on `followers / 100 * 0.8` to `followers / 100 * 2`, not a single quote.
- Reuse the existing 5-second report-loading pattern for creator lookup, but render progress text and a progress bar.
- Keep local featured creators priced more confidently, while searched small creators use conservative pricing.

## Technical Notes

- Main current demo implementation: `frontend/app/demo/page.tsx`.
- App header/navigation: `frontend/components/app-nav.tsx`.
- Global shell: `frontend/app/layout.tsx`.
- Route redirect behavior: `frontend/middleware.ts`.
- Mock merchant deals: `frontend/src/data/mockDeals.ts`.
- Initial backend deal seed should derive from `frontend/src/data/mockDeals.ts` or a copied backend seed equivalent.
- Mock creators: `frontend/src/data/mockCreators.ts`.
- Backend currently uses FastAPI routers under `backend/app/api/`, SQLAlchemy 2.x models under `backend/app/models/`, Pydantic schemas under `backend/app/schemas/`, and SQLite by default.
- Existing marketplace backend router is `backend/app/api/marketplace.py`.
- Existing SQLite tables are created through `init_db()` / `Base.metadata.create_all()` on FastAPI startup.
- Existing app was reachable locally at `http://localhost:3000/demo`.
- Playwright was not locally installed in `frontend/node_modules`; `npx --no-install playwright --help` timed out, so the current review used source inspection plus the local page HTML returned by the running Next dev server.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
