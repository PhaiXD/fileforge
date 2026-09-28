/**
 * FileForge — Main Application Logic
 * Theme management, navigation, settings, and initialization.
 */

// ============================================================
// Theme Management
// ============================================================

function initTheme() {
    const saved = localStorage.getItem('fileforge_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    setTheme(theme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fileforge_theme', theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

// ============================================================
// Navigation & Routing
// ============================================================

let currentCategory = 'video-audio';
let currentMode = 'convert';
let currentPanel = null;

const TOOLS = {
    'video-audio': {
        convert: [
            { id: 'yt-mp4', title: 'YouTube to MP4', desc: 'Download YouTube videos as MP4', icon: '🎬', color: 'var(--accent-red)', active: true },
            { id: 'yt-mp3', title: 'YouTube to MP3', desc: 'Extract audio from YouTube videos', icon: '🎵', color: 'var(--accent-red)', active: true },
            { id: 'tt-mp4', title: 'TikTok to MP4', desc: 'Download TikTok videos', icon: '📱', color: 'var(--accent-purple)', active: true },
            { id: 'tt-mp3', title: 'TikTok to MP3', desc: 'Extract audio from TikTok videos', icon: '🎶', color: 'var(--accent-purple)', active: true },
            // Extract Audio
            { id: 'mp4-mp3', title: 'MP4 to MP3', desc: 'Extract audio from MP4 video', icon: '🎧', color: 'var(--accent-blue)', active: true },
            { id: 'mp4-m4a', title: 'MP4 to M4A', desc: 'Extract audio from MP4 video (AAC)', icon: '🎧', color: 'var(--accent-blue)', active: true },
            { id: 'mov-mp3', title: 'MOV to MP3', desc: 'Extract audio from MOV video', icon: '🎧', color: 'var(--accent-blue)', active: true },
            { id: 'mov-m4a', title: 'MOV to M4A', desc: 'Extract audio from MOV video (AAC)', icon: '🎧', color: 'var(--accent-blue)', active: true },
            { id: 'webm-mp3', title: 'WEBM to MP3', desc: 'Extract audio from WEBM video', icon: '🎧', color: 'var(--accent-blue)', active: true },
            { id: 'mkv-mp3', title: 'MKV to MP3', desc: 'Extract audio from MKV video', icon: '🎧', color: 'var(--accent-blue)', active: true },
            // Video to GIF
            { id: 'mp4-gif', title: 'MP4 to GIF', desc: 'Convert MP4 to animated GIF', icon: '🖼️', color: 'var(--accent-yellow)', active: true },
            { id: 'mov-gif', title: 'MOV to GIF', desc: 'Convert MOV to animated GIF', icon: '🖼️', color: 'var(--accent-yellow)', active: true },
            { id: 'webm-gif', title: 'WEBM to GIF', desc: 'Convert WEBM to animated GIF', icon: '🖼️', color: 'var(--accent-yellow)', active: true },
            // Video to MP4
            { id: 'mov-mp4', title: 'MOV to MP4', desc: 'Convert QuickTime MOV to MP4', icon: '📹', color: 'var(--accent-green)', active: true },
            { id: 'webm-mp4', title: 'WEBM to MP4', desc: 'Convert WEBM to MP4', icon: '📹', color: 'var(--accent-green)', active: true },
            { id: 'mkv-mp4', title: 'MKV to MP4', desc: 'Convert MKV to MP4', icon: '📹', color: 'var(--accent-green)', active: true },
            { id: 'avi-mp4', title: 'AVI to MP4', desc: 'Convert AVI to MP4', icon: '📹', color: 'var(--accent-green)', active: true },
            // Audio to Audio
            { id: 'wav-mp3', title: 'WAV to MP3', desc: 'Convert WAV audio to MP3', icon: '🎵', color: 'var(--accent-teal)', active: true },
            { id: 'wav-m4a', title: 'WAV to M4A', desc: 'Convert WAV audio to M4A (AAC)', icon: '🎵', color: 'var(--accent-teal)', active: true },
            { id: 'm4a-mp3', title: 'M4A to MP3', desc: 'Convert M4A audio to MP3', icon: '🎵', color: 'var(--accent-teal)', active: true },
            { id: 'ogg-mp3', title: 'OGG to MP3', desc: 'Convert OGG audio to MP3', icon: '🎵', color: 'var(--accent-teal)', active: true },
            { id: 'flac-mp3', title: 'FLAC to MP3', desc: 'Convert FLAC audio to MP3', icon: '🎵', color: 'var(--accent-teal)', active: true },
        ],
        compress: [
            { id: 'video-compress', title: 'Video Compressor', desc: 'Reduce video file size', icon: '🗜️', color: 'var(--accent-blue)', active: false },
            { id: 'audio-compress', title: 'Audio Compressor', desc: 'Reduce audio file size', icon: '🔉', color: 'var(--accent-teal)', active: false },
        ],
    },
    'image': {
        convert: [
            // To JPG
            { id: 'png-jpg', title: 'PNG to JPG', desc: 'Convert PNG images to JPG format', icon: '🖼️', color: 'var(--accent-blue)', active: true },
            { id: 'webp-jpg', title: 'WEBP to JPG', desc: 'Convert WebP images to JPG format', icon: '🌐', color: 'var(--accent-blue)', active: true },
            { id: 'svg-jpg', title: 'SVG to JPG', desc: 'Rasterize SVG to JPG image', icon: '✏️', color: 'var(--accent-blue)', active: true },
            { id: 'heic-jpg', title: 'HEIC to JPG', desc: 'Convert Apple HEIC to JPG', icon: '📸', color: 'var(--accent-teal)', active: true },
            { id: 'ico-jpg', title: 'ICO to JPG', desc: 'Convert ICO icons to JPG', icon: '🎯', color: 'var(--accent-blue)', active: true },
            // To PNG
            { id: 'jpg-png', title: 'JPG to PNG', desc: 'Convert JPG images to PNG format', icon: '🖼️', color: 'var(--accent-green)', active: true },
            { id: 'webp-png', title: 'WEBP to PNG', desc: 'Convert WebP images to PNG', icon: '🌐', color: 'var(--accent-green)', active: true },
            { id: 'svg-png', title: 'SVG to PNG', desc: 'Rasterize SVG to PNG image', icon: '✏️', color: 'var(--accent-green)', active: true },
            { id: 'heic-png', title: 'HEIC to PNG', desc: 'Convert Apple HEIC to PNG', icon: '📸', color: 'var(--accent-teal)', active: true },
            { id: 'ico-png', title: 'ICO to PNG', desc: 'Convert ICO icons to PNG', icon: '🎯', color: 'var(--accent-green)', active: true },
            // To WEBP
            { id: 'jpg-webp', title: 'JPG to WEBP', desc: 'Convert JPG images to WebP format', icon: '🖼️', color: 'var(--accent-purple)', active: true },
            { id: 'png-webp', title: 'PNG to WEBP', desc: 'Convert PNG images to WebP format', icon: '🖼️', color: 'var(--accent-purple)', active: true },
            { id: 'svg-webp', title: 'SVG to WEBP', desc: 'Rasterize SVG to WebP image', icon: '✏️', color: 'var(--accent-purple)', active: true },
            { id: 'heic-webp', title: 'HEIC to WEBP', desc: 'Convert Apple HEIC to WebP', icon: '📸', color: 'var(--accent-teal)', active: true },
            { id: 'ico-webp', title: 'ICO to WEBP', desc: 'Convert ICO icons to WebP', icon: '🎯', color: 'var(--accent-purple)', active: true },
            // To ICO
            { id: 'png-ico', title: 'PNG to ICO', desc: 'Convert PNG images to ICO format', icon: '🖼️', color: 'var(--accent-red)', active: true },
            { id: 'jpg-ico', title: 'JPG to ICO', desc: 'Convert JPG images to ICO format', icon: '🖼️', color: 'var(--accent-red)', active: true },
            { id: 'webp-ico', title: 'WEBP to ICO', desc: 'Convert WebP images to ICO', icon: '🌐', color: 'var(--accent-red)', active: true },
            { id: 'svg-ico', title: 'SVG to ICO', desc: 'Convert SVG to ICO icon', icon: '✏️', color: 'var(--accent-red)', active: true },
            { id: 'heic-ico', title: 'HEIC to ICO', desc: 'Convert HEIC to ICO icon', icon: '📸', color: 'var(--accent-red)', active: true },
        ],
        compress: [
            { id: 'image-compress', title: 'Image Compressor', desc: 'Reduce image file size while preserving quality', icon: '📐', color: 'var(--accent-green)', active: true },
        ],
    },
    'pdf-docs': {
        convert: [
            { id: 'image-pdf', title: 'Image to PDF', desc: 'Convert image files to PDF format (1 image per PDF)', icon: '📄', color: 'var(--accent-green)', active: true },
            { id: 'images-to-pdf', title: 'Merge Images to PDF', desc: 'Merge multiple images into a single PDF file', icon: '📑', color: 'var(--accent-blue)', active: true },
            { id: 'pdf-to-jpg', title: 'PDF to JPG', desc: 'Convert PDF pages to JPG images', icon: '📄', color: 'var(--accent-red)', active: true },
            { id: 'pdf-extract', title: 'Extract PDF Pages', desc: 'Split or extract specific pages from a PDF', icon: '✂️', color: 'var(--accent-purple)', active: true },
            { id: 'pdf-merge', title: 'Merge PDFs', desc: 'Combine multiple PDFs into one in your chosen order', icon: '🔗', color: 'var(--accent-blue)', active: true },
            { id: 'pdf-word', title: 'PDF to Word', desc: 'Convert PDF to editable Word document', icon: '📝', color: 'var(--accent-blue)', active: false },
            { id: 'word-pdf', title: 'Word to PDF', desc: 'Convert Word documents to PDF', icon: '📋', color: 'var(--accent-red)', active: false },
            { id: 'pdf-png', title: 'PDF to PNG', desc: 'Convert PDF pages to PNG images', icon: '🖼️', color: 'var(--accent-green)', active: true },
            { id: 'excel-pdf', title: 'Excel to PDF', desc: 'Convert spreadsheets to PDF', icon: '📊', color: 'var(--accent-green)', active: false },
        ],
        compress: [
            { id: 'pdf-compress', title: 'PDF Compressor', desc: 'Reduce PDF file size for sharing', icon: '📦', color: 'var(--accent-red)', active: true },
        ],
    },
};

function switchCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    renderTools();
    hidePanel();
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    renderTools();
    hidePanel();
}

function getRecentTools() {
    try {
        return JSON.parse(localStorage.getItem('fileforge_recent_tools')) || [];
    } catch (e) {
        return [];
    }
}

function updateRecentTool(toolId) {
    let recent = getRecentTools();
    recent = recent.filter(id => id !== toolId);
    recent.unshift(toolId);
    recent = recent.slice(0, 50); // Keep top 50
    localStorage.setItem('fileforge_recent_tools', JSON.stringify(recent));
}

function renderTools() {
    const grid = document.getElementById('tool-grid');
    if (!grid) return;

    let tools = TOOLS[currentCategory]?.[currentMode] || [];
    
    // Sort tools based on recent usage
    const recent = getRecentTools();
    const sortedTools = [...tools].sort((a, b) => {
        const aIndex = recent.indexOf(a.id);
        const bIndex = recent.indexOf(b.id);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0; // Keep original order for non-recent tools
    });
    
    grid.innerHTML = '';

    sortedTools.forEach(tool => {
        const card = document.createElement('div');
        card.className = `tool-card ${tool.active ? '' : 'disabled'}`;
        card.style.setProperty('--card-accent', tool.color);
        card.innerHTML = `
            <div class="tool-card-icon" style="background:${tool.color}15; color:${tool.color}">
                ${tool.icon}
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title">${tool.title}</div>
                <div class="tool-card-desc">${tool.desc}</div>
            </div>
        `;

        if (tool.active) {
            card.addEventListener('click', () => {
                updateRecentTool(tool.id);
                showPanel(tool.id);
            });
        } else {
            card.addEventListener('click', () => {
                showToast(`${tool.title} is coming soon!`, 'info');
            });
        }

        grid.appendChild(card);
    });

    // Show/hide AI section based on category
    const aiSection = document.getElementById('ai-section');
    if (aiSection) {
        aiSection.style.display = currentMode === 'convert' ? 'block' : 'none';
    }
}

function showPanel(toolId) {
    // Hide grid, show tool panel
    document.getElementById('tool-grid-section').style.display = 'none';
    const aiSection = document.getElementById('ai-section');
    if (aiSection) aiSection.style.display = 'none';

    // Hide all panels
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));

    // Map tool IDs to panel IDs
    const panelMap = {
        'yt-mp4': 'panel-yt-mp4',
        'yt-mp3': 'panel-yt-mp3',
        'tt-mp4': 'panel-tt-mp4',
        'tt-mp3': 'panel-tt-mp3',
        'mp4-mp3': 'panel-media-convert',
        'mp4-m4a': 'panel-media-convert',
        'mov-mp3': 'panel-media-convert',
        'mov-m4a': 'panel-media-convert',
        'webm-mp3': 'panel-media-convert',
        'mkv-mp3': 'panel-media-convert',
        'mp4-gif': 'panel-media-convert',
        'mov-gif': 'panel-media-convert',
        'webm-gif': 'panel-media-convert',
        'mov-mp4': 'panel-media-convert',
        'webm-mp4': 'panel-media-convert',
        'mkv-mp4': 'panel-media-convert',
        'avi-mp4': 'panel-media-convert',
        'wav-mp3': 'panel-media-convert',
        'wav-m4a': 'panel-media-convert',
        'm4a-mp3': 'panel-media-convert',
        'ogg-mp3': 'panel-media-convert',
        'flac-mp3': 'panel-media-convert',
        'pdf-to-jpg': 'panel-pdf-to-image',
        'pdf-png': 'panel-pdf-to-image',
        'pdf-word': 'panel-pdf-word',
        'word-pdf': 'panel-word-pdf',
        'excel-pdf': 'panel-excel-pdf',
        'images-to-pdf': 'panel-images-to-pdf',
        'pdf-extract': 'panel-pdf-extract',
        'pdf-merge': 'panel-pdf-merge',
        'pdf-compress': 'panel-pdf-compress',
        'image-compress': 'panel-image-compress',
        'png-jpg': 'panel-img-convert',
        'webp-jpg': 'panel-img-convert',
        'svg-jpg': 'panel-img-convert',
        'heic-jpg': 'panel-img-convert',
        'jpg-png': 'panel-img-convert',
        'webp-png': 'panel-img-convert',
        'svg-png': 'panel-img-convert',
        'heic-png': 'panel-img-convert',
        'jpg-webp': 'panel-img-convert',
        'png-webp': 'panel-img-convert',
        'svg-webp': 'panel-img-convert',
        'heic-webp': 'panel-img-convert',
        'ico-webp': 'panel-img-convert',
        'ico-png': 'panel-img-convert',
        'ico-jpg': 'panel-img-convert',
        'png-ico': 'panel-img-convert',
        'jpg-ico': 'panel-img-convert',
        'webp-ico': 'panel-img-convert',
        'svg-ico': 'panel-img-convert',
        'heic-ico': 'panel-img-convert',
        'image-pdf': 'panel-img-convert',
        'ai-pdf': 'panel-ai-pdf',
        'ai-video': 'panel-ai-video',
    };

    const panelId = panelMap[toolId];
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
            currentPanel = toolId;
            
            // Configure generic image convert panel
            if (panelId === 'panel-img-convert') {
                const IMG_CONVERT_CONFIG = {
                    'png-jpg':   { title: 'PNG to JPG',   accept: '.png', hint: 'Supports .png files', format: 'jpg', btnText: '🖼️ Convert to JPG', ext: 'PNG' },
                    'webp-jpg':  { title: 'WEBP to JPG',  accept: '.webp', hint: 'Supports .webp files', format: 'jpg', btnText: '🌐 Convert to JPG', ext: 'WEBP' },
                    'svg-jpg':   { title: 'SVG to JPG',   accept: '.svg', hint: 'Supports .svg files', format: 'jpg', btnText: '✏️ Convert to JPG', ext: 'SVG' },
                    'heic-jpg':  { title: 'HEIC to JPG',  accept: '.heic,.heif', hint: 'Supports .heic files', format: 'jpg', btnText: '📸 Convert to JPG', ext: 'HEIC' },
                    'ico-jpg':   { title: 'ICO to JPG',   accept: '.ico', hint: 'Supports .ico files', format: 'jpg', btnText: '🎯 Convert to JPG', ext: 'ICO' },
                    'jpg-png':   { title: 'JPG to PNG',   accept: '.jpg,.jpeg', hint: 'Supports .jpg, .jpeg files', format: 'png', btnText: '🖼️ Convert to PNG', ext: 'JPG' },
                    'webp-png':  { title: 'WEBP to PNG',  accept: '.webp', hint: 'Supports .webp files', format: 'png', btnText: '🌐 Convert to PNG', ext: 'WEBP' },
                    'svg-png':   { title: 'SVG to PNG',   accept: '.svg', hint: 'Supports .svg files', format: 'png', btnText: '✏️ Convert to PNG', ext: 'SVG' },
                    'heic-png':  { title: 'HEIC to PNG',  accept: '.heic,.heif', hint: 'Supports .heic files', format: 'png', btnText: '📸 Convert to PNG', ext: 'HEIC' },
                    'ico-png':   { title: 'ICO to PNG',   accept: '.ico', hint: 'Supports .ico files', format: 'png', btnText: '🎯 Convert to PNG', ext: 'ICO' },
                    'jpg-webp':  { title: 'JPG to WEBP',  accept: '.jpg,.jpeg', hint: 'Supports .jpg files', format: 'webp', btnText: '🖼️ Convert to WEBP', ext: 'JPG' },
                    'png-webp':  { title: 'PNG to WEBP',  accept: '.png', hint: 'Supports .png files', format: 'webp', btnText: '🖼️ Convert to WEBP', ext: 'PNG' },
                    'svg-webp':  { title: 'SVG to WEBP',  accept: '.svg', hint: 'Supports .svg files', format: 'webp', btnText: '✏️ Convert to WEBP', ext: 'SVG' },
                    'heic-webp': { title: 'HEIC to WEBP', accept: '.heic,.heif', hint: 'Supports .heic files', format: 'webp', btnText: '📸 Convert to WEBP', ext: 'HEIC' },
                    'ico-webp':  { title: 'ICO to WEBP',  accept: '.ico', hint: 'Supports .ico files', format: 'webp', btnText: '🎯 Convert to WEBP', ext: 'ICO' },
                    'png-ico':   { title: 'PNG to ICO',   accept: '.png', hint: 'Supports .png files', format: 'ico', btnText: '🖼️ Convert to ICO', ext: 'PNG' },
                    'jpg-ico':   { title: 'JPG to ICO',   accept: '.jpg,.jpeg', hint: 'Supports .jpg, .jpeg files', format: 'ico', btnText: '🖼️ Convert to ICO', ext: 'JPG' },
                    'webp-ico':  { title: 'WEBP to ICO',  accept: '.webp', hint: 'Supports .webp files', format: 'ico', btnText: '🌐 Convert to ICO', ext: 'WEBP' },
                    'svg-ico':   { title: 'SVG to ICO',   accept: '.svg', hint: 'Supports .svg files', format: 'ico', btnText: '✏️ Convert to ICO', ext: 'SVG' },
                    'heic-ico':  { title: 'HEIC to ICO',  accept: '.heic,.heif', hint: 'Supports .heic files', format: 'ico', btnText: '📸 Convert to ICO', ext: 'HEIC' },
                    'image-pdf': { title: 'Image to PDF', accept: '.jpg,.jpeg,.png,.webp,.heic,.heif,.svg', hint: 'Supports standard images', format: 'pdf', btnText: '📄 Convert to PDF', ext: 'IMG' },
                };
                const cfg = IMG_CONVERT_CONFIG[toolId];
                if (cfg) {
                    panel.querySelector('h2').textContent = cfg.title;
                    const iconSpan = panel.querySelector('.tool-panel-title span');
                    if (iconSpan) iconSpan.textContent = cfg.btnText.split(' ')[0];
                    panel.querySelector('.upload-zone-hint').textContent = cfg.hint;
                    panel.querySelector('input[type="file"]').setAttribute('accept', cfg.accept);
                    panel.querySelector('.format-value').value = cfg.format;
                    panel.querySelector('.btn-convert').innerHTML = cfg.btnText;
                    
                    // Clear previous files when switching tools
                    if (panel._resetFiles) panel._resetFiles();
                }
            }

            // Configure generic media convert panel
            if (panelId === 'panel-media-convert') {
                const MEDIA_CONVERT_CONFIG = {
                    'mp4-mp3':  { title: 'MP4 to MP3',  accept: '.mp4',  hint: 'Supports .mp4 video files', format: 'mp3', btnText: '🎧 Convert to MP3' },
                    'mp4-m4a':  { title: 'MP4 to M4A',  accept: '.mp4',  hint: 'Supports .mp4 video files', format: 'm4a', btnText: '🎧 Convert to M4A' },
                    'mov-mp3':  { title: 'MOV to MP3',  accept: '.mov',  hint: 'Supports .mov video files', format: 'mp3', btnText: '🎧 Convert to MP3' },
                    'mov-m4a':  { title: 'MOV to M4A',  accept: '.mov',  hint: 'Supports .mov video files', format: 'm4a', btnText: '🎧 Convert to M4A' },
                    'webm-mp3': { title: 'WEBM to MP3', accept: '.webm', hint: 'Supports .webm video files', format: 'mp3', btnText: '🎧 Convert to MP3' },
                    'mkv-mp3':  { title: 'MKV to MP3',  accept: '.mkv',  hint: 'Supports .mkv video files', format: 'mp3', btnText: '🎧 Convert to MP3' },
                    'mp4-gif':  { title: 'MP4 to GIF',  accept: '.mp4',  hint: 'Supports .mp4 video files', format: 'gif', btnText: '🖼️ Convert to GIF' },
                    'mov-gif':  { title: 'MOV to GIF',  accept: '.mov',  hint: 'Supports .mov video files', format: 'gif', btnText: '🖼️ Convert to GIF' },
                    'webm-gif': { title: 'WEBM to GIF', accept: '.webm', hint: 'Supports .webm video files', format: 'gif', btnText: '🖼️ Convert to GIF' },
                    'mov-mp4':  { title: 'MOV to MP4',  accept: '.mov',  hint: 'Supports .mov video files', format: 'mp4', btnText: '📹 Convert to MP4' },
                    'webm-mp4': { title: 'WEBM to MP4', accept: '.webm', hint: 'Supports .webm video files', format: 'mp4', btnText: '📹 Convert to MP4' },
                    'mkv-mp4':  { title: 'MKV to MP4',  accept: '.mkv',  hint: 'Supports .mkv video files', format: 'mp4', btnText: '📹 Convert to MP4' },
                    'avi-mp4':  { title: 'AVI to MP4',  accept: '.avi',  hint: 'Supports .avi video files', format: 'mp4', btnText: '📹 Convert to MP4' },
                    'wav-mp3':  { title: 'WAV to MP3',  accept: '.wav',  hint: 'Supports .wav audio files', format: 'mp3', btnText: '🎵 Convert to MP3' },
                    'wav-m4a':  { title: 'WAV to M4A',  accept: '.wav',  hint: 'Supports .wav audio files', format: 'm4a', btnText: '🎵 Convert to M4A' },
                    'm4a-mp3':  { title: 'M4A to MP3',  accept: '.m4a',  hint: 'Supports .m4a audio files', format: 'mp3', btnText: '🎵 Convert to MP3' },
                    'ogg-mp3':  { title: 'OGG to MP3',  accept: '.ogg',  hint: 'Supports .ogg audio files', format: 'mp3', btnText: '🎵 Convert to MP3' },
                    'flac-mp3': { title: 'FLAC to MP3', accept: '.flac', hint: 'Supports .flac audio files', format: 'mp3', btnText: '🎵 Convert to MP3' },
                };
                const cfg = MEDIA_CONVERT_CONFIG[toolId];
                if (cfg) {
                    panel.querySelector('h2').textContent = cfg.title;
                    const iconSpan = panel.querySelector('.tool-panel-title span');
                    if (iconSpan) iconSpan.textContent = cfg.btnText.split(' ')[0];
                    panel.querySelector('.upload-zone-hint').textContent = cfg.hint;
                    panel.querySelector('input[type="file"]').setAttribute('accept', cfg.accept);
                    panel.querySelector('.format-value').value = cfg.format;
                    panel.querySelector('.btn-convert').innerHTML = cfg.btnText;
                    
                    if (panel._resetFiles) panel._resetFiles();
                    
                    const optionsContainer = panel.querySelector('#media-convert-options');
                    if (optionsContainer) {
                        optionsContainer.style.display = cfg.format === 'gif' ? 'flex' : 'none';
                    }
                }
            }

            // Configure generic PDF to Image panel
            if (panelId === 'panel-pdf-to-image') {
                const PDF_IMAGE_CONFIG = {
                    'pdf-to-jpg': { title: 'PDF to JPG', format: 'jpeg', btnText: '📄 Convert to JPG', hint: 'Convert PDF pages to JPG images' },
                    'pdf-png':    { title: 'PDF to PNG', format: 'png',  btnText: '📄 Convert to PNG', hint: 'Convert PDF pages to PNG images' },
                };
                const cfg = PDF_IMAGE_CONFIG[toolId];
                if (cfg) {
                    panel.querySelector('h2').textContent = cfg.title;
                    panel.querySelector('.tool-panel-title span').textContent = '🖼️';
                    panel.querySelector('.upload-zone-hint').textContent = cfg.hint;
                    panel.querySelector('.format-value').value = cfg.format;
                    panel.querySelector('.btn-convert').innerHTML = cfg.btnText;
                    
                    if (panel._resetFiles) panel._resetFiles();
                }
            }
        }
    }
}

function hidePanel() {
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tool-grid-section').style.display = 'block';
    const aiSection = document.getElementById('ai-section');
    if (aiSection && currentMode === 'convert') {
        aiSection.style.display = 'block';
    }
    currentPanel = null;
    
    // Re-render tools to update recent usage sorting
    renderTools();
}

// ============================================================
// Search Engine
// ============================================================

const CATEGORY_LABELS = {
    'video-audio': 'Video & Audio',
    'image': 'Image',
    'pdf-docs': 'PDF & Documents',
};

const AI_TOOLS = [
    { id: 'ai-pdf', title: 'Summarize PDF', desc: 'Extract and summarize PDF content using AI', icon: '📄', color: 'var(--accent-purple)', active: true, category: 'AI Tools', mode: 'ai' },
    { id: 'ai-video', title: 'Summarize Video', desc: 'Summarize YouTube video content from subtitles or audio', icon: '🎬', color: 'var(--accent-purple)', active: true, category: 'AI Tools', mode: 'ai' },
];

function getAllTools() {
    const allTools = [];
    for (const [category, modes] of Object.entries(TOOLS)) {
        for (const [mode, tools] of Object.entries(modes)) {
            tools.forEach(tool => {
                allTools.push({
                    ...tool,
                    category: CATEGORY_LABELS[category] || category,
                    categoryKey: category,
                    mode: mode,
                });
            });
        }
    }
    // Also add AI tools
    AI_TOOLS.forEach(t => allTools.push({ ...t }));
    return allTools;
}

function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<span class="search-highlight">$1</span>');
}

function searchTools(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const allTools = getAllTools();
    return allTools.filter(tool => {
        const title = tool.title.toLowerCase();
        const desc = tool.desc.toLowerCase();
        const cat = (tool.category || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || cat.includes(q);
    });
}

function renderSearchResults(results, query) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <span>🔍</span>
                No tools found for "<strong>${escapeHtml(query)}</strong>"
            </div>
        `;
        container.style.display = 'block';
        return;
    }
    
    container.innerHTML = '';
    results.forEach(tool => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="search-result-icon" style="background:${tool.color}15; color:${tool.color};">
                ${tool.icon}
            </div>
            <div class="search-result-info">
                <div class="search-result-title">${highlightMatch(tool.title, query)}</div>
                <div class="search-result-desc">${highlightMatch(tool.desc, query)}</div>
            </div>
            <span class="search-result-category">${escapeHtml(tool.category)}</span>
        `;
        
        item.addEventListener('click', () => {
            // Clear search
            document.getElementById('search-input').value = '';
            document.getElementById('search-clear').style.display = 'none';
            container.style.display = 'none';
            
            if (!tool.active) {
                showToast(`${tool.title} is coming soon!`, 'info');
                return;
            }
            
            // If it has a category key, switch to that category & mode first
            if (tool.categoryKey) {
                switchCategory(tool.categoryKey);
                switchMode(tool.mode);
            }
            
            showPanel(tool.id);
        });
        
        container.appendChild(item);
    });
    container.style.display = 'block';
}

function initSearch() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    const resultsContainer = document.getElementById('search-results');
    if (!input) return;
    
    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearBtn.style.display = query ? 'flex' : 'none';
        
        if (!query) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        const results = searchTools(query);
        renderSearchResults(results, query);
    });
    
    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        resultsContainer.style.display = 'none';
        input.focus();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        const container = document.getElementById('search-container');
        if (container && !container.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
    
    // Re-open on focus if there's a query
    input.addEventListener('focus', () => {
        const query = input.value.trim();
        if (query) {
            const results = searchTools(query);
            renderSearchResults(results, query);
        }
    });
    
    // Keyboard: Escape to close
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            clearBtn.style.display = 'none';
            resultsContainer.style.display = 'none';
            input.blur();
        }
    });
}

// ============================================================
// Settings Modal
// ============================================================

function showSettingsModal() {
    const overlay = document.getElementById('settings-modal');
    if (overlay) {
        const input = overlay.querySelector('#settings-api-key');
        if (input) input.value = localStorage.getItem('fileforge_gemini_api_key') || '';
        overlay.classList.add('active');
    }
}

function hideSettingsModal() {
    const overlay = document.getElementById('settings-modal');
    if (overlay) overlay.classList.remove('active');
}

function saveSettings() {
    const input = document.getElementById('settings-api-key');
    if (input) {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('fileforge_gemini_api_key', key);
            showToast('API Key saved!', 'success');
        } else {
            localStorage.removeItem('fileforge_gemini_api_key');
            showToast('API Key removed', 'info');
        }
    }
    hideSettingsModal();
}

// ============================================================
// Update Checker
// ============================================================

async function checkForUpdates() {
    try {
        const result = await fetchAPI('/api/system/check-update');
        
        // Update version in navbar dynamically
        if (result.current_version) {
            const versionElements = document.querySelectorAll('.navbar-version');
            versionElements.forEach(el => {
                // Only add 'v' prefix if it's not a commit hash (which git describe might return without v)
                // usually git tags have 'v' but we lstrip it, so let's just add 'v' if it starts with digit
                const verText = /^\d/.test(result.current_version) ? `v${result.current_version}` : result.current_version;
                el.textContent = verText;
            });
        }

        if (result.update_available) {
            const modal = document.getElementById('update-modal');
            if (modal) {
                modal.querySelector('.update-version').textContent = `v${result.latest_version}`;
                modal.style.display = 'flex';
            }
        }
    } catch (err) {
        // Silently fail — not critical
    }
}

async function performUpdate() {
    const btn = document.querySelector('.update-modal-btn');
    if (btn) {
        btn.innerHTML = '🔄 Updating...';
        btn.disabled = true;
    }

    try {
        const result = await fetchAPI('/api/system/update', { method: 'POST' });
        if (result.success) {
            if (btn) btn.innerHTML = '✅ Done!';
            setTimeout(() => {
                showToast(result.message || 'Updated successfully! Please restart the application.', 'success');
                const modal = document.getElementById('update-modal');
                if (modal) modal.style.display = 'none';
            }, 1000);
            return;
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (err) {
        showToast('Update failed', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = 'Update Now';
            btn.disabled = false;
        }
    }
}

// ============================================================
// Toast Notifications
// ============================================================

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `
        <span>${icons[type] || 'ℹ️'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Theme
    initTheme();

    // Navigation events
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => switchCategory(tab.dataset.category));
    });

    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Back buttons
    document.querySelectorAll('.tool-panel-back').forEach(btn => {
        btn.addEventListener('click', hidePanel);
    });

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    // Settings
    document.getElementById('btn-settings')?.addEventListener('click', showSettingsModal);
    document.getElementById('settings-save')?.addEventListener('click', saveSettings);
    document.getElementById('settings-cancel')?.addEventListener('click', hideSettingsModal);
    document.getElementById('settings-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') hideSettingsModal();
    });

    // Update
    document.querySelector('.update-modal-btn')?.addEventListener('click', performUpdate);
    document.querySelector('.update-modal-later')?.addEventListener('click', () => {
        const modal = document.getElementById('update-modal');
        if (modal) modal.style.display = 'none';
    });
    
    // Generic Modal click outside to close
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        });
    });

    // AI tool cards
    document.querySelectorAll('.ai-tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const toolId = card.dataset.tool;
            if (toolId) showPanel(toolId);
        });
    });

    // Render initial tools
    renderTools();

    // Initialize search
    initSearch();

    // Initialize tool handlers
    if (typeof initPdfToImage === 'function') initPdfToImage();
    if (typeof initPdfToWord === 'function') initPdfToWord();
    if (typeof initWordToPdf === 'function') initWordToPdf();
    if (typeof initExcelToPdf === 'function') initExcelToPdf();
    initImagesToPdf();
    initPdfExtract();
    if (typeof initPdfMerge === 'function') initPdfMerge();
    initPdfCompressor();
    initImageCompressor();
    if (typeof initHeicConvert === 'function') initHeicConvert();
    if (typeof initImageConvert === 'function') initImageConvert();
    if (typeof initMediaConvert === 'function') initMediaConvert();
    initMediaDownloader('yt-mp4');
    initMediaDownloader('yt-mp3');
    initMediaDownloader('tt-mp4');
    initMediaDownloader('tt-mp3');
    initPdfSummarizer();
    initVideoSummarizer();

    // Check for updates
    checkForUpdates();

    console.log('🔥 FileForge initialized');
});
