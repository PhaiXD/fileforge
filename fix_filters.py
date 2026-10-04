import codecs

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

# Replace initSearch to bind tag-filters
start_is = "function initSearch() {"
end_is = "const input = document.getElementById('search-input');"
idx1 = code.find(start_is)
idx2 = code.find(end_is, idx1)

if idx1 != -1 and idx2 != -1:
    new_is = """function initSearch() {
    document.getElementById('search-input')?.addEventListener('input', renderTools);
    document.getElementById('fav-filter')?.addEventListener('change', renderTools);
    document.querySelectorAll('.tag-filter').forEach(cb => cb.addEventListener('change', renderTools));
    """
    code = code[:idx1] + new_is + code[idx2:]


# Add tag filter logic to renderTools
start_filter = "const searchInput = document.getElementById('search-input');"
end_filter = "mergedTools = filterBySearch(mergedTools);"
idx1 = code.find(start_filter)
idx2 = code.find(end_filter, idx1)

if idx1 != -1 and idx2 != -1:
    new_filter = """const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Get active tags
    const activeTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value.toLowerCase());
    
    const filterBySearch = (tools) => {
        return tools.filter(t => {
            const searchableText = (t.title + " " + (t.desc || "") + " " + t.id).toLowerCase();
            
            // Must match all tags
            const tagsMatch = activeTags.length === 0 || activeTags.every(tag => searchableText.includes(tag));
            if (!tagsMatch) return false;
            
            // Must match search query
            if (query) {
                const terms = query.split(/\\s+/);
                return terms.every(term => searchableText.includes(term));
            }
            
            return true;
        });
    };

    """
    code = code[:idx1] + new_filter + code[idx2:]


with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
