/**
 * FileForge — Plugin Store Frontend
 */

let isStoreLoading = false;
let storeToolsList = [];
let storeCurrentPage = 1;
const STORE_PER_PAGE = 12;

async function loadStore() {
    if (isStoreLoading) return;
    
    const loadingEl = document.getElementById('store-loading');
    const errorEl = document.getElementById('store-error');
    const gridEl = document.getElementById('store-grid');
    
    isStoreLoading = true;
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    gridEl.style.display = 'none';
    gridEl.innerHTML = '';
    
    try {
        const response = await fetch('/api/plugins/store');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Unknown error loading plugins');
        }
        
        if (!data.plugins || data.plugins.length === 0) {
            errorEl.style.display = 'block';
            errorEl.querySelector('.store-error-msg').innerText = 'No plugins found in the registry.';
        } else {
            window.storePluginsData = data.plugins;
            if (typeof renderTools === 'function') renderTools();
            
            // Unbundle tools
            storeToolsList = [];
            data.plugins.forEach(plugin => {
                if (plugin.tools && plugin.tools.length > 0 ) {
                    plugin.tools.forEach(tool => {
                        const installedIds = typeof getInstalledToolIds === 'function' ? getInstalledToolIds() : new Set();
                        if (!installedIds.has(tool.id)) {
                            storeToolsList.push({
                                ...tool,
                                plugin_parent: plugin,
                                plugin_id: plugin.id
                            });
                        }
                    });
                }
            });
            
            renderStoreTools();
            gridEl.style.display = 'grid';
        }
    } catch (err) {
        console.error('Store error:', err);
        errorEl.style.display = 'block';
        errorEl.querySelector('.store-error-msg').innerText = err.message;
    } finally {
        isStoreLoading = false;
        loadingEl.style.display = 'none';
    }
}

function renderStoreTools() {
    const gridEl = document.getElementById('store-grid');
    gridEl.innerHTML = '';
    
    const searchInput = document.getElementById('store-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Also use the active sidebar categories for the store
    const activeTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value.toLowerCase());
    
    const filtered = storeToolsList.filter(t => {
        // Don't filter by mode in the full store page — show all
        const searchableText = (t.name + " " + (t.description || "") + " " + t.category).toLowerCase();
        
        if (query) {
            const terms = query.split(/\s+/);
            if (!terms.every(term => searchableText.includes(term))) return false;
        }
        
        if (activeTags.length > 0) {
            const catTags = activeTags.filter(tag => tag !== 'favorite');
            if (catTags.length > 0 && !catTags.every(tag => searchableText.includes(tag))) return false;
        }
        
        return true;
    });
    
    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / STORE_PER_PAGE));
    if (storeCurrentPage > totalPages) storeCurrentPage = totalPages;
    if (storeCurrentPage < 1) storeCurrentPage = 1;
    
    const startIdx = (storeCurrentPage - 1) * STORE_PER_PAGE;
    const pageItems = filtered.slice(startIdx, startIdx + STORE_PER_PAGE);
    
    if (filtered.length === 0) {
        gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-secondary);">No tools match your criteria.</div>';
    } else {
        pageItems.forEach(tool => {
            gridEl.appendChild(createStoreToolCard(tool));
        });
    }
    
    // Update pagination controls
    const paginationEl = document.getElementById('store-pagination');
    if (paginationEl) {
        if (totalPages <= 1) {
            paginationEl.style.display = 'none';
        } else {
            paginationEl.style.display = 'block';
            const pageContainer = paginationEl.querySelector('div');
            if (typeof window.buildPaginationHTML === 'function') {
                pageContainer.innerHTML = window.buildPaginationHTML(storeCurrentPage, totalPages);
                
                pageContainer.querySelectorAll('.btn-page').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const page = parseInt(e.target.dataset.page);
                        if (!isNaN(page)) {
                            storeCurrentPage = page;
                            renderStoreTools();
                        }
                    });
                });
            }
        }
    }
}


function createStoreToolCard(tool) {
    const card = document.createElement('div');
    card.className = 'tool-card plugin-card';
    card.style.cssText = '--card-accent: var(--accent-purple)';
    
    const plugin = tool.plugin_parent;
    const sizeMb = plugin.size_bytes ? (plugin.size_bytes / 1024 / 1024).toFixed(1) + ' MB' : '';
    
    let btnHtml = `<button class="btn-primary btn-sm" onclick="installPlugin('${plugin.id}', this)">Install</button>`;

    const tColor = 'var(--accent-purple)';
    const bg = 'var(--accent-purple-light)';

    card.innerHTML = `
        <div class="tool-card-icon" style="background: ${bg}; color: ${tColor}">
            ${tool.icon || '📦'}
        </div>
        <div class="tool-card-content" style="flex:1;">
            <div class="tool-card-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 8px;">
                ${tool.name}
            </div>
            <div class="tool-card-desc" style="margin-bottom:8px;">${tool.description || ''}</div>
            <div style="font-size:11px; color:var(--text-tertiary); display:flex; gap:12px; margin-bottom:12px; flex-wrap: wrap;">
                <span>v${plugin.version}</span>
                ${sizeMb ? `<span>${sizeMb}</span>` : ''}
            </div>
            <div class="plugin-actions" style="display:flex; gap:8px;">
                ${btnHtml}
            </div>
        </div>
    `;
    return card;
}

async function installPlugin(pluginId, btn) {
    const originalText = btn ? btn.innerText : '';
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Installing...';
    }
    
    const formData = new FormData();
    formData.append('plugin_id', pluginId);
    
    try {
        const response = await fetch('/api/plugins/install', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            customAlert('Plugin installed successfully!', 'Success', '\u2705').then(() => {
                location.reload();
            });
        } else {
            customAlert('Installation failed: ' + data.error, 'Error', '\u274c');
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    } catch (err) {
        console.error(err);
        customAlert('Failed to install plugin.', 'Error', '\u274c');
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

async function uninstallPlugin(pluginId, btn) {
    const originalText = btn ? btn.innerText : '';
    const ok = await customConfirm('Are you sure you want to uninstall this tool?', 'Uninstall', '\u26a0\ufe0f');
    if (!ok) return;

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Uninstalling...';
    }
    
    try {
        const response = await fetch('/api/plugins/' + pluginId + '/uninstall', {
            method: 'POST'
        });
        const data = await response.json();
        if (data.success) {
            customAlert('Plugin uninstalled successfully!', 'Success', '\u2705').then(() => {
                location.reload();
            });
        } else {
            customAlert('Uninstall failed: ' + data.error, 'Error', '\u274c');
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    } catch (err) {
        console.error(err);
        customAlert('Failed to uninstall plugin.', 'Error', '\u274c');
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

// Attach event listener for store search
document.addEventListener('DOMContentLoaded', () => {
    const storeSearch = document.getElementById('store-search-input');
    if (storeSearch) {
        storeSearch.addEventListener('input', () => { storeCurrentPage = 1; renderStoreTools(); });
    }
});
