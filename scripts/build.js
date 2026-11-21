const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DIST_DIR = path.join(PUBLIC_DIR, 'dist');
const KEY = [0x5a, 0x3c, 0x71, 0x19, 0xa3];

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

function obfuscateJs(source) {
  const raw = Buffer.from(source, 'utf8');
  const xored = Buffer.allocUnsafe(raw.length);
  for (let i = 0; i < raw.length; i++) {
    xored[i] = raw[i] ^ KEY[i % KEY.length];
  }
  const b64 = xored.toString('base64');
  return `(function(){var _d="${b64}",_k=[90,60,113,25,163],_b=atob(_d),_u=new Uint8Array(_b.length);for(var i=0;i<_b.length;i++)_u[i]=_b.charCodeAt(i)^_k[i%_k.length];(0,eval)(new TextDecoder("utf-8").decode(_u));})();\n`;
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/;\s*/g, ';');
}

const jsFiles = ['app.js', 'icons.js', 'i18n.js', 'minigames.js', 'role-balance.js'];
jsFiles.forEach(file => {
  const srcPath = path.join(PUBLIC_DIR, file);
  if (!fs.existsSync(srcPath)) {
    console.warn('[build] Пропущено (не знайдено):', file);
    return;
  }
  const src = fs.readFileSync(srcPath, 'utf8');
  const out = obfuscateJs(src);
  fs.writeFileSync(path.join(DIST_DIR, file), out, 'utf8');
  console.log(`[build] Закрито та зібрано ${file} (${src.length} -> ${out.length} bytes)`);
});

const cssSrc = path.join(PUBLIC_DIR, 'style.css');
if (fs.existsSync(cssSrc)) {
  const css = fs.readFileSync(cssSrc, 'utf8');
  const outCss = minifyCss(css);
  fs.writeFileSync(path.join(DIST_DIR, 'style.css'), outCss, 'utf8');
  console.log(`[build] Мініфіковано style.css (${css.length} -> ${outCss.length} bytes)`);
}
