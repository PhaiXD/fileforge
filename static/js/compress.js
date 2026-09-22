/**
 * FileForge — Compress Tool Handlers
 * Handles PDF and Image compression tools.
 */

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
    const qualitySelect = panel.querySelector('.quality-select');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');

    let selectedFile = null;

    setupUploadZone(uploadZone, fileInput, (file) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Please select a PDF file', 'error');
            return;
        }
        selectedFile = file;
        renderFileList(fileList, [file], () => {
            selectedFile = null;
            renderFileList(fileList, []);
            compressBtn.disabled = true;
        });
        compressBtn.disabled = false;
    }, false);

    compressBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('quality', qualitySelect?.value || 'medium');

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

    let selectedFile = null;

    // Compression level labels: 1=Minimal, 2=Low, 3=Medium, 4=High, 5=Maximum
    const levelLabels = { 1: 'Minimal', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Maximum' };
    // Map compression level to quality: higher compression = lower quality
    const levelToQuality = { 1: 90, 2: 75, 3: 60, 4: 40, 5: 20 };

    if (compressRange) {
        compressRange.addEventListener('input', () => {
            compressValue.textContent = levelLabels[compressRange.value] || 'Medium';
        });
    }

    setupUploadZone(uploadZone, fileInput, (file) => {
        const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExts.includes(ext)) {
            showToast('Please select a JPG, PNG, or WEBP image', 'error');
            return;
        }
        selectedFile = file;
        renderFileList(fileList, [file], () => {
            selectedFile = null;
            renderFileList(fileList, []);
            compressBtn.disabled = true;
        });
        compressBtn.disabled = false;
    }, false);

    compressBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const level = parseInt(compressRange?.value || '3');
        const quality = levelToQuality[level] || 60;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('quality', quality.toString());

        const maxWidth = maxWidthInput?.value;
        if (maxWidth && parseInt(maxWidth) > 0) {
            formData.append('max_width', maxWidth);
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
