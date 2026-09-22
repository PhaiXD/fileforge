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
            { id: 'mp4-mp3', title: 'MP4 to MP3', desc: 'Convert video files to audio', icon: '🔄', color: 'var(--accent-blue)', active: false },
            { id: 'mp4-gif', title: 'MP4 to GIF', desc: 'Convert video clips to animated GIFs', icon: '🖼️', color: 'var(--accent-yellow)', active: false },
            { id: 'wav-mp3', title: 'WAV to MP3', desc: 'Convert WAV audio to MP3', icon: '🎧', color: 'var(--accent-teal)', active: false },
            { id: 'mov-mp4', title: 'MOV to MP4', desc: 'Convert QuickTime to MP4', icon: '📹', color: 'var(--accent-green)', active: false },
        ],
        compress: [
            { id: 'video-compress', title: 'Video Compressor', desc: 'Reduce video file size', icon: '🗜️', color: 'var(--accent-blue)', active: false },
            { id: 'audio-compress', title: 'Audio Compressor', desc: 'Reduce audio file size', icon: '🔉', color: 'var(--accent-teal)', active: false },
        ],
    },
    'image': {
        convert: [
            { id: 'png-jpg', title: 'PNG to JPG', desc: 'Convert PNG images to JPG format', icon: '🖼️', color: 'var(--accent-blue)', active: false },
            { id: 'jpg-png', title: 'JPG to PNG', desc: 'Convert JPG images to PNG format', icon: '🖼️', color: 'var(--accent-green)', active: false },
            { id: 'webp-png', title: 'WEBP to PNG', desc: 'Convert WebP images to PNG', icon: '🌐', color: 'var(--accent-purple)', active: false },
            { id: 'svg-png', title: 'SVG to PNG', desc: 'Rasterize SVG to PNG image', icon: '✏️', color: 'var(--accent-yellow)', active: false },
            { id: 'heic-jpg', title: 'HEIC to JPG', desc: 'Convert Apple HEIC to JPG', icon: '📸', color: 'var(--accent-teal)', active: false },
        ],
        compress: [
            { id: 'image-compress', title: 'Image Compressor', desc: 'Reduce image file size while preserving quality', icon: '📐', color: 'var(--accent-green)', active: true },
        ],
    },
    'pdf-docs': {
        convert: [
            { id: 'pdf-to-jpg', title: 'PDF to JPG', desc: 'Convert PDF pages to JPG images', icon: '📄', color: 'var(--accent-red)', active: true },
            { id: 'images-to-pdf', title: 'Images to PDF', desc: 'Merge multiple images into one PDF', icon: '📑', color: 'var(--accent-blue)', active: true },
            { id: 'pdf-word', title: 'PDF to Word', desc: 'Convert PDF to editable Word document', icon: '📝', color: 'var(--accent-blue)', active: false },
            { id: 'word-pdf', title: 'Word to PDF', desc: 'Convert Word documents to PDF', icon: '📋', color: 'var(--accent-red)', active: false },
            { id: 'pdf-png', title: 'PDF to PNG', desc: 'Convert PDF pages to PNG images', icon: '🖼️', color: 'var(--accent-green)', active: false },
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

function renderTools() {
    const grid = document.getElementById('tool-grid');
    if (!grid) return;

    const tools = TOOLS[currentCategory]?.[currentMode] || [];
    grid.innerHTML = '';

    tools.forEach(tool => {
        const card = document.createElement('div');
        card.className = `tool-card ${tool.active ? '' : 'disabled'}`;
        card.style.setProperty('--card-accent', tool.color);
        card.innerHTML = `
            <span class="tool-card-badge ${tool.active ? 'badge-active' : 'badge-soon'}">
                ${tool.active ? '✓ Active' : '🔜 Soon'}
            </span>
            <div class="tool-card-icon" style="background:${tool.color}15; color:${tool.color}">
                ${tool.icon}
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title">${tool.title}</div>
                <div class="tool-card-desc">${tool.desc}</div>
            </div>
        `;

        if (tool.active) {
            card.addEventListener('click', () => showPanel(tool.id));
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
        'pdf-to-jpg': 'panel-pdf-to-jpg',
        'images-to-pdf': 'panel-images-to-pdf',
        'pdf-compress': 'panel-pdf-compress',
        'image-compress': 'panel-image-compress',
        'ai-pdf': 'panel-ai-pdf',
        'ai-video': 'panel-ai-video',
    };

    const panelId = panelMap[toolId];
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
            currentPanel = toolId;
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
            const banner = document.getElementById('update-banner');
            if (banner) {
                banner.querySelector('.update-version').textContent = `v${result.latest_version}`;
                banner.classList.add('show');
            }
        }
    } catch (err) {
        // Silently fail — not critical
    }
}

async function performUpdate() {
    const btn = document.querySelector('.update-banner-btn');
    if (btn) {
        btn.textContent = 'Updating...';
        btn.disabled = true;
    }

    try {
        const result = await fetchAPI('/api/system/update', { method: 'POST' });
        if (result.success) {
            showToast('Updated successfully! Please restart the application.', 'success');
            const banner = document.getElementById('update-banner');
            if (banner) banner.classList.remove('show');
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (err) {
        showToast('Update failed', 'error');
    } finally {
        if (btn) {
            btn.textContent = 'Update Now';
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
    document.querySelector('.update-banner-btn')?.addEventListener('click', performUpdate);
    document.querySelector('.update-banner-close')?.addEventListener('click', () => {
        document.getElementById('update-banner')?.classList.remove('show');
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

    // Initialize tool handlers
    initPdfToJpg();
    initImagesToPdf();
    initPdfCompressor();
    initImageCompressor();
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
