import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import YAML from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

const DATA_DIR = '/data'
const CONFIG_PATH = path.join(DATA_DIR, 'config.yaml')
const DEFAULT_APPSERVICE_HOST = process.env.DEFAULT_APPSERVICE_HOST || ''

// Static UI
app.use(express.static(path.join(__dirname, 'public')))

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null
  try {
    const text = fs.readFileSync(CONFIG_PATH, 'utf8')
    const doc = YAML.parse(text)
    return doc
  } catch (e) {
    return null
  }
}

function extractFields(cfg) {
  return {
    homeserverAddress: cfg?.homeserver?.address || '',
    matrixDomain: cfg?.homeserver?.domain || '',
    appserviceAddress: cfg?.appservice?.address || '',
    hsToken: cfg?.appservice?.hs_token || '',
    asToken: cfg?.appservice?.as_token || '',
    botUsername: cfg?.appservice?.bot_username || 'telegrambot'
  }
}

function writeConfig(fields) {
  const cfg = {
    homeserver: {
      address: fields.homeserverAddress,
      domain: fields.matrixDomain
    },
    appservice: {
      port: 29317,
      address: fields.appserviceAddress,
      hs_token: fields.hsToken,
      as_token: fields.asToken,
      bot_username: fields.botUsername || 'telegrambot'
    },
    bridge: {
      permissions: {
        [`@admin:${fields.matrixDomain}`]: 'admin'
      }
    },
    database: { type: 'sqlite', uri: 'file:/data/mautrix-telegram.db' },
    logging: { level: 'INFO' }
  }
  const out = YAML.stringify(cfg)
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (fs.existsSync(CONFIG_PATH)) {
    fs.copyFileSync(CONFIG_PATH, path.join(DATA_DIR, `config.yaml.bak.${Date.now()}`))
  }
  fs.writeFileSync(CONFIG_PATH, out, 'utf8')
}

app.get('/api/config', (req, res) => {
  const cfg = readConfig()
  return res.json({ ok: true, values: extractFields(cfg || {}) })
})

app.get('/api/meta', (req, res) => {
  res.json({ ok: true, defaultAppserviceHost: DEFAULT_APPSERVICE_HOST })
})

app.post('/api/config', (req, res) => {
  const { homeserverAddress, matrixDomain, appserviceAddress, hsToken, asToken, botUsername } = req.body || {}
  for (const [k, v] of Object.entries({ homeserverAddress, matrixDomain, appserviceAddress, hsToken, asToken })) {
    if (!v || typeof v !== 'string' || v.trim() === '') {
      return res.status(400).json({ ok: false, error: `Missing ${k}` })
    }
  }
  try {
    writeConfig({ homeserverAddress, matrixDomain, appserviceAddress, hsToken, asToken, botUsername })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Failed to write config' })
  }
})

// Health/status
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Validate homeserver and optional well-known from domain
app.post('/api/validate', async (req, res) => {
  try {
    const { homeserverAddress, matrixDomain } = req.body || {}
    if (!homeserverAddress) return res.status(400).json({ ok: false, error: 'Missing homeserverAddress' })
    const hs = String(homeserverAddress).replace(/\/$/, '')
    const results = { versions: null, wellKnown: null }

    const withTimeout = async (p, ms = 5000) => {
      const ac = new AbortController()
      const id = setTimeout(() => ac.abort(), ms)
      try { return await p(ac.signal) } finally { clearTimeout(id) }
    }

    // Versions check
    const versions = await withTimeout(async (signal) => {
      const r = await fetch(`${hs}/_matrix/client/versions`, { signal })
      const j = await r.json().catch(() => null)
      return { ok: r.ok, status: r.status, body: j }
    })
    results.versions = versions

    // Well-known check
    if (matrixDomain) {
      const domain = String(matrixDomain).trim()
      try {
        const wk = await withTimeout(async (signal) => {
          const r = await fetch(`https://${domain}/.well-known/matrix/client`, { signal })
          const j = await r.json().catch(() => null)
          return { ok: r.ok, status: r.status, body: j }
        })
        results.wellKnown = wk
      } catch (e) {
        results.wellKnown = { ok: false, error: 'well-known fetch failed' }
      }
    }

    return res.json({ ok: true, results })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'validation failed' })
  }
})

const PORT = process.env.PORT || 80
app.listen(PORT, () => {
  console.log(`UI listening on :${PORT}`)
})
