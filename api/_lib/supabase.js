import { createClient } from '@supabase/supabase-js';

let client = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado. Añade SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.');
  }

  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  return client;
}

export function getPublicUrl(bucket, path) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadToStorage(bucket, path, buffer, contentType) {
  const supabase = getSupabase();

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });

  if (error) throw new Error(error.message);
  return getPublicUrl(bucket, path);
}

export async function downloadFromStorage(bucket, path) {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(error.message);
  return data.text();
}

export async function uploadJsonToStorage(bucket, path, data) {
  const body = JSON.stringify(data, null, 2);
  const buffer = Buffer.from(body, 'utf8');
  return uploadToStorage(bucket, path, buffer, 'application/json');
}
