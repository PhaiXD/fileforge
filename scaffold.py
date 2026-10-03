import os
import json
from pathlib import Path

repo_dir = Path(r'C:\Users\ADMIN\Documents\GitHub\fileforge-plugins')
plugins_dir = repo_dir / 'plugins'
plugins_dir.mkdir(exist_ok=True)

registry = {
    "schema_version": "1.0.0",
    "plugins": []
}

def create_plugin(id_name, name, desc, icon, category):
    p_dir = plugins_dir / id_name
    p_dir.mkdir(exist_ok=True)
    manifest = {
        "id": id_name,
        "name": name,
        "version": "1.0.0",
        "description": desc,
        "author": "PhaiXD",
        "icon": icon,
        "min_core_version": "2.0.0",
        "tools": []
    }
    (p_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    (p_dir / 'plugin.py').write_text('# Plugin logic here\n', encoding='utf-8')
    
    registry['plugins'].append({
        "id": id_name,
        "name": name,
        "version": "1.0.0",
        "description": desc,
        "author": "PhaiXD",
        "icon": icon,
        "category": category,
        "download_url": f"https://github.com/PhaiXD/fileforge-plugins/releases/download/{id_name}-v1.0.0/{id_name}.zip"
    })

create_plugin('image-tools', 'Image Tools (Essential)', 'Core image conversions', '🖼️', 'image')
create_plugin('image-extra', 'Image Tools (Extra)', 'Additional formats like SVG, ICO', '📐', 'image')
create_plugin('pdf-tools', 'PDF Tools', 'All PDF tools', '📄', 'pdf-docs')
create_plugin('media-tools', 'Media Downloader', 'YouTube, MP4, MP3, AV1', '🎬', 'video-audio')
create_plugin('media-extra', 'Media Extra', 'Additional media formats', '🎞️', 'video-audio')
create_plugin('ai-tools', 'AI Tools', 'Gemini summarization', '🤖', 'ai')

(repo_dir / 'registry.json').write_text(json.dumps(registry, indent=2), encoding='utf-8')
print('Scaffolded fileforge-plugins')
