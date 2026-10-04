# -*- coding: utf-8 -*-
import codecs
import re

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

# 1. Filter out installed tools from storeTools in app.js
# Look for: if (window.storePluginsData) { ... }
old_store_push = """    // Add installed plugins to mergedTools
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
                                icon: t.icon || plugin.icon || '🧩',
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
            if (p.tools) {
                p.tools.forEach(t => {
                    storeTools.push({ ...t, isStore: true, pluginId: p.id, pluginVersion: p.version });
                });
            }
        });
    }"""

new_store_push = """    // Add installed plugins to mergedTools
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

app_js = app_js.replace(old_store_push, new_store_push)


# 2. Fix search input 'input' event (currently it might be using keyup)
# Search for searchInput.addEventListener('keyup'
app_js = app_js.replace(
    "searchInput.addEventListener('keyup', renderTools);",
    "searchInput.addEventListener('input', renderTools);"
)


# 3. Fix context menu handlers to close the menu
old_ctx = """          document.getElementById('ctx-fav').onclick = (e) => {
              if (ctxToolId) {
                  if(typeof toggleFavorite === 'function') toggleFavorite(ctxToolId, e);
              }
          };
          document.getElementById('ctx-uninstall').onclick = (e) => {
              if (ctxToolId && ctxToolId.startsWith('plugin:')) {
                  const parts = ctxToolId.split(':');
                  const pluginId = parts[1];
                  if(typeof uninstallPlugin === 'function') {
                      uninstallPlugin(pluginId);
                  }
              } else {
                  customAlert('This is a built-in tool and cannot be uninstalled.', 'Notice');
              }
          };"""

new_ctx = """          document.getElementById('ctx-fav').onclick = (e) => {
              document.getElementById('tool-context-menu').style.display = 'none';
              if (ctxToolId) {
                  if(typeof toggleFavorite === 'function') toggleFavorite(ctxToolId, e);
              }
          };
          document.getElementById('ctx-uninstall').onclick = (e) => {
              document.getElementById('tool-context-menu').style.display = 'none';
              if (ctxToolId && ctxToolId.startsWith('plugin:')) {
                  const parts = ctxToolId.split(':');
                  const pluginId = parts[1];
                  if(typeof uninstallPlugin === 'function') {
                      uninstallPlugin(pluginId);
                  }
              } else {
                  customAlert('This is a built-in tool and cannot be uninstalled.', 'Notice');
              }
          };"""
app_js = app_js.replace(old_ctx, new_ctx)

# 4. Fix customConfirm icon for installing tool
# We need to find the tool icon.
old_install_click = """                    if (toolId.startsWith('store:')) {
                        const parts = toolId.split(':');
                        const pluginId = parts[1];
                        customConfirm('Do you want to install <strong>' + parts[1] + '</strong>?', 'Install Tool').then(function(ok) {
                            if (ok && typeof installPlugin === 'function') installPlugin(pluginId);
                        });
                        return;
                    }"""
new_install_click = """                    if (toolId.startsWith('store:')) {
                        const parts = toolId.split(':');
                        const pluginId = parts[1];
                        
                        let toolIcon = '📦';
                        let toolName = parts[1];
                        // Find from storeData
                        if (window.storePluginsData) {
                            const pData = window.storePluginsData.find(p => p.id === pluginId);
                            if (pData && pData.tools && pData.tools.length > 0) {
                                toolIcon = pData.tools[0].icon || pData.icon || '📦';
                                toolName = pData.tools[0].name || pData.name || toolName;
                            }
                        }
                        
                        customConfirm('Do you want to install <strong>' + toolName + '</strong>?', 'Install Tool', toolIcon).then(function(ok) {
                            if (ok && typeof installPlugin === 'function') installPlugin(pluginId);
                        });
                        return;
                    }"""
app_js = app_js.replace(old_install_click, new_install_click)


with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)
print("app.js updated successfully")
