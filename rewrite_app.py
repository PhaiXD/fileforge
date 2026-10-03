import codecs

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

# 1. Replace the tools definition
start_tools = "let currentCategory = 'video-audio';"
end_tools = "};\n"

start_idx = code.find(start_tools)
end_idx = code.find(end_tools, start_idx) + len(end_tools)

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
        { id: 'image-pdf', title: 'Image to PDF', desc: 'Convert image files to PDF format', icon: '📄', color: 'var(--accent-green)', active: true },
        { id: 'images-to-pdf', title: 'Merge Images to PDF', desc: 'Merge multiple images into a single PDF file', icon: '📑', color: 'var(--accent-blue)', active: true },
        { id: 'pdf-to-jpg', title: 'PDF to JPG', desc: 'Convert PDF pages to JPG images', icon: '📄', color: 'var(--accent-red)', active: true },
        { id: 'pdf-extract', title: 'Extract PDF Pages', desc: 'Split or extract specific pages from a PDF', icon: '✂️', color: 'var(--accent-purple)', active: true },
        { id: 'pdf-merge', title: 'Merge PDFs', desc: 'Combine multiple PDFs into one', icon: '🔗', color: 'var(--accent-blue)', active: true },
        { id: 'pdf-png', title: 'PDF to PNG', desc: 'Convert PDF pages to PNG images', icon: '🖼️', color: 'var(--accent-green)', active: true },
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
};\n"""

code = code[:start_idx] + new_tools + code[end_idx:]

# 2. Replace switchCategory and switchMode
start_sc = "function switchCategory(category) {"
end_sc = "function getRecentTools() {"
start_idx = code.find(start_sc)
end_idx = code.find(end_sc, start_idx)

new_switch = """function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    renderTools();
    hidePanel();
}

function getFavorites() {
    try { return JSON.parse(localStorage.getItem('fileforge_favorites')) || []; }
    catch(e) { return []; }
}

window.toggleFavorite = function(toolId, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    let favs = getFavorites();
    if (favs.includes(toolId)) favs = favs.filter(id => id !== toolId);
    else favs.push(toolId);
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
    
    let html = <div style="text-align:left;">
        <h3 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;"> </h3>
        <p style="color:var(--text-secondary); margin-bottom:16px;"></p>
        <div style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px; background:var(--bg-secondary); padding:8px; border-radius:8px;">
            <div><strong>ID:</strong> </div>;
            
    if (isPlugin && pluginRef) {
        html += <div><strong>Provided by:</strong>  v</div>
                 <div><strong>Author:</strong> </div>;
    }
    
    html += </div>;
    
    if (isPlugin && !isBuiltin) {
        html += <button onclick="uninstallPlugin('')" class="btn-secondary" style="width:100%; border-color:var(--accent-red); color:var(--accent-red);">🗑️ Uninstall Plugin</button>;
    } else if (isBuiltin) {
        html += <div style="text-align:center; font-size:12px; color:var(--text-tertiary);">Core Built-in Tool</div>;
    }
    
    html += </div>;
    
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
    
    modal.innerHTML = <div class="modal-content" style="background:var(--bg-primary); padding:24px; border-radius:12px; width:90%; max-width:400px; box-shadow:0 10px 40px rgba(0,0,0,0.2);">
        
        <button onclick="this.parentElement.parentElement.remove()" class="btn-primary" style="margin-top:16px; width:100%;">Close</button>
    </div>;
    
    document.body.appendChild(modal);
}

"""
code = code[:start_idx] + new_switch + code[end_idx:]

# 3. Replace renderTools
start_rt = "function renderTools() {"
end_rt = "function showPanel(toolId) {"
start_idx = code.find(start_rt)
end_idx = code.find(end_rt, start_idx)

new_render = """function renderTools() {
    const grid = document.getElementById('tool-grid');
    const storeUninstalledGrid = document.getElementById('store-uninstalled-grid');
    if (!grid) return;

    let nativeTools = window.TOOLS[currentMode] || [];
    let mergedTools = [...nativeTools];
    let storeTools = [];
    
    // Add installed plugins to mergedTools
    if (window.installedPluginsData) {
        window.installedPluginsData.forEach(plugin => {
            if (plugin.tools) {
                plugin.tools.forEach(t => {
                    if (t.mode === currentMode || currentMode === 'convert') {
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
    
    // Add uninstalled store plugins to storeTools
    if (window.storePluginsData && storeUninstalledGrid) {
        window.storePluginsData.forEach(plugin => {
            const isInstalled = window.installedPluginsData?.some(p => p.id === plugin.id);
            if (!isInstalled) {
                // If it has tools defined, add them individually. If not, add the plugin as a whole.
                if (plugin.tools && plugin.tools.length > 0) {
                    plugin.tools.forEach(t => {
                        storeTools.push({
                            id: 'store:' + plugin.id + ':' + t.id,
                            title: t.name,
                            desc: t.description,
                            icon: t.icon || plugin.icon || '🧩',
                            color: 'var(--text-tertiary)',
                            active: true,
                            isStore: true,
                            pluginData: plugin,
                            toolData: t
                        });
                    });
                } else {
                    storeTools.push({
                        id: 'store:' + plugin.id,
                        title: plugin.name,
                        desc: plugin.description,
                        icon: plugin.icon || '🛒',
                        color: 'var(--text-tertiary)',
                        active: true,
                        isStore: true,
                        pluginData: plugin
                    });
                }
            }
        });
    }

    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const filterBySearch = (tools) => {
        if (!query) return tools;
        const terms = query.split(/\\s+/);
        return tools.filter(t => {
            const searchableText = (t.title + " " + (t.desc || "") + " " + t.id).toLowerCase();
            return terms.every(term => searchableText.includes(term));
        });
    };

    mergedTools = filterBySearch(mergedTools);
    storeTools = filterBySearch(storeTools);

    const recent = getRecentTools();
    const favs = getFavorites();
    const favOnly = document.getElementById('fav-filter')?.checked;

    if (favOnly) {
        mergedTools = mergedTools.filter(t => favs.includes(t.id));
        storeTools = storeTools.filter(t => favs.includes(t.id));
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

    const renderCard = (tool, isStore = false) => {
        const isFav = favs.includes(tool.id);
        return <div class="tool-card  " data-tool="" style="--card-accent: ; ">
            <div style="position:absolute; top:8px; right:8px; display:flex; gap:4px; z-index:2;">
                <button class="fav-btn" onclick="toggleFavorite('', event)" style="background:none; border:none; cursor:pointer; font-size:16px; opacity:; transition:0.2s;" title="Toggle Favorite">⭐</button>
                <button class="info-btn" onclick="showToolInfo('', event)" style="background:none; border:none; cursor:pointer; font-size:16px; opacity:0.3; transition:0.2s;" title="Info">ℹ️</button>
            </div>
            <div class="tool-card-icon" style="background: color-mix(in srgb,  15%, transparent); color: ">
                
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title" style="display:flex; justify-content:space-between; align-items:center;">
                    
                    
                </div>
                <div class="tool-card-desc"></div>
            </div>
            
        </div>;
    };

    grid.innerHTML = mergedTools.map(t => renderCard(t, false)).join('');
    
    if (storeUninstalledGrid) {
        // limit to 6 for the main page
        storeUninstalledGrid.innerHTML = storeTools.slice(0, 6).map(t => renderCard(t, true)).join('');
        if (storeTools.length === 0) {
            storeUninstalledGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-tertiary);">No new plugins found.</div>';
        }
    }

    const attachListeners = (container) => {
        if(!container) return;
        container.querySelectorAll('.tool-card').forEach(card => {
            if (!card.classList.contains('disabled')) {
                card.addEventListener('click', (e) => {
                    if(e.target.closest('.fav-btn') || e.target.closest('.info-btn')) return;
                    const toolId = card.dataset.tool;
                    
                    if (toolId.startsWith('store:')) {
                        // Go to store or prompt install
                        const parts = toolId.split(':');
                        const pluginId = parts[1];
                        if (confirm(Do you want to install ?)) {
                            if(typeof installPlugin === 'function') installPlugin(pluginId);
                        }
                        return;
                    }

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
    };

    attachListeners(grid);
    attachListeners(storeUninstalledGrid);
}

"""
code = code[:start_idx] + new_render + code[end_idx:]

code = code.replace("function initSearch() {", "function initSearch() {\\n    document.getElementById('search-input')?.addEventListener('input', renderTools);\\n    document.getElementById('fav-filter')?.addEventListener('change', renderTools);")

with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
