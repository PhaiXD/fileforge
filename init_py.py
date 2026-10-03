import codecs

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

new_init = """document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSearch();
    
    const btnMore = document.getElementById('btn-more-plugins');
    const btnBack = document.getElementById('btn-back-home');
    const toolGridSection = document.getElementById('tool-grid-section');
    const storePageSection = document.getElementById('store-page-section');
    const modeToggle = document.querySelector('.mode-toggle');
    const searchContainer = document.getElementById('search-container');
    
    if (btnMore) {
        btnMore.addEventListener('click', () => {
            toolGridSection.style.display = 'none';
            modeToggle.style.display = 'none';
            searchContainer.style.display = 'none';
            storePageSection.style.display = 'block';
            window.scrollTo(0,0);
        });
    }
    
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            storePageSection.style.display = 'none';
            toolGridSection.style.display = 'block';
            modeToggle.style.display = 'flex';
            searchContainer.style.display = 'flex';
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
    
    if (typeof loadStore === 'function') {
        loadStore();
    }
    
    renderTools();
});"""

start_init = "document.addEventListener('DOMContentLoaded', () => {"
start_idx = code.find(start_init)
if start_idx != -1:
    end_idx = code.find("});", start_idx) + 3
    code = code[:start_idx] + new_init + code[end_idx:]

with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
