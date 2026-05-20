import { checkCredentials, createToken } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body || {};

  if (!checkCredentials(email, password)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  return res.status(200).json({ token: createToken() });
}
