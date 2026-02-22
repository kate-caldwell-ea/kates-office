/**
 * Convert SVG icons to PNG
 * Run with: node scripts/convert-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

async function convertIcons() {
  const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'));
  
  for (const file of files) {
    const inputPath = path.join(iconsDir, file);
    const outputPath = path.join(iconsDir, file.replace('.svg', '.png'));
    
    // Parse size from filename
    const sizeMatch = file.match(/(\d+)x(\d+)/);
    const size = sizeMatch ? parseInt(sizeMatch[1]) : 96;
    
    try {
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ ${file} → ${file.replace('.svg', '.png')}`);
    } catch (error) {
      console.error(`✗ ${file}: ${error.message}`);
    }
  }
  
  // Generate additional sizes needed for Apple
  const additionalSizes = [16, 32, 167, 180];
  const baseSvg = path.join(iconsDir, 'icon-192x192.svg');
  
  for (const size of additionalSizes) {
    try {
      await sharp(baseSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ icon-${size}x${size}.png: ${error.message}`);
    }
  }
  
  console.log('\n✅ All icons converted!');
}

convertIcons().catch(console.error);
