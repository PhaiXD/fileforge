
// ============================================================
// Custom Modal (replaces browser alert/confirm)
// ============================================================

function customAlert(message, title, icon) {
    title = title || 'FileForge';
    icon = icon || '\u2139\ufe0f';
    return new Promise(function(resolve) {
        var modal = document.getElementById('custom-modal');
        document.getElementById('modal-icon').textContent = icon;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = message;
        document.getElementById('modal-actions').innerHTML = '<button class="custom-modal-btn primary" id="modal-ok">OK</button>';
        modal.style.display = 'flex';
        document.getElementById('modal-ok').onclick = function() { modal.style.display = 'none'; resolve(); };
        modal.onclick = function(e) { if (e.target === modal) { modal.style.display = 'none'; resolve(); } };
    });
}

function customConfirm(message, title, icon) {
    title = title || 'Confirm';
    icon = icon || '\u2753';
    return new Promise(function(resolve) {
        var modal = document.getElementById('custom-modal');
        document.getElementById('modal-icon').textContent = icon;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = message;
        document.getElementById('modal-actions').innerHTML = '<button class="custom-modal-btn secondary" id="modal-cancel">Cancel</button><button class="custom-modal-btn primary" id="modal-confirm">Confirm</button>';
        modal.style.display = 'flex';
        document.getElementById('modal-confirm').onclick = function() { modal.style.display = 'none'; resolve(true); };
        document.getElementById('modal-cancel').onclick = function() { modal.style.display = 'none'; resolve(false); };
        modal.onclick = function(e) { if (e.target === modal) { modal.style.display = 'none'; resolve(false); } };
    });
}

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

let currentMode = 'convert';
let currentPanel = null;
let ctxToolId = null;
let ctxIsStore = false;
let toolsCurrentPage = 1;
const TOOLS_PER_PAGE = 24;

window.TOOLS = {
    convert: [
        { id: 'mp4-mp3', title: 'MP4 to MP3', desc: 'Extract audio from MP4 video', icon: '🎧', color: 'var(--accent)', active: true, tags: ['video','audio'] },
        { id: 'mp4-m4a', title: 'MP4 to M4A', desc: 'Extract audio from MP4 video (AAC)', icon: '🎧', color: 'var(--accent)', active: true, tags: ['video','audio'] },
        { id: 'mov-mp4', title: 'MOV to MP4', desc: 'Convert QuickTime MOV to MP4', icon: '📹', color: 'var(--accent-green)', active: true, tags: ['video'] },
        { id: 'webm-mp4', title: 'WEBM to MP4', desc: 'Convert WEBM to MP4', icon: '📹', color: 'var(--accent-green)', active: true, tags: ['video'] },
        { id: 'av1-mp4', title: 'AV1 to MP4', desc: 'Convert AV1 to MP4', icon: '📹', color: 'var(--accent-green)', active: true, tags: ['video'] },
        { id: 'wav-mp3', title: 'WAV to MP3', desc: 'Convert WAV audio to MP3', icon: '🎵', color: 'var(--accent-teal)', active: true, tags: ['audio'] },
        { id: 'mp4-gif', title: 'MP4 to GIF', desc: 'Convert MP4 to animated GIF', icon: '🖼️', color: 'var(--accent-yellow)', active: true, tags: ['video','image'] },
        { id: 'png-jpg', title: 'PNG to JPG', desc: 'Convert PNG images to JPG format', icon: '🖼️', color: 'var(--accent)', active: true, tags: ['image'] },
        { id: 'webp-jpg', title: 'WEBP to JPG', desc: 'Convert WebP images to JPG format', icon: '🌐', color: 'var(--accent)', active: true, tags: ['image'] },
        { id: 'heic-jpg', title: 'HEIC to JPG', desc: 'Convert Apple HEIC to JPG', icon: '📸', color: 'var(--accent-teal)', active: true, tags: ['image'] },
        { id: 'jpg-png', title: 'JPG to PNG', desc: 'Convert JPG images to PNG format', icon: '🖼️', color: 'var(--accent-green)', active: true, tags: ['image'] },
        { id: 'webp-png', title: 'WEBP to PNG', desc: 'Convert WebP images to PNG', icon: '🌐', color: 'var(--accent-green)', active: true, tags: ['image'] },
        { id: 'heic-png', title: 'HEIC to PNG', desc: 'Convert Apple HEIC to PNG', icon: '📸', color: 'var(--accent-teal)', active: true, tags: ['image'] },
        { id: 'jpg-webp', title: 'JPG to WEBP', desc: 'Convert JPG images to WebP format', icon: '🖼️', color: 'var(--accent-purple)', active: true, tags: ['image'] },
        { id: 'png-webp', title: 'PNG to WEBP', desc: 'Convert PNG images to WebP format', icon: '🖼️', color: 'var(--accent-purple)', active: true, tags: ['image'] },
        { id: 'heic-webp', title: 'HEIC to WEBP', desc: 'Convert Apple HEIC to WebP', icon: '📸', color: 'var(--accent-teal)', active: true, tags: ['image'] },
        { id: 'image-pdf', title: 'Image to PDF', desc: 'Convert image files to PDF format', icon: '📄', color: 'var(--accent-green)', active: true, tags: ['image','document'] },
        { id: 'images-to-pdf', title: 'Merge Images to PDF', desc: 'Merge multiple images into a single PDF file', icon: '📑', color: 'var(--accent)', active: true, tags: ['image','document'] },
        { id: 'pdf-to-jpg', title: 'PDF to JPG', desc: 'Convert PDF pages to JPG images', icon: '📄', color: 'var(--accent-red)', active: true, tags: ['document','image'] },
        { id: 'pdf-extract', title: 'Extract PDF Pages', desc: 'Split or extract specific pages from a PDF', icon: '✂️', color: 'var(--accent-purple)', active: true, tags: ['document'] },
        { id: 'pdf-merge', title: 'Merge PDFs', desc: 'Combine multiple PDFs into one', icon: '🔗', color: 'var(--accent)', active: true, tags: ['document'] },
        { id: 'pdf-png', title: 'PDF to PNG', desc: 'Convert PDF pages to PNG images', icon: '🖼️', color: 'var(--accent-green)', active: true, tags: ['document','image'] },
    ],
    compress: [
        { id: 'video-compress', title: 'Video Compressor', desc: 'Reduce video file size', icon: '🗜️', color: 'var(--accent)', active: false, tags: ['video'] },
        { id: 'audio-compress', title: 'Audio Compressor', desc: 'Reduce audio file size', icon: '🔉', color: 'var(--accent-teal)', active: false, tags: ['audio'] },
        { id: 'image-compress', title: 'Image Compressor', desc: 'Reduce image file size while preserving quality', icon: '📐', color: 'var(--accent-green)', active: true, tags: ['image'] },
        { id: 'pdf-compress', title: 'PDF Compressor', desc: 'Reduce PDF file size for sharing', icon: '📦', color: 'var(--accent-red)', active: true, tags: ['document'] },
    ],
    fetch: [],
    ai: [
        { id: 'ai-pdf', title: 'Summarize PDF', desc: 'Extract and summarize PDF content using AI', icon: '📄', color: 'var(--accent-purple)', active: true, tags: ['document'] },
        { id: 'ai-video', title: 'Summarize Video', desc: 'Summarize YouTube video content from subtitles or audio', icon: '🎬', color: 'var(--accent-purple)', active: true, tags: ['video'] },
    ]
};

function switchMode(mode) {
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
        // Search across all modes for native tools
        Object.keys(window.TOOLS).forEach(mode => { const tools = window.TOOLS[mode] || []; if(Array.isArray(tools)) { const found = tools.find(t => t.id === toolId); if(found) toolInfo = found; } });
    }
    
    if (!toolInfo) {
        // Might be a store tool
        if (toolId.startsWith('store:')) {
            const parts = toolId.split(':');
            const pluginId = parts[1];
            const tId = parts[2];
            const plugin = window.storePluginsData?.find(p => p.id === pluginId);
            if (plugin) {
                if (tId) toolInfo = plugin.tools?.find(t => t.id === tId);
                else toolInfo = plugin;
                isPlugin = true;
                pluginRef = plugin;
            }
        }
        if (!toolInfo) return;
    }
    
    const isBuiltin = pluginRef?._builtin || !isPlugin;
    
    let html = `<div style="text-align:left;">
        <h3 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;">${toolInfo.icon || 'ℹ️'} ${toolInfo.title || toolInfo.name}</h3>
        <p style="color:var(--text-secondary); margin-bottom:16px;">${toolInfo.desc || toolInfo.description}</p>
        <div style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px; background:var(--bg-secondary); padding:8px; border-radius:8px;">
            <div><strong>ID:</strong> ${toolInfo.id}</div>`;
            
    if (isPlugin && pluginRef) {
        html += `<div><strong>Plugin Name:</strong> ${pluginRef.name}</div>
                 <div><strong>Version:</strong> v${pluginRef.version || '1.0.0'}</div>
                 <div><strong>Author:</strong> ${pluginRef.author || 'Unknown'}</div>`;
    } else {
        html += `<div><strong>Version:</strong> Built-in (Core)</div>`;
    }
    
    html += `</div></div>`;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;';
    
    modal.innerHTML = `<div class="modal-content" style="background:var(--bg-primary); padding:24px; border-radius:12px; width:90%; max-width:400px; box-shadow:0 10px 40px rgba(0,0,0,0.2);">
        ${html}
        <button onclick="this.parentElement.parentElement.remove()" class="btn-primary" style="margin-top:16px; width:100%;">Close</button>
    </div>`;
    
    // Click outside to close
    modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
    
    document.body.appendChild(modal);
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

window.buildPaginationHTML = function(currentPage, totalPages) {
    let html = '';
    
    // Prev
    const prevDisabled = currentPage <= 1 ? 'disabled' : '';
    html += `<button class="btn-secondary btn-page" data-page="${currentPage - 1}" ${prevDisabled}>&larr;</button>`;
    
    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        html += `<button class="btn-secondary btn-page" data-page="1">1</button>`;
        if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isCurrent = i === currentPage;
        const currentClass = isCurrent ? 'btn-page-current' : '';
        html += `<button class="btn-secondary btn-page ${currentClass}" data-page="${i}" ${isCurrent ? 'disabled style="opacity:1;"' : ''}>${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
        html += `<button class="btn-secondary btn-page" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Next
    const nextDisabled = currentPage >= totalPages ? 'disabled' : '';
    html += `<button class="btn-secondary btn-page" data-page="${currentPage + 1}" ${nextDisabled}>&rarr;</button>`;
    
    return html;
};

function renderTools() {
    if (typeof renderStoreTools === 'function') renderStoreTools();
    const grid = document.getElementById('tool-grid');
    const storeUninstalledGrid = document.getElementById('store-uninstalled-grid');
    if (!grid) return;

    let nativeTools = window.TOOLS[currentMode] || [];
    try {
        const hiddenNative = JSON.parse(localStorage.getItem('fileforge_hidden_native') || '[]');
        nativeTools = nativeTools.filter(t => !hiddenNative.includes(t.id));
    } catch(e) {}
    let mergedTools = [...nativeTools];
    let storeTools = [];
    
    // Add installed plugins to mergedTools
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
    
    // Add uninstalled store plugins to storeTools
    let installedToolIds = getInstalledToolIds();

    if (window.storePluginsData && storeUninstalledGrid) {
        window.storePluginsData.forEach(plugin => {
            if (plugin.tools && plugin.tools.length > 0) {
                plugin.tools.forEach(t => {
                    if (t.mode === currentMode) {
                        // Check if this specific tool is already installed!
                        if (!installedToolIds.has(t.id)) {
                            storeTools.push({
                                id: 'store:' + plugin.id + ':' + t.id,
                                title: t.name,
                                desc: t.description,
                                icon: t.icon || plugin.icon || '📦',
                                color: 'var(--text-tertiary)',
                                active: true,
                                isStore: true,
                                pluginData: plugin,
                                toolData: t
                            });
                        }
                    }
                });
            } else {
                if (!installedToolIds.has(plugin.id)) {
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
    
    // Reset page to 1 when search query changes (handled by input event listener below, but this is renderTools)
    
    // Get active tags from left sidebar
    const activeTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value.toLowerCase());
    
    const recent = getRecentTools();
    const favs = getFavorites();

    const filterBySearch = (tools) => {
        return tools.filter(t => {
            const searchableText = (t.title + " " + (t.desc || "") + " " + (t.tags?t.tags.join(' '):"") + " " + t.id).toLowerCase();
            
            // Must match all active category tags (except favorite)
            const catTags = activeTags.filter(tag => tag !== 'favorite');
            const hasFav = activeTags.includes('favorite');
            
            if (hasFav && !favs.includes(t.id)) return false;
            
            const tagsMatch = catTags.length === 0 || catTags.every(tag => searchableText.includes(tag));
            if (!tagsMatch) return false;
            
            // Must match search query
            if (query) {
                const terms = query.split(/\s+/);
                return terms.every(term => searchableText.includes(term));
            }
            
            return true;
        });
    };

    mergedTools = filterBySearch(mergedTools);
    storeTools = filterBySearch(storeTools);

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
        const tColor = tool.color || 'var(--accent-purple)';
        const bg = tColor.includes('var(') ? tColor.replace(')', '-light)') : tColor + '15';
        return `<div class="tool-card ${isStore ? 'store-item' : ''}" data-tool="${tool.id}" style="--card-accent: ${tColor}; ${isStore ? 'background:var(--bg-secondary); border-style:dashed;' : ''}">
            ${isFav ? '<div style="position:absolute; top:8px; right:8px; font-size:12px; z-index:2;" title="Favorite">⭐</div>' : ''}
            <div class="tool-card-icon" style="background: ${bg}; color: ${tColor}">
                ${tool.icon}
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title" style="display:flex; justify-content:space-between; align-items:center;">
                    ${tool.title}
                    ${isStore ? '<span style="font-size:12px; background:var(--accent); color:#fff; padding:2px 8px; border-radius:12px;">Get</span>' : ''}
                </div>
                <div class="tool-card-desc">${tool.desc}</div>
            </div>
        </div>`;
    };

    // Pagination for main grid
    const totalPages = Math.max(1, Math.ceil(mergedTools.length / TOOLS_PER_PAGE));
    if (toolsCurrentPage > totalPages) toolsCurrentPage = totalPages;
    if (toolsCurrentPage < 1) toolsCurrentPage = 1;
    
    const startIdx = (toolsCurrentPage - 1) * TOOLS_PER_PAGE;
    const pageItems = mergedTools.slice(startIdx, startIdx + TOOLS_PER_PAGE);
    
    grid.innerHTML = pageItems.map(t => renderCard(t, false)).join('');
    
    // Update pagination controls
    const paginationEl = document.getElementById('tools-pagination');
    if (paginationEl) {
        if (totalPages <= 1) {
            paginationEl.style.display = 'none';
        } else {
            paginationEl.style.display = 'block';
            const pageContainer = paginationEl.querySelector('div');
            pageContainer.innerHTML = window.buildPaginationHTML(toolsCurrentPage, totalPages);
            
            // Add click listeners to page buttons
            pageContainer.querySelectorAll('.btn-page').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    if (!isNaN(page)) {
                        toolsCurrentPage = page;
                        renderTools();
                    }
                });
            });
        }
    }
    
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
                // Right click
                card.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    ctxToolId = card.dataset.tool;
                    ctxIsStore = ctxToolId.startsWith('store:');
                    
                    const ctxMenu = document.getElementById('tool-context-menu');
                    if (ctxMenu) {
                        ctxMenu.style.display = 'block';
                        ctxMenu.style.left = e.clientX + 'px';
                        ctxMenu.style.top = e.clientY + 'px';
                        
                        document.getElementById('ctx-uninstall').style.display = 'flex';
                        document.getElementById('ctx-install').style.display = ctxIsStore ? 'flex' : 'none';
                    }
                });

                card.addEventListener('click', (e) => {
                    if(e.target.closest('.fav-btn') || e.target.closest('.info-btn')) return;
                    const toolId = card.dataset.tool;
                    
                    if (toolId.startsWith('store:')) {
                        const parts = toolId.split(':');
                        const pluginId = parts[1];
                        
                        let toolIcon = '📦';
                        let toolName = parts[1];
                        if (window.storePluginsData) {
                            const pData = window.storePluginsData.find(p => p.id === pluginId);
                            if (pData && pData.tools && pData.tools.length > 0) {
                                toolIcon = pData.tools[0].icon || pData.icon || '📦';
                                toolName = pData.tools[0].name || pData.name || toolName;
                            }
                        }
                        customConfirm('Do you want to install <strong>' + toolName + '</strong>?', 'Install Tool', toolIcon).then(function(ok) {
                            if (ok && typeof installPlugin === 'function') installPlugin(pluginId);
                        });
    
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

function showPanel(toolId) {
    // Hide grid, show tool panel
    document.getElementById('tool-grid-section').style.display = 'none';
    const sidebar = document.getElementById('sidebar-filters');
    if (sidebar) sidebar.style.display = 'none';
    const aiSection = document.getElementById('ai-section');
    if (aiSection) aiSection.style.display = 'none';
    
    const scBox = document.getElementById('smart-convert-box');
    if (scBox) scBox.style.display = 'none';

    // Hide all panels
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));

    // Map tool IDs to panel IDs
    const panelMap = {
        'yt-mp4': 'panel-yt-mp4',
        'yt-mp3': 'panel-yt-mp3',
        'mp4-mp3': 'panel-media-convert',
        'mp4-m4a': 'panel-media-convert',
        'mov-mp3': 'panel-media-convert',
        'mov-m4a': 'panel-media-convert',
        'webm-mp3': 'panel-media-convert',
        'mp4-gif': 'panel-media-convert',
        'mov-gif': 'panel-media-convert',
        'webm-gif': 'panel-media-convert',
        'mov-mp4': 'panel-media-convert',
        'webm-mp4': 'panel-media-convert',
        'av1-mp4': 'panel-media-convert',
        'wav-mp3': 'panel-media-convert',
        'wav-m4a': 'panel-media-convert',
        'm4a-mp3': 'panel-media-convert',
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
        'heic-jpg': 'panel-img-convert',
        'jpg-png': 'panel-img-convert',
        'webp-png': 'panel-img-convert',
        'heic-png': 'panel-img-convert',
        'jpg-webp': 'panel-img-convert',
        'png-webp': 'panel-img-convert',
        'heic-webp': 'panel-img-convert',
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
                    'heic-jpg':  { title: 'HEIC to JPG',  accept: '.heic,.heif', hint: 'Supports .heic files', format: 'jpg', btnText: '📸 Convert to JPG', ext: 'HEIC' },
                    'jpg-png':   { title: 'JPG to PNG',   accept: '.jpg,.jpeg', hint: 'Supports .jpg, .jpeg files', format: 'png', btnText: '🖼️ Convert to PNG', ext: 'JPG' },
                    'webp-png':  { title: 'WEBP to PNG',  accept: '.webp', hint: 'Supports .webp files', format: 'png', btnText: '🌐 Convert to PNG', ext: 'WEBP' },
                    'heic-png':  { title: 'HEIC to PNG',  accept: '.heic,.heif', hint: 'Supports .heic files', format: 'png', btnText: '📸 Convert to PNG', ext: 'HEIC' },
                    'jpg-webp':  { title: 'JPG to WEBP',  accept: '.jpg,.jpeg', hint: 'Supports .jpg files', format: 'webp', btnText: '🖼️ Convert to WEBP', ext: 'JPG' },
                    'png-webp':  { title: 'PNG to WEBP',  accept: '.png', hint: 'Supports .png files', format: 'webp', btnText: '🖼️ Convert to WEBP', ext: 'PNG' },
                    'heic-webp': { title: 'HEIC to WEBP', accept: '.heic,.heif', hint: 'Supports .heic files', format: 'webp', btnText: '📸 Convert to WEBP', ext: 'HEIC' },
                    'image-pdf': { title: 'Image to PDF', accept: '.jpg,.jpeg,.png,.webp,.heic,.heif', hint: 'Supports standard images', format: 'pdf', btnText: '📄 Convert to PDF', ext: 'IMG' },
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
                    'av1-mp4':  { title: 'AV1 to MP4',  accept: '.mp4,.webm,.mkv',  hint: 'Supports AV1 video files', format: 'mp4', btnText: '📹 Convert to MP4' },
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
    const sidebar = document.getElementById('sidebar-filters');
    if (sidebar) sidebar.style.display = '';
    const aiSection = document.getElementById('ai-section');
    if (aiSection && currentMode === 'ai') {
        aiSection.style.display = 'block';
    }
    
    const scBox = document.getElementById('smart-convert-box');
    if (scBox && currentMode === 'convert') {
        scBox.style.display = '';
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
    for (const [mode, tools] of Object.entries(window.TOOLS)) {
        if (Array.isArray(tools)) {
            tools.forEach(tool => {
                allTools.push({
                    ...tool,
                    category: mode,
                    categoryKey: mode,
                    mode: mode,
                });
            });
        }
    }
    
    // Also include plugin tools
    if (window.installedPluginsData) {
        window.installedPluginsData.forEach(plugin => {
            if (plugin.tools) {
                plugin.tools.forEach(tool => {
                    allTools.push({
                        ...tool,
                        title: tool.name,
                        desc: tool.description,
                        icon: tool.icon || plugin.icon || '🧩',
                        color: 'var(--accent-purple)',
                        category: 'Plugin',
                        categoryKey: 'plugin',
                        mode: tool.mode,
                        is_plugin: true,
                        plugin_id: plugin.id,
                        pluginData: plugin,
                        toolData: tool
                    });
                });
            }
        });
    }
    
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
        const tColor = tool.color || 'var(--accent-purple)';
        const bg = tColor.includes('var(') ? tColor.replace(')', '-light)') : tColor + '15';
        item.innerHTML = `
            <div class="search-result-icon" style="background: ${bg}; color:${tColor};">
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
            
            if (tool.is_plugin && typeof openPluginTool === 'function') {
                openPluginTool(tool.plugin_id, tool.id);
            } else {
                showPanel(tool.id);
            }
        });
        
        container.appendChild(item);
    });
    container.style.display = 'block';
}

function initSearch() {
    document.getElementById('search-input')?.addEventListener('input', () => { toolsCurrentPage = 1; renderTools(); });
    document.getElementById('fav-filter')?.addEventListener('change', () => { toolsCurrentPage = 1; renderTools(); });
    document.querySelectorAll('.tag-filter').forEach(cb => cb.addEventListener('change', () => { toolsCurrentPage = 1; renderTools(); }));
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    const resultsContainer = document.getElementById('search-results');
    if (!input) return;
    
    input.addEventListener('input', () => {
        const query = input.value.trim();
        clearBtn.style.display = query ? 'flex' : 'none';
        
        if (!query) {
              resultsContainer.style.display = 'none';
              renderTools();
              return;
          }
        
        const results = searchTools(query);
        renderSearchResults(results, query);
    });
    
    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        resultsContainer.style.display = 'none';
        renderTools();
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
    // ctxToolId and ctxIsStore are global (declared near currentMode)
    initTheme();
    initSearch();
    
    const btnMore = document.getElementById('btn-more-plugins');
    const btnBack = document.getElementById('btn-back-home');
    const toolGridSection = document.getElementById('tool-grid-section');
    const storePageSection = document.getElementById('store-page-section');
    const modeToggle = document.querySelector('.mode-toggle');
    const searchContainer = document.getElementById('search-container');
    
    if (btnMore) {
        btnMore.addEventListener('click', () => {
            toolGridSection.style.display = 'none';
            modeToggle.style.display = 'none';
            searchContainer.style.display = 'none';
            storePageSection.style.display = 'block';
            window.scrollTo(0,0);
        });
    }
    
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            storePageSection.style.display = 'none';
            toolGridSection.style.display = 'block';
            modeToggle.style.display = 'flex';
            searchContainer.style.display = 'flex';
        });
    }

    const storeSearch = document.getElementById('store-search-input');
    if (storeSearch) {
        storeSearch.addEventListener('input', () => {
            const query = storeSearch.value.toLowerCase().trim();
            const terms = query.split(/\s+/);
            document.querySelectorAll('#store-grid .tool-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                if (terms.every(term => text.includes(term))) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    if (typeof loadStore === 'function') {
        loadStore();
    }
    
    renderTools();
    
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

    // GitHub popup
    const ghBtn = document.getElementById('btn-github');
    const ghPopup = document.getElementById('github-popup');
    if (ghBtn && ghPopup) {
        ghBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ghPopup.style.display = ghPopup.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', (e) => {
            if (!ghPopup.contains(e.target) && e.target !== ghBtn) {
                ghPopup.style.display = 'none';
            }
        });
    }

    // Rotating tagline
    const taglines = document.querySelectorAll('.hero-tagline');
    if (taglines.length > 1) {
        let currentIdx = 0;
        setInterval(() => {
            taglines[currentIdx].classList.remove('active');
            currentIdx = (currentIdx + 1) % taglines.length;
            taglines[currentIdx].classList.add('active');
        }, 4000);
    }

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
    initPdfSummarizer();
    initVideoSummarizer();

    // Check for updates
    checkForUpdates();


    // Context Menu Handlers
    const ctxMenu = document.getElementById('tool-context-menu');
    document.addEventListener('click', () => { if(ctxMenu) ctxMenu.style.display = 'none'; });
    
    if (ctxMenu) {
        document.getElementById('ctx-info').onclick = (e) => {
            document.getElementById('tool-context-menu').style.display = 'none';
            if (ctxToolId) {
                if(typeof showToolInfo === 'function') showToolInfo(ctxToolId, e);
            }
        };
        document.getElementById('ctx-fav').onclick = (e) => {
              document.getElementById('tool-context-menu').style.display = 'none';
              if (ctxToolId) {
                  if(typeof toggleFavorite === 'function') toggleFavorite(ctxToolId, e);
              }
          };
        document.getElementById('ctx-uninstall').onclick = (e) => {
            document.getElementById('tool-context-menu').style.display = 'none';
            if (!ctxToolId) return;
            
            if (ctxToolId.startsWith('plugin:')) {
                const pluginId = ctxToolId.split(':')[1];
                if(typeof uninstallPlugin === 'function') uninstallPlugin(pluginId);
            } else if (!ctxToolId.startsWith('store:')) {
                customConfirm('Are you sure you want to remove this built-in tool?', 'Remove Tool', '🗑️').then(ok => {
                    if (ok) {
                        let hidden = JSON.parse(localStorage.getItem('fileforge_hidden_native') || '[]');
                        if (!hidden.includes(ctxToolId)) {
                            hidden.push(ctxToolId);
                            localStorage.setItem('fileforge_hidden_native', JSON.stringify(hidden));
                        }
                        renderTools();
                    }
                });
            }
        };
        document.getElementById('ctx-install').onclick = (e) => {
            document.getElementById('tool-context-menu').style.display = 'none';
            if (ctxToolId && ctxToolId.startsWith('store:')) {
                const pluginId = ctxToolId.split(':')[1];
                if (typeof installPlugin === 'function') installPlugin(pluginId);
            }
        };
    }

    console.log('🔥 FileForge initialized');
});

function getInstalledToolIds() {
    let installedToolIds = new Set();
    // Collect all native tool IDs across all modes
    Object.values(window.TOOLS).forEach(toolArray => {
        if (Array.isArray(toolArray)) {
            toolArray.forEach(t => installedToolIds.add(t.id));
        }
    });
    // Collect plugin tool IDs (both raw IDs and prefixed IDs)
    if (window.installedPluginsData) {
        window.installedPluginsData.forEach(plugin => {
            if (plugin.tools) {
                plugin.tools.forEach(t => {
                    installedToolIds.add(t.id);  // raw ID like 'mp4-mp3'
                    installedToolIds.add('plugin:' + plugin.id + ':' + t.id);  // prefixed ID
                });
            }
        });
    }
    // Remove hidden native tools
    try {
        const hiddenNative = JSON.parse(localStorage.getItem('fileforge_hidden_native') || '[]');
        hiddenNative.forEach(id => installedToolIds.delete(id));
    } catch(e) {}
    return installedToolIds;
}



