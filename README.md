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
3. ตรวจว่า Search / การ์ด / ข้อความไม่ล้นหน้าจอ และเลื่อนตารางไปถึงคอลัมน์จัดการได้โดยหน้าเว็บไม่เลื่อนแนวนอน Desktop ยังคงเป็นตาราง หากพื้นที่ไม่พอจะเลื่อนภายในตารางเช่นกัน
4. กด Tab ไปยัง Search → พื้นที่ตาราง → ปุ่มรายละเอียด ต้องเห็นกรอบ focus ใช้ลูกศรซ้าย/ขวาเลื่อนตาราง และ Enter/Space เปิดปิดรายละเอียด
5. ค้นหา `Icomputer` ต้องพบ 2 รายการ ค้นหา `no-match` ต้องเห็น **ไม่พบรายการคำสั่งซื้อ** ล้างคำค้นต้องกลับมา 3 รายการ
6. สำหรับ Loading และ Error ให้ใช้ Console ใน development mode (`npm start`) เพื่อจำลองสถานะ Mock:

```js
const orderList = ng.getComponent(document.querySelector('app-order-list'));
orderList.state.set('loading'); // กำลังโหลดข้อมูล...
orderList.state.set('error');   // ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง
orderList.state.set('normal');  // แสดงข้อมูลตามคำค้นปัจจุบัน
```

รันแต่ละคำสั่งแยกกันเพื่อดูแต่ละ State ใน Error ให้คลิก **ลองใหม่อีกครั้ง** ต้องแสดง Loading แล้วกลับสู่ Normal และโฟกัสช่องค้นหา คำสั่ง `ng.getComponent` ใช้ได้เฉพาะ development mode เท่านั้น การปิดเครือข่ายจะไม่ทำให้ Mock เกิด Error

ตรวจ horizontal overflow ได้จาก Console ในทุกขนาดและทุก State (ควรได้ `true`):

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

### Browser Test Note

ทดสอบเมื่อ 27 กันยายน 2026 บน Windows ด้วย Chrome 153 และ Microsoft Edge 154 แบบ headless ที่ 360px, 768px และ 1440px ผ่านทั้งสองเบราว์เซอร์: ไม่มี page horizontal overflow, Search อยู่ใน viewport, ตารางเลื่อนได้ภายใน container, ค้นหา/เปิดรายละเอียดได้, แสดง Normal/Loading/Empty/Error ถูกต้อง และ retry กลับสู่ Normal พร้อมคืน focus ตรวจ Tab/ลูกศร/Enter และกรอบ focus 3px แล้ว ไม่พบ page runtime errors ระหว่างตรวจหน้า ไม่มีการใช้ CSS framework หรือ CSS เฉพาะเบราว์เซอร์

ตรวจ production build ผ่านด้วย `npm run build` การตรวจ accessibility ครั้งนี้ครอบคลุม DOM/accessibility tree และคีย์บอร์ด ยังไม่ได้ทดสอบการอ่านออกเสียงด้วย Screen Reader จริงหรืออุปกรณ์มือถือจริง
