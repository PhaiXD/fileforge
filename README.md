# 🔨 FileForge

**FileForge** is a fast, powerful, and privacy-first local web application for all your daily file operations. Built with **FastAPI** and **Vanilla JS**, it runs entirely on your local machine—meaning your files never leave your computer.

*(Placeholder: 📸 [Insert a full screenshot of the main application here])*

---

## ✨ Features

### 🖼️ Image Tools
- **Convert Anywhere:** Seamlessly convert images between **JPG, PNG, WEBP, SVG, HEIC**, and **ICO** formats.
- **Smart Compression:** Reduce image file sizes significantly while preserving visual quality.
- **Batch Processing:** Drag and drop multiple files to convert them all at once. The system automatically zips the output for easy downloading.

*(Placeholder: 🎞️ [Insert a short GIF demonstrating drag-and-drop batch image conversion here])*

### 🎬 Video & Audio Tools
- **Comprehensive Conversion:** Easily extract audio or convert videos. Supports **MP4, MOV, WEBM, MKV, AVI, WAV, MP3, M4A, OGG, FLAC**, and **GIF**.
- **Media Download:** Quickly download videos and audio from popular platforms (e.g., YouTube, TikTok) via `yt-dlp`.
- **Powered by FFmpeg:** Uses FFmpeg under the hood for lightning-fast processing and broad format support.

### 📄 PDF & Documents
- **PDF Extract & Merge:** Extract specific pages from a PDF or merge multiple files together. Rearrange page orders effortlessly.
- **PDF to Image:** Instantly convert PDF pages to JPG or PNG images.
- **PDF Compressor:** Shrink large PDF documents for easier sharing and emailing.

*(Placeholder: 📸 [Insert a screenshot or GIF showing the drag-and-drop PDF merge and reordering feature here])*

### 🤖 AI-Powered Tools (Integrated with Gemini)
- **PDF Summarizer:** Condense long PDF documents into key takeaways and summaries.
- **Video & Audio Summarizer:** Transcribe and summarize key points from video or audio files with high accuracy.

---

## 🚀 Getting Started

Since FileForge processes everything 100% locally, you will need to set up a few background dependencies first.

### 1. Prerequisites
- **Python 3.10+**
- **FFmpeg:** Required for Video/Audio processing. (Download and install from [ffmpeg.org](https://ffmpeg.org/download.html), and ensure it's added to your system's PATH)
- **Node.js / npm** (Optional: for potential future build scripts or Tailwind integration)

### 2. Installation
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/yourusername/fileforge.git
   cd fileforge
   ```
2. Create a Virtual Environment and install dependencies:
   ```bash
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
3. *(Optional)* API Key Setup: Copy the `.env.example` file to `.env` and insert your `GEMINI_API_KEY` if you plan to use the AI-powered summarization features.

### 3. Run the App
Start the server with the following command:
```bash
python main.py
```
> The server will start up, and **your default web browser will automatically open to `http://localhost:8000`**. 🎉

*(Placeholder: 🎞️ [Insert a GIF showing `python main.py` being run in the terminal and the browser launching automatically])*

---

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, Pillow (Image), PyMuPDF (PDF), FFmpeg (Media), yt-dlp
- **Frontend:** HTML5, Vanilla JavaScript, CSS3 (CSS Variables, Grid, Flexbox)
- **AI Integration:** Google Gemini 1.5 Pro / Flash

---

## 🛡️ Privacy First
FileForge is designed for **100% Local Processing**. Your private documents, images, and videos will never be uploaded to the cloud or any external servers (unless you specifically use the AI tools, which securely send data to the Gemini model for summarization).

---

## 🤝 Contributing
Contributions are always welcome! Feel free to submit Pull Requests or open Issues to suggest new ideas or report bugs.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
