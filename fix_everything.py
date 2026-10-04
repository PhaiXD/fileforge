import codecs
import re

# ==========================================
# Fix app.js
# ==========================================
with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

# Fix the mode filtering pollution in app.js
# Replace `if (t.mode === currentMode || currentMode === 'convert') {` with `if (t.mode === currentMode) {`
# but only for the store tools iteration and mergedTools iteration.
# Actually, wait, does FileForge have an "All" tab? No, tabs are `Convert`, `Compress`, `AI Tools`.
# So `currentMode` is one of those. `currentMode === 'convert'` should never show compress tools.
app_js = app_js.replace("t.mode === currentMode || currentMode === 'convert'", "t.mode === currentMode")
# Wait, also check `aiSection`
app_js = app_js.replace("if (aiSection && currentMode === 'convert')", "if (aiSection && currentMode === 'ai')")

# Expose getInstalledToolIds() globally so store.js can use it
expose_func = """function getInstalledToolIds() {
    let installedToolIds = new Set();
    let nativeTools = window.TOOLS[currentMode] || [];
    // Also include other modes just in case
    Object.values(window.TOOLS).forEach(toolArray => {
        toolArray.forEach(t => installedToolIds.add(t.id));
    });
    if (window.installedPluginsData) {
        window.installedPluginsData.forEach(plugin => {
            if (plugin.tools) {
                plugin.tools.forEach(t => installedToolIds.add(t.id));
            }
        });
    }
    return installedToolIds;
}"""
if "function getInstalledToolIds()" not in app_js:
    app_js += "\\n" + expose_func + "\\n"

# In renderTools, use the global getInstalledToolIds()
app_js = re.sub(
    r'let installedToolIds = new Set\(\);.*?else installedToolIds\.add\(t\.id\);\s*\}\);', 
    'let installedToolIds = getInstalledToolIds();', 
    app_js, flags=re.DOTALL
)

with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)


# ==========================================
# Fix store.js
# ==========================================
with codecs.open('static/js/store.js', 'r', 'utf-8') as f:
    store_js = f.read()

# Change data.plugins.forEach logic in loadStore
old_store_loop = """              data.plugins.forEach(plugin => {
                  if (plugin.tools && plugin.tools.length > 0 && !plugin.installed) {
                      plugin.tools.forEach(tool => {
                          storeToolsList.push({
                              ...tool,
                              plugin_parent: plugin,
                              plugin_id: plugin.id
                          });
                      });
                  }
              });"""

new_store_loop = """              data.plugins.forEach(plugin => {
                  if (plugin.tools && plugin.tools.length > 0) {
                      plugin.tools.forEach(tool => {
                          const installedIds = typeof getInstalledToolIds === 'function' ? getInstalledToolIds() : new Set();
                          if (!installedIds.has(tool.id)) {
                              storeToolsList.push({
                                  ...tool,
                                  plugin_parent: plugin,
                                  plugin_id: plugin.id
                              });
                          }
                      });
                  }
              });"""
store_js = store_js.replace(old_store_loop, new_store_loop)

# The user mentioned: "และเปลี่ยนเป็น v2.0.0"
# This is in main.py, let's just do it in python directly here:
with codecs.open('main.py', 'r', 'utf-8') as f:
    main_py = f.read()
main_py = main_py.replace('APP_VERSION = "1.1.2"', 'APP_VERSION = "2.0.0"')
main_py = main_py.replace('APP_VERSION = "2.0"', 'APP_VERSION = "2.0.0"')
with codecs.open('main.py', 'w', 'utf-8') as f:
    f.write(main_py)

with codecs.open('static/js/store.js', 'w', 'utf-8') as f:
    f.write(store_js)

print("Fixed cross-pollution, duplicates in store, and version.")
