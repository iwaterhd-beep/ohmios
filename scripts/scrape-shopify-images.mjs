/**
 * Extrae todas las imágenes disponibles de Shopify
 */
import fs from 'fs';

const BASE = 'https://grupo-arkos-ohmios-energia.myshopify.com';
const found = new Map();

function add(url, source) {
  if (!url || !url.includes('cdn.shopify.com')) return;
  const clean = url.split('?')[0];
  if (!found.has(clean)) found.set(clean, { url, source });
}

const html = await (await fetch(BASE + '/')).text();

// Todas las URLs en el HTML
for (const m of html.matchAll(/https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\\s<>]+/g)) {
  add(m[0], 'html');
}

// JSON embebido en scripts
for (const m of html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)) {
  try {
    const walk = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      if (typeof obj === 'string' && obj.includes('cdn.shopify.com')) add(obj, `json:${path}`);
      if (Array.isArray(obj)) obj.forEach((v, i) => walk(v, `${path}[${i}]`));
      else Object.entries(obj).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
    };
    walk(JSON.parse(m[1]));
  } catch { /* ignore */ }
}

// Productos con todas las imágenes
const { products = [] } = await (await fetch(`${BASE}/products.json?limit=50`)).json();
for (const p of products) {
  for (const img of p.images || []) add(img.src, `product:${p.title}`);
  if (p.body_html) {
    for (const m of p.body_html.matchAll(/https:\/\/cdn\.shopify\.com\/[^"'\\s<>]+/g)) {
      add(m[0], `product-html:${p.title}`);
    }
  }
}

// Páginas
try {
  const { pages = [] } = await (await fetch(`${BASE}/pages.json`)).json();
  for (const page of pages) {
    if (page.body_html) {
      for (const m of page.body_html.matchAll(/https:\/\/cdn\.shopify\.com\/[^"'\\s<>]+/g)) {
        add(m[0], `page:${page.title}`);
      }
    }
  }
} catch { /* ignore */ }

// Meta og:image
for (const m of html.matchAll(/property="og:image"\s+content="([^"]+)"/g)) add(m[1], 'og:image');

const list = [...found.values()];
console.log(JSON.stringify(list, null, 2));
console.error(`\nTotal: ${list.length} imágenes`);
