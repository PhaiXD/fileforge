import codecs

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

# First, declare the context menu globals at the top of DOMContentLoaded
start_dom = "document.addEventListener('DOMContentLoaded', () => {"
if "let ctxToolId = null;" not in code:
    code = code.replace(start_dom, start_dom + "\n    let ctxToolId = null;\n    let ctxIsStore = false;")

# Second, attach the context menu button handlers at the end of DOMContentLoaded
end_dom = "    console.log('🔥 FileForge initialized');\n});"
handlers = """
    // Context Menu Handlers
    const ctxMenu = document.getElementById('tool-context-menu');
    document.addEventListener('click', () => { if(ctxMenu) ctxMenu.style.display = 'none'; });
    
    if (ctxMenu) {
        document.getElementById('ctx-info').onclick = (e) => {
            if (ctxToolId) {
                if(typeof showToolInfo === 'function') showToolInfo(ctxToolId, e);
            }
        };
        document.getElementById('ctx-fav').onclick = (e) => {
            if (ctxToolId) {
                if(typeof toggleFavorite === 'function') toggleFavorite(ctxToolId, e);
            }
        };
        document.getElementById('ctx-uninstall').onclick = (e) => {
            if (ctxToolId && ctxToolId.startsWith('plugin:')) {
                const pluginId = ctxToolId.split(':')[1];
                if(typeof uninstallPlugin === 'function') uninstallPlugin(pluginId);
            }
        };
        document.getElementById('ctx-install').onclick = (e) => {
            if (ctxToolId && ctxToolId.startsWith('store:')) {
                const pluginId = ctxToolId.split(':')[1];
                if (typeof installPlugin === 'function') installPlugin(pluginId);
            }
        };
    }
"""
if "// Context Menu Handlers" not in code:
    code = code.replace(end_dom, handlers + "\n" + end_dom)

with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
