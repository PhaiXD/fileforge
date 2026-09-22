/**
 * FileForge — Convert Tool Handlers
 * Handles PDF-to-JPG and Images-to-PDF conversion tools.
 */

/**
 * Initialize PDF to JPG conversion tool.
 */
function initPdfToJpg() {
    const panel = document.getElementById('panel-pdf-to-jpg');
    if (!panel) return;

    const uploadZone = panel.querySelector('.upload-zone');
    const fileInput = panel.querySelector('input[type="file"]');
    const fileList = panel.querySelector('.file-list');
    const pageSelector = panel.querySelector('.page-selector');
    const convertBtn = panel.querySelector('.btn-convert');
    const dpiSelect = panel.querySelector('.dpi-select');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');

    let selectedFile = null;

    // Upload zone events
    setupUploadZone(uploadZone, fileInput, async (file) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Please select a PDF file', 'error');
            return;
        }
        selectedFile = file;
        renderFileList(fileList, [file], () => {
            selectedFile = null;
            renderFileList(fileList, []);
            convertBtn.disabled = true;
            if (pageSelector) {
                pageSelector.style.display = 'none';
                pageSelector.innerHTML = '';
            }
        });
        convertBtn.disabled = false;

        // Fetch page count and show page selector
        if (pageSelector) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const data = await fetchAPI('/api/pdf/page-count', {
                    method: 'POST',
                    body: formData,
                });

                if (data && (data.page_count !== undefined || data.total_pages !== undefined)) {
                    const totalPages = data.page_count !== undefined ? data.page_count : data.total_pages;
                    pageSelector.style.display = 'block';
                    pageSelector.innerHTML = `
                        <div class="option-group" style="margin-top:16px; margin-bottom:0;">
                            <label class="option-label">Page Selection <span class="page-count-display" style="text-transform:none; font-weight:normal; color:var(--text-tertiary); margin-left:8px;">(Total: ${totalPages} pages)</span></label>
                            <input type="text" class="modal-input page-range-input" placeholder="e.g. 1, 3, 5-8 (leave blank for all pages)" style="max-width:320px; margin-bottom:4px;">
                            <div class="page-hint" style="font-size:12px; color:var(--text-tertiary);">Total: ${totalPages} pages. Specify page numbers and/or ranges (e.g. 1, 3, 5-8), or leave blank for all.</div>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('Failed to get page count:', err);
            }
        }
    }, false);

    // Convert button
    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const pageInput = panel.querySelector('.page-range-input');
        const pagesVal = pageInput ? pageInput.value.trim() : '';

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('dpi', dpiSelect?.value || '300');
        formData.append('pages', pagesVal);

        try {
            convertBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);

            const result = await uploadFiles('/api/pdf/to-jpg', formData, (percent) => {
                updateProgress(progressBar, progressText, percent, 'Uploading...');
            });

            setProgressIndeterminate(progressBar, progressText, 'Converting PDF pages...');

            if (result.error) {
                showResult(resultArea, false, result.error);
            } else {
                hideProgress(progressContainer);
                showResult(resultArea, true, 'PDF converted successfully!');
                downloadBlob(result.blob, result.filename);
            }
        } catch (err) {
            showResult(resultArea, false, err.error || 'Conversion failed');
        } finally {
            convertBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}

/**
 * Initialize Images to PDF merge tool.
 */
function initImagesToPdf() {
    const panel = document.getElementById('panel-images-to-pdf');
    if (!panel) return;

    const uploadZone = panel.querySelector('.upload-zone');
    const fileInput = panel.querySelector('input[type="file"]');
    const fileList = panel.querySelector('.file-list');
    const convertBtn = panel.querySelector('.btn-convert');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');

    let selectedFiles = [];

    // Upload zone events (multiple files)
    setupUploadZone(uploadZone, fileInput, (files) => {
        const validExts = ['.jpg', '.jpeg', '.png', '.bmp', '.webp'];
        const validFiles = Array.from(files).filter(f => {
            const ext = '.' + f.name.split('.').pop().toLowerCase();
            return validExts.includes(ext);
        });

        if (validFiles.length === 0) {
            showToast('Please select JPG or PNG images', 'error');
            return;
        }

        selectedFiles = validFiles;
        renderFileList(fileList, validFiles, (index) => {
            selectedFiles.splice(index, 1);
            renderFileList(fileList, selectedFiles);
            convertBtn.disabled = selectedFiles.length === 0;
        });
        convertBtn.disabled = false;
    }, true);

    // Convert button
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        const formData = new FormData();
        selectedFiles.forEach(f => formData.append('files', f));

        try {
            convertBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);

            const result = await uploadFiles('/api/pdf/merge-images', formData, (percent) => {
                updateProgress(progressBar, progressText, percent, 'Uploading images...');
            });

            setProgressIndeterminate(progressBar, progressText, 'Merging into PDF...');

            if (result.error) {
                showResult(resultArea, false, result.error);
            } else {
                hideProgress(progressContainer);
                showResult(resultArea, true, `${selectedFiles.length} images merged into PDF!`);
                downloadBlob(result.blob, result.filename);
            }
        } catch (err) {
            showResult(resultArea, false, err.error || 'Merge failed');
        } finally {
            convertBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}

// --- Helper: Setup upload zone with drag & drop ---
function setupUploadZone(zone, input, onFiles, multiple = false) {
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onFiles(multiple ? files : files[0]);
        }
    });

    input.addEventListener('change', () => {
        if (input.files.length > 0) {
            onFiles(multiple ? input.files : input.files[0]);
        }
    });
}

// --- Helper: Render file list ---
function renderFileList(container, files, onRemove = null) {
    if (!container) return;
    container.innerHTML = '';

    const fileArray = Array.isArray(files) ? files : Array.from(files);
    fileArray.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-item-info">
                <span class="file-item-icon">📄</span>
                <div>
                    <div class="file-item-name">${escapeHtml(file.name)}</div>
                    <div class="file-item-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            ${onRemove ? '<button class="file-item-remove" title="Remove">✕</button>' : ''}
        `;

        if (onRemove) {
            item.querySelector('.file-item-remove')?.addEventListener('click', () => {
                onRemove(index);
            });
        }

        container.appendChild(item);
    });
}

// --- Helper: Progress ---
function showProgress(container, bar, text) {
    if (container) container.classList.add('active');
    if (bar) {
        bar.style.width = '0%';
        bar.classList.remove('indeterminate');
    }
    if (text) text.textContent = 'Starting...';
}

function updateProgress(bar, text, percent, label) {
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = `${label} ${percent}%`;
}

function setProgressIndeterminate(bar, text, label) {
    if (bar) bar.classList.add('indeterminate');
    if (text) text.textContent = label;
}

function hideProgress(container) {
    if (container) container.classList.remove('active');
}

// --- Helper: Result area ---
function showResult(area, success, message) {
    if (!area) return;
    area.className = `result-area active ${success ? '' : 'error'}`;
    area.innerHTML = `
        <div class="result-title">${success ? '✅' : '❌'} ${success ? 'Success' : 'Error'}</div>
        <div class="result-stats">${escapeHtml(message)}</div>
    `;
}

// --- Helper: Escape HTML ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
