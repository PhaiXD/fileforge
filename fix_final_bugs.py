import codecs
import re

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

# 1. Fix storeTools duplicate logic by checking tool ID instead of plugin ID
old_store_logic = """    // Add installed plugins to mergedTools
    let installedIds = new Set();
    if (window.installedPluginsData) {
        window.installedPluginsData.forEach(plugin => {
            installedIds.add(plugin.id);
            if (plugin.tools) {
                plugin.tools.forEach(t => {
                    if (t.mode === currentMode || currentMode === 'convert') {
                        if (!mergedTools.find(nt => nt.id === t.id)) {
                            mergedTools.push({
                                id: 'plugin:' + plugin.id + ':' + t.id,
                                title: t.name,
                                desc: t.description,
                                icon: t.icon || plugin.icon || '📦',
                                color: 'var(--accent-purple)',
                                active: true,
                                isPlugin: true,
                                pluginData: plugin,
                                toolData: t
                            });
                        }
                    }
                });
            }
        });
    }

    if (window.storePluginsData) {
        window.storePluginsData.forEach(p => {
            // ONLY push if NOT installed!
            if (!installedIds.has(p.id) && p.tools) {
                p.tools.forEach(t => {
                    storeTools.push({ ...t, isStore: true, pluginId: p.id, pluginVersion: p.version });
                });
            }
        });
    }"""

new_store_logic = """    // Add installed plugins to mergedTools
    if (window.installedPluginsData) {
        window.installedPluginsData.forEach(plugin => {
            if (plugin.tools) {
                plugin.tools.forEach(t => {
                    if (t.mode === currentMode || currentMode === 'convert') {
                        if (!mergedTools.find(nt => nt.id === t.id)) {
                            mergedTools.push({
                                id: 'plugin:' + plugin.id + ':' + t.id,
                                title: t.name,
                                desc: t.description,
                                icon: t.icon || plugin.icon || '📦',
                                color: 'var(--accent-purple)',
                                active: true,
                                isPlugin: true,
                                pluginData: plugin,
                                toolData: t
                            });
                        }
                    }
                });
            }
        });
    }
    
    let installedToolIds = new Set();
    mergedTools.forEach(t => {
        if (t.isPlugin && t.toolData) installedToolIds.add(t.toolData.id);
        else installedToolIds.add(t.id);
    });

    if (window.storePluginsData) {
        window.storePluginsData.forEach(p => {
            if (p.tools) {
                p.tools.forEach(t => {
                    if (!installedToolIds.has(t.id)) {
                        storeTools.push({ ...t, isStore: true, pluginId: p.id, pluginVersion: p.version });
                    }
                });
            }
        });
    }"""

app_js = app_js.replace(old_store_logic, new_store_logic)


# 2. Fix the search clear button not triggering renderTools
old_clear_btn = """    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        resultsContainer.style.display = 'none';
        input.focus();
    });"""

new_clear_btn = """    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        resultsContainer.style.display = 'none';
        renderTools();
        input.focus();
    });"""
app_js = app_js.replace(old_clear_btn, new_clear_btn)


# 3. Add search input 'search' event listener for native 'x' button in type="search" inputs
# Wait, the search bar is type="text", but users might use backspace. The 'input' event should fire for backspace.
# The user said "ผมกดกากบาท หรือปุ่มลบใน search bar แล้ว text ในนั้นมันหายนะ แต่ plugin ที่อยู่บนจอกลับไม่ refresh ใหม่"
# The 'x' button inside the search input is `clearBtn` because it's a custom button overlaid on the input.
# So adding `renderTools()` to `clearBtn` click will fix it!
# Also, just in case, ensure the input triggers renderTools on any change.
if "input.addEventListener('input', () => {" in app_js:
    # Ensure renderTools is called when query becomes empty
    old_input_ev = """        if (!query) {
            resultsContainer.style.display = 'none';
            return;
        }"""
    new_input_ev = """        if (!query) {
            resultsContainer.style.display = 'none';
            renderTools();
            return;
        }"""
    app_js = app_js.replace(old_input_ev, new_input_ev)

# Also fix the actual input.addEventListener('input', renderTools) which might have been lost
if "document.getElementById('search-input')?.addEventListener('input', renderTools);" not in app_js:
    app_js += "\\n    document.getElementById('search-input')?.addEventListener('input', renderTools);\\n"

with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)
print("Updated app.js logic for store duplicate and search clear")
