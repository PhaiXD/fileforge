import codecs

with codecs.open('static/js/app.js', 'r', 'utf-8') as f:
    code = f.read()

# Remove the old .tool-card event listener injection
start_events = "    // Click and Context Menu for ALL cards"
end_events = "    document.querySelectorAll('.tool-card').forEach(card => {"
idx1 = code.find(start_events)

if idx1 != -1:
    # Find the end of the forEach block
    end_block = "        });\\n    });"
    # Actually it's better to just replace the whole section starting at // Click and Context Menu for ALL cards
    # Let's find exactly what to replace by finding the start and end of that section
    pass

# We will just rewrite the event delegation properly using replace
start_delegation = "    // Click and Context Menu for ALL cards"
end_delegation_block = "        });\n    });\n"
idx_start = code.find(start_delegation)
if idx_start != -1:
    idx_end = code.find(end_delegation_block, idx_start) + len(end_delegation_block)
    
    new_delegation = """    // Event delegation for tool cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.tool-card');
        if (card && !card.classList.contains('disabled')) {
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
        }
    });

    document.addEventListener('contextmenu', (e) => {
        const card = e.target.closest('.tool-card');
        if (card) {
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
        }
    });
"""
    code = code[:idx_start] + new_delegation + code[idx_end:]


with codecs.open('static/js/app.js', 'w', 'utf-8') as f:
    f.write(code)
