import codecs
import re

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    app_js = f.read()

# 1. Show Uninstall button for all tools
pattern_ctx = r'document\.getElementById\(\'ctx-uninstall\'\)\.style\.display = ctxToolId\.startsWith\(\'plugin:\'\) \? \'flex\' : \'none\';'
app_js = re.sub(pattern_ctx, "document.getElementById('ctx-uninstall').style.display = 'flex';", app_js)

# 2. Update Uninstall click handler
pattern_uninstall = r'document\.getElementById\(\'ctx-uninstall\'\)\.onclick = \(e\) => \{.*?document\.getElementById\(\'tool-context-menu\'\)\.style\.display = \'none\';.*?if \(ctxToolId && ctxToolId\.startsWith\(\'plugin:\'\)\) \{.*?const pluginId = parts\[1\];.*?if\(typeof uninstallPlugin === \'function\'\) uninstallPlugin\(pluginId\);.*?\} else \{.*?customAlert\(\'This is a built-in tool and cannot be uninstalled\.\', \'Notice\'\);.*?\}'
# The above pattern might fail if linebreaks differ. Let's just do string replacement on the exact block.
old_uninstall = """document.getElementById('ctx-uninstall').onclick = (e) => {
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
# Wait, in fix_everything.py it was:
old_uninstall2 = """document.getElementById('ctx-uninstall').onclick = (e) => {
                    document.getElementById('tool-context-menu').style.display = 'none';
                    if (ctxToolId && ctxToolId.startsWith('plugin:')) {
                        const parts = ctxToolId.split(':');
                        const pluginId = parts[1];
                        if(typeof uninstallPlugin === 'function') uninstallPlugin(pluginId);
                    } else {
                        customAlert('This is a built-in tool and cannot be uninstalled.', 'Notice');
                    }
                }"""
# Just replace any occurrence of customAlert('This is a built-in tool...
new_uninstall = """document.getElementById('ctx-uninstall').onclick = (e) => {
    document.getElementById('tool-context-menu').style.display = 'none';
    if (!ctxToolId) return;
    
    if (ctxToolId.startsWith('plugin:')) {
        const parts = ctxToolId.split(':');
        const pluginId = parts[1];
        if(typeof uninstallPlugin === 'function') uninstallPlugin(pluginId);
    } else {
        customConfirm('Are you sure you want to remove this built-in tool?', 'Remove Tool', '🗑️').then(ok => {
            if (ok) {
                let hidden = JSON.parse(localStorage.getItem('fileforge_hidden_native') || '[]');
                if (!hidden.includes(ctxToolId)) {
                    hidden.push(ctxToolId);
                    localStorage.setItem('fileforge_hidden_native', JSON.stringify(hidden));
                }
                renderTools();
            }
        });
    }
};"""

app_js = re.sub(
    r'document\.getElementById\(\'ctx-uninstall\'\)\.onclick = \(e\) => \{.*?customAlert\(\'This is a built-in tool and cannot be uninstalled\.\', \'Notice\'\);\s*\}\s*\};?',
    new_uninstall,
    app_js, flags=re.DOTALL
)

# 3. Filter nativeTools based on localStorage
old_native = "let nativeTools = window.TOOLS[currentMode] || [];"
new_native = """let nativeTools = window.TOOLS[currentMode] || [];
    try {
        const hiddenNative = JSON.parse(localStorage.getItem('fileforge_hidden_native') || '[]');
        nativeTools = nativeTools.filter(t => !hiddenNative.includes(t.id));
    } catch(e) {}"""
app_js = app_js.replace(old_native, new_native)

# Write it back
with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(app_js)
    
print("Updated native uninstall logic")
