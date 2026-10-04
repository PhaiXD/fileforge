import json
import os
import glob

repo_dir = r"c:\Users\ADMIN\Documents\GitHub\fileforge-plugins"
registry_path = os.path.join(repo_dir, "registry.json")

with open(registry_path, "r", encoding="utf-8-sig") as f:
    registry = json.load(f)

for plugin in registry["plugins"]:
    plugin_id = plugin["id"]
    manifest_path = os.path.join(repo_dir, "plugins", plugin_id, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8-sig") as fm:
            manifest = json.load(fm)
            if "tools" in manifest:
                plugin["tools"] = manifest["tools"]

with open(registry_path, "w", encoding="utf-8") as f:
    json.dump(registry, f, indent=2, ensure_ascii=False)

print("Updated registry.json with tools!")
