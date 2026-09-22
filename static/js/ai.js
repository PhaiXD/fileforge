/**
 * FileForge — AI Summarization Handlers
 * Handles PDF and Video summarization via Gemini API.
 */

/**
 * Initialize PDF Summarizer tool.
 */
function initPdfSummarizer() {
    const panel = document.getElementById('panel-ai-pdf');
    if (!panel) return;

    const uploadZone = panel.querySelector('.upload-zone');
    const fileInput = panel.querySelector('input[type="file"]');
    const fileList = panel.querySelector('.file-list');
    const summarizeBtn = panel.querySelector('.btn-convert');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');
    const summaryResult = panel.querySelector('.summary-result');

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
            summarizeBtn.disabled = true;
        });
        summarizeBtn.disabled = false;
    }, false);

    summarizeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const apiKey = getApiKey();
        if (!apiKey) {
            showSettingsModal();
            showToast('Please set your Google API Key first', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('api_key', apiKey);

        try {
            summarizeBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);
            setProgressIndeterminate(progressBar, progressText, 'Extracting text and summarizing with AI...');

            const result = await fetchAPI('/api/ai/summarize-pdf', {
                method: 'POST',
                body: formData,
            });

            hideProgress(progressContainer);

            if (result.success) {
                showResult(resultArea, true, 'PDF summarized successfully!');
                if (summaryResult) {
                    summaryResult.style.display = 'block';
                    summaryResult.innerHTML = marked.parse(result.summary);
                }
            } else {
                showResult(resultArea, false, result.error || 'Summarization failed');
            }
        } catch (err) {
            showResult(resultArea, false, 'Summarization failed');
        } finally {
            summarizeBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}

/**
 * Initialize Video Summarizer tool.
 */
function initVideoSummarizer() {
    const panel = document.getElementById('panel-ai-video');
    if (!panel) return;

    const urlInput = panel.querySelector('.url-input');
    const summarizeBtn = panel.querySelector('.btn-convert');
    const progressContainer = panel.querySelector('.progress-container');
    const progressBar = panel.querySelector('.progress-bar');
    const progressText = panel.querySelector('.progress-text');
    const resultArea = panel.querySelector('.result-area');
    const summaryResult = panel.querySelector('.summary-result');

    summarizeBtn.addEventListener('click', async () => {
        const url = urlInput?.value?.trim();
        if (!url) {
            showToast('Please enter a YouTube URL', 'error');
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            showSettingsModal();
            showToast('Please set your Google API Key first', 'warning');
            return;
        }

        try {
            summarizeBtn.disabled = true;
            showProgress(progressContainer, progressBar, progressText);
            setProgressIndeterminate(progressBar, progressText, 'Checking for subtitles...');

            // First try with subtitles
            const formData = new FormData();
            formData.append('url', url);
            formData.append('api_key', apiKey);
            formData.append('use_audio', 'false');

            const result = await fetchAPI('/api/ai/summarize-video', {
                method: 'POST',
                body: formData,
            });

            if (result.success) {
                hideProgress(progressContainer);
                const methodLabel = result.method === 'subtitle' ? '(from subtitles)' : '(from audio)';
                showResult(resultArea, true, `Video summarized successfully! ${methodLabel}`);
                if (summaryResult) {
                    summaryResult.style.display = 'block';
                    summaryResult.innerHTML = marked.parse(result.summary);
                }
            } else if (result.no_subtitle) {
                // No subtitles — show warning popup
                hideProgress(progressContainer);
                showAudioConfirmModal(async () => {
                    // User confirmed — proceed with audio
                    try {
                        showProgress(progressContainer, progressBar, progressText);
                        setProgressIndeterminate(progressBar, progressText, 'Downloading audio and summarizing (this may take a while)...');

                        const audioFormData = new FormData();
                        audioFormData.append('url', url);
                        audioFormData.append('api_key', apiKey);
                        audioFormData.append('use_audio', 'true');

                        const audioResult = await fetchAPI('/api/ai/summarize-video', {
                            method: 'POST',
                            body: audioFormData,
                        });

                        hideProgress(progressContainer);

                        if (audioResult.success) {
                            showResult(resultArea, true, 'Video summarized successfully! (from audio)');
                            if (summaryResult) {
                                summaryResult.style.display = 'block';
                                summaryResult.innerHTML = marked.parse(audioResult.summary);
                            }
                        } else {
                            showResult(resultArea, false, audioResult.error || 'Audio summarization failed');
                        }
                    } catch (err) {
                        showResult(resultArea, false, 'Audio summarization failed');
                    } finally {
                        summarizeBtn.disabled = false;
                        hideProgress(progressContainer);
                    }
                });
            } else {
                showResult(resultArea, false, result.error || 'Summarization failed');
            }
        } catch (err) {
            showResult(resultArea, false, 'Summarization failed');
        } finally {
            summarizeBtn.disabled = false;
            hideProgress(progressContainer);
        }
    });
}

/**
 * Show audio confirmation modal.
 * Warns user about high token usage when using audio-based summarization.
 */
function showAudioConfirmModal(onConfirm) {
    const overlay = document.getElementById('modal-audio-confirm');
    if (!overlay) {
        // Create modal dynamically
        const modal = document.createElement('div');
        modal.id = 'modal-audio-confirm';
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-title">⚠️ No Subtitles Found</div>
                <div class="modal-body">
                    <p>This video doesn't have subtitles available. The system will download the audio and use AI to listen and summarize it.</p>
                    <p style="margin-top:12px; color:var(--accent-yellow); font-weight:600;">⚡ Warning: This method uses significantly more API tokens and may take longer to process.</p>
                    <p style="margin-top:12px;">Do you want to continue?</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary btn-cancel">Cancel</button>
                    <button class="btn-primary btn-confirm">Continue with Audio</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            modal.classList.remove('active');
            modal.remove();
        });

        modal.querySelector('.btn-confirm').addEventListener('click', () => {
            modal.classList.remove('active');
            modal.remove();
            if (onConfirm) onConfirm();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.remove();
            }
        });
    }
}

/**
 * Get API key from localStorage.
 */
function getApiKey() {
    return localStorage.getItem('fileforge_gemini_api_key') || '';
}
