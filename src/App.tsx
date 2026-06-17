import { useState, useEffect } from 'react'
import { LayoutDashboard, Briefcase, TrendingUp, Building2, BarChart3, Shield, TrendingDown, Menu, X, ChevronRight, Settings, Wifi, WifiOff, DollarSign } from 'lucide-react'
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

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'portfolio', label: 'Mon Portfolio', icon: <Briefcase size={20} /> },
  { id: 'dividends', label: 'Dividendes', icon: <DollarSign size={20} /> },
  { id: 'projections', label: 'Projections', icon: <TrendingUp size={20} /> },
  { id: 'recommendations', label: 'Recommandations', icon: <Building2 size={20} /> },
  { id: 'indicators', label: 'Indicateurs', icon: <BarChart3 size={20} /> },
  { id: 'risk', label: 'Analyse Risque', icon: <Shield size={20} /> },
  { id: 'undervalued', label: 'Sous-Évaluées', icon: <TrendingDown size={20} /> },
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
      case 'dashboard': return <Dashboard />
      case 'portfolio': return <Portfolio />
      case 'projections': return <Projections />
      case 'recommendations': return <Recommendations />
      case 'indicators': return <Indicators />
      case 'risk': return <RiskAnalysis />
      case 'undervalued': return <UndervaluedStocks />
      case 'dividends': return <DividendTracker />
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {showApiSettings && <ApiSettings onClose={() => { setShowApiSettings(false); setApiConfigured(isApiConfigured()) }} />}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-700 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">PortfolioAI</span>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                page === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {page === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-700 space-y-3">
          <button
            onClick={() => setShowApiSettings(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-sm transition-colors"
          >
            {apiConfigured ? <Wifi size={15} className="text-green-400" /> : <WifiOff size={15} className="text-slate-500" />}
            <span className="flex-1 text-left">{apiConfigured ? 'Temps réel actif' : 'Données simulées'}</span>
            <Settings size={14} />
          </button>
          <p className="text-xs text-slate-600 text-center">PortfolioAI v0.0.1</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-white">PortfolioAI</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
