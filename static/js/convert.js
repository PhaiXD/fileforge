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
        
        const updateList = () => {
            renderFileList(fileList, selectedFiles, (index) => {
                selectedFiles.splice(index, 1);
                updateList();
                convertBtn.disabled = selectedFiles.length === 0;
            });
        };
        
        updateList();
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
            <div class="file-item-info" style="cursor:pointer; transition:opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1" title="Click to preview">
                <span class="file-item-icon">📄</span>
                <div>
                    <div class="file-item-name">${escapeHtml(file.name)}</div>
                    <div class="file-item-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            ${onRemove ? '<button class="file-item-remove" title="Remove">✕</button>' : ''}
        `;

        item.querySelector('.file-item-info').addEventListener('click', () => {
            openPreviewModal(file);
        });

        if (onRemove) {
            item.querySelector('.file-item-remove')?.addEventListener('click', (e) => {
                e.stopPropagation();
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

/**
 * Initialize PDF Extract tool.
 */
function initPdfExtract() {
    const panel = document.getElementById('panel-pdf-extract');
    if (!panel) return;

    const uploadZone = panel.querySelector('.upload-zone');
    const fileInput = panel.querySelector('input[type="file"]');
    const fileList = panel.querySelector('.file-list');
    const pageSelector = panel.querySelector('.page-selector');
    const convertBtn = panel.querySelector('.btn-convert');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');

    let selectedFile = null;

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
                            <label class="option-label">Pages to Extract <span class="page-count-display" style="text-transform:none; font-weight:normal; color:var(--text-tertiary); margin-left:8px;">(Total: ${totalPages} pages)</span></label>
                            <input type="text" class="modal-input page-range-input" placeholder="e.g. 1, 3, 5-8 (leave blank for all pages)" style="max-width:320px; margin-bottom:4px;">
                            <div class="page-hint" style="font-size:12px; color:var(--text-tertiary);">Total: ${totalPages} pages. Specify page numbers and/or ranges (e.g. 1, 3, 5-8).</div>
                        </div>
                    `;
                }
            } catch (err) {
                console.error('Failed to get page count:', err);
            }
        }
    }, false);

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const pageInput = panel.querySelector('.page-range-input');
        const pagesVal = pageInput ? pageInput.value.trim() : '';

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('pages', pagesVal);

        try {
            convertBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);

            const result = await uploadFiles('/api/pdf/extract', formData, (percent) => {
                updateProgress(progressBar, progressText, percent, 'Uploading...');
            });

            setProgressIndeterminate(progressBar, progressText, 'Extracting PDF pages...');

            if (result.error) {
                showResult(resultArea, false, result.error);
            } else {
                hideProgress(progressContainer);
                showResult(resultArea, true, 'PDF pages extracted successfully!');
                downloadBlob(result.blob, result.filename);
            }
        } catch (err) {
            showResult(resultArea, false, err.error || 'Extraction failed');
        } finally {
            convertBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}

function initHeicConvert() {
    _initHeicPanel('panel-heic-jpg');
    _initHeicPanel('panel-heic-png');
}

function _initHeicPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const fileInput = panel.querySelector('input[type="file"]');
    const uploadZone = panel.querySelector('.upload-zone');
    const fileListContainer = panel.querySelector('.file-list');
    const convertBtn = panel.querySelector('.btn-convert');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');
    const formatSelect = panel.querySelector('.format-select');

    let currentFiles = [];

    setupUploadZone(uploadZone, fileInput, (files) => {
        currentFiles = [...currentFiles, ...Array.from(files)];
        
        const updateList = () => {
            renderFileList(fileListContainer, currentFiles, (index) => {
                currentFiles.splice(index, 1);
                updateList();
                convertBtn.disabled = currentFiles.length === 0;
            });
        };
        
        updateList();
        convertBtn.disabled = currentFiles.length === 0;
        hideResult(resultArea);
    }, true);

    convertBtn.addEventListener('click', async () => {
        if (currentFiles.length === 0) return;

        const formData = new FormData();
        currentFiles.forEach(file => formData.append('file', file));
        
        formData.append('target_format', formatSelect.value);

        try {
            convertBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);

            const total = currentFiles.length;
            
            if (total === 1) {
                const singleForm = new FormData();
                singleForm.append('file', currentFiles[0]);
                singleForm.append('target_format', formatSelect.value);
                
                const result = await uploadFiles('/api/image/convert', singleForm, (percent) => {
                    updateProgress(progressBar, progressText, percent, 'Converting...');
                });
                
                if (result.error) throw new Error(result.error);
                downloadBlob(result.blob, result.filename);
            } else {
                const zip = new JSZip();
                let hasError = false;
                
                for (let i = 0; i < total; i++) {
                    const pct = Math.round((i / total) * 100);
                    updateProgress(progressBar, progressText, pct, `Converting ${i+1}/${total}...`);
                    
                    const singleForm = new FormData();
                    singleForm.append('file', currentFiles[i]);
                    singleForm.append('target_format', formatSelect.value);
                    
                    const result = await uploadFiles('/api/image/convert', singleForm);
                    if (result.error) {
                        hasError = true;
                        continue;
                    }
                    zip.file(result.filename, result.blob);
                }
                
                updateProgress(progressBar, progressText, 100, 'Zipping files...');
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                downloadBlob(zipBlob, `converted_images.zip`);
                if (hasError) throw new Error("Some files failed to convert.");
            }

            hideProgress(progressContainer);
            showResult(resultArea, true, 'Converted successfully!');
        } catch (err) {
            showResult(resultArea, false, err.message || 'Conversion failed');
        } finally {
            convertBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}

// --- Helper: File Preview ---
function openPreviewModal(file) {
    const modal = document.getElementById('modal-preview');
    if (!modal) return;
    
    const title = modal.querySelector('#preview-title');
    const iframe = modal.querySelector('#preview-iframe');
    const img = modal.querySelector('#preview-image');
    const unsupported = modal.querySelector('#preview-unsupported');
    const cancelBtn = modal.querySelector('.btn-cancel');
    
    title.textContent = file.name || 'Preview';
    iframe.style.display = 'none';
    img.style.display = 'none';
    unsupported.style.display = 'none';
    
    if (iframe.src) { URL.revokeObjectURL(iframe.src); iframe.src = ''; }
    if (img.src) { URL.revokeObjectURL(img.src); img.src = ''; }

    const fileType = file.type || '';
    const nameLower = (file.name || '').toLowerCase();
    
    let objectUrl = null;

    if (fileType === 'application/pdf' || nameLower.endsWith('.pdf')) {
        objectUrl = URL.createObjectURL(file);
        iframe.src = objectUrl;
        iframe.style.display = 'block';
    } else if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/.test(nameLower)) {
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        img.style.display = 'block';
    } else {
        unsupported.style.display = 'block';
    }
    
    modal.classList.add('active');
    
    const closeModal = () => {
        modal.classList.remove('active');
        if (objectUrl) {
            setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
        }
        iframe.src = '';
        img.src = '';
    };
    
    cancelBtn.onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}
