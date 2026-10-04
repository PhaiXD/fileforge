import codecs

with codecs.open('static/js/store.js', 'r', 'utf-8') as f:
    code = f.read()

code = code.replace("btn.disabled = false;", "if(btn) btn.disabled = false;")
code = code.replace("btn.innerText = originalText;", "if(btn) btn.innerText = originalText;")

with codecs.open('static/js/store.js', 'w', 'utf-8') as f:
    f.write(code)
