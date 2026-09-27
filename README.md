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
