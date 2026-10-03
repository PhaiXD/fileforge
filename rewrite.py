import sys

with open('templates/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

end_idx = 0
for i, line in enumerate(lines):
    if '<!-- ==================== TOOL PANELS ====================' in line:
        end_idx = i
        break

with open('temp.html', 'r', encoding='utf-8') as f:
    new_html = f.read()

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
    for line in lines[end_idx:]:
        f.write(line)
