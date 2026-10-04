/**
 * FileForge — Dynamic Plugin UI Renderer (Phase 3)
 */

let installedPlugins = {}; // pid -> manifest

async function loadInstalledPlugins() {
    try {
        const response = await fetch('/api/plugins');
        const data = await response.json();
        
        if (data.success) {
            installedPlugins = {};
            window.installedPluginsData = data.plugins; // Needed by app.js renderTools & showToolInfo
            data.plugins.forEach(p => {
                installedPlugins[p.id] = p;
            });
            // Re-render the tool grid — renderTools() in app.js handles
            // merging plugin tools from window.installedPluginsData
            if (typeof renderTools === 'function') {
                renderTools();
            }
        }
    } catch (err) {
        console.error('Failed to load installed plugins:', err);
    }
}

function openPluginTool(pluginId, toolId) {
    const plugin = installedPlugins[pluginId];
    if (!plugin) return;
    
    const tool = plugin.tools.find(t => t.id === toolId);
    if (!tool) return;
    
    // Create the dynamic panel
    const panelId = `panel-plugin-${toolId}`;
    
    // Check if it already exists, if so, just show it
    let panel = document.getElementById(panelId);
    if (!panel) {
        panel = document.createElement('div');
        panel.id = panelId;
        panel.className = 'tool-panel plugin-generated-panel';
        document.querySelector('.main-content').appendChild(panel);
    }
    
    // Render contents
    panel.innerHTML = `
        <div class="tool-panel-header">
            <div class="tool-panel-title">
                <span style="font-size:28px">${tool.icon || '🔌'}</span>
                <h2>${tool.name}</h2>
            </div>
            <button class="tool-panel-back" onclick="hidePanel()">← Back to Tools</button>
        </div>
        
        <form id="form-${toolId}" onsubmit="executePluginTool(event, '${pluginId}', '${toolId}')">
            ${renderToolInputs(tool)}
            ${renderToolOptions(tool)}
            
            <div style="margin-top:24px;">
                <button type="submit" class="btn-primary btn-convert" id="btn-exec-${toolId}">
                    ${tool.mode === 'compress' ? '🗜️ Compress' : '🔄 Execute'}
                </button>
            </div>
            
            <div class="progress-container" id="prog-${toolId}" style="display:none;">
                <div class="progress-bar-wrapper"><div class="progress-bar" style="width:0%; animation:progressStripes 2s linear infinite;"></div></div>
                <div class="progress-text">Processing via ${plugin.name}...</div>
            </div>
            
            <div class="result-area" id="res-${toolId}"></div>
        </form>
    `;
    
    // Show the panel
    document.getElementById('tool-grid-section').style.display = 'none';
    document.querySelector('.mode-toggle').style.display = 'none';
    document.getElementById('ai-section').style.display = 'none';
    document.getElementById('store-section').style.display = 'none';
    
    document.querySelectorAll('.tool-panel').forEach(p => p.style.display = 'none');
    panel.style.display = 'block';
    
    // Bind file upload UI events (from compress.js / convert.js if available, or write custom ones here)
    bindDynamicUploadEvents(panelId);
}

function renderToolInputs(tool) {
    if (!tool.inputs) return '';
    
    if (tool.inputs.type === 'file') {
        const acceptStr = tool.inputs.accept ? tool.inputs.accept.join(',') : '*/*';
        const isMultiple = tool.inputs.multiple ? 'multiple' : '';
        return `
            <div class="upload-zone dynamic-upload-zone">
                <div class="upload-zone-icon">📤</div>
                <div class="upload-zone-text">Drop your file(s) here or click to browse</div>
                <div class="upload-zone-hint">Accepts: ${tool.inputs.accept.join(', ')}</div>
                <input type="file" name="file_upload" accept="${acceptStr}" ${isMultiple} style="display:none" required>
            </div>
            <div class="file-list dynamic-file-list"></div>
        `;
    }
    
    if (tool.inputs.type === 'url') {
        return `
            <div class="option-group" style="margin-bottom: 24px;">
                <label class="option-label">Video/Audio URL</label>
                <input type="url" name="url_input" class="plugin-text-input" placeholder="https://www.youtube.com/watch?v=..." required style="width:100%; padding:12px; border-radius:8px; border:2px solid var(--border-light); background:var(--bg-secondary); color:var(--text-primary); font-size:16px;">
            </div>
        `;
    }
    
    return '';
}

function renderToolOptions(tool) {
    if (!tool.options || tool.options.length === 0) return '';
    
    let html = '<div style="display:flex; gap:24px; margin-top:20px; flex-wrap:wrap; align-items:end;">';
    
    tool.options.forEach(opt => {
        html += '<div class="option-group">';
        html += `<label class="option-label">${opt.label}</label>`;
        
        switch (opt.type) {
            case 'select':
                html += `<select name="opt_${opt.id}" class="option-select">`;
                opt.choices.forEach(c => {
                    const sel = (c.value === opt.default) ? 'selected' : '';
                    html += `<option value="${c.value}" ${sel}>${c.label}</option>`;
                });
                html += `</select>`;
                break;
            case 'slider':
                html += `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <input type="range" name="opt_${opt.id}" min="${opt.min}" max="${opt.max === 'auto' ? 100 : opt.max}" step="${opt.step}" value="${opt.default ? parseInt(opt.default) : opt.min}">
                        <span>${opt.unit || ''}</span>
                    </div>
                `;
                break;
            case 'number':
                html += `<input type="number" name="opt_${opt.id}" class="plugin-text-input" min="${opt.min}" placeholder="${opt.placeholder || ''}" ${opt.required ? 'required' : ''}>`;
                break;
            case 'text':
                html += `<input type="text" name="opt_${opt.id}" class="plugin-text-input" placeholder="${opt.placeholder || ''}" ${opt.required ? 'required' : ''}>`;
                break;
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    return html;
}

function bindDynamicUploadEvents(panelId) {
    const panel = document.getElementById(panelId);
    const uploadZone = panel.querySelector('.dynamic-upload-zone');
    const fileInput = panel.querySelector('input[type="file"]');
    const fileList = panel.querySelector('.dynamic-file-list');
    
    if (!uploadZone || !fileInput) return;
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--accent)';
        uploadZone.style.background = 'rgba(59, 130, 246, 0.05)';
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--border-light)';
        uploadZone.style.background = 'transparent';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--border-light)';
        uploadZone.style.background = 'transparent';
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            updateFileList();
        }
    });
    
    fileInput.addEventListener('change', updateFileList);
    
    function updateFileList() {
        if (fileInput.files.length > 0) {
            let filesHtml = '';
            Array.from(fileInput.files).forEach(f => {
                filesHtml += `
                    <div class="file-item">
                        <span class="file-item-name">${f.name}</span>
                        <span class="file-item-size">${(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                `;
            });
            fileList.innerHTML = filesHtml;
        } else {
            fileList.innerHTML = '';
        }
    }
}

async function executePluginTool(e, pluginId, toolId) {
    e.preventDefault();
    const form = e.target;
    
    // Gather options
    const options = {};
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('opt_')) {
            options[key.replace('opt_', '')] = value;
        }
    }
    
    // Construct execution payload
    const execData = new FormData();
    execData.append('options_json', JSON.stringify(options));
    
    if (form.file_upload && form.file_upload.files.length > 0) {
        execData.append('file', form.file_upload.files[0]);
    } else if (form.url_input && form.url_input.value) {
        execData.append('url', form.url_input.value);
    } else {
        alert("Please provide an input file or URL.");
        return;
    }
    
    const btn = document.getElementById(`btn-exec-${toolId}`);
    const prog = document.getElementById(`prog-${toolId}`);
    const res = document.getElementById(`res-${toolId}`);
    
    btn.disabled = true;
    prog.style.display = 'block';
    res.innerHTML = '';
    
    try {
        const response = await fetch(`/api/plugins/${pluginId}/${toolId}/run`, {
            method: 'POST',
            body: execData
        });
        
        if (!response.ok) {
            let errMsg = 'Execution failed.';
            try {
                const errData = await response.json();
                errMsg = errData.error || errMsg;
            } catch (je) {}
            throw new Error(errMsg);
        }
        
        // It's a file download
        const blob = await response.blob();
        
        // Get headers for stats
        const origSize = response.headers.get('X-Original-Size');
        const compSize = response.headers.get('X-Compressed-Size');
        const reduction = response.headers.get('X-Reduction-Percent');
        
        // Get filename from Content-Disposition
        let filename = 'output_file';
        const cd = response.headers.get('Content-Disposition');
        if (cd) {
            const filenameMatch = cd.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            } else {
                const utf8Match = cd.match(/filename\*=UTF-8''([^;]+)/);
                if (utf8Match) filename = decodeURIComponent(utf8Match[1]);
            }
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        let resultHtml = `
            <div class="result-card" style="margin-top:20px;">
                <div class="result-details" style="flex:1;">
                    <div style="font-weight:600; color:var(--text-primary); margin-bottom:8px;">${filename}</div>
                    <div style="font-size:13px; color:var(--text-secondary); display:flex; gap:16px;">
        `;
        
        if (origSize && compSize) {
            resultHtml += `
                <span><strong>Original:</strong> ${(origSize / 1024).toFixed(1)} KB</span>
                <span><strong>New:</strong> ${(compSize / 1024).toFixed(1)} KB</span>
                <span style="color:var(--accent-green); font-weight:600;">↓ ${reduction}%</span>
            `;
        } else {
            resultHtml += `<span><strong>Size:</strong> ${(blob.size / 1024 / 1024).toFixed(2)} MB</span>`;
        }
        
        resultHtml += `
                    </div>
                </div>
                <a href="${url}" download="${filename}" class="btn-primary" style="text-decoration:none;">Download</a>
            </div>
        `;
        
        res.innerHTML = resultHtml;
        
    } catch (err) {
        res.innerHTML = `
            <div style="margin-top:20px; padding:16px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:12px; color:var(--accent-red);">
                <strong>Error:</strong> ${err.message}
            </div>
        `;
    } finally {
        btn.disabled = false;
        prog.style.display = 'none';
        
        // Reset the bar width
        const bar = prog.querySelector('.progress-bar');
        if (bar) bar.style.width = '100%';
    }
}

// Call on startup
document.addEventListener('DOMContentLoaded', loadInstalledPlugins);
