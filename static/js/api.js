/**
 * FileForge — API Client
 * Centralized API wrapper for all backend calls.
 */

const API_BASE = '';

/**
 * Make an API call with error handling.
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
            },
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        return response;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

/**
 * Upload file(s) to an endpoint with FormData.
 * onProgress: callback(percent)
 */
function uploadFiles(endpoint, formData, onProgress = null) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}${endpoint}`);

        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    onProgress(percent);
                }
            });
        }

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                const contentType = xhr.getResponseHeader('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const decoder = new TextDecoder();
                    const text = decoder.decode(xhr.response);
                    resolve(JSON.parse(text));
                } else {
                    // Return blob for file downloads
                    resolve({
                        blob: new Blob([xhr.response]),
                        filename: getFilenameFromHeaders(xhr),
                        headers: {
                            'x-original-size': xhr.getResponseHeader('x-original-size'),
                            'x-compressed-size': xhr.getResponseHeader('x-compressed-size'),
                            'x-reduction-percent': xhr.getResponseHeader('x-reduction-percent'),
                        },
                    });
                }
            } else {
                try {
                    const decoder = new TextDecoder();
                    const text = decoder.decode(xhr.response);
                    reject(JSON.parse(text));
                } catch {
                    reject({ error: `HTTP ${xhr.status}: ${xhr.statusText}` });
                }
            }
        };

        xhr.onerror = () => reject({ error: 'Network error' });
        xhr.responseType = 'arraybuffer';
        xhr.send(formData);
    });
}

/**
 * Extract filename from Content-Disposition header.
 */
function getFilenameFromHeaders(xhr) {
    const disposition = xhr.getResponseHeader('content-disposition');
    if (disposition) {
        const match = disposition.match(/filename="?([^";\n]+)"?/);
        if (match) return match[1];
    }
    return 'download';
}

/**
 * Trigger a file download from a Blob.
 */
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

/**
 * Format file size to human-readable string.
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
