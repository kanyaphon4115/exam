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

- ใช้ Angular Reactive Forms (`FormGroup`, `FormControl`, `Validators`) ทั้ง Filter และ Update Status ไม่มี `ngModel`
- Filter รองรับ Search / Status / Date Range พร้อมปุ่มค้นหาและล้างตัวกรอง ส่งค่าผ่าน `OrderService` ซึ่งสร้าง `HttpParams` รวม `dateFrom`, `dateTo` และ `page`
- Search เป็น optional, trim ก่อน submit/ส่ง API และจำกัด 100 ตัวอักษร; Status ตัวกรองเป็น optional และรับเฉพาะสถานะที่ระบบรองรับ
- Date Range เป็น optional ทั้งสองช่อง กรอกเป็น `วัน/เดือน/ปี พ.ศ.` เช่น `01/02/2564` และ `27/09/2569` โดยแสดงรูปแบบเดียวกันทุกเบราว์เซอร์ ตรวจวันที่จริงรวมปีอธิกสุรทิน แล้วลบ 543 จากปีเพื่อส่ง API เป็น ค.ศ. รูปแบบ `YYYY-MM-DD` ใช้ group validator เปรียบเทียบวันที่ที่แปลงแล้ว เมื่อกรอกครบและ `dateFrom > dateTo` ฟอร์ม invalid และแสดง “วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด” วันที่เท่ากันใช้ได้
- เมื่อ invalid จะปิดปุ่มค้นหาและตรวจซ้ำใน submit/request pipeline เพื่อไม่เรียก API
- คงการค้นหาอัตโนมัติหลังหยุดพิมพ์ 300ms จากข้อ 5 โดยใช้ `switchMap` + `timer` เพื่อให้ submit/reset ยกเลิก debounce ที่ค้างได้ ไม่เรียกซ้ำสำหรับคำค้นที่ใช้อยู่ และยกเลิก GET เก่าเมื่อเริ่ม request ใหม่
- Mock API ใช้ทุกเงื่อนไขร่วมกัน รวมวันที่ขอบเขตทั้งสองวัน และกรองก่อนแบ่งหน้า ปุ่มล้างตัวกรอง reset form แล้วโหลดรายการเริ่มต้นใหม่
- Update Status มี `Validators.required` และตรวจสถานะที่รองรับ เมื่อว่างแสดง “กรุณาเลือกสถานะสินค้า” และไม่ส่ง PATCH
- ป้องกัน Double Submit ด้วย Saving State และ `exhaustMap`; ระหว่าง request ปิด select/ปุ่มและแสดง “กำลังบันทึก...” ใช้ `finalize()` คืน Saving State หลังสำเร็จ ล้มเหลว หรือยกเลิก request
- เก็บ Order เดิมใน request closure และไม่เปลี่ยนรายการ/รายละเอียดก่อน PATCH สำเร็จ เมื่อสำเร็จใช้ response อัปเดตทั้งรายการ รายละเอียด และ Status Badge โดยไม่ reload หน้า พร้อม “อัปเดตสถานะสำเร็จ”
- ถ้า PATCH ล้มเหลว ข้อมูลเดิมยังอยู่ และ Status Form reset กลับเป็นค่าของ Order เดิม พร้อม “ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง” ผู้ใช้เลือกสถานะแล้วลองใหม่ได้
- ใช้ state เดิม (`state`, `detailState`, `saveState`) และ validation จาก Form โดยตรง ไม่เพิ่ม boolean ซ้ำซ้อน ข้อผิดพลาด GET/PATCH เป็นภาษาไทย ไม่แสดง raw error
- ทุกช่องมี label; validation เชื่อมด้วย `aria-describedby` และ `aria-invalid`; Error ใช้ `role="alert"`, Loading/Success ใช้ `role="status"` รองรับ keyboard และ responsive 1440/768/360px

### ไฟล์ที่เกี่ยวข้อง

| หน้าที่ | ไฟล์ |
| --- | --- |
| Filter Reactive Form และ request/state orchestration | `src/app/order-dashboard/order-dashboard.ts` |
| Filter fields, errors และ responsive | `src/app/order-dashboard/order-dashboard.html`, `order-dashboard.css` |
| Reusable Update Status Reactive Form (รับ input/ส่ง output ไม่มี HttpClient) | `src/app/components/order-status-form/order-status-form.ts`, `order-status-form.html` |
| Date Range / Supported Status validators | `src/app/utils/order-validators.ts` |
| Query model, HttpParams และ Mock filters | `src/app/models/order.model.ts`, `src/app/services/order.service.ts`, `src/app/services/mock-orders.interceptor.ts` |
| Filter validation / submit / reset / debounce tests | `src/app/order-dashboard/order-filter.spec.ts` |
| Required / double submit / success / rollback tests | `src/app/components/order-status-form/order-status-form.spec.ts`, `src/app/order-dashboard/order-dashboard-api.spec.ts` |
| GET/error/retry และ API filter tests | `src/app/order-dashboard/order-dashboard.spec.ts`, `src/app/services/order.service.spec.ts`, `src/app/services/mock-orders.interceptor.spec.ts` |

### ผลตรวจสอบข้อ 6

- `npm test -- --watch=false` (`ng test --watch=false`): ผ่าน 54 tests ใน 11 ไฟล์ ครอบคลุม regression tests เดิม รวมการแปลง พ.ศ. เป็น ค.ศ., วันที่ที่ไม่มีจริง และช่วงวันที่ พ.ศ.
- `npm run build` (`ng build`): ผ่าน
- ตรวจด้วย headless browser ที่ 1440/768/360px: ฟอร์มแสดงครบและไม่ล้น viewport
- ตรวจ combined filters, invalid date range, reset และ PATCH success ผ่านหน้าเว็บ; ตรวจ PATCH error/rollback และ double submit ด้วย HTTP integration tests
- Mock API เป็น interceptor ภายในแอป ข้อมูลสถานะเก็บในหน่วยความจำและกลับเป็น fixture เมื่อ reload หน้า
