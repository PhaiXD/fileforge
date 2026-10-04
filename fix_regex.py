# -*- coding: utf-8 -*-
import codecs
import re

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

# 1. Update storeTools push logic to filter by installed tools
# Find the exact loop for storePluginsData
pattern1 = r'if\s*\(\s*window\.storePluginsData\s*\)\s*\{\s*window\.storePluginsData\.forEach\(\s*p\s*=>\s*\{\s*if\s*\(\s*p\.tools\s*\)\s*\{\s*p\.tools\.forEach\(\s*t\s*=>\s*\{\s*storeTools\.push\(.*?\);\s*\}\s*\);\s*\}\s*\}\s*\);\s*\}'
match = re.search(pattern1, app_js, re.DOTALL)
if match:
    new_logic = """
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
    }
    """
    app_js = app_js[:match.start()] + new_logic + app_js[match.end():]
    print("Fixed store duplicates")
else:
    print("Could not match pattern 1")


# 2. Fix the clearBtn click listener
pattern2 = r'clearBtn\.addEventListener\(\s*\'click\'\s*,\s*\(\)\s*=>\s*\{\s*input\.value\s*=\s*\'\';\s*clearBtn\.style\.display\s*=\s*\'none\';\s*resultsContainer\.style\.display\s*=\s*\'none\';\s*input\.focus\(\);\s*\}\);'
match = re.search(pattern2, app_js, re.DOTALL)
if match:
    new_clearBtn = """clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        resultsContainer.style.display = 'none';
        renderTools();
        input.focus();
    });"""
    app_js = app_js[:match.start()] + new_clearBtn + app_js[match.end():]
    print("Fixed clearBtn")
else:
    print("Could not match pattern 2")

# 3. Add renderTools() when query is empty inside input listener
pattern3 = r'if\s*\(!query\)\s*\{\s*resultsContainer\.style\.display\s*=\s*\'none\';\s*return;\s*\}'
match = re.search(pattern3, app_js, re.DOTALL)
if match:
    new_empty = """if (!query) {
              resultsContainer.style.display = 'none';
              renderTools();
              return;
          }"""
    app_js = app_js[:match.start()] + new_empty + app_js[match.end():]
    print("Fixed empty query refresh")
else:
    print("Could not match pattern 3")
    
# 4. Fix customConfirm in click listener
pattern4 = r'customConfirm\(\'Do you want to install <strong>\'\s*\+\s*parts\[1\]\s*\+\s*\'</strong>\?\',\s*\'Install Tool\'\)\.then\(function\(ok\)\s*\{\s*if\s*\(ok\s*&&\s*typeof\s*installPlugin\s*===\s*\'function\'\)\s*installPlugin\(pluginId\);\s*\}\);'
match = re.search(pattern4, app_js, re.DOTALL)
if match:
    new_confirm = """
                        let toolIcon = '📦';
                        let toolName = parts[1];
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
    """
    app_js = app_js[:match.start()] + new_confirm + app_js[match.end():]
    print("Fixed customConfirm")
else:
    print("Could not match pattern 4")
    
# 5. Fix context menu display logic (close on click)
pattern5_fav = r'document\.getElementById\(\'ctx-fav\'\)\.onclick\s*=\s*\(e\)\s*=>\s*\{\s*if\s*\(ctxToolId\)\s*\{\s*if\(typeof toggleFavorite === \'function\'\)\s*toggleFavorite\(ctxToolId,\s*e\);\s*\}\s*\};'
match = re.search(pattern5_fav, app_js, re.DOTALL)
if match:
    new_fav = """document.getElementById('ctx-fav').onclick = (e) => {
              document.getElementById('tool-context-menu').style.display = 'none';
              if (ctxToolId) {
                  if(typeof toggleFavorite === 'function') toggleFavorite(ctxToolId, e);
              }
          };"""
    app_js = app_js[:match.start()] + new_fav + app_js[match.end():]
    print("Fixed ctx-fav click")
else:
    print("Could not match pattern 5 (fav)")
    
pattern5_uninstall = r'document\.getElementById\(\'ctx-uninstall\'\)\.onclick\s*=\s*\(e\)\s*=>\s*\{\s*if\s*\(ctxToolId\s*&&\s*ctxToolId\.startsWith\(\'plugin:\'\)\)\s*\{\s*const\s*parts\s*=\s*ctxToolId\.split\(\':\'\);\s*const\s*pluginId\s*=\s*parts\[1\];\s*if\(typeof uninstallPlugin === \'function\'\)\s*\{\s*uninstallPlugin\(pluginId\);\s*\}\s*\}\s*else\s*\{\s*customAlert\(\'This is a built-in tool and cannot be uninstalled\.\',\s*\'Notice\'\);\s*\}\s*\};'
match = re.search(pattern5_uninstall, app_js, re.DOTALL)
if match:
    new_uninstall = """document.getElementById('ctx-uninstall').onclick = (e) => {
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
    app_js = app_js[:match.start()] + new_uninstall + app_js[match.end():]
    print("Fixed ctx-uninstall click")
else:
    print("Could not match pattern 5 (uninstall)")
    
with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)
