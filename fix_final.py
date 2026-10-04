import codecs
import re

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

# 1. Update storeTools push logic to filter by installed tools
# Instead of matching the whole block, I will just match `const isInstalled = window.installedPluginsData?.some(p => p.id === plugin.id);`
# and replace it with tool level logic.
# Wait, let's just replace the WHOLE function `renderTools()`'s store tools loop using a robust regex.
pattern_render = r'// Add uninstalled store plugins to storeTools.*?// Get active tags from left sidebar'
match = re.search(pattern_render, app_js, re.DOTALL)
if match:
    new_logic = """// Add uninstalled store plugins to storeTools
    let installedToolIds = new Set();
    mergedTools.forEach(t => {
        if (t.isPlugin && t.toolData) installedToolIds.add(t.toolData.id);
        else installedToolIds.add(t.id);
    });

    if (window.storePluginsData && storeUninstalledGrid) {
        window.storePluginsData.forEach(plugin => {
            if (plugin.tools && plugin.tools.length > 0) {
                plugin.tools.forEach(t => {
                    if (t.mode === currentMode || currentMode === 'convert') {
                        // Check if this specific tool is already installed!
                        if (!installedToolIds.has(t.id)) {
                            storeTools.push({
                                id: 'store:' + plugin.id + ':' + t.id,
                                title: t.name,
                                desc: t.description,
                                icon: t.icon || plugin.icon || '📦',
                                color: 'var(--text-tertiary)',
                                active: true,
                                isStore: true,
                                pluginData: plugin,
                                toolData: t
                            });
                        }
                    }
                });
            } else {
                if (!installedToolIds.has(plugin.id)) {
                    storeTools.push({
                        id: 'store:' + plugin.id,
                        title: plugin.name,
                        desc: plugin.description,
                        icon: plugin.icon || '🛒',
                        color: 'var(--text-tertiary)',
                        active: true,
                        isStore: true,
                        pluginData: plugin
                    });
                }
            }
        });
    }

    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Get active tags from left sidebar"""
    app_js = app_js[:match.start()] + new_logic + app_js[match.end():]
    print("Replaced store logic successfully!")

pattern_uninstall = r'document\.getElementById\(\'ctx-uninstall\'\)\.onclick = \(e\) => \{.*?if \(ctxToolId && ctxToolId\.startsWith\(\'plugin:\'\)\) \{.*?const pluginId =.*?if\(typeof uninstallPlugin === \'function\'\).*?else \{.*?customAlert.*?;.*?\}'
match = re.search(pattern_uninstall, app_js, re.DOTALL)
if match:
    new_uninstall = """document.getElementById('ctx-uninstall').onclick = (e) => {
                    document.getElementById('tool-context-menu').style.display = 'none';
                    if (ctxToolId && ctxToolId.startsWith('plugin:')) {
                        const parts = ctxToolId.split(':');
                        const pluginId = parts[1];
                        if(typeof uninstallPlugin === 'function') uninstallPlugin(pluginId);
                    } else {
                        customAlert('This is a built-in tool and cannot be uninstalled.', 'Notice');
                    }
                }"""
    app_js = app_js[:match.start()] + new_uninstall + app_js[match.end():]
    print("Replaced ctx-uninstall successfully!")
else:
    print("Could not match uninstall context logic")


with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)
