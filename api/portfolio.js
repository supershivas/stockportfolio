// Reads and writes portfolio.json in the GitHub repo.
// Requires GITHUB_TOKEN env var (fine-grained PAT with Contents: read+write for this repo).
const OWNER = 'supershivas'
const REPO = 'stockportfolio'
const FILE_PATH = 'data/portfolio.json'
const BRANCH = 'main'
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`

function headers() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN not configured')
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${API}?ref=${BRANCH}`, { headers: headers() })
      if (r.status === 404) return res.json({ positions: [] })
      if (!r.ok) return res.status(r.status).json({ error: 'read failed' })
      const data = await r.json()
      const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'))
      return res.json(content)
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const encoded = Buffer.from(JSON.stringify(body, null, 2)).toString('base64')

      // Get current SHA (needed for update)
      let sha = undefined
      const existing = await fetch(`${API}?ref=${BRANCH}`, { headers: headers() })
      if (existing.ok) {
        const d = await existing.json()
        sha = d.sha
      }

      const r = await fetch(API, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          message: 'Update portfolio data',
          content: encoded,
          branch: BRANCH,
          ...(sha ? { sha } : {}),
        }),
      })
      if (!r.ok) return res.status(r.status).json({ error: 'write failed' })
      return res.json({ ok: true })
    }

    return res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
