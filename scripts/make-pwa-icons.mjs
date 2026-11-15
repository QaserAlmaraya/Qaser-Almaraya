// Builds the installable-app icons in public/icons/ from the existing brand mark.
// The logo artwork is only resized and placed on a white square; it is never redrawn.
// Run: node scripts/make-pwa-icons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'public/assets/logo-mark-hero.png');
const OUT = path.join(root, 'public/icons');
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// `fill` = share of the square the logo may occupy. Maskable icons are cropped
// to a circle of 80% diameter by Android, so the logo stays well inside it.
async function make(name, size, fill) {
  const box = Math.round(size * fill);
  const logo = await sharp(SRC).resize(box, box, { fit: 'inside', kernel: 'lanczos3' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
    .composite([{ input: logo, gravity: 'centre' }])
    .flatten({ background: WHITE })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, name));
}

await make('icon-192.png', 192, 0.76);
await make('icon-512.png', 512, 0.76);
await make('icon-maskable-512.png', 512, 0.52);
console.log('icons written to public/icons/');
