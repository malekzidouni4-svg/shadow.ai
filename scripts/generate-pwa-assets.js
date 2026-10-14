import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="coreGlow" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background with subtle border -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#38bdf8" stroke-opacity="0.25" stroke-width="4" />

  <!-- Outer ambient glow circle -->
  <circle cx="256" cy="240" r="140" fill="#38bdf8" fill-opacity="0.12" filter="url(#glow)" />

  <!-- Geometric Neural Prism Symbol -->
  <g transform="translate(256, 240)" filter="url(#glow)">
    <!-- Outer Hexagram Points -->
    <polygon points="0,-130 112,-65 112,65 0,130 -112,65 -112,-65" fill="#030712" fill-opacity="0.8" stroke="url(#neonCyan)" stroke-width="6" stroke-linejoin="round" />
    <!-- Inner Core Prism -->
    <polygon points="0,-80 70,-40 70,40 0,80 -70,40 -70,-40" fill="url(#coreGlow)" fill-opacity="0.3" stroke="#38bdf8" stroke-width="4" stroke-linejoin="round" />
    <!-- Center Core Node -->
    <circle cx="0" cy="0" r="28" fill="#38bdf8" />
    <circle cx="0" cy="0" r="14" fill="#ffffff" />
    <!-- Connecting neural rays -->
    <line x1="0" y1="-130" x2="0" y2="-80" stroke="#38bdf8" stroke-width="4" />
    <line x1="112" y1="65" x2="70" y2="40" stroke="#38bdf8" stroke-width="4" />
    <line x1="-112" y1="65" x2="-70" y2="40" stroke="#38bdf8" stroke-width="4" />
  </g>

  <!-- App Title Typography -->
  <text x="256" y="440" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff" letter-spacing="3">
    shadow<tspan fill="#38bdf8">.ai</tspan>
  </text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());
console.log('✅ Created public/icon.svg');

// PNG Builder Helper using pure Node.js
function buildPng(width, height, pixelShader) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelShader(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const toCrc = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Shader function for rendering the glowing logo
function renderShadowShader(x, y, width, height, isMaskable = false) {
  const cx = width / 2;
  const cy = isMaskable ? height / 2 : height * 0.48;
  const dx = (x - cx) / (width / 2);
  const dy = (y - cy) / (height / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: dark navy #020617 to #0f172a
  let r = Math.round(2 + (15 - 2) * (1 - Math.min(dist, 1)));
  let g = Math.round(6 + (23 - 6) * (1 - Math.min(dist, 1)));
  let b = Math.round(23 + (42 - 23) * (1 - Math.min(dist, 1)));
  let a = 255;

  // Scale scale factor (maskable needs 15% inner padding)
  const scale = isMaskable ? 0.65 : 0.85;

  const ndx = dx / scale;
  const ndy = dy / scale;
  const ndist = Math.sqrt(ndx * ndx + ndy * ndy);

  // Ambient glow
  if (ndist < 0.9) {
    const glowIntensity = Math.max(0, 1 - ndist / 0.9);
    r = Math.min(255, Math.round(r + 40 * glowIntensity));
    g = Math.min(255, Math.round(g + 140 * glowIntensity));
    b = Math.min(255, Math.round(b + 220 * glowIntensity));
  }

  // Hexagon/Diamond outer rim (approximate polygon)
  const angle = Math.atan2(ndy, ndx);
  const hexDist = ndist * (Math.cos(angle % (Math.PI / 3) - Math.PI / 6));
  
  if (hexDist > 0.42 && hexDist < 0.52) {
    // Outer cyan ring
    r = 56;
    g = 189;
    b = 248;
  } else if (hexDist > 0.22 && hexDist < 0.30) {
    // Inner purple/blue ring
    r = 129;
    g = 140;
    b = 248;
  } else if (ndist < 0.12) {
    // White glowing core
    r = 255;
    g = 255;
    b = 255;
  } else if (ndist < 0.18) {
    // Core cyan halo
    r = 56;
    g = 189;
    b = 248;
  }

  return [r, g, b, a];
}

// Generate the icons
const pwa192 = buildPng(192, 192, (x, y, w, h) => renderShadowShader(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
console.log('✅ Created public/pwa-192x192.png');

const pwa512 = buildPng(512, 512, (x, y, w, h) => renderShadowShader(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
console.log('✅ Created public/pwa-512x512.png');

const pwaMaskable = buildPng(512, 512, (x, y, w, h) => renderShadowShader(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);
console.log('✅ Created public/pwa-maskable-512x512.png');

const appleTouchIcon = buildPng(180, 180, (x, y, w, h) => renderShadowShader(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);
console.log('✅ Created public/apple-touch-icon.png');

const favicon = buildPng(32, 32, (x, y, w, h) => renderShadowShader(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);
console.log('✅ Created public/favicon.ico');

console.log('🎉 All PWA assets generated successfully in public/');
