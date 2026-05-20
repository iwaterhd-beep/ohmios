/**
 * Quita el fondo negro del logo y deja alpha real.
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '../assets/images/logo-ohmios.png');

const { data, info } = await sharp(logoPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];

  // Solo fondo negro puro o casi negro (no toca el gris del texto "HMIOS")
  if (r <= 18 && g <= 18 && b <= 18) {
    data[i + 3] = 0;
    continue;
  }

  // Suavizar halos oscuros en bordes del recorte
  if (r <= 35 && g <= 35 && b <= 35) {
    const lum = Math.max(r, g, b);
    data[i + 3] = Math.round((data[i + 3] * lum) / 35);
  }
}

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(logoPath);

console.log(`✓ Logo con transparencia real: ${logoPath}`);
