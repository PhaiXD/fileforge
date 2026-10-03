import re

with open('static/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

new_tools = """let currentMode = 'convert';
let currentPanel = null;

window.TOOLS = {
    convert: [
        { id: 'yt-mp4', title: 'YouTube to MP4', desc: 'Download YouTube videos as MP4', icon: '🎬', color: 'var(--accent-red)', active: true },
        { id: 'yt-mp3', title: 'YouTube to MP3', desc: 'Extract audio from YouTube videos', icon: '🎵', color: 'var(--accent-red)', active: true },
        { id: 'mp4-mp3', title: 'MP4 to MP3', desc: 'Extract audio from MP4 video', icon: '🎧', color: 'var(--accent-blue)', active: true },
        { id: 'mp4-m4a', title: 'MP4 to M4A', desc: 'Extract audio from MP4 video (AAC)', icon: '🎧', color: 'var(--accent-blue)', active: true },
        { id: 'mov-mp4', title: 'MOV to MP4', desc: 'Convert QuickTime MOV to MP4', icon: '📹', color: 'var(--accent-green)', active: true },
        { id: 'webm-mp4', title: 'WEBM to MP4', desc: 'Convert WEBM to MP4', icon: '📹', color: 'var(--accent-green)', active: true },
        { id: 'av1-mp4', title: 'AV1 to MP4', desc: 'Convert AV1 to MP4', icon: '📹', color: 'var(--accent-green)', active: true },
        { id: 'wav-mp3', title: 'WAV to MP3', desc: 'Convert WAV audio to MP3', icon: '🎵', color: 'var(--accent-teal)', active: true },
        { id: 'mp4-gif', title: 'MP4 to GIF', desc: 'Convert MP4 to animated GIF', icon: '🖼️', color: 'var(--accent-yellow)', active: true },
        { id: 'png-jpg', title: 'PNG to JPG', desc: 'Convert PNG images to JPG format', icon: '🖼️', color: 'var(--accent-blue)', active: true },
        { id: 'webp-jpg', title: 'WEBP to JPG', desc: 'Convert WebP images to JPG format', icon: '🌐', color: 'var(--accent-blue)', active: true },
        { id: 'heic-jpg', title: 'HEIC to JPG', desc: 'Convert Apple HEIC to JPG', icon: '📸', color: 'var(--accent-teal)', active: true },
        { id: 'jpg-png', title: 'JPG to PNG', desc: 'Convert JPG images to PNG format', icon: '🖼️', color: 'var(--accent-green)', active: true },
        { id: 'webp-png', title: 'WEBP to PNG', desc: 'Convert WebP images to PNG', icon: '🌐', color: 'var(--accent-green)', active: true },
        { id: 'heic-png', title: 'HEIC to PNG', desc: 'Convert Apple HEIC to PNG', icon: '📸', color: 'var(--accent-teal)', active: true },
        { id: 'jpg-webp', title: 'JPG to WEBP', desc: 'Convert JPG images to WebP format', icon: '🖼️', color: 'var(--accent-purple)', active: true },
        { id: 'png-webp', title: 'PNG to WEBP', desc: 'Convert PNG images to WebP format', icon: '🖼️', color: 'var(--accent-purple)', active: true },
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
        { id: 'video-compress', title: 'Video Compressor', desc: 'Reduce video file size', icon: '🗜️', color: 'var(--accent-blue)', active: false },
        { id: 'audio-compress', title: 'Audio Compressor', desc: 'Reduce audio file size', icon: '🔉', color: 'var(--accent-teal)', active: false },
        { id: 'image-compress', title: 'Image Compressor', desc: 'Reduce image file size while preserving quality', icon: '📐', color: 'var(--accent-green)', active: true },
        { id: 'pdf-compress', title: 'PDF Compressor', desc: 'Reduce PDF file size for sharing', icon: '📦', color: 'var(--accent-red)', active: true },
    ],
    ai: [
        { id: 'ai-pdf', title: 'Summarize PDF', desc: 'Extract and summarize PDF content using AI', icon: '📄', color: 'var(--accent-purple)', active: true },
        { id: 'ai-video', title: 'Summarize Video', desc: 'Summarize YouTube video content from subtitles or audio', icon: '🎬', color: 'var(--accent-purple)', active: true },
    ]
};
"""

code = re.sub(r'let currentCategory =.*?\n\};\n', new_tools, code, flags=re.DOTALL)

replace_modes = """function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    renderTools();
    hidePanel();
}

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('fileforge_favorites')) || [];
    } catch (e) {
        return [];
    }
}

window.toggleFavorite = function(toolId, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    let favs = getFavorites();
    if (favs.includes(toolId)) {
        favs = favs.filter(id => id !== toolId);
    } else {
        favs.push(toolId);
    }
    localStorage.setItem('fileforge_favorites', JSON.stringify(favs));
    renderTools();
}

window.showToolInfo = function(toolId, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    
    let toolInfo = null;
    let isPlugin = false;
    let pluginRef = null;
    
    if (toolId.startsWith('plugin:')) {
        const parts = toolId.split(':');
        const pluginId = parts[1];
        const tId = parts[2];
        const plugin = window.installedPluginsData?.find(p => p.id === pluginId);
        if (plugin) {
            toolInfo = plugin.tools.find(t => t.id === tId);
            isPlugin = true;
            pluginRef = plugin;
        }
    } else {
        const tools = window.TOOLS[currentMode] || [];
        toolInfo = tools.find(t => t.id === toolId);
    }
    
    if (!toolInfo) return;
    
    const isBuiltin = pluginRef?._builtin || !isPlugin;
    
    let html = f'''<div style="text-align:left;">
        <h3 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;"> </h3>
        <p style="color:var(--text-secondary); margin-bottom:16px;"></p>
        <div style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px; background:var(--bg-secondary); padding:8px; border-radius:8px;">
            <div><strong>ID:</strong> </div>''';
            
    if (isPlugin && pluginRef) {
        html += f'''<div><strong>Provided by:</strong>  v</div>
                 <div><strong>Author:</strong> </div>''';
    }
    
    html += '</div>';
    
    if (isPlugin && !isBuiltin) {
        html += f'''<button onclick="uninstallPlugin('')" class="btn-secondary" style="width:100%; border-color:var(--accent-red); color:var(--accent-red);">🗑️ Uninstall Plugin</button>''';
    } else if (isBuiltin) {
        html += '<div style="text-align:center; font-size:12px; color:var(--text-tertiary);">Core Built-in Tool</div>';
    }
    
    html += '</div>';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = f'''<div class="modal-content" style="background:var(--bg-primary); padding:24px; border-radius:12px; width:90%; max-width:400px; box-shadow:0 10px 40px rgba(0,0,0,0.2);">
        
        <button onclick="this.parentElement.parentElement.remove()" class="btn-primary" style="margin-top:16px; width:100%;">Close</button>
    </div>''';
    
    document.body.appendChild(modal);
}
""".replace("f'''", "").replace("'''", "")

code = re.sub(r'function switchCategory.*?function switchMode.*?hidePanel\(\);\n\}', replace_modes, code, flags=re.DOTALL)

new_render_tools = """function renderTools() {
    const grid = document.getElementById('tool-grid');
    if (!grid) return;

    let nativeTools = window.TOOLS[currentMode] || [];
    let mergedTools = [...nativeTools];
    
    if (window.installedPluginsData) {
        window.installedPluginsData.forEach(plugin => {
            if (plugin.tools) {
                plugin.tools.forEach(t => {
                    if (t.mode === currentMode) {
                        if (!mergedTools.find(nt => nt.id === t.id)) {
                            mergedTools.push({
                                id: 'plugin:' + plugin.id + ':' + t.id,
                                title: t.name,
                                desc: t.description,
                                icon: t.icon || plugin.icon || '🧩',
                                color: 'var(--accent-purple)',
                                active: true,
                                isPlugin: true,
                                pluginData: plugin,
                                toolData: t
                            });
                        }
                    }
                });
            }
        });
    }

    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (query) {
        const terms = query.split(/\\s+/);
        mergedTools = mergedTools.filter(t => {
            const searchableText = (t.title + " " + (t.desc || "") + " " + t.id).toLowerCase();
            return terms.every(term => searchableText.includes(term));
        });
    }

    const recent = getRecentTools();
    const favs = getFavorites();
    const favOnly = document.getElementById('fav-filter')?.checked;

    if (favOnly) {
        mergedTools = mergedTools.filter(t => favs.includes(t.id));
    }

    mergedTools.sort((a, b) => {
        const aFav = favs.includes(a.id);
        const bFav = favs.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        const aIndex = recent.indexOf(a.id);
        const bIndex = recent.indexOf(b.id);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        if (a.active === b.active) return 0;
        return a.active ? -1 : 1;
    });

    grid.innerHTML = mergedTools.map(tool => {
        const isFav = favs.includes(tool.id);
        return f'''
        <div class="tool-card " data-tool="" style="--card-accent: ">
            <div style="position:absolute; top:8px; right:8px; display:flex; gap:4px; z-index:2;">
                <button class="fav-btn" onclick="toggleFavorite('', event)" style="background:none; border:none; cursor:pointer; font-size:16px; opacity:; transition:0.2s;" title="Toggle Favorite">⭐</button>
                <button class="info-btn" onclick="showToolInfo('', event)" style="background:none; border:none; cursor:pointer; font-size:16px; opacity:0.3; transition:0.2s;" title="Info">ℹ️</button>
            </div>
            <div class="tool-card-icon" style="background: color-mix(in srgb,  15%, transparent); color: ">
                
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title"></div>
                <div class="tool-card-desc"></div>
            </div>
            
        </div>
        ''';
    }).join('');

    grid.querySelectorAll('.tool-card').forEach(card => {
        if (!card.classList.contains('disabled')) {
            card.addEventListener('click', (e) => {
                if(e.target.closest('.fav-btn') || e.target.closest('.info-btn')) return;
                const toolId = card.dataset.tool;
                updateRecentTool(toolId);
                
                if (toolId.startsWith('plugin:')) {
                    const parts = toolId.split(':');
                    const pluginId = parts[1];
                    const tId = parts[2];
                    const plugin = window.installedPluginsData.find(p => p.id === pluginId);
                    if (plugin) {
                        const tool = plugin.tools.find(t => t.id === tId);
                        if (typeof renderPluginPanel === 'function') {
                            renderPluginPanel(plugin, tool);
                        }
                    }
                } else {
                    showPanel(toolId);
                }
            });
        }
    });
}
""".replace("f'''", "").replace("'''", "")

code = re.sub(r'function renderTools\(\) \{.*?grid\.querySelectorAll\(\'\.tool-card\'\)\.forEach\(card => \{.*?\}\);\n    \}\);\n\}', new_render_tools, code, flags=re.DOTALL)

code = code.replace("function initSearch() {", "function initSearch() {\n    document.getElementById('search-input')?.addEventListener('input', renderTools);\n    document.getElementById('fav-filter')?.addEventListener('change', renderTools);")

with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
