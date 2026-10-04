const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('templates/index.html', 'utf8');
const js = fs.readFileSync('static/js/app.js', 'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously' });
const window = dom.window;
window.localStorage = { getItem: () => null, setItem: () => {} };
window.fetch = () => Promise.resolve({ json: () => Promise.resolve({}) });
window.matchMedia = () => ({ matches: false });
window.HTMLCanvasElement.prototype.getContext = () => {};

const scriptEl = window.document.createElement('script');
scriptEl.textContent = js;
window.document.body.appendChild(scriptEl);

setTimeout(() => {
    // Simulate DOMContentLoaded manually since jsdom might fire it early
    const evt = window.document.createEvent('Event');
    evt.initEvent('DOMContentLoaded', true, true);
    window.document.dispatchEvent(evt);
    
    // Simulate right click on mp4-mp3
    const card = window.document.querySelector('.tool-card[data-tool="mp4-mp3"]');
    if(!card) { console.log('Card not found'); return; }
    
    card.dispatchEvent(new window.Event('contextmenu'));
    console.log('Context menu display:', window.document.getElementById('tool-context-menu').style.display);
    
    // Simulate click on ctx-info
    const btn = window.document.getElementById('ctx-info');
    btn.click();
    
    // Check if modal exists
    const modal = window.document.querySelector('.modal-overlay');
    console.log('Modal exists:', !!modal);
}, 500);
