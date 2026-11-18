const fs = require('fs');
const path = require('path');

const FILE = 'story.js';
const START = '/* I18N-DATA:START (gerado por build-i18n.js — não editar) */';
const END = '/* I18N-DATA:END */';

// Lê lang/*.json (ficheiros vazios contam como {})
const langs = {};
fs.readdirSync('lang').filter(f => f.endsWith('.json')).sort().forEach(f => {
  const txt = fs.readFileSync(path.join('lang', f), 'utf8').trim();
  langs[path.basename(f, '.json')] = txt ? JSON.parse(txt) : {};
});

// Aviso de chaves em falta face ao PT
const ptKeys = Object.keys(langs.pt || {});
Object.keys(langs).forEach(l => {
  if (l === 'pt') return;
  const missing = ptKeys.filter(k => !langs[l][k]);
  console.log(l + ': ' + (ptKeys.length - missing.length) + '/' + ptKeys.length + ' chaves');
});

// \u003c evita que "</script>" num texto parta o HTML
const json = JSON.stringify(langs).replace(/</g, '\\u003c');
const block = START + '\nsetup.i18n = ' + json + ';\n' + END;

let src = fs.readFileSync(FILE, 'utf8');
const a = src.indexOf(START), b = src.indexOf(END);
if (a !== -1 && b !== -1) src = src.slice(0, a) + block + src.slice(b + END.length);
else src = src.replace(/\s*$/, '\n\n') + block + '\n';
fs.writeFileSync(FILE, src);
console.log('story.js atualizado.');