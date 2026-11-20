// Генерація іконок PWA (icons/icon.svg, icons/icon-192.png, icons/icon-512.png) без зовнішніх залежностей
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0" stop-color="#f59e0b"/>
      <stop offset="0.55" stop-color="#92400e"/>
      <stop offset="1" stop-color="#0f172a"/>
    </radialGradient>
  </defs>
  <rect width="128" height="128" rx="26" fill="url(#bg)" stroke="#111" stroke-width="6"/>
  <ellipse cx="64" cy="70" rx="44" ry="12" fill="#18181b" stroke="#111" stroke-width="5"/>
  <path d="M36 70 Q38 34 64 34 Q90 34 92 70 Z" fill="#27272a" stroke="#111" stroke-width="5"/>
  <rect x="37" y="58" width="54" height="8" fill="#dc2626"/>
  <text x="64" y="108" font-family="Impact,Arial Black,sans-serif" font-size="24" text-anchor="middle" fill="#fde047" stroke="#111" stroke-width="1.5">MAFIA</text>
</svg>`;
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg);

// Мінімальний генератор PNG (RGBA) із силуетом капелюха мафії
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function makePng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    const ny = (y / size) * 2 - 1;
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 2 - 1;
      const d = Math.hypot(nx, ny);
      let r = 17, g = 20, b = 28;
      if (d < 0.88) {
        const k = Math.max(0, 1 - d / 0.88);
        r = Math.round(25 + 215 * k);
        g = Math.round(18 + 135 * k);
        b = Math.round(14 + 20 * k);
      }
      // Криси капелюха
      const brim = (nx * nx) / (0.68 * 0.68) + ((ny - 0.12) * (ny - 0.12)) / (0.17 * 0.17) <= 1;
      // Тулія капелюха
      const crown = Math.abs(nx) < 0.42 && ny > -0.45 && ny <= 0.12 && (nx * nx) / (0.44 * 0.44) + ((ny - 0.12) * (ny - 0.12)) / (0.56 * 0.56) <= 1;
      const band = Math.abs(nx) < 0.42 && ny > -0.02 && ny <= 0.09;
      if (brim || crown) { r = 28; g = 28; b = 34; }
      if (band) { r = 220; g = 38; b = 38; }
      const p = row + 1 + x * 4;
      raw[p] = r; raw[p + 1] = g; raw[p + 2] = b; raw[p + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), makePng(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), makePng(512));
console.log('Generated icons/icon.svg, icons/icon-192.png, icons/icon-512.png');
