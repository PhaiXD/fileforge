import codecs
import re

with codecs.open('templates/index.html', 'r', 'utf-8') as f:
    html = f.read()

# I will revert the previous layout wrap and do it correctly.
# First, let's remove the wrapper div and aside that I added.
wrapper_start = '<div style="max-width: 1400px; margin: 0 auto; display: flex; gap: 24px; padding: 24px;">'
aside_start = '<aside style="width: 260px; flex-shrink: 0;" class="sidebar-filters">'
aside_end = '</aside>'
idx1 = html.find(wrapper_start)
if idx1 != -1:
    idx2 = html.find(aside_end, idx1) + len(aside_end)
    # The main tag was modified to: <main class="main-content" style="padding: 0; max-width: 100%; flex: 1;">
    # Let's just find that main tag
    main_tag = '<main class="main-content" style="padding: 0; max-width: 100%; flex: 1;">'
    idx3 = html.find(main_tag, idx2)
    if idx3 != -1:
        # We replace from idx1 to idx3 + len(main_tag) with just <main class="main-content">
        html = html[:idx1] + '<main class="main-content">\n' + html[idx3+len(main_tag):]

# Also remove the closing </div> at the end of the file
end_div = '</main>\\n</div>'
html = html.replace('</main>\n</div>', '</main>')

# Now, we want the layout to be:
# <main class="main-content">
#   <section class="hero">...</section>
#   <div id="search-container">...</div> (remove the old filters from here)
#   <div class="mode-toggle">...</div>
#   <div class="layout-container" style="display:flex; gap:24px; margin-top:24px;">
#       <aside class="sidebar-filters" style="width:260px; flex-shrink:0; position:sticky; top:24px; height:max-content; padding:20px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--border-color);">
#           ... Categories with checkboxes ...
#       </aside>
#       <section id="tool-grid-section" style="flex:1;">
#           ... Your Tools ...
#       </section>
#   </div>
# </main>

# 1. Remove old filter options in search-container (if they still exist)
filter_start = '<div class="filter-options"'
filter_end = '</div>\n        </div>\n        <div id="search-results"'
if filter_start in html:
    html = re.sub(r'<div class="filter-options".*?</div>\s*</div>', '</div>', html, flags=re.DOTALL)

# 2. Wrap tool-grid-section and add the sidebar
tool_grid_start = '<section id="tool-grid-section">'
sidebar_html = """
        <div class="layout-container" style="display:flex; gap:24px; margin-top:24px; align-items:flex-start;">
            <aside class="sidebar-filters" style="width:260px; flex-shrink:0; position:sticky; top:24px; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:12px; padding:16px;">
                <h3 style="font-size: 14px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Categories</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" id="fav-filter" class="tag-filter" value="FAVORITE" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>⭐</span> <span style="font-size:14px; font-weight:500;">Favorites</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Document" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>📄</span> <span style="font-size:14px;">Document & Text</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Image" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>🖼️</span> <span style="font-size:14px;">Image & Graphic</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Audio" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>🎵</span> <span style="font-size:14px;">Audio</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Video" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>🎥</span> <span style="font-size:14px;">Video & Multimedia</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Spreadsheet" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>📊</span> <span style="font-size:14px;">Spreadsheet & Data</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Archive" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>📦</span> <span style="font-size:14px;">Archive & Compressed</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Developer" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>💻</span> <span style="font-size:14px;">Developer & Code</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="E-book" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>📚</span> <span style="font-size:14px;">E-book</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="Fonts" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>🅰️</span> <span style="font-size:14px;">Fonts</span>
                    </label>
                    <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 8px; transition: 0.2s;">
                        <input type="checkbox" class="tag-filter" value="3D Models" style="accent-color:var(--accent); width:16px; height:16px; cursor:pointer;">
                        <span>🧊</span> <span style="font-size:14px;">3D Models</span>
                    </label>
                </div>
                <style>
                    .category-filter-label:hover { background: var(--bg-secondary); }
                    @media (max-width: 899px) { 
                        .layout-container { flex-direction: column; }
                        .sidebar-filters { width: 100% !important; position: static !important; }
                    }
                </style>
            </aside>
            <section id="tool-grid-section" style="flex:1; min-width:0;">
"""
html = html.replace('<section id="tool-grid-section">', sidebar_html)

# The section ends at </section>, we need to close the layout-container too.
idx = html.find('</section>', html.find('<section id="tool-grid-section"'))
if idx != -1:
    html = html[:idx] + '</section>\n        </div>' + html[idx+10:]

with codecs.open('templates/index.html', 'w', 'utf-8') as f:
    f.write(html)
