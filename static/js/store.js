/**
 * FileForge — Plugin Store Frontend
 */

let isStoreLoading = false;

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
            data.plugins.forEach(plugin => {
                gridEl.appendChild(createPluginCard(plugin));
            });
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

function createPluginCard(plugin) {
    const card = document.createElement('div');
    card.className = 'tool-card plugin-card';
    card.style.cssText = '--card-accent: var(--accent-purple)';
    
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
            ${plugin.icon || '📦'}
        </div>
        <div class="tool-card-content" style="flex:1;">
            <div class="tool-card-title" style="display:flex; justify-content:space-between; align-items:center;">
                ${plugin.name}
                ${plugin.installed && !plugin.update_available ? '<span style="font-size:10px; background:var(--accent-green); color:#fff; padding:2px 6px; border-radius:4px;">Installed</span>' : ''}
            </div>
            <div class="tool-card-desc" style="margin-bottom:8px;">${plugin.description}</div>
            <div style="font-size:12px; color:var(--text-tertiary); display:flex; gap:12px; margin-bottom:12px;">
                <span>v${plugin.version}</span>
                <span>By ${plugin.author}</span>
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
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Installing...';
    
    const formData = new FormData();
    formData.append('plugin_id', pluginId);
    
    try {
        const response = await fetch('/api/plugins/install', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            // Reload store to update UI
            loadStore();
        } else {
            alert('Installation failed: ' + (data.error || 'Unknown error'));
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (err) {
        alert('Installation failed: ' + err.message);
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function uninstallPlugin(pluginId, btn) {
    if (!confirm(`Are you sure you want to uninstall ${pluginId}?`)) return;
    
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Removing...';
    
    try {
        const response = await fetch(`/api/plugins/${pluginId}/uninstall`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            loadStore();
        } else {
            alert('Uninstall failed: ' + (data.error || 'Unknown error'));
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (err) {
        alert('Uninstall failed: ' + err.message);
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('store-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadStore);
    }
});
