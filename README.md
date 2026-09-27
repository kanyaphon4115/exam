# Order Management Dashboard

## ข้อ 1: Semantic HTML และ Accessibility

สร้างหน้า Order List ด้วย Angular สำหรับแสดงรายการคำสั่งซื้อ โดยใช้ Semantic HTML และรองรับ Accessibility

### สิ่งที่ทำ
- แสดงข้อมูล Order ในรูปแบบตาราง
- มีช่องค้นหา Order
- ใช้ `label`, `heading`, `table` และ `button` อย่างเหมาะสม
- รองรับการใช้งานด้วย Keyboard
- รองรับ Screen Reader
- รองรับ Responsive

## วิธีติดตั้ง

```bash
npm install
```

## วิธีรัน

```bash
ng serve
```

เปิด Browser ที่

```text
http://localhost:4200
```

## Accessibility

1. **Keyboard Navigation**  
   ใช้ `<button>` และ `<input>` ที่เป็น HTML element มาตรฐาน ทำให้ผู้ใช้สามารถกด `Tab` เพื่อเลื่อนไปยังช่องค้นหาและปุ่มต่าง ๆ และใช้ `Enter`/`Space` เพื่อกดปุ่มได้

2. **Screen Reader**  
   ช่องค้นหามี `<label>` และปุ่มดูรายละเอียดมี `aria-label` ระบุหมายเลขคำสั่งซื้อ ทำให้ Screen Reader สามารถอธิบายหน้าที่ของแต่ละส่วนได้ชัดเจน

3. **Accessible Table**  
   ใช้ `<table>`, `<thead>`, `<tbody>` และ `<th scope="col">` เพื่อให้ Screen Reader เข้าใจความสัมพันธ์ระหว่างหัวตารางกับข้อมูลแต่ละคอลัมน์

## ข้อ 2: Responsive CSS และ Cross-browser

- ใช้ CSS ปกติและ media queries ที่ 768px / 480px เพื่อปรับระยะห่างและขนาดข้อความ
- Grid ใช้ `minmax(0, 1fr)` และการ์ดใช้ `min-width: 0` ป้องกันตารางดันหน้าเว็บให้กว้างเกิน viewport
- ตารางยังใช้ Semantic HTML และเลื่อนแนวนอนเฉพาะ `.table-scroll` ด้วย `overflow-x: auto` โดยไม่ซ่อน overflow ของทั้งหน้า
- Search มีความกว้าง 100% ภายใน container และจำกัดความกว้างสูงสุดไว้ที่ 688px
- คง label, ข้อความช่วยเหลือ, heading hierarchy, table headers, aria-label และ visible focus จากข้อ 1
- Loading / Empty ใช้ `role="status"` และ Error ใช้ `role="alert"` โดยคง live region ไว้ใน DOM ข้อความสถานะอยู่ภายนอกตาราง จึงอ่านได้ครบแม้หน้าจอแคบ
- ปุ่มลองใหม่จำลองการโหลด Mock 600ms แล้วกลับสู่ Normal และคืน focus ให้ Search ไม่มี Backend หรือ API request

### วิธีทดสอบ Responsive และ UI State

1. รัน `npm start` แล้วเปิด `http://localhost:4200` ใน Chrome และ Microsoft Edge
2. เปิด DevTools (`F12`) และ Device Toolbar (`Ctrl+Shift+M`) เลือก Responsive แล้วทดสอบที่ **360 × 900**, **768 × 900**, **1440 × 900** CSS pixels โดยใช้ zoom 100%
3. ไฟล์ CSS หลังแยกคอมโพเนนต์:

- src/app/order-dashboard/order-dashboard.css
- src/app/components/order-table/order-table.css
- src/app/components/status-badge/status-badge.css
- src/styles.css

ทดสอบการแสดงผลทั้งหมด 3 ขนาด

- Mobile: 360px — ผ่าน
- Tablet: 768px — ผ่าน
- Desktop: 1440px — ผ่าน


### Browser Test Note

ทดสอบบน Browser:

- Google Chrome — ผ่าน
- Microsoft Edge — ผ่าน

ตรวจสอบ:
- Layout และ Responsive
- Search Input
- Order Table
- Keyboard Navigation
- Loading / Empty / Error State

## ข้อ 3: TypeScript Data Transformation

- Function: `src/app/utils/order-transform.ts`
- Type Definition: `src/app/models/order.model.ts`
- Unit Test: `src/app/utils/order-transform.spec.ts`

Unit Test ครอบคลุม 4 กรณี:
1. การจัดกลุ่มตามหมายเลขคำสั่งซื้อ
2. การคำนวณยอดรวมสุทธิ
3. การแปลงวันที่เป็น พ.ศ.
4. ตรวจสอบว่า Pure Function ไม่แก้ไขข้อมูลต้นฉบับ

## ข้อ 4: Angular Architecture และ Reusable Components

| หน้าที่ | ไฟล์ |
| --- | --- |
| Smart Component | `src/app/order-dashboard/order-dashboard.ts` |
| Presentational Table | `src/app/components/order-table/order-table.ts` |
| Reusable Status Badge | `src/app/components/status-badge/status-badge.ts` |
| Service | `src/app/services/order.service.ts` |
| Model / Interface | `src/app/models/order.model.ts` |
| Mock Data แหล่งเดียว | `src/app/data/orders.mock.ts` |
| Pure Functions | `src/app/utils/order-transform.ts` |

### Data Flow
OrderService
     │
     │ Orders
     ▼
OrderDashboardComponent
     │
     │ @Input
     ▼
OrderTableComponent
     │
     │ status
     ▼
StatusBadgeComponent

OrderTableComponent
     │
     │ @Output (ดูรายละเอียด)
     ▼
OrderDashboardComponent
OrderService เป็นแหล่งข้อมูล Order และส่งข้อมูลให้ OrderDashboardComponent ซึ่งเป็น Smart Component สำหรับจัดการข้อมูลและ Search จากนั้นส่งข้อมูลผ่าน Input ไปยัง OrderTableComponent เพื่อแสดงตาราง โดย StatusBadgeComponent ใช้สำหรับแสดงสถานะและสามารถนำกลับมาใช้ซ้ำได้ เมื่อผู้ใช้กดดูรายละเอียด Child Component จะส่ง Event กลับไปยัง Parent Component


## ข้อ 5: RESTful API และ Asynchronous Request

### โครงสร้าง

- `src/app/services/order.service.ts`: ใช้ Angular HttpClient ไม่มี fetch รองรับ getOrders(query), getOrder(id), updateOrderStatus(id, status)
- `src/app/services/mock-orders.interceptor.ts`: Functional HTTP interceptor จำลอง API โดยใช้ MockOrderStore เก็บข้อมูลในหน่วยความจำ เริ่มจาก orders.mock.ts แหล่งเดียว
- `src/environments/environment.ts` และ `environment.development.ts`: กำหนด apiBaseUrl และ mockApi; angular.json เลือกไฟล์ development ผ่าน fileReplacements
- `src/app/app.config.ts`: ลงทะเบียน provideHttpClient และ interceptor
- `OrderDashboardComponent`: จัดการคำค้นและ request pipeline ส่งข้อมูลให้ Table/Badge เดิม และใช้ Pure Functions เดิม

### API Contract

| Method | Endpoint | ผลลัพธ์ |
| --- | --- | --- |
| GET | /api/orders | Order[] หน้าแรก |
| GET | /api/orders?search=Icomputer&status=ส่งของแล้ว&page=1 | Order[] ตามคำค้น สถานะ และหน้า |
| GET | /api/orders/4 | Order ของแถว ID 4 |
| PATCH | /api/orders/4/status | รับ { "status": "ส่งของแล้ว" } และคืน Order ที่อัปเดต |



### RxJS Operators

- debounceTime(300): รอหยุดพิมพ์ 300ms เพื่อลดจำนวน request
- distinctUntilChanged(): ไม่ส่งคำค้นเดิมซ้ำ หลัง trim และแปลงตัวพิมพ์เล็ก
- switchMap(): ยกเลิก request ก่อนหน้าเมื่อคำค้นใหม่ผ่าน debounce แล้ว รวมถึงการรอ retry ป้องกัน response เก่าทับผลใหม่
- merge(): รวมการเปิดหน้าครั้งแรก การค้นหา และปุ่มลองใหม่ใน pipeline เดียว
- defer()/tap(): เริ่ม Loading และบันทึกข้อมูลเมื่อได้รับ response
- catchError() ภายใน switchMap: แสดง Error โดยไม่ปิด stream การค้นหา ผู้ใช้จึงค้นหาต่อหรือกดลองใหม่ได้
- finalize(): จบ Angular PendingTasks เมื่อสำเร็จ ล้มเหลว หรือถูกยกเลิก

### Loading / Error / Retry

Loading แสดง “กำลังโหลดข้อมูล...” ผ่าน role=status; เมื่อสำเร็จแสดงตาราง หรือ “ไม่พบรายการคำสั่งซื้อ” สำหรับ [] ส่วน Error ใช้ role=alert แสดง “ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง” พร้อมปุ่ม “ลองใหม่” ซึ่งเรียกคำค้นปัจจุบันอีกครั้งและคืน focus ให้ช่อง Search เมื่อสำเร็จ

GET ใช้ retry count 2 เฉพาะ network error (status 0) และ HTTP 5xx รอ 300ms และ 600ms รวมสูงสุด 3 attempts ต่อการโหลด เลือก 2 retries เพื่อรับมือความผิดพลาดชั่วคราวโดยไม่เพิ่มภาระเซิร์ฟเวอร์หรือให้ผู้ใช้รอไม่จำกัด ไม่ retry 4xx เพราะต้องแก้ request และไม่ retry PATCH อัตโนมัติเพื่อไม่ส่งคำสั่งเขียนซ้ำ

### ป้องกัน Memory Leak

ใช้ takeUntilDestroyed() หลัง switchMap เพื่อยกเลิกทั้ง outer stream และ request ภายในเมื่อ Dashboard ถูกทำลาย HttpClient และ Mock timer ถูกยกเลิกตาม subscription ไม่มี nested subscribe และ cleanup PendingTasks ของ debounce ผ่าน DestroyRef ส่วน finalize ของ request เก่าไม่เปลี่ยน UI state ของ request ใหม่

### วิธีทดสอบและเปลี่ยน Backend

1. รัน npm start แล้วเปิด http://localhost:4200: Loading → รายการ 3 แถว
2. ค้นหา Icomputer: รอ debounce 300ms และ Mock 600ms จะเหลือ 2 แถว ยอดรวม 9,750.00 บาท
3. ค้นหา no-match เพื่อดู Empty และล้างคำค้นเพื่อกลับมา 3 แถว
4. จำลอง API Error โดยตั้ง mockApi.forceError เป็น true ใน environment.development.ts แล้วเปิดหน้าใหม่ จะ retry สูงสุด 2 ครั้งก่อนแสดง Error ตั้งกลับ false เพื่อใช้งานปกติ Tests ครอบคลุม Error → ลองใหม่ และค้นหาต่อหลัง Error
5. รัน npm test -- --watch=false และ npm run build



## ข้อ 6: Form, Validation และ State

ใช้ Angular Reactive Forms สำหรับ Filter และการอัปเดตสถานะคำสั่งซื้อ
- วันที่เริ่มต้นมากกว่าวันที่สิ้นสุด → แสดง Validation Error และไม่เรียก API
- ไม่เลือกสถานะ → แสดงข้อความ "กรุณาเลือกสถานะสินค้า"
- ระหว่างบันทึก → Disable ปุ่มเพื่อป้องกันการกดซ้ำ
- PATCH API ล้มเหลว → คืนสถานะเดิมและแสดงข้อความ Error

## ข้อ 7: Debugging, Performance และ Testing

### เปิด/ปิด Performance Test Mode

แก้ `src/environments/environment.development.ts`:

```ts
export const PERFORMANCE_TEST_MODE = true;
```

- `true`: ใช้ Mock Orders **5,000 รายการ** จาก `generatePerformanceOrders()` ใน `src/app/data/orders.performance.ts`
- `false`: ใช้ข้อมูลเดิม **3 รายการ** ใน `src/app/data/orders.mock.ts` ซึ่งไม่ได้แก้ไขหรือลบ
- รัน `npm start` แล้ว reload หน้าเว็บหลังสลับค่า ไม่ต้องเพิ่ม query parameter
- แต่ละรายการมี `id` และหมายเลขคำสั่งซื้อ `number` ไม่ซ้ำ เช่น `PERF000001`–`PERF005000` และใช้ Order model เดิม
- แสดง **50 รายการต่อหน้า รวม 100 หน้า** เมื่อยังไม่กรอง มีหน้าก่อนหน้า/หน้าถัดไป และข้อความ `หน้า 1 / 100 · 1–50 จาก 5,000 รายการ`
- ส่วน `Performance Test` แสดง dataset, จำนวนแถวคำสั่งซื้อที่ render และหน้า เฉพาะ development เมื่อเปิดโหมดนี้
- Production ใช้ `environment.ts` ซึ่งปิดโหมดนี้ ส่วน unit tests ใช้ build configuration `testing` เพื่อให้ regression tests ใช้ข้อมูลเดิมอย่างคงที่ โดย tests สำหรับ 5,000 รายการเปิดโหมดแยกเอง

### Root Cause

- การจัดกลุ่มเดิม `filter()` ข้อมูลทั้งหมดซ้ำทุกหมายเลขคำสั่งซื้อ ทำงาน O(n × จำนวนกลุ่ม)
- ปุ่มค้นหาเดิมเรียก GET ซ้ำเมื่อ submit เงื่อนไขเดิม เพราะ guard กันซ้ำครอบคลุมเฉพาะ auto-search
- เปิดรายละเอียดเดิมซ้ำเรียก GET ใหม่ทุกครั้ง เพราะไม่มี cache
- หาก API ส่ง 5,000 รายการ ตารางสร้างทั้ง 5,000 แถวและแถวรายละเอียดที่ซ่อนอีก 5,000 แถว พร้อม transform/group ทั้งชุด ข้อมูลปกติเดิมถูกจำกัด 10 แถวแต่ไม่มีปุ่มเปลี่ยนหน้า
- ไม่พบ duplicate initial load หรือ subscription ซ้ำ; `track order.id`, OnPush ของ presentational components และ debounce มีอยู่แล้ว

### Performance Improvements

1. คง `@for (...; track order.id)` และเพิ่ม test ตรวจว่า DOM rows เดิมถูกใช้ต่อหลัง reorder/immutable update
2. เพิ่ม OnPush ที่ Dashboard; Table, StatusBadge และ StatusForm ใช้ OnPush อยู่แล้ว และยังอัปเดตข้อมูลแบบ immutable
3. ใช้ `debounceTime(300)` ลด request ระหว่างพิมพ์, `distinctUntilChanged()` ตรวจ query ทั้งชุด รวม status/date/page และ `switchMap()` ยกเลิก request เก่า การ Retry/Refresh ข้าม deduplication ได้
4. API รับ `page`/`pageSize` และคืน `X-Total-Count`; กรองทั้งหมดก่อนแบ่งหน้า 50 รายการ ไม่ render 5,000 rows พร้อมกัน และสร้าง detail row เฉพาะเมื่อเปิดรายละเอียด สรุปยอดเป็นรายการในหน้าปัจจุบัน
5. Cache page/detail ด้วย `shareReplay` อายุ 30 วินาที ไม่เกิน 40 entries ต่อ cache; ไม่เก็บ Error ถาวร และล้าง cache ทั้งสองหลัง PATCH สำเร็จ ปุ่มรีเฟรช/ล้างตัวกรองโหลดใหม่ได้
6. เปลี่ยน grouping เป็น Map แบบ O(n) โดยคงลำดับและผลรวมเดิม

Search / Status / Date Filter ยังทำงานกับทั้งชุด วันที่กรอกเป็น พ.ศ. และแปลงเป็น ค.ศ. ก่อนส่ง API ส่วน pagination ใช้ native buttons, aria-live, focus-visible และ responsive เดิม

### Before / After

หลักฐานจริงและขั้นตอนวัด: [docs/performance-before-after.md](docs/performance-before-after.md)

| Metric | Before | After |
| --- | ---: | ---: |
| GET เพิ่มเมื่อ submit เงื่อนไขเดิมสองครั้ง | 2 | 0 |
| GET ระหว่างพิมพ์เร็ว 5 ค่า | 1 | 1 |
| GET รายละเอียดเดิมสองครั้ง | 2 | 1 |
| DOM `<tr>` ตอนโหลดรายการ รวม detail ที่ซ่อน | 10,000 | 50 |
| Response → Angular DOM render complete | 1,728.0 ms | 37.3 ms |

Before ใช้โค้ดเดิมพร้อม instrumentation จำลอง API ส่ง 5,000 รายการ ไม่ใช่ข้อมูลปกติเดิม 3 รายการ ตัวเลขเป็นหนึ่งรอบวัดจริง ไม่ใช่ค่าเฉลี่ยหรือคำรับประกันความเร็ว

### Important Bug Test

`order-performance.spec.ts` ตรวจ initial GET ตามด้วย submit เงื่อนไขเดิมสองครั้ง ก่อนแก้ล้มเหลวเพราะพบ GET เพิ่ม 2 ครั้ง หลังแก้ผ่านโดยไม่มี request เพิ่ม รวม tests ของ generator 5,000 รายการ/unique IDs, pagination หน้า 1/2/100, filter ก่อนแบ่งหน้า, DOM tracking, cache invalidation หลัง PATCH, expiry, error และ cancellation

ผลตรวจสอบ: `ng test --watch=false` ผ่าน **68 tests / 15 ไฟล์** และ `ng build` ผ่าน ตรวจหน้าเว็บที่ 360/768/1440px แล้วไม่มี viewport overflow และไม่ได้ git push
