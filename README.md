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

OrderService → OrderDashboardComponent → orders input → OrderTableComponent → status input → StatusBadgeComponent

Dashboard โหลดข้อมูลจาก Service จัดการ Search และ Loading/Empty/Error ใช้ Pure Functions แปลงวันที่และคำนวณยอด แล้วส่งข้อมูลให้ตาราง เมื่อกดดูรายละเอียด ตารางส่ง `detailsRequested` output พร้อม ID ของแถวกลับไปให้ Dashboard เปลี่ยน `expandedRow` และส่งค่ากลับลงมาตาราง

ใช้ standalone components และ signal-based `input()`/`output()` ของ Angular ปัจจุบัน ซึ่งทำหน้าที่เหมือน @Input/@Output โดย child components ไม่ inject Service และไม่แก้ไขข้อมูล input

`OrderService.getOrders()` คืน `Observable<readonly Order[]>` และคัดลอกข้อมูล Mock ต่อการเรียกหนึ่งครั้ง จำลองเวลาโหลด 600ms ทั้งตอนเปิดหน้าและลองใหม่ ภายหลังสามารถเปลี่ยนภายใน Service เป็น `HttpClient.get` โดยคงสัญญาการคืนข้อมูลเดิม Dashboard ยกเลิก subscription เมื่อถูกทำลาย และจัดการ error จาก Observable

ย้าย OrderListComponent เดิมเป็น OrderDashboardComponent และแยก template/CSS ตารางกับ badge ไปให้ child โดยคง semantic table, label, aria-describedby, status/alert, focus-visible และ horizontal scroll ภายในตาราง ใช้ `tableId` ที่ไม่ซ้ำกันเพื่อรองรับตารางหลาย instance

### การตรวจสอบ

- Unit tests: 22 cases รวม Pure Functions เดิม 12 cases และการเชื่อมต่อ Service, UI states, retry, child output, badge input และ subscription cleanup
- รันด้วย `npm test -- --watch=false`
- ตรวจ production build ด้วย `npm run build`
- หน้าแรกยังเปิดที่ http://localhost:4200
- จำลอง Error ใน development Console ด้วย `ng.getComponent(document.querySelector('app-order-dashboard')).state.set('error')` แล้วกดลองใหม่; Mock ไม่ได้เรียกเครือข่าย การปิด Network จึงไม่ทำให้เกิด Error

ตรวจหลังแยก architecture: Chrome และ Edge แบบ headless ที่ 360/768/1440px ไม่พบ page horizontal overflow; Search, วันที่ พ.ศ., ยอดสรุป, Empty และรายละเอียดทำงาน ตรวจ Tab/ลูกศร/Enter, focus-visible และ Error → Loading → Normal ใน Chrome ผ่าน ยังไม่ได้ทดสอบการอ่านออกเสียงด้วย Screen Reader จริง
