/**
 * PWA Icon Generator Script
 * Run with: node scripts/generate-icons.js
 * 
 * This creates placeholder icons. For production, replace with proper designed icons.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

// Kate's Office colors
const SAGE_GREEN = '#779977';
const CREAM = '#FFFDF7';
const WHITE = '#FFFFFF';

// Create SVG icon with sparkle design
function createIconSVG(size, maskable = false) {
  const padding = maskable ? size * 0.1 : 0;
  const iconSize = size - (padding * 2);
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Sparkle path scaled to icon size
  const sparkleScale = iconSize / 24;
  const sparkleOffset = (size - (24 * sparkleScale)) / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${maskable ? CREAM : SAGE_GREEN}" rx="${maskable ? 0 : size * 0.22}"/>
  
  <!-- Inner circle for maskable -->
  ${maskable ? `<circle cx="${centerX}" cy="${centerY}" r="${iconSize * 0.4}" fill="${SAGE_GREEN}"/>` : ''}
  
  <!-- Sparkle icon -->
  <g transform="translate(${sparkleOffset}, ${sparkleOffset}) scale(${sparkleScale})">
    <path 
      d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" 
      fill="${WHITE}" 
      stroke="none"
    />
    <path 
      d="M18.5 12l.75 2.25L21.5 15l-2.25.75-.75 2.25-.75-2.25L15.5 15l2.25-.75.75-2.25z" 
      fill="${WHITE}" 
      opacity="0.8"
    />
    <path 
      d="M5.5 14l.5 1.5L7.5 16l-1.5.5-.5 1.5-.5-1.5L3.5 16l1.5-.5.5-1.5z" 
      fill="${WHITE}" 
      opacity="0.6"
    />
  </g>
</svg>`;
}

// Create shortcut icons
function createShortcutSVG(type) {
  const size = 96;
  const icons = {
    kanban: `<rect x="6" y="4" width="5" height="16" rx="1" fill="${WHITE}"/>
             <rect x="13" y="4" width="5" height="12" rx="1" fill="${WHITE}"/>
             <rect x="20" y="4" width="5" height="8" rx="1" fill="${WHITE}"/>`,
    calendar: `<rect x="4" y="6" width="24" height="20" rx="2" fill="none" stroke="${WHITE}" stroke-width="2"/>
               <path d="M4 12h24" stroke="${WHITE}" stroke-width="2"/>
               <rect x="8" y="2" width="2" height="6" rx="1" fill="${WHITE}"/>
               <rect x="22" y="2" width="2" height="6" rx="1" fill="${WHITE}"/>`,
    chat: `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="${WHITE}" stroke-width="2"/>`
  };
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${SAGE_GREEN}" rx="20"/>
  <g transform="translate(34, 34) scale(1.2)">
    ${icons[type]}
  </g>
</svg>`;
}

// Create badge icon (smaller, simple)
function createBadgeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${SAGE_GREEN}" rx="${size * 0.2}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.3}" fill="${WHITE}"/>
</svg>`;
}

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate regular icons
for (const size of sizes) {
  const svg = createIconSVG(size, false);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
}

// Generate maskable icons
for (const size of maskableSizes) {
  const svg = createIconSVG(size, true);
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.svg`), svg);
  console.log(`Generated icon-maskable-${size}x${size}.svg`);
}

// Generate shortcut icons
for (const type of ['kanban', 'calendar', 'chat']) {
  const svg = createShortcutSVG(type);
  fs.writeFileSync(path.join(iconsDir, `shortcut-${type}.svg`), svg);
  console.log(`Generated shortcut-${type}.svg`);
}

// Generate badge icon
const badge = createBadgeSVG(72);
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.svg'), badge);
console.log('Generated badge-72x72.svg');

console.log('\n✅ All SVG icons generated!');
console.log('\n📝 Note: For production, convert SVGs to PNGs using:');
console.log('   npx sharp-cli --input public/icons/*.svg --output public/icons/ --format png');
console.log('\nOr use an online tool like https://svgtopng.com/');
