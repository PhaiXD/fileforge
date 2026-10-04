import codecs
import re

with codecs.open('services/plugin_manager.py', 'r', 'utf-8') as f:
    code = f.read()

local_repo_override = """        # Override for local testing
        local_registry = Path(r"C:\\Users\\ADMIN\\Documents\\GitHub\\fileforge-plugins\\registry.json")
        if local_registry.exists():
            try:
                registry = json.loads(local_registry.read_text("utf-8-sig"))
                cache_path.write_text(json.dumps(registry, indent=2), "utf-8")
                return registry
            except Exception as e:
                print(f"[PluginManager] Failed to read local registry: {e}")
"""

# Insert right after def get_registry
idx = code.find('cache_path = CACHE_DIR / "registry.json"')
if idx != -1:
    code = code[:idx] + local_repo_override + "\n        " + code[idx:]
    with codecs.open('services/plugin_manager.py', 'w', 'utf-8') as f:
        f.write(code)
    print("Modified plugin_manager.py for local testing!")
