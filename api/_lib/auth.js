function getAdminSecret() {
  return process.env.ADMIN_SECRET || 'ohmios-cms-internal-secret';
}

export function createToken() {
  const secret = getAdminSecret();

  const payload = {
    exp: Date.now() + 24 * 60 * 60 * 1000,
    k: secret,
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;

  const secret = getAdminSecret();
  if (!secret) return false;

  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString('utf8'));
    if (Date.now() > payload.exp) return false;
    return payload.k === secret;
  } catch {
    return false;
  }
}

export function checkCredentials(email, password) {
  const expectedEmail = (process.env.ADMIN_EMAIL || 'ohmios@admin.com').toLowerCase().trim();
  const expectedPassword = process.env.ADMIN_PASSWORD || '9999';
  const givenEmail = String(email || '').toLowerCase().trim();
  return givenEmail === expectedEmail && password === expectedPassword;
}
