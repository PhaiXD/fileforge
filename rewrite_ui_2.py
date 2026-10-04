import codecs

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

# 1. Update filter logic in app.js
start_filter = "    const searchInput = document.getElementById('search-input');"
end_filter = "    mergedTools = filterBySearch(mergedTools);"
idx1 = code.find(start_filter)
idx2 = code.find(end_filter, idx1)

if idx1 != -1 and idx2 != -1:
    new_filter = """    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Get active tags from left sidebar
    const activeTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value.toLowerCase());
    
    const filterBySearch = (tools) => {
        return tools.filter(t => {
            const searchableText = (t.title + " " + (t.desc || "") + " " + (t.tags?t.tags.join(' '):"") + " " + t.id).toLowerCase();
            
            // Must match all active category tags (except favorite)
            const catTags = activeTags.filter(tag => tag !== 'favorite');
            const hasFav = activeTags.includes('favorite');
            
            if (hasFav && !favs.includes(t.id)) return false;
            
            const tagsMatch = catTags.length === 0 || catTags.every(tag => searchableText.includes(tag));
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

# 2. Sync store tools filtering!
# Below mergedTools = filterBySearch(mergedTools);
# Add storeTools = filterBySearch(storeTools);
start_store = "    mergedTools = filterBySearch(mergedTools);"
idx1 = code.find(start_store)
if idx1 != -1:
    code = code[:idx1] + "    mergedTools = filterBySearch(mergedTools);\n    storeTools = filterBySearch(storeTools);\n" + code[idx1+len(start_store):]

# 3. Modify renderCard to remove buttons and "coming soon"
start_card = "    const renderCard = (tool, isStore = false) => {"
end_card = "    };"
idx1 = code.find(start_card)
idx2 = code.find(end_card, idx1)
if idx1 != -1 and idx2 != -1:
    new_card = """    const renderCard = (tool, isStore = false) => {
        const isFav = favs.includes(tool.id);
        return <div class="tool-card " data-tool="" style="--card-accent: ; ">
            
            <div class="tool-card-icon" style="background: color-mix(in srgb,  15%, transparent); color: ">
                
            </div>
            <div class="tool-card-content">
                <div class="tool-card-title" style="display:flex; justify-content:space-between; align-items:center;">
                    
                    
                </div>
                <div class="tool-card-desc"></div>
            </div>
        </div>;
    };"""
    code = code[:idx1] + new_card + code[idx2:]

# 4. Context Menu Logic & click events
start_events = "    // Add click events"
end_events = "    // Add click events for store items"
idx1 = code.find(start_events)
idx2 = code.find(end_events, idx1)
if idx1 != -1 and idx2 != -1:
    new_events = """    // Context Menu Logic
    const ctxMenu = document.getElementById('tool-context-menu');
    let ctxToolId = null;
    let ctxIsStore = false;
    
    document.addEventListener('click', (e) => {
        if (ctxMenu) ctxMenu.style.display = 'none';
    });
    
    if (ctxMenu) {
        document.getElementById('ctx-info').onclick = (e) => {
            if (ctxToolId) showToolInfo(ctxToolId, e);
        };
        document.getElementById('ctx-fav').onclick = (e) => {
            if (ctxToolId) toggleFavorite(ctxToolId, e);
        };
        document.getElementById('ctx-uninstall').onclick = (e) => {
            if (ctxToolId && ctxToolId.startsWith('plugin:')) {
                const pluginId = ctxToolId.split(':')[1];
                uninstallPlugin(pluginId);
            }
        };
        document.getElementById('ctx-install').onclick = (e) => {
            if (ctxToolId && ctxToolId.startsWith('store:')) {
                const pluginId = ctxToolId.split(':')[1];
                if (typeof installPlugin === 'function') installPlugin(pluginId);
            }
        };
    }
    
    // Click and Context Menu for ALL cards
    document.querySelectorAll('.tool-card').forEach(card => {
        // Left click
        card.addEventListener('click', (e) => {
            const toolId = card.dataset.tool;
            if (toolId.startsWith('store:')) {
                const pluginId = toolId.split(':')[1];
                if (confirm(Do you want to install ?)) {
                    if(typeof installPlugin === 'function') installPlugin(pluginId);
                }
                return;
            }
            updateRecentTool(toolId);
            showPanel(toolId);
        });
        
        // Right click
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            ctxToolId = card.dataset.tool;
            ctxIsStore = ctxToolId.startsWith('store:');
            
            if (ctxMenu) {
                ctxMenu.style.display = 'block';
                ctxMenu.style.left = e.clientX + 'px';
                ctxMenu.style.top = e.clientY + 'px';
                
                // Show/hide buttons based on context
                document.getElementById('ctx-uninstall').style.display = ctxToolId.startsWith('plugin:') ? 'flex' : 'none';
                document.getElementById('ctx-install').style.display = ctxIsStore ? 'flex' : 'none';
            }
        });
    });

"""
    code = code[:idx1] + new_events + code[idx2:]

    # Remove the old click events for store items since we merged them
    end_store_events = "    });"
    idx3 = code.find(end_store_events, idx1 + len(new_events))
    if idx3 != -1:
        code = code[:idx1 + len(new_events)] + code[idx3+7:]


with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
