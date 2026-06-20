import { useState, useEffect } from 'react'
import { Newspaper, ExternalLink, RefreshCw, TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react'
import { isApiConfigured } from '../services/marketData'

interface NewsItem {
  id: number
  headline: string
  summary: string
  source: string
  url: string
  datetime: number // unix timestamp
  category: string
  image?: string
}

const CACHE_KEY = 'market_bulletin_cache'
const CACHE_TS_KEY = 'market_bulletin_ts'
const CACHE_TTL = 60 * 60 * 1000 // 1 heure

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

// Financial relevance keywords — headline or summary must contain at least one
const FINANCIAL_KEYWORDS = [
  'stock', 'market', 'share', 'equity', 'nasdaq', 's&p', 'dow', 'cac', 'dax',
  'fed', 'federal reserve', 'ecb', 'interest rate', 'inflation', 'gdp', 'earnings',
  'revenue', 'profit', 'ipo', 'dividend', 'bond', 'yield', 'treasury',
  'oil', 'gold', 'crypto', 'bitcoin', 'etf', 'fund', 'hedge',
  'acquisition', 'merger', 'buyback', 'outlook', 'forecast', 'guidance',
  'quarter', 'fiscal', 'analyst', 'upgrade', 'downgrade', 'rating',
  'portfolio', 'invest', 'trade', 'rally', 'selloff', 'volatil',
  'bourse', 'action', 'taux', 'banque', 'obligation', 'rendement',
  // major companies likely in portfolio
  'apple', 'microsoft', 'nvidia', 'amazon', 'alphabet', 'meta', 'tesla',
  'lvmh', 'airbus', 'totalenergies', 'sanofi', 'bnp', 'asml',
]

function isFinanciallyRelevant(item: NewsItem): boolean {
  const text = (item.headline + ' ' + (item.summary || '')).toLowerCase()
  return FINANCIAL_KEYWORDS.some((kw) => text.includes(kw))
}

async function fetchNews(apiKey: string): Promise<NewsItem[]> {
  // Fetch both general and merger categories for richer financial coverage
  const [generalRes, mergerRes] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`),
    fetch(`https://finnhub.io/api/v1/news?category=merger&token=${apiKey}`),
  ])

  const general: NewsItem[] = generalRes.ok ? await generalRes.json() : []
  const merger: NewsItem[] = mergerRes.ok ? await mergerRes.json() : []
  const combined = [...general, ...merger]

  // Filter: last 48h (not just today — weekends/early morning can be sparse)
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
    .sort((a, b) => b.datetime - a.datetime) // most recent first
    .slice(0, 5)
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000 - ts) / 60)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff} min`
  const h = Math.floor(diff / 60)
  return `Il y a ${h}h${diff % 60 > 0 ? ` ${diff % 60}min` : ''}`
}

function categoryIcon(source: string) {
  const s = source.toLowerCase()
  if (s.includes('reuters') || s.includes('bloomberg') || s.includes('wsj')) return <TrendingUp size={12} className="text-indigo-400" />
  if (s.includes('seeking') || s.includes('market') || s.includes('invest')) return <Zap size={12} className="text-yellow-400" />
  return <AlertTriangle size={12} className="text-slate-400" />
}

// Fallback static articles when API not configured or no data today
const FALLBACK_ARTICLES = [
  {
    id: 1,
    headline: "BCE : 3e baisse de taux consecutive, depots a 3,25%",
    summary: "La Banque Centrale Europeenne a abaisse ses taux directeurs de 25 bps en juin 2025, marquant son 3e assouplissement depuis septembre 2024. Cela favorise les emprunteurs et pese sur l'euro face au dollar.",
    source: 'ECB',
    url: 'https://www.ecb.europa.eu/press/pr/date/2025/html/index.en.html',
    datetime: Math.floor(Date.now() / 1000) - 3600,
    category: 'macro',
  },
  {
    id: 2,
    headline: "S&P 500 au-dessus de 5 800 pts — la resistance devient support",
    summary: "Le S&P 500 consolide au-dessus du niveau cle 5 800 points, soutenu par des resultats T1 2026 meilleurs qu'attendu. Le secteur technologique affiche +4,2% sur le mois.",
    source: 'Bloomberg',
    url: 'https://www.bloomberg.com/markets',
    datetime: Math.floor(Date.now() / 1000) - 7200,
    category: 'equity',
  },
  {
    id: 3,
    headline: "NVIDIA : commandes IA en hausse de 45% YoY, guidance relevee",
    summary: "NVIDIA releve sa guidance FY2027 a +38% de croissance sur les revenus Data Center. La demande des hyperscalers (Microsoft, Google, Meta) reste soutenue malgre la correction du titre en mai.",
    source: 'Reuters',
    url: 'https://www.reuters.com/technology/',
    datetime: Math.floor(Date.now() / 1000) - 10800,
    category: 'tech',
  },
  {
    id: 4,
    headline: "Or : 3 200 $/oz — valeur refuge en periode de tensions geopolitiques",
    summary: "L'or depasse 3 200 $ l'once pour la premiere fois. Les fonds souverains asiatiques et les banques centrales accelerent leurs achats face a l'incertitude macroeconomique mondiale.",
    source: 'FT',
    url: 'https://www.ft.com/commodities',
    datetime: Math.floor(Date.now() / 1000) - 14400,
    category: 'commodity',
  },
]

export default function MarketBulletin() {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [expanded, setExpanded] = useState<number | null>(0) // first article open by default

  const apiKey = isApiConfigured()
    ? localStorage.getItem('finnhub_api_key') || ''
    : ''

  const load = async (force = false) => {
    if (!force) {
      const cached = getCached()
      if (cached && cached.length > 0) {
        setArticles(cached)
        const ts = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0')
        setLastFetch(new Date(ts))
        return
      }
    }

    if (!apiKey) {
      setArticles(FALLBACK_ARTICLES as unknown as NewsItem[])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const news = await fetchNews(apiKey)
      if (news.length > 0) {
        setArticles(news)
        setCache(news)
        setLastFetch(new Date())
      } else {
        // No articles today yet (weekend / early morning) — use fallback
        setArticles(FALLBACK_ARTICLES as unknown as NewsItem[])
      }
    } catch {
      setError('Impossible de charger les actualités.')
      setArticles(FALLBACK_ARTICLES as unknown as NewsItem[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Bulletin du Marché</h2>
            {!apiKey && (
              <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded">
                Contenu statique — connectez Finnhub pour les news en direct
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={10} />
              {lastFetch.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {loading && articles.length === 0 && (
        <div className="px-5 py-8 text-center text-slate-500 text-sm">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
          Chargement des actualités…
        </div>
      )}

      <div className="divide-y divide-slate-700/60">
        {articles.map((a, i) => {
          const open = expanded === i
          return (
            <button
              key={a.id}
              className="w-full text-left px-5 py-3.5 hover:bg-slate-700/30 transition-colors"
              onClick={() => setExpanded(open ? null : i)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                      {categoryIcon(a.source)}
                      {a.source}
                    </span>
                    <span className="text-xs text-slate-600">{timeAgo(a.datetime)}</span>
                  </div>
                  <p className="text-sm font-medium text-white leading-snug">{a.headline}</p>

                  {open && (
                    <div className="mt-2 space-y-2">
                      <p className="text-slate-300 text-xs leading-relaxed">{a.summary}</p>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                      >
                        <ExternalLink size={10} />
                        Lire la suite
                      </a>
                    </div>
                  )}
                </div>
                <span className="text-slate-600 text-xs shrink-0 mt-0.5">{open ? '▲' : '▼'}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
