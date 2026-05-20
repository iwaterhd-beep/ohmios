const OWNER = process.env.GITHUB_OWNER || 'iwaterhd-beep';
const REPO = process.env.GITHUB_REPO || 'ohmios';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function getFile(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: githubHeaders() }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub GET failed: ${err}`);
  }

  const data = await res.json();
  const text = Buffer.from(data.content, 'base64').toString('utf8');
  return { content: text, sha: data.sha };
}

export async function saveFile(path, content, message, sha = null, alreadyBase64 = false) {
  const body = {
    message: message || `CMS: actualizar ${path}`,
    content: alreadyBase64 ? content : Buffer.from(content, 'utf8').toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT failed: ${err}`);
  }

  return res.json();
}

export function isGitHubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN);
}
