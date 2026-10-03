const fs = require('fs');

let code = fs.readFileSync('static/js/app.js', 'utf8');

let newInit = 
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSearch();
    
    // Wire up Browse Full Store button
    const btnMore = document.getElementById('btn-more-plugins');
    const btnBack = document.getElementById('btn-back-home');
    const toolGridSection = document.getElementById('tool-grid-section');
    const storePageSection = document.getElementById('store-page-section');
    const modeToggle = document.querySelector('.mode-toggle');
    
    if (btnMore) {
        btnMore.addEventListener('click', () => {
            toolGridSection.style.display = 'none';
            modeToggle.style.display = 'none';
            storePageSection.style.display = 'block';
            window.scrollTo(0,0);
        });
    }
    
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            storePageSection.style.display = 'none';
            toolGridSection.style.display = 'block';
            modeToggle.style.display = 'flex';
        });
    }

    const storeSearch = document.getElementById('store-search-input');
    if (storeSearch) {
        storeSearch.addEventListener('input', () => {
            const query = storeSearch.value.toLowerCase().trim();
            const terms = query.split(/\\s+/);
            document.querySelectorAll('#store-grid .tool-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                if (terms.every(term => text.includes(term))) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Load store data on startup for the main page uninstalled list
    if (typeof loadStore === 'function') {
        loadStore();
    }
    
    // Initial render
    renderTools();
});
;

code = code.replace(/document\.addEventListener\('DOMContentLoaded', \(\) => \{[\s\S]*?renderTools\(\);\n\}\);/, newInit.trim());

fs.writeFileSync('static/js/app.js', code);
