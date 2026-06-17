import { useState, useEffect } from 'react'
import { Newspaper, TrendingUp, AlertTriangle, ExternalLink, RefreshCw, Zap } from 'lucide-react'

interface BulletinEntry {
  date: string
  title: string
  theme: 'opportunity' | 'risk' | 'macro' | 'sector'
  summary: string
  insight: string
  sources: { label: string; url: string }[]
}

// Bulletin rotatif — enrichi chaque semaine
const BULLETINS: BulletinEntry[] = [
  {
    date: '2026-06-17',
    title: 'IA & Semi-conducteurs : la consolidation crée des points d\'entrée',
    theme: 'opportunity',
    summary: 'Après une hausse de +180% depuis 2023, le secteur des semi-conducteurs marque une pause (-8% en mai). Les fondamentaux restent solides : la demande IA des hyperscalers (Meta, Google, Microsoft) est en hausse de +45% YoY.',
    insight: 'NVDA et AMD offrent des niveaux techniques intéressants. Le consensus 12 mois des analystes reste haussier (+25% upside moyen). Surveiller le support des 800$ sur NVDA.',
    sources: [
      { label: 'Goldman Sachs — AI Capex Outlook 2026', url: 'https://www.goldmansachs.com/intelligence/pages/ai-investment-forecast-tops-200-billion-by-2025.html' },
      { label: 'SIA — Semiconductor Industry Report', url: 'https://www.semiconductors.org/global-semiconductor-sales/' },
    ],
  },
  {
    date: '2026-06-17',
    title: 'CAC 40 : rebond post-résultats, le luxe reprend des couleurs',
    theme: 'opportunity',
    summary: 'Le CAC 40 affiche +4,2% depuis le 1er janvier, porté par le secteur Luxe (+11%). LVMH et Hermès bénéficient du rebond de la consommation chinoise (+9% des ventes Asie-Pacifique au T1 2026).',
    insight: 'Les valeurs PEA françaises offrent un avantage fiscal non négligeable. LVMH se négocie à 19x PE 2026 vs 28x historique. Opportunité pour les investisseurs long terme.',
    sources: [
      { label: 'Euronext — Statistiques CAC 40', url: 'https://live.euronext.com/fr/products/indices/FR0003500008-XPAR' },
      { label: 'LVMH — Résultats T1 2026', url: 'https://www.lvmh.com/investors/financial-information/financial-results/' },
    ],
  },
  {
    date: '2026-06-17',
    title: 'Risque : inflation US persistante, taux Fed en pause prolongée',
    theme: 'risk',
    summary: 'Le CPI US de mai ressort à +3,3% YoY, au-dessus des attentes. La Fed maintient ses taux entre 4,25-4,50%. Les marchés ont repoussé leurs anticipations de baisses à fin 2026, pesant sur les valorisations growth.',
    insight: 'Réduire l\'exposition aux obligations longue durée. Privilégier les actions value (dividendes élevés, faible duration implicite) et les secteurs défensifs (santé, utilities).',
    sources: [
      { label: 'FRED — CPI US', url: 'https://fred.stlouisfed.org/series/CPIAUCSL' },
      { label: 'CME FedWatch Tool', url: 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html' },
    ],
  },
  {
    date: '2026-06-17',
    title: 'Macro : BCE en cycle d\'assouplissement, euro sous pression',
    theme: 'macro',
    summary: 'La BCE a baissé ses taux à 3,25% (3e coupe depuis septembre 2024). L\'euro s\'échange à 1,07$ USD. Cette dynamique favorable aux exportateurs européens (Airbus, Stellantis, LVMH) avec une compétitivité accrue.',
    insight: 'Opportunité tactique sur les exportateurs CAC 40 libellés en EUR. L\'ETF PE500.PA (S&P 500 hedgé EUR) peut limiter le risque de change sur la poche US.',
    sources: [
      { label: 'BCE — Décisions de politique monétaire', url: 'https://www.ecb.europa.eu/press/pr/date/2025/html/index.en.html' },
      { label: 'EUR/USD — Macrotrends', url: 'https://www.macrotrends.net/1480/euro-dollar-exchange-rate-historical-chart' },
    ],
  },
  {
    date: '2026-06-17',
    title: 'ETF Monde : CW8 et IWDA au plus haut historique',
    theme: 'sector',
    summary: 'L\'ETF Amundi MSCI World (CW8.PA) a progressé de +12,3% depuis le 1er janvier 2026, porté par les valeurs US (+60% du sous-jacent). La diversification internationale reste le meilleur rapport risque/rendement sur 20 ans.',
    insight: 'Un investissement régulier mensuel sur CW8 ou IWDA reste la stratégie optimale selon Vanguard et Morningstar. Le DRIP (réinvestissement des dividendes) ajoute ~0,8% de rendement composé annuel.',
    sources: [
      { label: 'Morningstar — CW8.PA', url: 'https://www.morningstar.fr/fr/etf/snapshot/snapshot.aspx?id=0P0000MEHZ' },
      { label: 'MSCI World — Composition', url: 'https://www.msci.com/our-solutions/indexes/msci-world' },
      { label: 'Vanguard — Principes d\'investissement', url: 'https://www.vanguard.com/pdf/ISGPRINC.pdf' },
    ],
  },
]

const THEME_STYLES = {
  opportunity: { icon: <TrendingUp size={14} />, bg: 'bg-green-500/10 border-green-500/30', badge: 'bg-green-500/20 text-green-300', label: 'Opportunité' },
  risk: { icon: <AlertTriangle size={14} />, bg: 'bg-red-500/10 border-red-500/30', badge: 'bg-red-500/20 text-red-300', label: 'Risque' },
  macro: { icon: <Zap size={14} />, bg: 'bg-blue-500/10 border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300', label: 'Macro' },
  sector: { icon: <Newspaper size={14} />, bg: 'bg-indigo-500/10 border-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300', label: 'Secteur' },
}

function getLastRefreshTime(): string {
  const stored = localStorage.getItem('bulletinLastSeen')
  if (stored) return new Date(parseInt(stored)).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  return 'Jamais'
}

export default function MarketBulletin() {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [lastSeen, setLastSeen] = useState('')

  useEffect(() => {
    setLastSeen(getLastRefreshTime())
    localStorage.setItem('bulletinLastSeen', Date.now().toString())
  }, [])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Bulletin du Marché</h2>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <RefreshCw size={11} />
          Actualisé chaque matin 7h00
        </div>
      </div>

      <div className="space-y-3">
        {BULLETINS.map((b, i) => {
          const style = THEME_STYLES[b.theme]
          const open = expanded === i
          return (
            <div key={i} className={`rounded-lg border p-4 ${style.bg} cursor-pointer`} onClick={() => setExpanded(open ? null : i)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className={`mt-0.5 flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.badge}`}>
                    {style.icon}
                    {style.label}
                  </span>
                  <span className="text-sm font-medium text-white leading-snug">{b.title}</span>
                </div>
                <span className="text-slate-500 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
              </div>

              {open && (
                <div className="mt-3 space-y-3 pl-2">
                  <p className="text-slate-300 text-sm leading-relaxed">{b.summary}</p>
                  <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-indigo-400 font-semibold mb-1 uppercase tracking-wide">Insight Investisseur</div>
                    <p className="text-slate-200 text-sm leading-relaxed">{b.insight}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {b.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                      >
                        <ExternalLink size={10} />
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {lastSeen && (
        <p className="text-xs text-slate-600 mt-3 text-right">Dernière consultation : {lastSeen}</p>
      )}
    </div>
  )
}
