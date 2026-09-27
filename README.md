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
```
ทดสอบการแสดงผลทั้งหมด 3 ขนาด

- Mobile: 360px — ผ่าน
- Tablet: 768px — ผ่าน
- Desktop: 1440px — ผ่าน

หน้าเว็บสามารถแสดงผลได้โดยข้อมูลไม่ล้นออกนอกหน้าจอ และตารางสามารถเลื่อนแนวนอนได้เมื่อพื้นที่ไม่เพียงพอ

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

