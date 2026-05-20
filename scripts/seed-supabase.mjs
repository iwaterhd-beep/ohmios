/**
 * Sube el contenido JSON inicial a Supabase Storage.
 * Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);
const files = ['settings', 'home', 'nosotros', 'services', 'projects'];

for (const name of files) {
  const filePath = path.join('content', `${name}.json`);
  const body = fs.readFileSync(filePath, 'utf8');

  const { error } = await supabase.storage
    .from('content')
    .upload(`${name}.json`, body, {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    console.error(`Error subiendo ${name}.json:`, error.message);
    process.exit(1);
  }

  console.log(`✓ ${name}.json`);
}

console.log('Contenido inicial subido a Supabase.');
