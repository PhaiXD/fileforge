/**
 * FileForge — Smart Convert Module
 * Drag-and-drop file conversion with intelligent format detection.
 */

(function () {
    'use strict';

    // ─── Format Mapping ────────────────────────────────────────
    // Maps source extension → { category, targets[] }
    const FORMAT_MAP = {
        // Images
        'jpg':  { category: 'Image',    targets: ['png', 'webp', 'pdf', 'ico'] },
        'jpeg': { category: 'Image',    targets: ['png', 'webp', 'pdf', 'ico'] },
        'png':  { category: 'Image',    targets: ['jpg', 'webp', 'pdf', 'ico'] },
        'webp': { category: 'Image',    targets: ['jpg', 'png'] },
        'heic': { category: 'Image',    targets: ['jpg', 'png', 'webp'] },
        'heif': { category: 'Image',    targets: ['jpg', 'png', 'webp'] },
        'svg':  { category: 'Image',    targets: ['jpg', 'png'] },
        'bmp':  { category: 'Image',    targets: ['jpg', 'png', 'webp'] },
        // Video
        'mp4':  { category: 'Video',    targets: ['mp3', 'm4a', 'gif', 'ogg'] },
        'mov':  { category: 'Video',    targets: ['mp4', 'mp3', 'm4a', 'gif'] },
        'webm': { category: 'Video',    targets: ['mp4', 'mp3'] },
        'mkv':  { category: 'Video',    targets: ['mp4'] },
        'avi':  { category: 'Video',    targets: ['mp4'] },
        // Audio
        'wav':  { category: 'Audio',    targets: ['mp3', 'ogg', 'flac'] },
        'mp3':  { category: 'Audio',    targets: ['ogg', 'flac'] },
        'm4a':  { category: 'Audio',    targets: ['mp3', 'ogg', 'flac'] },
        'flac': { category: 'Audio',    targets: ['mp3', 'ogg'] },
        'ogg':  { category: 'Audio',    targets: ['mp3', 'flac'] },
        'aac':  { category: 'Audio',    targets: ['mp3', 'ogg', 'flac'] },
        // Documents
        'pdf':  { category: 'Document', targets: ['jpg', 'png', 'docx'] },
        'doc':  { category: 'Document', targets: ['pdf'] },
        'docx': { category: 'Document', targets: ['pdf'] },
        'xls':  { category: 'Document', targets: ['pdf'] },
        'xlsx': { category: 'Document', targets: ['pdf'] },
    };

    // Target format display info
    const FORMAT_INFO = {
        'jpg':  { label: 'JPG',  icon: '🖼️', group: 'Image' },
        'png':  { label: 'PNG',  icon: '🖼️', group: 'Image' },
        'webp': { label: 'WEBP', icon: '🌐', group: 'Image' },
        'ico':  { label: 'ICO',  icon: '🔷', group: 'Image' },
        'pdf':  { label: 'PDF',  icon: '📄', group: 'Document' },
        'docx': { label: 'DOCX', icon: '📝', group: 'Document' },
        'mp4':  { label: 'MP4',  icon: '🎬', group: 'Video' },
        'gif':  { label: 'GIF',  icon: '🎞️', group: 'Image' },
        'mp3':  { label: 'MP3',  icon: '🎵', group: 'Audio' },
        'm4a':  { label: 'M4A',  icon: '🎵', group: 'Audio' },
        'ogg':  { label: 'OGG',  icon: '🎵', group: 'Audio' },
        'flac': { label: 'FLAC', icon: '🎵', group: 'Audio' },
    };

    // Source extension → icon
    function getFileIcon(ext) {
        const map = FORMAT_MAP[ext];
        if (!map) return '📎';
        switch (map.category) {
            case 'Image':    return '🖼️';
            case 'Video':    return '🎬';
            case 'Audio':    return '🎵';
            case 'Document': return '📄';
            default:         return '📎';
        }
    }

    function getFileCategory(ext) {
        return FORMAT_MAP[ext]?.category || 'Unknown';
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function getExtension(filename) {
        return (filename.split('.').pop() || '').toLowerCase();
    }

    // ─── State ─────────────────────────────────────────────────
    let files = []; // Array of { id, file, ext, selectedTarget, status }
    let fileIdCounter = 0;
    let openDropdownId = null;

    // ─── Render ────────────────────────────────────────────────
    function render() {
        const box = document.getElementById('smart-convert-box');
        if (!box) return;

        if (files.length === 0) {
            renderEmpty(box);
        } else {
            renderFileList(box);
        }
    }

    function renderEmpty(box) {
        let actionWord = 'convert';
        if (window.currentMode === 'compress') actionWord = 'compress';
        if (window.currentMode === 'ai') actionWord = 'summarize';

        box.innerHTML = `
            <div class="sc-empty">
                <div class="sc-upload-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                </div>
                <h3 class="sc-title">Select your file to ${actionWord}</h3>
                <p class="sc-subtitle">or drop your file here.</p>
                <button class="sc-select-btn" id="sc-select-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Select File
                </button>
            </div>
        `;
        box.querySelector('#sc-select-btn').addEventListener('click', openFilePicker);
    }

    function renderFileList(box) {
        const itemsHtml = files.map(f => {
            const extUpper = f.ext.toUpperCase();
            const catColor = getCategoryColor(f.ext);
            const targetInfo = f.selectedTarget ? FORMAT_INFO[f.selectedTarget] : null;
            const targetLabel = targetInfo ? targetInfo.label : 'Select Format';
            const targetBtnClass = f.selectedTarget ? 'sc-format-selected' : '';

            let statusHtml = '';
            let actionLabel = 'Convert';
            if (window.currentMode === 'compress') actionLabel = 'Compress';
            if (window.currentMode === 'ai') actionLabel = 'Summarize';

            if (f.status === 'converting') {
                statusHtml = '<div class="sc-spinner"></div>';
            } else if (f.status === 'done') {
                statusHtml = '<span class="sc-done">✅</span>';
            } else if (f.status === 'error') {
                statusHtml = '<span class="sc-error-badge">❌</span>';
            } else {
                statusHtml = `<button class="sc-convert-btn" data-id="${f.id}" title="${actionLabel} this file">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    ${actionLabel}
                </button>`;
            }

            let formatUI = '';
            if (window.currentMode === 'compress') {
                formatUI = `<div class="sc-quality-wrap" style="display:inline-flex; align-items:center; gap:8px;">
                    <span style="font-size:12px; color:var(--text-secondary);">Quality:</span>
                    <input type="range" class="sc-quality-slider" data-id="${f.id}" min="10" max="100" value="${f.compressionQuality}" style="width:80px; accent-color:var(--accent);">
                    <span class="sc-quality-label" id="sc-quality-lbl-${f.id}" style="font-size:12px; min-width:30px; color:var(--text-primary); font-weight:600;">${f.compressionQuality}%</span>
                </div>`;
            } else if (window.currentMode === 'ai') {
                formatUI = `<span class="sc-ai-badge" style="font-size:12px; font-weight:600; padding:4px 8px; border-radius:12px; background:var(--accent-purple)15; color:var(--accent-purple);">✨ AI Summarize</span>`;
            } else {
                formatUI = `<button class="sc-format-btn ${targetBtnClass}" data-id="${f.id}">${targetLabel} ▾</button>`;
            }

            return `
                <div class="sc-file-item" data-id="${f.id}">
                    <div class="sc-file-icon">${getFileIcon(f.ext)}</div>
                    <div class="sc-file-info">
                        <div class="sc-file-name">${escapeHtml(f.file.name)}</div>
                        <div class="sc-file-meta">${formatFileSize(f.file.size)} · ${getFileCategory(f.ext)} File</div>
                    </div>
                    <div class="sc-file-actions">
                        ${statusHtml}
                        <span class="sc-format-badge" style="background: ${catColor}22; color: ${catColor}; border: 1px solid ${catColor}44;">
                            ${extUpper}
                        </span>
                        <span class="sc-arrow">→</span>
                        ${formatUI}
                        <button class="sc-remove-btn" data-id="${f.id}" title="Remove">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        let allAction = 'Convert All';
        if (window.currentMode === 'compress') allAction = 'Compress All';
        if (window.currentMode === 'ai') allAction = 'Summarize All';

        const allSelected = (window.currentMode === 'compress' || window.currentMode === 'ai') ? true : files.every(f => f.selectedTarget);
        const anyConverting = files.some(f => f.status === 'converting');
        const convertAllDisabled = !allSelected || anyConverting ? 'disabled' : '';
        const pendingCount = files.filter(f => (f.selectedTarget || window.currentMode !== 'convert') && f.status !== 'done').length;

        box.innerHTML = `
            <div class="sc-file-list">
                ${itemsHtml}
            </div>
            <div class="sc-bottom-bar">
                <button class="sc-add-more-btn" id="sc-add-more-btn">+ Add more files</button>
                <button class="sc-convert-all-btn" id="sc-convert-all-btn" ${convertAllDisabled}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    ${allAction} (${pendingCount})
                </button>
            </div>
        `;

        // Bind events
        box.querySelector('#sc-add-more-btn').addEventListener('click', openFilePicker);

        box.querySelector('#sc-convert-all-btn')?.addEventListener('click', convertAll);

        box.querySelectorAll('.sc-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                files = files.filter(f => f.id !== id);
                if (files.length === 0) openDropdownId = null;
                render();
            });
        });

        box.querySelectorAll('.sc-convert-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                convertSingle(id);
            });
        });

        box.querySelectorAll('.sc-format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                toggleFormatDropdown(id, btn);
            });
        });

        box.querySelectorAll('.sc-quality-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const id = parseInt(slider.dataset.id);
                const fileItem = files.find(f => f.id === id);
                if (fileItem) {
                    fileItem.compressionQuality = parseInt(e.target.value);
                    const lbl = document.getElementById('sc-quality-lbl-' + id);
                    if (lbl) lbl.textContent = fileItem.compressionQuality + '%';
                }
            });
        });
    }

    function getCategoryColor(ext) {
        const cat = getFileCategory(ext);
        switch (cat) {
            case 'Image':    return '#30d158';
            case 'Video':    return '#ff453a';
            case 'Audio':    return '#0a84ff';
            case 'Document': return '#ff9f0a';
            default:         return '#8e8e93';
        }
    }

    // ─── Format Dropdown ───────────────────────────────────────
    function toggleFormatDropdown(fileId, anchorBtn) {
        // Close existing
        closeDropdown();

        const fileItem = files.find(f => f.id === fileId);
        if (!fileItem) return;

        const mapping = FORMAT_MAP[fileItem.ext];
        if (!mapping || mapping.targets.length === 0) return;

        openDropdownId = fileId;

        // Group targets by category
        const groups = {};
        mapping.targets.forEach(t => {
            const info = FORMAT_INFO[t];
            if (!info) return;
            if (!groups[info.group]) groups[info.group] = [];
            groups[info.group].push({ ext: t, ...info });
        });

        let dropdownHtml = '<div class="sc-dropdown" id="sc-dropdown">';

        for (const [groupName, formats] of Object.entries(groups)) {
            dropdownHtml += `<div class="sc-dropdown-group">`;
            dropdownHtml += `<div class="sc-dropdown-group-title">${groupName}</div>`;
            dropdownHtml += `<div class="sc-dropdown-formats">`;
            formats.forEach(fmt => {
                const isSelected = fileItem.selectedTarget === fmt.ext;
                dropdownHtml += `
                    <button class="sc-dropdown-item ${isSelected ? 'selected' : ''}" data-format="${fmt.ext}">
                        ${fmt.label}
                    </button>
                `;
            });
            dropdownHtml += `</div></div>`;
        }

        dropdownHtml += '</div>';

        // Position dropdown
        const rect = anchorBtn.getBoundingClientRect();
        const dropdown = document.createElement('div');
        dropdown.id = 'sc-dropdown-wrapper';
        dropdown.className = 'sc-dropdown-wrapper';
        dropdown.innerHTML = dropdownHtml;
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 4) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.zIndex = '9999';

        document.body.appendChild(dropdown);

        // Ensure dropdown is within viewport
        requestAnimationFrame(() => {
            const ddEl = dropdown.querySelector('.sc-dropdown');
            if (ddEl) {
                const ddRect = ddEl.getBoundingClientRect();
                if (ddRect.right > window.innerWidth) {
                    dropdown.style.left = (window.innerWidth - ddRect.width - 12) + 'px';
                }
                if (ddRect.bottom > window.innerHeight) {
                    dropdown.style.top = (rect.top - ddRect.height - 4) + 'px';
                }
            }
        });

        // Bind format selection
        dropdown.querySelectorAll('.sc-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                fileItem.selectedTarget = item.dataset.format;
                closeDropdown();
                render();
            });
        });

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 10);
    }

    function handleOutsideClick(e) {
        const wrapper = document.getElementById('sc-dropdown-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            closeDropdown();
        }
    }

    function closeDropdown() {
        const el = document.getElementById('sc-dropdown-wrapper');
        if (el) el.remove();
        openDropdownId = null;
        document.removeEventListener('click', handleOutsideClick);
    }

    // ─── File Picker & Drop ────────────────────────────────────
    function openFilePicker() {
        const input = document.getElementById('sc-file-input');
        if (input) {
            input.value = '';
            input.click();
        }
    }

    function handleFiles(fileList) {
        for (const file of fileList) {
            const ext = getExtension(file.name);
            
            if (window.currentMode === 'compress') {
                if (!['jpg','jpeg','png','webp','heic','heif','pdf'].includes(ext)) {
                    showToast(`"${file.name}" — unsupported for compression`, 'warning');
                    continue;
                }
            } else if (window.currentMode === 'ai') {
                if (ext !== 'pdf') {
                    showToast(`"${file.name}" — AI currently supports PDF only`, 'warning');
                    continue;
                }
            } else {
                if (!FORMAT_MAP[ext]) {
                    showToast(`"${file.name}" — unsupported format`, 'warning');
                    continue;
                }
            }

            files.push({
                id: fileIdCounter++,
                file: file,
                ext: ext,
                selectedTarget: (window.currentMode === 'compress' || window.currentMode === 'ai') ? 'auto' : null,
                compressionQuality: 80, // Default quality for compress
                status: null,
            });
        }
        render();
    }

    // ─── Convert Logic ─────────────────────────────────────────
    async function convertSingle(id) {
        const item = files.find(f => f.id === id);
        if (!item || (!item.selectedTarget && window.currentMode === 'convert') || item.status === 'converting') return;

        item.status = 'converting';
        render();

        try {
            if (window.currentMode === 'ai') {
                const result = await callConvertAPI(item.file, item.ext, item.selectedTarget, item.compressionQuality);
                if (window.customAlert) {
                    window.customAlert(`<div style="text-align:left; max-height:400px; overflow-y:auto; white-space:pre-wrap; font-size:14px; line-height:1.6;">${result.summary}</div>`, 'AI Summary for ' + item.file.name, '✨');
                } else {
                    alert('Summary:\n' + result.summary);
                }
                item.status = 'done';
            } else {
                const blob = await callConvertAPI(item.file, item.ext, item.selectedTarget, item.compressionQuality);
                let outName = item.file.name;
                if (window.currentMode === 'compress') outName = item.file.name.replace(/\.[^/.]+$/, "") + "-compressed." + item.ext;
                else outName = replaceExtension(item.file.name, item.selectedTarget);
                
                downloadBlob(blob, outName);
                item.status = 'done';
            }
        } catch (err) {
            console.error('Action error:', err);
            item.status = 'error';
            showToast(`Error handling ${item.file.name}: ${err.message}`, 'error');
        }
        render();
    }

    async function convertAll() {
        const toConvert = files.filter(f => f.selectedTarget && f.status !== 'done' && f.status !== 'converting');
        for (const item of toConvert) {
            await convertSingle(item.id);
        }
    }

    async function callConvertAPI(file, sourceExt, targetExt, quality) {
        const formData = new FormData();
        formData.append('file', file);

        let url = '';

        if (window.currentMode === 'ai') {
            url = '/api/ai/summarize-pdf';
            const resp = await fetch(url, { method: 'POST', body: formData });
            if (!resp.ok) {
                const errJson = await resp.json().catch(()=>({}));
                throw new Error(errJson.detail || resp.statusText);
            }
            return await resp.json();
        }

        if (window.currentMode === 'compress') {
            if (['jpg','jpeg','png','webp','heic','heif'].includes(sourceExt)) {
                url = '/api/image/compress';
            } else if (sourceExt === 'pdf') {
                url = '/api/pdf/compress';
            }
            formData.append('quality', quality || 80);
        } else {
            const srcCat = getFileCategory(sourceExt);
            const tgtInfo = FORMAT_INFO[targetExt];

            // Route to the correct API
            if (srcCat === 'Image' && targetExt === 'pdf') {
                // Image → PDF
                url = '/api/image/convert';
                formData.append('target_format', 'pdf');
            } else if (srcCat === 'Image' && ['jpg', 'png', 'webp', 'ico'].includes(targetExt)) {
                url = '/api/image/convert';
                formData.append('target_format', targetExt);
            } else if (srcCat === 'Video' || srcCat === 'Audio') {
                url = '/api/media/convert';
                formData.append('target_format', targetExt);
            } else if (sourceExt === 'pdf' && ['jpg', 'jpeg', 'png'].includes(targetExt)) {
                url = '/api/pdf/to-image';
                formData.append('target_format', targetExt === 'jpg' ? 'jpeg' : targetExt);
            } else if (sourceExt === 'pdf' && targetExt === 'docx') {
                url = '/api/pdf/to-word';
            } else if (['doc', 'docx'].includes(sourceExt) && targetExt === 'pdf') {
                url = '/api/pdf/word-to-pdf';
            } else if (['xls', 'xlsx'].includes(sourceExt) && targetExt === 'pdf') {
                url = '/api/pdf/excel-to-pdf';
            } else {
                throw new Error(`Conversion ${sourceExt} → ${targetExt} not supported`);
            }
        }

        const resp = await fetch(url, { method: 'POST', body: formData });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(errText || `Server error ${resp.status}`);
        }

        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const json = await resp.json();
            if (json.error) throw new Error(json.error);
            throw new Error('Unexpected JSON response');
        }

        return await resp.blob();
    }

    function replaceExtension(filename, newExt) {
        const base = filename.replace(/\.[^.]+$/, '');
        return `${base}.${newExt}`;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function showToast(msg, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            console.warn('[Toast]', type, msg);
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── Init ──────────────────────────────────────────────────
    function init() {
        const box = document.getElementById('smart-convert-box');
        if (!box) return;

        // Drag & drop
        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            box.classList.add('drag-over');
        });

        box.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            box.classList.add('drag-over');
        });

        box.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only remove if leaving the box itself
            if (!box.contains(e.relatedTarget)) {
                box.classList.remove('drag-over');
            }
        });

        box.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            box.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFiles(e.dataTransfer.files);
            }
        });

        // File input
        const fileInput = document.getElementById('sc-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    handleFiles(e.target.files);
                }
            });
        }

        render();
    }

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
