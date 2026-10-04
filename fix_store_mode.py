import codecs

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

# Fix storeTools push logic
start_store_tools = "                    plugin.tools.forEach(t => {"
end_store_tools = "                    });"
idx1 = code.find(start_store_tools)
idx2 = code.find(end_store_tools, idx1)

if idx1 != -1 and idx2 != -1:
    new_store_tools = """                    plugin.tools.forEach(t => {
                        if (t.mode === currentMode || currentMode === 'convert') {
                            storeTools.push({
                                id: 'store:' + plugin.id + ':' + t.id,
                                title: t.name,
                                desc: t.description,
                                icon: t.icon || plugin.icon || '🧩',
                                color: 'var(--text-tertiary)',
                                active: true,
                                isStore: true,
                                pluginData: plugin,
                                toolData: t
                            });
                        }
                    });"""
    code = code[:idx1] + new_store_tools + code[idx2+23:]

with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
