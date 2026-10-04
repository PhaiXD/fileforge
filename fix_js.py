import codecs
import re

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

bad_showToolInfo_start = "window.showToolInfo = function(toolId, e) {"
bad_showToolInfo_end = "document.body.appendChild(modal);\n}"
idx1 = code.find(bad_showToolInfo_start)
idx2 = code.find(bad_showToolInfo_end) + len(bad_showToolInfo_end)

if idx1 != -1 and idx2 != -1:
    good_showToolInfo = r"""window.showToolInfo = function(toolId, e) {
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
}"""
    code = code[:idx1] + good_showToolInfo + code[idx2:]


# 2. Fix the broken toolCard rendering in renderTools()
bad_render_start = "    grid.innerHTML = mergedTools.map(t => renderCard(t, false)).join('');"
# Actually the bad part was in renderCard definition!
bad_renderCard_start = "    const renderCard = (tool, isStore = false) => {"
bad_renderCard_end = "    };"
idx1 = code.find(bad_renderCard_start)
idx2 = code.find(bad_renderCard_end, idx1) + len(bad_renderCard_end)

if idx1 != -1 and idx2 != -1:
    good_renderCard = r"""    const renderCard = (tool, isStore = false) => {
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
    };"""
    code = code[:idx1] + good_renderCard + code[idx2:]


with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
