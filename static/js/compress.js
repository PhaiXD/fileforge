/**
 * FileForge — Compress Tool Handlers
 * Handles PDF and Image compression tools.
 */

/**
 * Setup linked Target Size and Compression Percentage UI
 */
function setupCompressControls(panel, file) {
    const controls = panel.querySelector('.compress-controls');
    if (!controls) return;
    
    const slider = controls.querySelector('.target-size-slider');
    const sizeDisplay = controls.querySelector('.target-size-display');
    const percentDisplay = controls.querySelector('.compression-percent-display');
    const hiddenInput = controls.querySelector('.target-size-input');
    
    if (!file) {
        controls.style.opacity = '0.5';
        controls.style.pointerEvents = 'none';
        sizeDisplay.textContent = '--';
        percentDisplay.textContent = '--';
        return;
    }
    
    const origKb = Math.max(1, Math.ceil(file.size / 1024));
    controls.style.opacity = '1';
    controls.style.pointerEvents = 'auto';
    
    slider.max = origKb;
    slider.min = origKb > 10 ? 10 : 1;
    slider.step = origKb > 1000 ? 10 : 1;
    slider.value = Math.max(slider.min, Math.floor(origKb * 0.5));
    
    function updateDisplay() {
        const val = parseInt(slider.value);
        sizeDisplay.textContent = formatFileSize(val * 1024);
        
        let percent = 100 - Math.round((val / origKb) * 100);
        if (percent < 0) percent = 0;
        if (percent > 99 && val > 0) percent = 99; // Cap at 99% if not 0 bytes
        
        percentDisplay.textContent = percent + '%';
        hiddenInput.value = val;
    }
    
    slider.removeEventListener('input', slider._updateHandler);
    slider._updateHandler = updateDisplay;
    slider.addEventListener('input', updateDisplay);
    
    updateDisplay();
}

/**
 * Initialize PDF Compressor tool.
 */
function initPdfCompressor() {
    const panel = document.getElementById('panel-pdf-compress');
    if (!panel) return;

    const uploadZone = panel.querySelector('.upload-zone');
    const fileInput = panel.querySelector('input[type="file"]');
    const fileList = panel.querySelector('.file-list');
    const compressBtn = panel.querySelector('.btn-convert');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');
    const targetSizeInput = panel.querySelector('.target-size-input');

    let selectedFile = null;

    setupUploadZone(uploadZone, fileInput, (file) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Please select a PDF file', 'error');
            return;
        }
        selectedFile = file;
        setupCompressControls(panel, file);
        
        renderFileList(fileList, [file], () => {
            selectedFile = null;
            setupCompressControls(panel, null);
            renderFileList(fileList, []);
            compressBtn.disabled = true;
        });
        compressBtn.disabled = false;
    }, false);

    compressBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const targetSize = targetSizeInput?.value;
        if (targetSize && parseInt(targetSize) > 0) {
            formData.append('target_size_kb', targetSize);
        }

        try {
            compressBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);

            const result = await uploadFiles('/api/pdf/compress', formData, (percent) => {
                updateProgress(progressBar, progressText, percent, 'Uploading...');
            });

            setProgressIndeterminate(progressBar, progressText, 'Compressing PDF...');

            if (result.error) {
                showResult(resultArea, false, result.error);
            } else {
                hideProgress(progressContainer);
                const origSize = result.headers['x-original-size'];
                const compSize = result.headers['x-compressed-size'];
                const reduction = result.headers['x-reduction-percent'];

                let msg = 'PDF compressed successfully!';
                if (origSize && compSize) {
                    msg = `Compressed: ${formatFileSize(parseInt(origSize))} → ${formatFileSize(parseInt(compSize))} (${reduction}% reduction)`;
                }
                showResult(resultArea, true, msg);
                downloadBlob(result.blob, result.filename);
            }
        } catch (err) {
            showResult(resultArea, false, err.error || 'Compression failed');
        } finally {
            compressBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}

/**
 * Initialize Image Compressor tool.
 */
function initImageCompressor() {
    const panel = document.getElementById('panel-image-compress');
    if (!panel) return;

    const uploadZone = panel.querySelector('.upload-zone');
    const fileInput = panel.querySelector('input[type="file"]');
    const fileList = panel.querySelector('.file-list');
    const compressBtn = panel.querySelector('.btn-convert');
    const compressRange = panel.querySelector('.compress-range');
    const compressValue = panel.querySelector('.compress-value');
    const maxWidthInput = panel.querySelector('.max-width-input');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');

    const targetSizeInput = panel.querySelector('.target-size-input');
    let selectedFile = null;

    setupUploadZone(uploadZone, fileInput, (file) => {
        const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExts.includes(ext)) {
            showToast('Please select a JPG, PNG, or WEBP image', 'error');
            return;
        }
        selectedFile = file;
        setupCompressControls(panel, file);
        
        renderFileList(fileList, [file], () => {
            selectedFile = null;
            setupCompressControls(panel, null);
            renderFileList(fileList, []);
            compressBtn.disabled = true;
        });
        compressBtn.disabled = false;
    }, false);

    compressBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        const maxWidth = maxWidthInput?.value;
        if (maxWidth && parseInt(maxWidth) > 0) {
            formData.append('max_width', maxWidth);
        }
        
        const targetSize = targetSizeInput?.value;
        if (targetSize && parseInt(targetSize) > 0) {
            formData.append('target_size_kb', targetSize);
        }

        try {
            compressBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);

            const result = await uploadFiles('/api/image/compress', formData, (percent) => {
                updateProgress(progressBar, progressText, percent, 'Uploading...');
            });

            setProgressIndeterminate(progressBar, progressText, 'Compressing image...');

            if (result.error) {
                showResult(resultArea, false, result.error);
            } else {
                hideProgress(progressContainer);
                const origSize = result.headers['x-original-size'];
                const compSize = result.headers['x-compressed-size'];
                const reduction = result.headers['x-reduction-percent'];

                let msg = 'Image compressed successfully!';
                if (origSize && compSize) {
                    msg = `Compressed: ${formatFileSize(parseInt(origSize))} → ${formatFileSize(parseInt(compSize))} (${reduction}% reduction)`;
                }
                showResult(resultArea, true, msg);
                downloadBlob(result.blob, result.filename);
            }
        } catch (err) {
            showResult(resultArea, false, err.error || 'Compression failed');
        } finally {
            compressBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}
