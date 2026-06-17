export interface DividendStock {
  ticker: string
  name: string
  currency: 'USD' | 'EUR'
  sector: string
  country: string
  annualDividend: number  // per share
  yieldPct: number        // dividend yield %
  frequency: 'Mensuel' | 'Trimestriel' | 'Semestriel' | 'Annuel'
  exDate: string          // next ex-dividend date
  payDate: string         // next payment date
  consecutive: number     // years of consecutive dividends
  pea: boolean
  aristocrat: boolean     // 25+ years consecutive raises
}

// Data sourced from company IR pages and Dividendinvestor.com — updated June 2025
export const DIVIDEND_STOCKS: DividendStock[] = [
  // European aristocrats (PEA-eligible)
  {
    ticker: 'OR.PA', name: "L'Oréal SA", currency: 'EUR', sector: 'Cosmétiques',
    country: '🇫🇷', annualDividend: 6.60, yieldPct: 1.8, frequency: 'Annuel',
    exDate: '2026-04-23', payDate: '2026-05-05', consecutive: 28, pea: true, aristocrat: true,
  },
  {
    ticker: 'TTE.PA', name: 'TotalEnergies SE', currency: 'EUR', sector: 'Énergie',
    country: '🇫🇷', annualDividend: 3.22, yieldPct: 5.5, frequency: 'Trimestriel',
    exDate: '2026-06-19', payDate: '2026-07-01', consecutive: 38, pea: true, aristocrat: true,
  },
  {
    ticker: 'SAN.PA', name: 'Sanofi SA', currency: 'EUR', sector: 'Santé',
    country: '🇫🇷', annualDividend: 3.92, yieldPct: 4.2, frequency: 'Annuel',
    exDate: '2026-05-27', payDate: '2026-06-05', consecutive: 32, pea: true, aristocrat: true,
  },
  {
    ticker: 'BNP.PA', name: 'BNP Paribas SA', currency: 'EUR', sector: 'Finance',
    country: '🇫🇷', annualDividend: 4.60, yieldPct: 6.7, frequency: 'Annuel',
    exDate: '2026-05-28', payDate: '2026-06-03', consecutive: 12, pea: true, aristocrat: false,
  },
  {
    ticker: 'MC.PA', name: 'LVMH Moët Hennessy', currency: 'EUR', sector: 'Luxe',
    country: '🇫🇷', annualDividend: 13.00, yieldPct: 1.9, frequency: 'Semestriel',
    exDate: '2026-07-01', payDate: '2026-07-10', consecutive: 22, pea: true, aristocrat: false,
  },
  {
    ticker: 'AIR.PA', name: 'Airbus SE', currency: 'EUR', sector: 'Aéronautique',
    country: '🇫🇷', annualDividend: 1.80, yieldPct: 1.1, frequency: 'Annuel',
    exDate: '2026-04-09', payDate: '2026-04-17', consecutive: 8, pea: true, aristocrat: false,
  },
  {
    ticker: 'ALV.DE', name: 'Allianz SE', currency: 'EUR', sector: 'Assurance',
    country: '🇩🇪', annualDividend: 14.40, yieldPct: 5.4, frequency: 'Annuel',
    exDate: '2026-05-08', payDate: '2026-05-12', consecutive: 14, pea: true, aristocrat: false,
  },
  {
    ticker: 'BAS.DE', name: 'BASF SE', currency: 'EUR', sector: 'Chimie',
    country: '🇩🇪', annualDividend: 3.40, yieldPct: 7.2, frequency: 'Annuel',
    exDate: '2026-04-30', payDate: '2026-05-04', consecutive: 10, pea: true, aristocrat: false,
  },
  {
    ticker: 'SAP.DE', name: 'SAP SE', currency: 'EUR', sector: 'Technologie',
    country: '🇩🇪', annualDividend: 2.20, yieldPct: 1.3, frequency: 'Annuel',
    exDate: '2026-05-22', payDate: '2026-05-27', consecutive: 18, pea: true, aristocrat: false,
  },
  // US dividend aristocrats
  {
    ticker: 'JNJ', name: 'Johnson & Johnson', currency: 'USD', sector: 'Santé',
    country: '🇺🇸', annualDividend: 4.96, yieldPct: 3.2, frequency: 'Trimestriel',
    exDate: '2026-08-19', payDate: '2026-09-09', consecutive: 62, pea: false, aristocrat: true,
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp.', currency: 'USD', sector: 'Technologie',
    country: '🇺🇸', annualDividend: 3.32, yieldPct: 0.9, frequency: 'Trimestriel',
    exDate: '2026-08-20', payDate: '2026-09-11', consecutive: 21, pea: false, aristocrat: false,
  },
  {
    ticker: 'AAPL', name: 'Apple Inc.', currency: 'USD', sector: 'Technologie',
    country: '🇺🇸', annualDividend: 1.00, yieldPct: 0.5, frequency: 'Trimestriel',
    exDate: '2026-08-08', payDate: '2026-08-14', consecutive: 12, pea: false, aristocrat: false,
  },
  {
    ticker: 'JPM', name: 'JPMorgan Chase', currency: 'USD', sector: 'Finance',
    country: '🇺🇸', annualDividend: 5.00, yieldPct: 2.6, frequency: 'Trimestriel',
    exDate: '2026-07-06', payDate: '2026-07-31', consecutive: 14, pea: false, aristocrat: false,
  },
  {
    ticker: 'V', name: 'Visa Inc.', currency: 'USD', sector: 'Finance',
    country: '🇺🇸', annualDividend: 2.52, yieldPct: 0.9, frequency: 'Trimestriel',
    exDate: '2026-07-17', payDate: '2026-08-01', consecutive: 15, pea: false, aristocrat: false,
  },
  {
    ticker: 'XOM', name: 'ExxonMobil Corp.', currency: 'USD', sector: 'Énergie',
    country: '🇺🇸', annualDividend: 3.96, yieldPct: 3.7, frequency: 'Trimestriel',
    exDate: '2026-08-14', payDate: '2026-09-10', consecutive: 42, pea: false, aristocrat: true,
  },
]

// How many business days until the next ex-dividend date
export function daysUntilExDate(exDate: string): number {
  const today = new Date()
  const ex = new Date(exDate)
  const diff = Math.ceil((ex.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// Check if last dividend update was before today 7am Brussels time
export function needsDailyRefresh(): boolean {
  const key = 'dividendLastUpdate'
  const stored = localStorage.getItem(key)
  const now = new Date()
  // 7h00 Brussels today
  const brussels7am = new Date(
    now.toLocaleDateString('en-CA', { timeZone: 'Europe/Brussels' }) + 'T07:00:00'
  )
  // Convert to local ms
  const brussels7amMs = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Brussels',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now) + 'T07:00:00'
  ).getTime()
  // Use offset-aware comparison
  const offset = brussels7am.getTimezoneOffset() * 60000
  const brussels7amUtc = brussels7amMs + offset

  if (!stored) return true
  const lastUpdate = parseInt(stored, 10)
  return now.getTime() >= brussels7amUtc && lastUpdate < brussels7amUtc
}

export function markDividendRefreshed(): void {
  localStorage.setItem('dividendLastUpdate', Date.now().toString())
}
