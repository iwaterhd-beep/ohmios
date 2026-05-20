/**
 * Descarga media externa (Shopify) a assets/ y actualiza content/*.json
 * Uso: node scripts/migrate-local-media.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

const MIGRATIONS = [
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/videos/c/vp/122662cb82a544e085df6c2423007060/122662cb82a544e085df6c2423007060.HD-720p-4.5Mbps-65724090.mp4?v=0',
    to: 'assets/videos/cms/hero-clinica.mp4',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/PHOTO-2025-10-20-13-35-28.jpg?v=1766495607&width=1920',
    to: 'assets/images/cms/hero-poster.jpg',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/1748780327290.jpg?v=1767125033&width=1200',
    to: 'assets/images/cms/reforma-vivienda.jpg',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/PHOTO-2025-10-20-13-35-30_2.jpg?v=1766486544&width=1920',
    to: 'assets/images/cms/obra-instalacion.jpg',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/PHOTO-2025-10-20-13-35-29.jpg?v=1766486518&width=1200',
    to: 'assets/images/cms/instalaciones-sevilla.jpg',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/1748780114309_6800fe8a-5f47-4639-8000-5fc2c38ab992.jpg?v=1767124713&width=1200',
    to: 'assets/images/cms/instalacion-electrica.jpg',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/1748780570953.jpg?v=1767124955&width=1200',
    to: 'assets/images/cms/reforma-bano.jpg',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/1748780184433_6115e6e7-1b81-4e2e-a4f1-899d8b27f8a3.jpg?v=1767125258&width=1200',
    to: 'assets/images/cms/reforma-cocina.jpg',
  },
  {
    from: 'https://grupo-arkos-ohmios-energia.myshopify.com/cdn/shop/files/A4_Horizontal_portafolio_minimalista_amarillo.png?v=1767038964&width=1200',
    to: 'assets/images/cms/proyecto-monolito.png',
  },
];

function publicPath(relativePath) {
  return `/${relativePath.replace(/\\/g, '/')}`;
}

async function download(url, dest) {
  const dir = path.dirname(dest);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(dest)) {
    console.log(`↷ Ya existe: ${path.relative(ROOT, dest)}`);
    return;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  console.log(`✓ ${path.relative(ROOT, dest)} (${Math.round(buffer.length / 1024)} KB)`);
}

function replaceInObject(obj, map) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return map.has(obj) ? map.get(obj) : obj;
  }
  if (Array.isArray(obj)) return obj.map((item) => replaceInObject(item, map));
  if (typeof obj === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = replaceInObject(value, map);
    }
    return out;
  }
  return obj;
}

const urlMap = new Map();

for (const { from, to } of MIGRATIONS) {
  const abs = path.join(ROOT, to);
  await download(from, abs);
  urlMap.set(from, publicPath(to));
}

const contentFiles = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));

for (const file of contentFiles) {
  const filePath = path.join(CONTENT_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = replaceInObject(data, urlMap);
  fs.writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`✓ Actualizado content/${file}`);
}

console.log('\nMigración completada. Media alojada en assets/.');
