import { useState, useEffect } from 'react'
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react'
import { isApiConfigured } from '../services/marketData'

interface NewsItem {
  id: number
  headline: string
  summary: string
  source: string
  url: string
  datetime: number
  category: string
}

const CACHE_KEY = 'market_bulletin_cache'
const CACHE_TS_KEY = 'market_bulletin_ts'
const CACHE_TTL = 60 * 60 * 1000

function getCached(): NewsItem[] | null {
  try {
    const ts = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0')
    if (Date.now() - ts > CACHE_TTL) return null
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCache(items: NewsItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items))
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString())
  } catch { /* quota */ }
}

const FINANCIAL_KEYWORDS = [
  'stock', 'market', 'share', 'equity', 'nasdaq', 's&p', 'dow', 'cac', 'dax',
  'fed', 'federal reserve', 'ecb', 'interest rate', 'inflation', 'gdp', 'earnings',
  'revenue', 'profit', 'ipo', 'dividend', 'bond', 'yield', 'treasury',
  'oil', 'gold', 'crypto', 'bitcoin', 'etf', 'fund', 'hedge',
  'acquisition', 'merger', 'buyback', 'outlook', 'forecast', 'guidance',
  'quarter', 'fiscal', 'analyst', 'upgrade', 'downgrade', 'rating',
  'portfolio', 'invest', 'trade', 'rally', 'selloff', 'volatil',
  'bourse', 'action', 'taux', 'banque', 'obligation', 'rendement',
  'apple', 'microsoft', 'nvidia', 'amazon', 'alphabet', 'meta', 'tesla',
  'lvmh', 'airbus', 'totalenergies', 'sanofi', 'bnp', 'asml',
]

function isFinanciallyRelevant(item: NewsItem): boolean {
  const text = (item.headline + ' ' + (item.summary || '')).toLowerCase()
  return FINANCIAL_KEYWORDS.some((kw) => text.includes(kw))
}

async function fetchNews(apiKey: string): Promise<NewsItem[]> {
  const [generalRes, mergerRes] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`),
    fetch(`https://finnhub.io/api/v1/news?category=merger&token=${apiKey}`),
  ])
  const general: NewsItem[] = generalRes.ok ? await generalRes.json() : []
  const merger: NewsItem[] = mergerRes.ok ? await mergerRes.json() : []
  const combined = [...general, ...merger]
  const cutoff = Date.now() / 1000 - 48 * 3600
  const seen = new Set<string>()
  return combined
    .filter((n) => n.datetime >= cutoff && n.headline && n.summary)
    .filter((n) => isFinanciallyRelevant(n))
    .filter((n) => {
      const key = n.headline.slice(0, 60).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, 4)
}

// Free, no-key fallback: Yahoo Finance's public RSS feed, proxied via
// /api/news to dodge CORS. Real, live headlines — used whenever no Finnhub
// key is configured, so there is no more static/simulated news content.
async function fetchYahooNews(): Promise<NewsItem[]> {
  const res = await fetch('/api/news')
  if (!res.ok) throw new Error('news fetch failed')
  const data = await res.json()
  const items = (data.items ?? []) as Omit<NewsItem, 'category'>[]
  return items.map((it, i) => ({ ...it, id: i, category: 'market' }))
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000 - ts) / 60)
  if (diff < 60) return `${diff}min`
  const h = Math.floor(diff / 60)
  return `${h}h`
}

export default function MarketBulletin() {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const apiKey = isApiConfigured() ? localStorage.getItem('finnhub_api_key') || '' : ''

  const load = async (force = false) => {
    if (!force) {
      const cached = getCached()
      if (cached && cached.length > 0) {
        setArticles(cached)
        setLastFetch(new Date(parseInt(localStorage.getItem(CACHE_TS_KEY) || '0')))
        return
      }
    }
    setLoading(true)
    try {
      // Finnhub gives finance-filtered general/merger news when a key is
      // configured; otherwise fall back to the free Yahoo Finance RSS feed —
      // both are real, live headlines, never static content.
      const news = apiKey ? await fetchNews(apiKey) : await fetchYahooNews()
      if (news.length > 0) { setArticles(news); setCache(news); setLastFetch(new Date()) }
      else setArticles(await fetchYahooNews())
    } catch {
      try { setArticles(await fetchYahooNews()); setLastFetch(new Date()) } catch { /* offline */ }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-accent/80 shrink-0" />
          <span className="text-xs font-semibold text-white capitalize">{today}</span>
          {lastFetch && (
            <span className="text-xs text-slate-600">
              · {lastFetch.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
            </span>
          )}
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <ul className="space-y-1.5">
        {articles.length === 0 && loading && (
          <li className="text-xs text-slate-500">Chargement des actualités…</li>
        )}
        {articles.map((a) => (
          <li key={a.id} className="flex items-baseline gap-2 text-xs leading-snug">
            <span className="text-slate-600 shrink-0 w-6 text-right">{timeAgo(a.datetime)}</span>
            <span className="text-slate-500 shrink-0">{a.source}</span>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white flex items-center gap-1 min-w-0"
            >
              <span className="truncate">{a.headline}</span>
              <ExternalLink size={9} className="shrink-0 text-slate-600" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
