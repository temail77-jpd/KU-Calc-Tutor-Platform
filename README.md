# University Calculus AI Tutor Web Portal

เว็บพอร์ทัลหน้าบ้าน (Frontend Web Portal) สำหรับระบบติวเตอร์แคลคูลัสอัจฉริยะ (University Calculus AI Tutor) ออกแบบมารองรับการใช้งานระดับมหาวิทยาลัย (ตัวอย่างรหัสนิสิต มหาวิทยาลัยเกษตรศาสตร์ KU) ด้วยโครงสร้างระบบแชร์ค่าใช้จ่าย (Cost-Sharing Model) และการประเมินการบ้านแคลคูลัสแบบเป็นขั้นตอน

---

## ส่วนประกอบของโปรเจกต์ (Project Files)

1. **`index.html`**: ไฟล์เดียวเบ็ดเสร็จ (HTML5 + CSS3 Custom + Tailwind Play CDN + JS Frontend logic) รันและเทสบนเบราว์เซอร์ได้ทันที
2. **`gas-backend-mock.js`**: ต้นแบบโค้ดฝั่งหลังบ้าน (Backend) สำหรับวางบน Google Apps Script เพื่อบันทึกข้อมูลนิสิตและระบบเครดิตกระเป๋าเงินลงบน Google Spreadsheet

---

## ขั้นตอนการรันทดสอบและพรีวิว (Local Testing)

1. **เปิดไฟล์หน้าบ้าน**:
   - เปิดโฟลเดอร์นี้และดับเบิลคลิกไฟล์ [index.html](file:///C:/Users/dheer/.gemini/antigravity/scratch/calculus-ai-tutor/index.html) ในเว็บเบราว์เซอร์ (Chrome, Firefox, Safari หรือ Edge)
   - ไม่ต้องมีการ Compile หรือติดตั้ง Node Modules เพิ่มเติม เนื่องจากใช้ Tailwind CSS v3 และแบบอักษร Google Fonts ผ่าน CDN

2. **ทดสอบระบบจำลอง (Simulation Modes)**:
   - **รหัสนิสิตสำหรับทดสอบ**: ป้อนรหัสนิสิต 10 หลัก (รหัสนิสิต KU) เพื่อผ่านการตรวจสอบ Regex
     - บัญชีนิสิตที่มีข้อมูลจำลองในระบบ:
       - `6510401111` (นิสิต สมชาย ใจสู้ - 150 เครดิต)
       - `6510402222` (นิสิต สรวิชญ์ วิวัฒนกุล - 80 เครดิต)
       - `6510403333` (นิสิต ณิชชา แก้วเจริญ - 210 เครดิต)
       - `6510405555` (นิสิต อนันดา ทองดี - ไม่มีเครดิตเหลือ)
     - *หากป้อนรหัส 10 หลักอื่น ๆ ระบบจะสร้างบัญชีจำลองผู้ใช้ใหม่พร้อม 100 เครดิตตั้งต้น*
   - **การจำลองหน้าแชท (Coze Chat Simulator)**:
     - คลิกปุ่ม **"เริ่มแชทกับติวเตอร์"** ระบบจะขยายหน้าต่างจำลองการแชท (Mock Chat Interface)
     - ลองพิมพ์คำถามคีย์เวิร์ด เช่น *"ช่วยสอนกฎลูกโซ่"*, *"ดิฟฟังก์ชันตรีโกณ"*, หรือ *"สอนอินทิเกรต"* เพื่อดูการอธิบายและสูตรคณิตศาสตร์แบบ LaTeX
   - **การจำลองตรวจการบ้าน (Homework Checker Simulator)**:
     - คลิกปุ่ม **"ส่งกระดาษทดให้ AI ตรวจ"**
     - ลากไฟล์ภาพ หรือคลิกเลือกไฟล์จำลอง แล้วกดปุ่มตรวจการบ้าน
     - ระบบจะทำการจำลอง Logging ขั้นตอนการประมวลผล OCR และ Symbolic Engine ทีละบรรทัด พร้อมแสดงผลคะแนน 8/10 และระบุบรรทัดที่คิดเลขตรีโกณมิติผิด
   - **การจำลองระบบเติมเครดิต (Wallet Cost-Sharing)**:
     - คลิกปุ่ม **"สนับสนุนค่าระบบ / เติมเครดิต"** เพื่ออ่านคำอธิบายโครงสร้างการดูแลต้นทุน
     - สามารถกดปุ่มทดสอบ `+100 เครดิต` เพื่อจำลองการเพิ่มเครดิตในกระเป๋า

---

## ขั้นตอนการเชื่อมต่อระบบจริง (Production Integration Guide)

### 1. การเชื่อมต่อ Coze Web Chat SDK ตัวจริง
หาคอมเมนต์บล็อก `COZE_CHAT_SDK_PLACEHOLDER_START` ในไฟล์ `index.html` แล้วนำ SDK Script และ config จากแพลตฟอร์ม Coze มาแทนที่ดังนี้:

```html
<!-- แทนที่บล็อกคอมเมนต์ Coze Chat ด้วยสคริปต์ตัวจริง -->
<script src="https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-sdk/1.0.1/play.js"></script>
<script>
  new CozeWebSDK.WebChat({
    config: {
      bot_id: 'ใส่_BOT_ID_ตัวจริงของคุณตรงนี้',
    },
    componentProps: {
      title: 'KU Calculus AI Tutor',
    },
    el: document.getElementById('coze-chat-container'),
  });
</script>
```

### 2. การเชื่อมต่อฐานข้อมูล Google Apps Script
1. สร้าง Google Spreadsheet ใหม่
2. ตั้งชื่อชีตว่า `Students` และใส่หัวคอลัมน์ในแถวแรก: `StudentID`, `Name`, `Credits`
3. ไปที่เมนู **Extensions -> Apps Script**
4. นำโค้ดในไฟล์ [gas-backend-mock.js](file:///C:/Users/dheer/.gemini/antigravity/scratch/calculus-ai-tutor/gas-backend-mock.js) ไปวางทั้งหมด
5. นำ ID ของ Google Spreadsheet มาใส่ในตัวแปร `SPREADSHEET_ID`
6. กด **Deploy -> New Deployment** เลือก Type เป็น **Web App**
   - ตั้งค่า Execute as: **Me**
   - ตั้งค่า Who has access: **Anyone** (เพื่อส่ง API จากเว็บเบราว์เซอร์ได้)
7. ก๊อปปี้ URL ของ Web App ที่ได้ นำมาใส่ในฟังก์ชัน `authenticateStudent()` ภายใน `index.html` แทนส่วนของ Mockup
