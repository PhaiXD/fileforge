# -*- coding: utf-8 -*-
"""Script to fix the store page layout and unbundle store tools."""
import codecs, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ================================================================
# 1. Update index.html to move store inside layout-container
# ================================================================
with codecs.open('templates/index.html', 'r', 'utf-8') as f:
    html = f.read()

# Find the store-page-section
store_section_start = '        <!-- FULL STORE PAGE SECTION -->\n        <section id="store-page-section" style="display:none;">'
store_section_end = '            </div>\n        </section>\n\n        <!-- ==================== TOOL PANELS ==================== -->'

if store_section_start in html and store_section_end in html:
    idx_s = html.find(store_section_start)
    idx_e = html.find(store_section_end, idx_s) + len(store_section_end) - len('\n\n        <!-- ==================== TOOL PANELS ==================== -->')
    
    store_html = html[idx_s:idx_e]
    # Modify the inline style to be flex:1
    store_html = store_html.replace('<section id="store-page-section" style="display:none;">', '<section id="store-page-section" style="display:none; flex:1; min-width:0;">')
    
    # Remove it from its original location
    html = html[:idx_s] + html[idx_e:]
    
    # Insert it inside layout-container, after tool-grid-section
    target_insert = '        </section>\n        </div>\n\n        <!-- FULL STORE PAGE SECTION -->'
    if '        </section>\n        </div>' in html:
        insert_idx = html.find('        </section>\n        </div>') + len('        </section>\n')
        html = html[:insert_idx] + store_html + '\n' + html[insert_idx:]
    
    with codecs.open('templates/index.html', 'w', 'utf-8') as f:
        f.write(html)
    print("Fixed layout in index.html")
else:
    print("Could not find store section to move!")

# ================================================================
# 2. Update store.js to unbundle tools
# ================================================================
with codecs.open('static/js/store.js', 'r', 'utf-8') as f:
    store_js = f.read()

new_store_js = """/**
 * FileForge — Plugin Store Frontend
 */

let isStoreLoading = false;
let storeToolsList = [];

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
                if (plugin.tools && plugin.tools.length > 0) {
                    plugin.tools.forEach(tool => {
                        storeToolsList.push({
                            ...tool,
                            plugin_parent: plugin,
                            plugin_id: plugin.id
                        });
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
    
    // Also use the active sidebar categories for the store!
    const activeTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value.toLowerCase());
    
    const filtered = storeToolsList.filter(t => {
        const searchableText = (t.name + " " + (t.description || "") + " " + t.category).toLowerCase();
        
        if (query) {
            const terms = query.split(/\\s+/);
            if (!terms.every(term => searchableText.includes(term))) return false;
        }
        
        if (activeTags.length > 0) {
            if (!activeTags.every(tag => searchableText.includes(tag))) return false;
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        gridEl.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--text-secondary);">No tools match your criteria.</div>';
        return;
    }
    
    filtered.forEach(tool => {
        gridEl.appendChild(createStoreToolCard(tool));
    });
}

function createStoreToolCard(tool) {
    const card = document.createElement('div');
    card.className = 'tool-card plugin-card';
    card.style.cssText = '--card-accent: var(--accent-purple)';
    
    const plugin = tool.plugin_parent;
    const sizeMb = plugin.size_bytes ? (plugin.size_bytes / 1024 / 1024).toFixed(1) + ' MB' : '';
    
    let btnHtml = '';
    if (plugin.installed) {
        if (plugin.update_available) {
            btnHtml = `<button class="btn-primary btn-sm" onclick="installPlugin('${plugin.id}', this)" style="background:var(--accent-yellow); color:#000;">Update (v${plugin.version})</button>`;
        } else {
            btnHtml = `<button class="btn-secondary btn-sm" onclick="uninstallPlugin('${plugin.id}', this)" style="color:var(--accent-red); border-color:var(--accent-red);">Uninstall</button>`;
        }
    } else {
        btnHtml = `<button class="btn-primary btn-sm" onclick="installPlugin('${plugin.id}', this)">Install</button>`;
    }

    card.innerHTML = `
        <div class="tool-card-icon" style="background:var(--accent-purple-light); color:var(--accent-purple)">
            ${tool.icon || '📦'}
        </div>
        <div class="tool-card-content" style="flex:1;">
            <div class="tool-card-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 8px;">
                ${tool.name}
                ${plugin.installed && !plugin.update_available ? '<span style="font-size:10px; background:var(--accent-green); color:#fff; padding:2px 6px; border-radius:4px;">Installed</span>' : ''}
            </div>
            <div class="tool-card-desc" style="margin-bottom:8px;">${tool.description || ''}</div>
            <div style="font-size:11px; color:var(--text-tertiary); display:flex; gap:12px; margin-bottom:12px; flex-wrap: wrap;">
                <span>Pack: <strong>${plugin.name}</strong></span>
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
            customAlert('Plugin installed successfully!', 'Success', '\\u2705').then(() => {
                location.reload();
            });
        } else {
            customAlert('Installation failed: ' + data.error, 'Error', '\\u274c');
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    } catch (err) {
        console.error(err);
        customAlert('Failed to install plugin.', 'Error', '\\u274c');
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

async function uninstallPlugin(pluginId, btn) {
    const originalText = btn ? btn.innerText : '';
    const ok = await customConfirm('Are you sure you want to uninstall this plugin pack?', 'Uninstall', '\\u26a0\\ufe0f');
    if (!ok) return;

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Uninstalling...';
    }
    
    const formData = new FormData();
    formData.append('plugin_id', pluginId);
    
    try {
        const response = await fetch('/api/plugins/uninstall', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            customAlert('Plugin uninstalled successfully!', 'Success', '\\u2705').then(() => {
                location.reload();
            });
        } else {
            customAlert('Uninstall failed: ' + data.error, 'Error', '\\u274c');
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    } catch (err) {
        console.error(err);
        customAlert('Failed to uninstall plugin.', 'Error', '\\u274c');
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
        storeSearch.addEventListener('input', renderStoreTools);
    }
});
"""

with codecs.open('static/js/store.js', 'w', 'utf-8') as f:
    f.write(new_store_js)
print("Fixed store.js to unbundle tools!")

# ================================================================
# 3. Ensure app.js re-renders store tools when category filter changes
# ================================================================
with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

if "if (typeof renderStoreTools === 'function') renderStoreTools();" not in app_js:
    # Find renderTools and make sure it also calls renderStoreTools
    app_js = app_js.replace(
        "function renderTools() {",
        "function renderTools() {\n    if (typeof renderStoreTools === 'function') renderStoreTools();"
    )
    with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
        f.write(app_js)
    print("Updated app.js to hook category filters to store tools.")
