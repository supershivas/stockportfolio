import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Briefcase, TrendingUp, Building2, BarChart3, Shield,
  TrendingDown, Menu, X, ChevronRight, Settings, Wifi, WifiOff, DollarSign,
} from 'lucide-react'
import ApiSettings from './components/ApiSettings'
import { isApiConfigured } from './services/marketData'
import Dashboard from './components/Dashboard'
import Portfolio from './components/Portfolio'
import Projections from './components/Projections'
import Recommendations from './components/Recommendations'
import Indicators from './components/Indicators'
import RiskAnalysis from './components/RiskAnalysis'
import UndervaluedStocks from './components/UndervaluedStocks'
import DividendTracker from './components/DividendTracker'
import { Page } from './types'

interface NavItem {
  id: Page
  label: string
  icon: React.ReactNode
  tooltip: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Vue d\'ensemble',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={18} />,
        tooltip: 'Indices mondiaux, valeur du portefeuille et actualités du jour',
      },
    ],
  },
  {
    label: 'Mon Portefeuille',
    items: [
      {
        id: 'portfolio',
        label: 'Positions',
        icon: <Briefcase size={18} />,
        tooltip: 'Gérez vos positions : ajouter, modifier, supprimer des titres',
      },
      {
        id: 'dividends',
        label: 'Dividendes',
        icon: <DollarSign size={18} />,
        tooltip: 'Suivi des dividendes, calendrier de paiements et revenus annuels',
      },
      {
        id: 'projections',
        label: 'Projections',
        icon: <TrendingUp size={18} />,
        tooltip: 'Simulez la croissance sur 1 à 30 ans selon 3 scénarios de rendement',
      },
    ],
  },
  {
    label: 'Marché',
    items: [
      {
        id: 'indicators',
        label: 'Indicateurs',
        icon: <BarChart3 size={18} />,
        tooltip: 'VIX, taux Fed, inflation, or, dollar — baromètre macroéconomique',
      },
      {
        id: 'recommendations',
        label: 'Recommandations',
        icon: <Building2 size={18} />,
        tooltip: 'Allocations suggérées par Vanguard, BlackRock, Goldman Sachs…',
      },
      {
        id: 'undervalued',
        label: 'Sous-Évaluées',
        icon: <TrendingDown size={18} />,
        tooltip: 'Screening fondamental : P/E, ROE, marges, scoring Graham & DCF',
      },
    ],
  },
  {
    label: 'Analyse',
    items: [
      {
        id: 'risk',
        label: 'Risque',
        icon: <Shield size={18} />,
        tooltip: 'Beta, volatilité, Sharpe, drawdown et matrice de corrélation',
      },
    ],
  },
]

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [apiConfigured, setApiConfigured] = useState(isApiConfigured())

  useEffect(() => {
    const interval = setInterval(() => setApiConfigured(isApiConfigured()), 1000)
    return () => clearInterval(interval)
  }, [])

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard />
      case 'portfolio':      return <Portfolio />
      case 'dividends':      return <DividendTracker />
      case 'projections':    return <Projections />
      case 'recommendations':return <Recommendations />
      case 'indicators':     return <Indicators />
      case 'risk':           return <RiskAnalysis />
      case 'undervalued':    return <UndervaluedStocks />
    }
  }

  const currentLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === page)?.label ?? ''

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {showApiSettings && <ApiSettings onClose={() => { setShowApiSettings(false); setApiConfigured(isApiConfigured()) }} />}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-slate-900 border-r border-slate-700 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp size={15} className="text-white" />
            </div>
            <span className="font-bold text-base text-white">PortfolioAI</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => { setPage(item.id); setSidebarOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        page === item.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {page === item.id && <ChevronRight size={14} className="shrink-0" />}
                    </button>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover:block lg:block">
                      <div className="bg-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 shadow-xl max-w-[220px] leading-relaxed whitespace-normal border border-slate-600">
                        {item.tooltip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-700 space-y-2">
          <button
            onClick={() => setShowApiSettings(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs transition-colors"
          >
            {apiConfigured
              ? <Wifi size={14} className="text-green-400 shrink-0" />
              : <WifiOff size={14} className="text-slate-500 shrink-0" />}
            <span className="flex-1 text-left">{apiConfigured ? 'Temps réel actif' : 'Données simulées'}</span>
            <Settings size={12} />
          </button>
          <p className="text-xs text-slate-600 text-center">PortfolioAI v0.1</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-white">{currentLabel || 'PortfolioAI'}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
