import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Briefcase, TrendingUp, Building2, BarChart3, Shield,
  TrendingDown, X, ChevronRight, Settings, Wifi, WifiOff, DollarSign, Sun, Moon, Cloud, Menu,
} from 'lucide-react'
import ApiSettings from './components/ApiSettings'
import JosePublic from './components/JosePublic'
import Login, { isAuthenticated } from './components/Login'
import { isApiConfigured } from './services/marketData'
import { restoreFromCloud, getLastSyncedAt, setLastSyncedAt } from './services/cloudBackup'
import { usePortfolioStore } from './store/portfolioStore'
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

function getInitialTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

function AppMain() {
  const [page, setPage] = useState<Page>('portfolio')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [apiConfigured, setApiConfigured] = useState(isApiConfigured())
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'ok'>('idle')
  const positions = usePortfolioStore((s) => s.positions)
  const hydrateFromCloud = usePortfolioStore((s) => s.hydrateFromCloud)
  const restoredRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const interval = setInterval(() => setApiConfigured(isApiConfigured()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Cloud (GitHub) is the source of truth across devices/browsers, since each
  // browser's localStorage is an isolated island. On startup, pull cloud data
  // whenever it's newer than what this device last pushed — this is what lets
  // an edit made in Firefox show up in Chrome or on the iPhone. Local wins only
  // if this device has unsynced local changes newer than the cloud snapshot.
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    setCloudStatus('syncing')
    restoreFromCloud().then((data) => {
      const lastSyncedAt = getLastSyncedAt()
      const cloudIsNewer = (data?.updatedAt ?? 0) > lastSyncedAt
      const localIsEmpty = positions.length === 0
      if (data?.positions && (cloudIsNewer || localIsEmpty)) {
        hydrateFromCloud(data.positions, data.transactions ?? [])
        if (data.updatedAt) setLastSyncedAt(data.updatedAt)
      }
      setCloudStatus('ok')
    }).catch(() => setCloudStatus('idle'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--content-bg)', color: 'var(--text-primary)' }}>
      {showApiSettings && <ApiSettings onClose={() => { setShowApiSettings(false); setApiConfigured(isApiConfigured()) }} />}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
        className={`fixed lg:static inset-y-0 left-0 z-30 w-[264px] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '1px solid var(--sidebar-border)', paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
              <TrendingUp size={15} style={{ color: '#ffffff' }} />
            </div>
            <span className="font-bold text-base font-title" style={{ color: 'var(--sidebar-fg)' }}>PortfolioAI</span>
          </div>
          <button className="lg:hidden" style={{ color: 'var(--sidebar-muted)' }} onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)', opacity: 0.7 }}>{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = page === item.id
                  return (
                    <div key={item.id} className="relative">
                      <button
                        onClick={() => { setPage(item.id); setSidebarOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all"
                        style={{
                          background: active ? 'var(--sidebar-selected)' : 'transparent',
                          color: active ? 'var(--sidebar-selected-fg)' : 'var(--sidebar-muted)',
                        }}
                        onPointerEnter={e => {
                          if (e.pointerType === 'touch') return
                          if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-fg)' }
                          const tip = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement
                          if (tip) tip.style.display = 'block'
                        }}
                        onPointerLeave={e => {
                          if (e.pointerType === 'touch') return
                          if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-muted)' }
                          const tip = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement
                          if (tip) tip.style.display = 'none'
                        }}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {active && <ChevronRight size={14} className="shrink-0" />}
                      </button>
                      {/* Tooltip — shown via JS mouseenter/leave only, never on touch */}
                      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50" style={{ display: 'none' }}>
                        <div className="text-xs rounded-lg px-3 py-2 shadow-xl max-w-[220px] leading-relaxed whitespace-normal"
                          style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)', border: '1px solid var(--sidebar-border)' }}>
                          {item.tooltip}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 space-y-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <div className="flex gap-2">
            <button
              onClick={() => setShowApiSettings(true)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors"
              style={{ border: '1px solid var(--sidebar-border)', color: 'var(--sidebar-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-fg)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-muted)' }}
            >
              {apiConfigured
                ? <Wifi size={14} className="text-green-400 shrink-0" />
                : <WifiOff size={14} className="shrink-0" style={{ color: 'var(--sidebar-icon)' }} />}
              <span className="flex-1 text-left">{apiConfigured ? 'Temps réel actif' : 'Données simulées'}</span>
              <span title={cloudStatus === 'ok' ? 'Sauvegarde cloud active' : cloudStatus === 'syncing' ? 'Synchronisation...' : 'Pas de sauvegarde'}>
                <Cloud
                  size={12}
                  style={{ color: cloudStatus === 'syncing' ? '#60a5fa' : cloudStatus === 'ok' ? '#4ade80' : 'var(--sidebar-muted)' }}
                  className={cloudStatus === 'syncing' ? 'animate-pulse' : ''}
                />
              </span>
              <Settings size={12} />
            </button>
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center w-9 h-9 rounded-md text-xs transition-colors"
              style={{ border: '1px solid var(--sidebar-border)', color: 'var(--sidebar-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-fg)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-muted)' }}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--sidebar-muted)', opacity: 0.4 }}>PortfolioAI v0.1</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
        >
          {renderPage()}
        </main>

        {/* Bottom nav — mobile only */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch py-2"
          style={{
            background: 'var(--sidebar-bg)',
            borderTop: '1px solid var(--sidebar-border)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {([
            { id: 'dashboard' as Page,   label: 'Dashboard',  icon: <LayoutDashboard size={20} /> },
            { id: 'portfolio' as Page,   label: 'Positions',  icon: <Briefcase size={20} /> },
            { id: 'dividends' as Page,   label: 'Dividendes', icon: <DollarSign size={20} /> },
            { id: 'projections' as Page, label: 'Projections',icon: <TrendingUp size={20} /> },
          ] as { id: Page; label: string; icon: React.ReactNode }[]).map((item) => {
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
                style={{ color: active ? 'var(--accent)' : 'var(--sidebar-muted)' }}
              >
                {item.icon}
                <span className="text-[10px]">{item.label}</span>
              </button>
            )
          })}
          {/* Opens the full sidebar drawer — gives access to Indicateurs, Recommandations,
              Sous-Évaluées and Risque, which don't fit in the 5-slot bottom nav */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
            style={{ color: ['indicators', 'recommendations', 'undervalued', 'risk'].includes(page) ? 'var(--accent)' : 'var(--sidebar-muted)' }}
          >
            <Menu size={20} />
            <span className="text-[10px]">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default function App() {
  if (window.location.pathname === '/jose') return <JosePublic />
  const [authed, setAuthed] = useState(isAuthenticated)
  if (!authed) return <Login onAuth={() => setAuthed(true)} />
  return <AppMain />
}
