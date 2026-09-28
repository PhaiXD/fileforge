# 🔨 FileForge

**FileForge** is a fast, powerful, and privacy-first local web application for all your daily file operations. Built with **FastAPI** and **Vanilla JS**, it runs entirely on your local machine—meaning your files never leave your computer.

*(ใส่ภาพ: 📸 [Screenshot หน้าจอหลักของโปรแกรม ที่เห็นเมนูต่างๆ ครบถ้วน] ตรงนี้)*

---

## ✨ Features (คุณสมบัติเด่น)

### 🖼️ Image Tools
- **Convert Anywhere:** แปลงไฟล์ภาพไปมาระหว่าง **JPG, PNG, WEBP, SVG, HEIC** และ **ICO** ได้อย่างอิสระ
- **Smart Compression:** บีบอัดรูปภาพให้เล็กลงโดยที่ยังคงความคมชัด
- **Batch Processing:** ลากวางหลายๆ ไฟล์พร้อมกันเพื่อแปลงทีเดียว ระบบจะบีบอัดเป็น `.zip` ให้อัตโนมัติ

*(ใส่ GIF: 🎞️ [GIF สั้นๆ แสดงการลากไฟล์รูปหลายๆ ไฟล์ลงไปแปลงพร้อมกัน] ตรงนี้)*

### 🎬 Video & Audio Tools
- **Comprehensive Conversion:** สกัดเสียง หรือแปลงวิดีโอง่ายๆ รองรับ **MP4, MOV, WEBM, MKV, AVI, WAV, MP3, M4A, OGG, FLAC** และ **GIF**
- **Media Download:** ดาวน์โหลดวิดีโอและเสียงจากแพลตฟอร์มยอดฮิต (เช่น YouTube, TikTok) ได้รวดเร็วผ่าน `yt-dlp`
- **Powered by FFmpeg:** เบื้องหลังใช้ FFmpeg ทำให้การแปลงไฟล์รวดเร็วและรองรับไฟล์แทบทุกประเภทบนโลก

### 📄 PDF & Documents
- **PDF Extract & Merge:** แยกหน้า PDF ที่ต้องการ หรือจับรวมหลายๆ ไฟล์เข้าด้วยกัน พร้อมจัดเรียงลำดับได้อย่างอิสระ
- **PDF to Image:** แปลง PDF เป็น JPG หรือ PNG ทันที
- **PDF Compressor:** ย่อขนาดไฟล์เอกสาร PDF ให้ส่งอีเมลหรือแชร์ต่อได้ง่ายขึ้น

*(ใส่ภาพ: 📸 [Screenshot หน้าจอการลากสลับจัดเรียง (Drag & Drop) ในฟังก์ชัน Merge PDFs] ตรงนี้)*

### 🤖 AI-Powered Tools (Integrated with Gemini)
- **PDF Summarizer:** สรุปเนื้อหาจากไฟล์ PDF แบบยาวๆ ให้เหลือแต่ใจความสำคัญ
- **Video & Audio Summarizer:** ถอดเสียงจากวิดีโอหรือไฟล์เสียง และสรุปประเด็นสำคัญออกมาเป็นข้อๆ อย่างแม่นยำ

---

## 🚀 Getting Started (วิธีติดตั้งและใช้งาน)

เนื่องจาก FileForge ประมวลผลบนเครื่องของคุณเอง 100% จึงต้องมีการติดตั้งเครื่องมือเบื้องหลังบางส่วนก่อนเริ่มใช้งาน

### 1. Prerequisites (สิ่งที่ต้องมี)
- **Python 3.10+**
- **FFmpeg:** สำหรับประมวลผล Video/Audio (ต้อง [ติดตั้ง](https://ffmpeg.org/download.html) และเพิ่มเข้า PATH)
- **Node.js / npm** (ถ้ามีการใช้ tailwind / build script อื่นๆ ในอนาคต)

### 2. Installation
1. โคลนโปรเจกต์นี้ลงบนเครื่องของคุณ
   ```bash
   git clone https://github.com/yourusername/fileforge.git
   cd fileforge
   ```
2. สร้าง Virtual Environment และติดตั้ง Dependencies
   ```bash
   python -m venv venv
   # สำหรับ Windows: venv\Scripts\activate
   # สำหรับ Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
3. *(ทางเลือก)* ตั้งค่า API Key: คัดลอกไฟล์ `.env.example` เป็น `.env` และใส่คีย์ `GEMINI_API_KEY` ของคุณหากต้องการใช้ฟีเจอร์ AI

### 3. Run the App
สั่งรันเซิร์ฟเวอร์ด้วยคำสั่ง:
```bash
python main.py
```
> เซิร์ฟเวอร์จะเริ่มต้น และ**เบราว์เซอร์ของคุณจะถูกเปิดขึ้นมาที่ `http://localhost:8000` โดยอัตโนมัติ** 🎉

*(ใส่ GIF: 🎞️ [GIF แสดงการพิมพ์ `python main.py` บน Terminal แล้วเด้งเปิดหน้าเบราว์เซอร์อัตโนมัติ] ตรงนี้)*

---

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, Pillow (Image), PyMuPDF (PDF), FFmpeg (Media), yt-dlp
- **Frontend:** HTML5, Vanilla JavaScript, CSS3 (CSS Variables, Grid, Flexbox)
- **AI Integration:** Google Gemini 1.5 Pro / Flash

---

## 🛡️ Privacy First
FileForge ถูกออกแบบมาให้ประมวลผล **Local 100%** ไฟล์เอกสาร รูปภาพ หรือวิดีโอส่วนตัวของคุณจะไม่มีวันถูกอัปโหลดขึ้นไปยัง Cloud หรือเซิร์ฟเวอร์ภายนอก (ยกเว้นเมื่อคุณเลือกใช้งานฟีเจอร์ฝั่ง AI ที่จำเป็นต้องส่งไฟล์ไปให้โมเดลสรุป)

---

## 🤝 Contributing
Contributions are always welcome! สามารถส่ง Pull Request หรือเปิด Issues เพื่อเสนอไอเดียใหม่ๆ ได้เลย

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
