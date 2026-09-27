# Order Dashboard: performance evidence

## Dataset and environment

- Windows, HeadlessChrome 153.0.0.0, viewport 1440 × 900, Angular development build.
- Deterministic 5,000-order dataset generated from the original three fixtures; unique `id` and `number` (`Order` calls the order number `number`, not `orderNumber`). No original fixture was changed.
- Mock API latency remains 600 ms. API is an Angular interceptor, so requests do not travel to an HTTP server or appear as backend requests in the browser Network panel.
- Before was measured at 2026-09-27T08:21:50Z, after at 2026-09-27T12:08:37Z. These are individual observed samples, not averages or a statistically controlled benchmark. Machine load/JIT/GC can affect timings.

## Actual measurements

Source artifacts: [before JSON](performance-before.json), [after JSON](performance-after.json).

| Metric | Before | After |
| --- | ---: | ---: |
| Dataset size | 5,000 | 5,000 |
| Initial list GET attempts | 1 | 1 |
| Additional GETs after submitting unchanged filters twice | 2 | 0 |
| GETs for rapid `I → Ic → Ico → Icom → Icomputer` input | 1 | 1 |
| Detail GETs when opening the same row twice | 2 | 1 |
| Total API attempts in measured scenario | 6 | 3 |
| Initial order rows in DOM | 5,000 | 50 |
| Initial total `tbody tr`, including hidden detail rows | 10,000 | 50 |
| Initial row transformations | 24.0 ms / 5,000 items | 0.8 ms / 50 items |
| Initial grouping | 697.0 ms / 5,000 items | 0.5 ms / 50 items |
| Response received → Angular DOM render complete | 1,728.0 ms | 37.3 ms |

The processing timings compare the work needed for the initial screen: the optimized screen only transforms/groups one page. They do **not** prove a 5,000-item standalone grouping speedup of the same ratio. Separately, source inspection establishes that grouping now uses a Map in O(n), replacing per-group full-array scans, O(n × number of groups).

The original normal mock API returned at most 10 rows and the dashboard always requested page 1. It did **not** actually render 5,000 rows in ordinary use. For the Before experiment only, instrumentation enabled a generated dataset and returned all 5,000 rows on page 1 to reproduce the requested large-response scenario. The After API limits page size to 50; it cannot be switched into an unbounded production list by a URL parameter.

## Root causes confirmed in source

1. `groupOrdersByNumber()` used `orders.filter()` for each distinct number. With 5,000 unique numbers it scanned 25 million row/group combinations.
2. `submitFilters()` unconditionally emitted a reload even if search/status/dates were unchanged. The duplicate guard only covered the automatic search path. A regression test before the fix failed with **“Expected zero matching requests … found 2.”**
3. `OrderService` returned cold, uncached reads. Reopening the same detail generated another GET.
4. Table created a hidden detail `<tr>` for every order, doubling row elements before any detail was opened. Every row supplied by the service was transformed and rendered; there were no pagination controls to reach other pages.

Not root causes: initial load was one GET, the source had no duplicated list subscription, search already debounced 300 ms, the table already tracked `order.id`, and Table/Badge/Status Form already used OnPush. We preserve and test these instead of claiming they were missing.

## Changes and behavior

- Server-side pagination: `page` + `pageSize=50`; body stays `Order[]` for compatibility, with `X-Total-Count` containing the filtered dataset size. `getOrdersPage()` exposes `{ items, total }`. Legacy `getOrders()` still returns an array. The default legacy API page size is 10; the dashboard explicitly requests 50.
- Filters run on all 5,000 records **before** slicing the page. Changed filters reset to page 1. Paging uses the applied query. Summary and net total describe the **current page**, explicitly labeled in the UI.
- `debounceTime(300)` waits through rapid typing; `distinctUntilChanged()` compares the whole normalized query across automatic search and explicit submit; `switchMap()` cancels obsolete reads. Retry and explicit refresh bypass deduplication/cache; reset cancels pending search and fetches the unfiltered first page.
- Page/detail read cache uses `shareReplay({bufferSize:1,refCount:true})`, shares in-flight requests, retains successful results for 30 seconds, and bounds each cache to 40 entries. Error/cancelled reads are removed. Successful PATCH clears page and detail caches; completion of an older request cannot repopulate a cleared cache. Failed PATCH preserves saved status and existing cache. External backend changes may remain cached up to 30 seconds; use refresh for an immediate list read.
- Dashboard also uses OnPush. Updates remain immutable. `@for (...; track order.id)` keeps row elements across reorder/immutable status updates. Detail DOM is created only for an expanded row: normally 50 `<tr>`, at most 51 with a detail open.
- Grouping uses one Map pass and preserves first-seen ordering, independent copies, and integer-satang totals.

## How to reproduce After

1. In `src/environments/environment.development.ts`, set `PERFORMANCE_TEST_MODE = true` and run `npm start`. No URL flag is needed now. Open `http://127.0.0.1:4200`.
2. Expect `หน้า 1 / 100`, `1–50 จาก 5,000 รายการ`, and development-only `Performance Test / Dataset: 5,000 orders / Rows rendered: 50 / Page: 1 / 100`.
3. Click Next: IDs 51–100 and page 2. Search `PERF005000`: one row on page 1. Combine `Icomputer`, `ส่งของแล้ว`, and BE dates `01/01/2563`–`31/12/2563`: 3,333 matching rows, 67 pages. Invalid BE date range must not call the API.
4. Run the existing measurement script with a locally installed agent-browser CLI (no application dependency is needed):

   ```text
   node scripts/measure-performance.mjs /path/to/agent-browser/bin/agent-browser.js after
   ```

   It opens a fresh page, records the initial screen, submits identical filters twice, sends five rapid input events, and opens/closes/reopens one detail. It writes `docs/performance-after.json`. Keep the measurement page active; browsers may throttle `requestAnimationFrame` on inactive pages. Do not run other browser benchmarks concurrently.

5. `window.__orderPerformance` provides raw data in development. `apiCalls` counts attempted mock API requests, including any retries or subsequently cancelled attempts, but excluding cache hits. DOM counts are queried in `afterEveryRender`. Timings use `performance.now()` around row/group computations and from response receipt to `afterEveryRender` (not network latency, browser paint or total navigation time). Polling with animation frames is only for measurement readiness; no artificial delay is added to reported timings.
6. Set `PERFORMANCE_TEST_MODE = false`, reload, and the original 3 fixtures return. `ng build` uses `environment.ts`, with both performance flags false, so the panel and metrics are inactive in production.

## Reproduce the recorded Before source

Use a **separate checkout**, never overwrite the current work:

1. Check out commit `fef9d7443a5dbf8a237e7f4fdc566da022d1fe2a` in that copy.
2. Apply the supplied [baseline instrumentation patch](baseline-instrumentation.patch). It only adds the generated dataset, development metrics, and the large-response switch; it leaves the old service, grouping, template and request logic intact. The patch includes its new supporting files and has been checked against that commit with `git apply --check`.
3. Run its dev server on port 4200, then use the measurement script from the current revision with phase `before`. That baseline selects the 5,000 dataset using `?perf=5000` (already in the script). Preserve the supplied JSON files before recording a new run.

## Verification

- `npm test -- --watch=false`: 68 tests pass in 15 files, retaining the previous tests and adding generator, pagination, cache, DOM identity and duplicate-submit regressions.
- `npm run build`: passes using production configuration.
- Browser checks at 360/768/1440px: document scroll width equals viewport width; the table scrolls inside its own region. Pagination is native buttons with disabled boundary/loading states, visible focus and polite page announcements. Inputs remain Reactive Forms with Buddhist Era dates.
- No new application dependencies, no test disabling, no git push.

## Files involved in section 7

`src/app/data/orders.performance.ts`, `src/app/services/performance-metrics.ts`, `src/app/services/mock-orders.interceptor.ts`, `src/app/services/order.service.ts`, `src/app/models/order.model.ts`, `src/app/utils/order-transform.ts`, `src/app/order-dashboard/order-dashboard.{ts,html,css}`, `src/app/components/order-table/order-table.html`, `src/environments/environment{,.development}.ts`, `angular.json`, accompanying specs, `scripts/measure-performance.mjs`, `docs/performance-{before,after}.json`, this document, the baseline patch and README.
