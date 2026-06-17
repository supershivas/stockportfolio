export interface StockSearchResult {
  ticker: string
  name: string
  sector: string
  currency: 'USD' | 'EUR'
  currentPrice: number
  country: string
  type: 'Action' | 'ETF' | 'Obligation'
}

export const STOCK_DATABASE: StockSearchResult[] = [
  // US Tech
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technologie', currency: 'USD', currentPrice: 189, country: '🇺🇸', type: 'Action' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technologie', currency: 'USD', currentPrice: 375, country: '🇺🇸', type: 'Action' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconducteurs', currency: 'USD', currentPrice: 495, country: '🇺🇸', type: 'Action' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technologie', currency: 'USD', currentPrice: 141, country: '🇺🇸', type: 'Action' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Technologie', currency: 'USD', currentPrice: 355, country: '🇺🇸', type: 'Action' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce', currency: 'USD', currentPrice: 178, country: '🇺🇸', type: 'Action' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automobile', currency: 'USD', currentPrice: 248, country: '🇺🇸', type: 'Action' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconducteurs', currency: 'USD', currentPrice: 162, country: '🇺🇸', type: 'Action' },
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Semiconducteurs', currency: 'USD', currentPrice: 43, country: '🇺🇸', type: 'Action' },
  { ticker: 'ORCL', name: 'Oracle Corp.', sector: 'Technologie', currency: 'USD', currentPrice: 118, country: '🇺🇸', type: 'Action' },
  // US Finance
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', currency: 'USD', currentPrice: 196, country: '🇺🇸', type: 'Action' },
  { ticker: 'BAC', name: 'Bank of America', sector: 'Finance', currency: 'USD', currentPrice: 34, country: '🇺🇸', type: 'Action' },
  { ticker: 'GS', name: 'Goldman Sachs', sector: 'Finance', currency: 'USD', currentPrice: 389, country: '🇺🇸', type: 'Action' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Finance', currency: 'USD', currentPrice: 271, country: '🇺🇸', type: 'Action' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway B', sector: 'Finance', currency: 'USD', currentPrice: 366, country: '🇺🇸', type: 'Action' },
  // US Health
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Santé', currency: 'USD', currentPrice: 158, country: '🇺🇸', type: 'Action' },
  { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'Santé', currency: 'USD', currentPrice: 28, country: '🇺🇸', type: 'Action' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Santé', currency: 'USD', currentPrice: 524, country: '🇺🇸', type: 'Action' },
  // US Energy/Other
  { ticker: 'XOM', name: 'ExxonMobil Corp.', sector: 'Énergie', currency: 'USD', currentPrice: 105, country: '🇺🇸', type: 'Action' },
  { ticker: 'CVX', name: 'Chevron Corp.', sector: 'Énergie', currency: 'USD', currentPrice: 155, country: '🇺🇸', type: 'Action' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Distribution', currency: 'USD', currentPrice: 165, country: '🇺🇸', type: 'Action' },
  { ticker: 'BABA', name: 'Alibaba Group', sector: 'E-Commerce', currency: 'USD', currentPrice: 74, country: '🇨🇳', type: 'Action' },
  { ticker: 'T', name: 'AT&T Inc.', sector: 'Télécommunications', currency: 'USD', currentPrice: 17, country: '🇺🇸', type: 'Action' },
  // France CAC40
  { ticker: 'MC.PA', name: 'LVMH Moët Hennessy', sector: 'Luxe', currency: 'EUR', currentPrice: 820, country: '🇫🇷', type: 'Action' },
  { ticker: 'OR.PA', name: "L'Oréal SA", sector: 'Cosmétiques', currency: 'EUR', currentPrice: 425, country: '🇫🇷', type: 'Action' },
  { ticker: 'SAN.PA', name: 'Sanofi SA', sector: 'Santé', currency: 'EUR', currentPrice: 92, country: '🇫🇷', type: 'Action' },
  { ticker: 'AIR.PA', name: 'Airbus SE', sector: 'Aéronautique', currency: 'EUR', currentPrice: 158, country: '🇫🇷', type: 'Action' },
  { ticker: 'TTE.PA', name: 'TotalEnergies SE', sector: 'Énergie', currency: 'EUR', currentPrice: 58, country: '🇫🇷', type: 'Action' },
  { ticker: 'BNP.PA', name: 'BNP Paribas SA', sector: 'Finance', currency: 'EUR', currentPrice: 68, country: '🇫🇷', type: 'Action' },
  { ticker: 'ACA.PA', name: 'Crédit Agricole SA', sector: 'Finance', currency: 'EUR', currentPrice: 14, country: '🇫🇷', type: 'Action' },
  { ticker: 'SGO.PA', name: 'Compagnie de Saint-Gobain', sector: 'Matériaux', currency: 'EUR', currentPrice: 72, country: '🇫🇷', type: 'Action' },
  { ticker: 'BN.PA', name: 'Danone SA', sector: 'Agroalimentaire', currency: 'EUR', currentPrice: 61, country: '🇫🇷', type: 'Action' },
  { ticker: 'RI.PA', name: 'Pernod Ricard SA', sector: 'Spiritueux', currency: 'EUR', currentPrice: 118, country: '🇫🇷', type: 'Action' },
  { ticker: 'CAP.PA', name: 'Capgemini SE', sector: 'Technologie', currency: 'EUR', currentPrice: 195, country: '🇫🇷', type: 'Action' },
  { ticker: 'KER.PA', name: 'Kering SA', sector: 'Luxe', currency: 'EUR', currentPrice: 310, country: '🇫🇷', type: 'Action' },
  // Germany
  { ticker: 'SIE.DE', name: 'Siemens AG', sector: 'Industrie', currency: 'EUR', currentPrice: 178, country: '🇩🇪', type: 'Action' },
  { ticker: 'BAS.DE', name: 'BASF SE', sector: 'Chimie', currency: 'EUR', currentPrice: 47, country: '🇩🇪', type: 'Action' },
  { ticker: 'VOW3.DE', name: 'Volkswagen AG', sector: 'Automobile', currency: 'EUR', currentPrice: 115, country: '🇩🇪', type: 'Action' },
  { ticker: 'BMW.DE', name: 'BMW AG', sector: 'Automobile', currency: 'EUR', currentPrice: 94, country: '🇩🇪', type: 'Action' },
  { ticker: 'SAP.DE', name: 'SAP SE', sector: 'Technologie', currency: 'EUR', currentPrice: 178, country: '🇩🇪', type: 'Action' },
  { ticker: 'ALV.DE', name: 'Allianz SE', sector: 'Assurance', currency: 'EUR', currentPrice: 265, country: '🇩🇪', type: 'Action' },
  // ETF
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF USA', currency: 'USD', currentPrice: 476, country: '🇺🇸', type: 'ETF' },
  { ticker: 'QQQ', name: 'Invesco NASDAQ-100 ETF', sector: 'ETF Tech', currency: 'USD', currentPrice: 406, country: '🇺🇸', type: 'ETF' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'ETF USA', currency: 'USD', currentPrice: 236, country: '🇺🇸', type: 'ETF' },
  { ticker: 'VT', name: 'Vanguard Total World Stock ETF', sector: 'ETF Monde', currency: 'USD', currentPrice: 104, country: '🇺🇸', type: 'ETF' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', sector: 'Obligations', currency: 'USD', currentPrice: 72, country: '🇺🇸', type: 'ETF' },
  { ticker: 'CW8.PA', name: 'Amundi MSCI World UCITS ETF', sector: 'ETF Monde', currency: 'EUR', currentPrice: 42, country: '🇫🇷', type: 'ETF' },
  { ticker: 'PE500.PA', name: 'Amundi S&P 500 UCITS ETF', sector: 'ETF USA', currency: 'EUR', currentPrice: 52, country: '🇫🇷', type: 'ETF' },
  { ticker: 'IWDA.AS', name: 'iShares Core MSCI World ETF', sector: 'ETF Monde', currency: 'EUR', currentPrice: 88, country: '🇳🇱', type: 'ETF' },
  { ticker: 'VWCE.DE', name: 'Vanguard FTSE All-World UCITS ETF', sector: 'ETF Monde', currency: 'EUR', currentPrice: 115, country: '🇩🇪', type: 'ETF' },
  { ticker: 'PANX.PA', name: 'Amundi NASDAQ-100 UCITS ETF', sector: 'ETF Tech', currency: 'EUR', currentPrice: 36, country: '🇫🇷', type: 'ETF' },
  { ticker: 'PAEEM.PA', name: 'Amundi MSCI Emerging Markets ETF', sector: 'ETF Émergents', currency: 'EUR', currentPrice: 28, country: '🇫🇷', type: 'ETF' },
]

export function searchStocks(query: string): StockSearchResult[] {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return STOCK_DATABASE.filter(
    (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 8)
}
