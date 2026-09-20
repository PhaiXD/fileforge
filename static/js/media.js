/**
 * FileForge — Media Download Handlers
 * Handles YouTube/TikTok video and audio downloading.
 */

/**
 * Initialize Media Downloader tool.
 */
function initMediaDownloader(toolId) {
    const panel = document.getElementById(`panel-${toolId}`);
    if (!panel) return;

    const urlInput = panel.querySelector('.url-input');
    const fetchBtn = panel.querySelector('.btn-fetch-info');
    const downloadBtn = panel.querySelector('.btn-convert');
    const qualitySelect = panel.querySelector('.quality-select');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');
    const mediaInfoArea = panel.querySelector('.media-info');

    let mediaInfo = null;

    // Determine format from tool ID
    const formatType = toolId.includes('mp3') ? 'mp3' : 'mp4';

    // Fetch info button
    if (fetchBtn) {
        fetchBtn.addEventListener('click', async () => {
            const url = urlInput?.value?.trim();
            if (!url) {
                showToast('Please enter a URL', 'error');
                return;
            }

            try {
                fetchBtn.disabled = true;
                fetchBtn.textContent = 'Loading...';

                const formData = new FormData();
                formData.append('url', url);

                const result = await fetchAPI('/api/media/info', {
                    method: 'POST',
                    body: formData,
                });

                if (result.success) {
                    mediaInfo = result.data;
                    renderMediaInfo(mediaInfoArea, mediaInfo, qualitySelect, formatType);
                    downloadBtn.disabled = false;
                } else {
                    showToast(result.error || 'Failed to get media info', 'error');
                }
            } catch (err) {
                showToast('Failed to fetch media info', 'error');
            } finally {
                fetchBtn.disabled = false;
                fetchBtn.textContent = 'Fetch Info';
            }
        });
    }

    // Also allow Enter key in URL input
    if (urlInput && fetchBtn) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') fetchBtn.click();
        });
    }

    // Download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const url = urlInput?.value?.trim();
            if (!url) {
                showToast('Please enter a URL', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('url', url);
            formData.append('format_type', formatType);
            if (qualitySelect?.value) {
                formData.append('quality', qualitySelect.value);
            }

            try {
                downloadBtn.disabled = true;
                showProgress(progressContainer, progressBar, progressText);
                setProgressIndeterminate(progressBar, progressText, `Downloading ${formatType.toUpperCase()}...`);

                const result = await uploadFiles('/api/media/download', formData);

                if (result.error) {
                    showResult(resultArea, false, result.error);
                } else {
                    hideProgress(progressContainer);
                    const title = mediaInfo?.title || 'media';
                    showResult(resultArea, true, `Downloaded: ${title}`);
                    downloadBlob(result.blob, result.filename);
                }
            } catch (err) {
                showResult(resultArea, false, err.error || 'Download failed');
            } finally {
                downloadBtn.disabled = false;
                hideProgress(progressContainer);
            }
        });
    }
}

/**
 * Render media info card.
 */
function renderMediaInfo(container, info, qualitySelect, formatType) {
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = `
        <div style="display:flex; gap:16px; align-items:start; padding:16px; background:var(--bg-secondary); border-radius:var(--radius-md); margin-bottom:16px;">
            ${info.thumbnail ? `<img src="${info.thumbnail}" alt="Thumbnail" style="width:160px; height:90px; object-fit:cover; border-radius:var(--radius-sm);">` : ''}
            <div style="flex:1; min-width:0;">
                <div style="font-size:15px; font-weight:600; color:var(--text-primary); margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(info.title)}</div>
                <div style="font-size:13px; color:var(--text-secondary);">${escapeHtml(info.uploader)} · ${info.duration_string || ''}</div>
            </div>
        </div>
    `;

    // Populate quality select (for video only)
    if (qualitySelect && formatType === 'mp4' && info.formats && info.formats.length > 0) {
        qualitySelect.innerHTML = '<option value="">Best Quality</option>';
        info.formats.forEach(f => {
            qualitySelect.innerHTML += `<option value="${f.quality}">${f.quality}</option>`;
        });
        qualitySelect.parentElement.style.display = 'block';
    }
}
