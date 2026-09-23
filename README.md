# 🚀 ระบบย่อ URL & สร้าง QR Code บันทึกลง Google Sheets อัตโนมัติ
### (GAS URL Shortener & QR Code Generator with Google Sheets Integration)

ระบบแปลงลิงก์ Google Apps Script หรือ Web URL ที่ยาวมาก ให้กลายเป็น **ลิงก์ย่อ (Short URL)** และสร้าง **QR Code คุณภาพสูง** ที่สามารถสแกนใช้งานได้จริง พร้อมระบบบันทึกประวัติการย่อลิงก์ลง **Google Spreadsheet** แบบอัตโนมัติ

---

## 🌟 ฟีเจอร์เด่น (Key Features)

1. **🔗 ย่อลิงก์อัตโนมัติ (URL Shortener)**:
   - แปลงลิงก์ Google Apps Script Web App ที่ยาวเหยียด หรือลิงก์เว็บไซต์ใดๆ ให้สั้นลง สะอาดตา แชร์ต่อง่าย
   - ทำงานผ่าน API ย่อลิงก์ความเร็วสูง (TinyURL / is.gd) พร้อมระบบ Fallback
   
2. **📱 สร้าง QR Code ที่ใช้งานได้จริง (Functional QR Code)**:
   - สแกนด้วยกล้องมือถือหรือแอปอ่าน QR Code ได้ทันที
   - คมชัดระดับ High Resolution (300x300 px)
   - มีปุ่ม **"ดาวน์โหลดรูปภาพ QR Code (PNG)"** บันทึกลงเครื่องได้ในคลิกเดียว

3. **📊 บันทึกข้อมูลลง Google Sheet อัตโนมัติ (Google Sheets Sync)**:
   - เชื่อมต่อกับ Google Spreadsheet: `https://docs.google.com/spreadsheets/d/19lTnU0PZMlUEAleqfiHEvNks2HBqbbrfFMj5Mwv0R98/`
   - จัดเก็บข้อมูล 5 คอลัมน์ตรงตามที่กำหนด:
     - `Timestamp` (วันที่-เวลาที่บันทึก)
     - `Topic` (ชื่อหัวข้อ/เรื่อง)
     - `Url` (ลิงก์ต้นฉบับ/Long URL)
     - `Short Url` (ลิงก์ที่ย่อแล้ว)
     - `QR code` (สูตร `=IMAGE(...)` แสดงภาพ QR Code ในเซลล์)

4. **✨ ส่วนต่อประสานผู้ใช้ที่สวยงาม (Modern & Responsive UI)**:
   - ออกแบบด้วย TailwindCSS + FontAwesome + Prompt/Kanit Font
   - รองรับทั้งหน้าจอมือถือ แท็บเล็ต และคอมพิวเตอร์
   - มีปุ่มวางลิงก์จากคลิปบอร์ด และปุ่มคัดลอก (Copy) สะดวกสบาย
   - ตารางแสดงประวัติรายการย่อลิงก์ล่าสุด พร้อมป๊อปอัปดู/ดาวน์โหลด QR Code

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
.
├── Code.gs             # สคริปต์ Backend ฝั่ง Google Apps Script
├── index.html          # หน้าเว็บ Frontend Web App UI
├── appsscript.json     # ไฟล์ Manifest กำหนดค่า Apps Script
└── README.md           # คู่มือและเอกสารการใช้งาน
```

---

## 🛠️ ขั้นตอนการติดตั้งและการนำไปใช้งาน (Deployment Guide)

### วิธีที่ 1: ติดตั้งบน Google Apps Script โดยตรง (แนะนำ)

1. เปิด Google Sheet ของคุณ: [Google Spreadsheet](https://docs.google.com/spreadsheets/d/19lTnU0PZMlUEAleqfiHEvNks2HBqbbrfFMj5Mwv0R98/)
2. ไปที่เมนู **ส่วนขยาย (Extensions)** > **Apps Script**
3. คัดลอกโค้ดจากไฟล์ `Code.gs` ในโปรเจกต์นี้ ไปวางแทนที่โค้ดเดิมในแท็บ `Code.gs`
4. สร้างไฟล์ HTML เพิ่มเติม โดยกดปุ่ม `+` > เลือก **HTML** > ตั้งชื่อไฟล์ว่า `index`
5. คัดลอกโค้ดจากไฟล์ `index.html` ในโปรเจกต์นี้ ไปวางในไฟล์ `index.html`
6. กดปุ่ม **บันทึก (Save Project)** 💾
7. กดปุ่ม **การทำให้ใช้งานได้ (Deploy)** มุมบนขวา > เลือก **การทำให้ใช้งานได้รายการใหม่ (New deployment)**
8. เลือกประเภทเป็น **เว็บแอป (Web app)**
   - **คำอธิบาย (Description)**: `URL Shortener & QR Code v1.0`
   - **เรียกใช้ในฐานะ (Execute as)**: `ฉัน (Me)`
   - **ผู้มีสิทธิ์เข้าถึง (Who has access)**: `ทุกคน (Anyone)`
9. กด **ทำให้ใช้งานได้ (Deploy)** และคัดลอก URL ของ Web App ไปเปิดใช้งานได้ทันที 🎉

---

## ⚙️ การตั้งค่าเพิ่มเติม (Configuration)

หากต้องการเปลี่ยน Google Spreadsheet ปลายทาง สามารถแก้ไขได้ที่บรรทัดที่ 10 ในไฟล์ `Code.gs`:

```javascript
const SPREADSHEET_ID = '19lTnU0PZMlUEAleqfiHEvNks2HBqbbrfFMj5Mwv0R98';
const SHEET_NAME = 'Sheet1';
```

---

## 📄 License
MIT License - ใช้งาน ดัดแปลง และพัฒนาต่อยอดได้อย่างอิสระ
