import codecs
import re

# ================================
# 1. Update index.html
# ================================
with codecs.open('templates/index.html', 'r', 'utf-8') as f:
    html = f.read()

# Replace the layout starting from <main class="main-content">
# to add a sidebar.
main_start = '<main class="main-content">'
layout = """
<div style="max-width: 1400px; margin: 0 auto; display: flex; gap: 24px; padding: 24px;">
    <aside style="width: 260px; flex-shrink: 0;" class="sidebar-filters">
        <h3 style="font-size: 14px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Categories</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s; background: var(--bg-secondary);">
                <input type="checkbox" id="fav-filter" class="tag-filter" value="FAVORITE" style="accent-color:var(--accent); display:none;">
                <span>⭐</span> <span style="font-size:14px; font-weight:500;">Favorites</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Document" style="display:none;">
                <span>📄</span> <span style="font-size:14px;">Document & Text</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Image" style="display:none;">
                <span>🖼️</span> <span style="font-size:14px;">Image & Graphic</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Audio" style="display:none;">
                <span>🎵</span> <span style="font-size:14px;">Audio</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Video" style="display:none;">
                <span>🎥</span> <span style="font-size:14px;">Video & Multimedia</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Spreadsheet" style="display:none;">
                <span>📊</span> <span style="font-size:14px;">Spreadsheet & Data</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Archive" style="display:none;">
                <span>📦</span> <span style="font-size:14px;">Archive & Compressed</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Developer" style="display:none;">
                <span>💻</span> <span style="font-size:14px;">Developer & Code</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="E-book" style="display:none;">
                <span>📚</span> <span style="font-size:14px;">E-book</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="Fonts" style="display:none;">
                <span>🅰️</span> <span style="font-size:14px;">Fonts</span>
            </label>
            <label class="category-filter-label" style="cursor:pointer; display:flex; align-items:center; gap:8px; padding: 8px 12px; border-radius: 8px; transition: 0.2s;">
                <input type="checkbox" class="tag-filter" value="3D Models" style="display:none;">
                <span>🧊</span> <span style="font-size:14px;">3D Models</span>
            </label>
        </div>
        <style>
            .category-filter-label:hover { background: var(--bg-secondary); }
            .category-filter-label:has(input:checked) { background: var(--accent); color: #fff; }
            .sidebar-filters { display: none; }
            @media (min-width: 900px) { .sidebar-filters { display: block; } }
            @media (max-width: 899px) { .main-content { max-width: 100%; } }
        </style>
    </aside>
    <main class="main-content" style="padding: 0; max-width: 100%; flex: 1;">
"""

html = html.replace('<main class="main-content">', layout)
html = html.replace('</main>', '</main>\n</div>')

# Remove the old filter-options inside search-container
filter_start = '<div class="filter-options"'
filter_end = '</div>\n        </div>'
idx1 = html.find(filter_start)
idx2 = html.find(filter_end, idx1)
if idx1 != -1 and idx2 != -1:
    html = html[:idx1] + html[idx2+6:]

# Add context menu HTML
context_menu = """
    <!-- Context Menu -->
    <div id="tool-context-menu" style="display:none; position:fixed; background:var(--bg-primary); border:1px solid var(--border-color); box-shadow:0 8px 24px rgba(0,0,0,0.2); border-radius:8px; padding:8px 0; z-index:9999; min-width:160px;">
        <button id="ctx-info" style="width:100%; text-align:left; padding:8px 16px; background:none; border:none; color:var(--text-primary); cursor:pointer; font-size:14px; display:flex; gap:8px; align-items:center;"><span>ℹ️</span> Info</button>
        <button id="ctx-fav" style="width:100%; text-align:left; padding:8px 16px; background:none; border:none; color:var(--text-primary); cursor:pointer; font-size:14px; display:flex; gap:8px; align-items:center;"><span>⭐</span> Toggle Favorite</button>
        <button id="ctx-uninstall" style="width:100%; text-align:left; padding:8px 16px; background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:14px; display:flex; gap:8px; align-items:center;"><span>🗑️</span> Uninstall</button>
        <button id="ctx-install" style="width:100%; text-align:left; padding:8px 16px; background:none; border:none; color:var(--accent-purple); cursor:pointer; font-size:14px; display:flex; gap:8px; align-items:center; display:none;"><span>📥</span> Install</button>
    </div>
"""
html = html.replace('</body>', context_menu + '</body>')

with codecs.open('templates/index.html', 'w', 'utf-8') as f:
    f.write(html)
