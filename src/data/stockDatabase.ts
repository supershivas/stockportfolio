export interface StockSearchResult {
  ticker: string
  name: string
  sector: string
  currency: 'USD' | 'EUR'
  currentPrice: number
  country: string
  type: 'Action' | 'ETF' | 'Obligation'
  pea: boolean
}

// PEA eligibility rules (France):
// - Actions d'entreprises ayant leur siège dans l'UE/EEE → PEA ✓
// - ETFs UCITS domiciliés en UE/EEE → PEA ✓ (ex: Amundi .PA, iShares .AS, Vanguard .DE)
// - Actions US/hors EEE → PEA ✗
// - ETFs domiciliés aux USA (SPY, QQQ, VTI) → PEA ✗
// Source: https://www.amf-france.org/fr/particuliers/investir/le-pea
export const STOCK_DATABASE: StockSearchResult[] = [
  // US Tech — non PEA
  { ticker: 'AAPL',  name: 'Apple Inc.',              sector: 'Technologie',      currency: 'USD', currentPrice: 200,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'MSFT',  name: 'Microsoft Corp.',         sector: 'Technologie',      currency: 'USD', currentPrice: 420,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',            sector: 'Semiconducteurs',  currency: 'USD', currentPrice: 130,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',           sector: 'Technologie',      currency: 'USD', currentPrice: 185,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'META',  name: 'Meta Platforms',          sector: 'Technologie',      currency: 'USD', currentPrice: 620,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',         sector: 'E-Commerce',       currency: 'USD', currentPrice: 225,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'TSLA',  name: 'Tesla Inc.',              sector: 'Automobile',       currency: 'USD', currentPrice: 320,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'AMD',   name: 'Advanced Micro Devices',  sector: 'Semiconducteurs',  currency: 'USD', currentPrice: 165,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'INTC',  name: 'Intel Corp.',             sector: 'Semiconducteurs',  currency: 'USD', currentPrice: 22,   country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'ORCL',  name: 'Oracle Corp.',            sector: 'Technologie',      currency: 'USD', currentPrice: 165,  country: '🇺🇸', type: 'Action', pea: false },
  // US Finance — non PEA
  { ticker: 'JPM',   name: 'JPMorgan Chase',          sector: 'Finance',          currency: 'USD', currentPrice: 255,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'BAC',   name: 'Bank of America',         sector: 'Finance',          currency: 'USD', currentPrice: 47,   country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'GS',    name: 'Goldman Sachs',           sector: 'Finance',          currency: 'USD', currentPrice: 580,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'V',     name: 'Visa Inc.',               sector: 'Finance',          currency: 'USD', currentPrice: 310,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway B',   sector: 'Finance',          currency: 'USD', currentPrice: 480,  country: '🇺🇸', type: 'Action', pea: false },
  // US Health — non PEA
  { ticker: 'JNJ',   name: 'Johnson & Johnson',       sector: 'Santé',            currency: 'USD', currentPrice: 155,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'PFE',   name: 'Pfizer Inc.',             sector: 'Santé',            currency: 'USD', currentPrice: 24,   country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'UNH',   name: 'UnitedHealth Group',      sector: 'Santé',            currency: 'USD', currentPrice: 280,  country: '🇺🇸', type: 'Action', pea: false },
  // US Energy — non PEA
  { ticker: 'XOM',   name: 'ExxonMobil Corp.',        sector: 'Énergie',          currency: 'USD', currentPrice: 110,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'CVX',   name: 'Chevron Corp.',           sector: 'Énergie',          currency: 'USD', currentPrice: 148,  country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'WMT',   name: 'Walmart Inc.',            sector: 'Distribution',     currency: 'USD', currentPrice: 97,   country: '🇺🇸', type: 'Action', pea: false },
  { ticker: 'BABA',  name: 'Alibaba Group',           sector: 'E-Commerce',       currency: 'USD', currentPrice: 120,  country: '🇨🇳', type: 'Action', pea: false },
  { ticker: 'T',     name: 'AT&T Inc.',               sector: 'Télécommunications',currency: 'USD', currentPrice: 27,   country: '🇺🇸', type: 'Action', pea: false },
  // CAC 40 — tous PEA (siège en France, UE) — cours juin 2026
  { ticker: 'MC.PA',  name: 'LVMH Moët Hennessy',         sector: 'Luxe',           currency: 'EUR', currentPrice: 680,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'OR.PA',  name: "L'Oréal SA",                  sector: 'Cosmétiques',    currency: 'EUR', currentPrice: 350,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'SAN.PA', name: 'Sanofi SA',                   sector: 'Santé',          currency: 'EUR', currentPrice: 95,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'AIR.PA', name: 'Airbus SE',                   sector: 'Aéronautique',   currency: 'EUR', currentPrice: 170,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'TTE.PA', name: 'TotalEnergies SE',            sector: 'Énergie',        currency: 'EUR', currentPrice: 58,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'BNP.PA', name: 'BNP Paribas SA',              sector: 'Finance',        currency: 'EUR', currentPrice: 72,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'ACA.PA', name: 'Crédit Agricole SA',          sector: 'Finance',        currency: 'EUR', currentPrice: 16,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'SGO.PA', name: 'Saint-Gobain',                sector: 'Matériaux',      currency: 'EUR', currentPrice: 78,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'BN.PA',  name: 'Danone SA',                   sector: 'Agroalimentaire',currency: 'EUR', currentPrice: 62,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'RI.PA',  name: 'Pernod Ricard SA',            sector: 'Spiritueux',     currency: 'EUR', currentPrice: 90,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'CAP.PA', name: 'Capgemini SE',                sector: 'Technologie',    currency: 'EUR', currentPrice: 185,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'KER.PA', name: 'Kering SA',                   sector: 'Luxe',           currency: 'EUR', currentPrice: 245,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'DSY.PA', name: 'Dassault Systèmes SE',        sector: 'Technologie',    currency: 'EUR', currentPrice: 32,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'HO.PA',  name: 'Thales SA',                   sector: 'Défense',        currency: 'EUR', currentPrice: 185,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'ML.PA',  name: 'Michelin',                    sector: 'Automobile',     currency: 'EUR', currentPrice: 34,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'RMS.PA', name: 'Hermès International',        sector: 'Luxe',           currency: 'EUR', currentPrice: 2400, country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'ORA.PA', name: 'Orange SA',                   sector: 'Télécommunications',currency: 'EUR', currentPrice: 10, country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'ENGI.PA',name: 'Engie SA',                    sector: 'Utilities',      currency: 'EUR', currentPrice: 16,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'CS.PA',  name: 'AXA SA',                      sector: 'Assurance',      currency: 'EUR', currentPrice: 42,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'VIE.PA', name: 'Veolia Environnement',        sector: 'Utilities',      currency: 'EUR', currentPrice: 30,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'PUB.PA', name: 'Publicis Groupe SA',          sector: 'Médias',         currency: 'EUR', currentPrice: 95,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'SU.PA',  name: 'Schneider Electric SE',       sector: 'Industrie',      currency: 'EUR', currentPrice: 210,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'EL.PA',  name: 'EssilorLuxottica SA',         sector: 'Santé',          currency: 'EUR', currentPrice: 220,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'SW.PA',  name: 'Sodexo SA',                   sector: 'Services',       currency: 'EUR', currentPrice: 72,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'DG.PA',  name: 'Vinci SA',                    sector: 'Construction',   currency: 'EUR', currentPrice: 115,  country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'GLE.PA', name: 'Société Générale SA',         sector: 'Finance',        currency: 'EUR', currentPrice: 32,   country: '🇫🇷', type: 'Action', pea: true },
  { ticker: 'STM.PA', name: 'STMicroelectronics NV',       sector: 'Semiconducteurs',currency: 'EUR', currentPrice: 26,   country: '🇫🇷', type: 'Action', pea: true },
  // Allemagne DAX — PEA (siège UE)
  { ticker: 'SIE.DE',  name: 'Siemens AG',          sector: 'Industrie',    currency: 'EUR', currentPrice: 220,  country: '🇩🇪', type: 'Action', pea: true },
  { ticker: 'BAS.DE',  name: 'BASF SE',             sector: 'Chimie',       currency: 'EUR', currentPrice: 45,   country: '🇩🇪', type: 'Action', pea: true },
  { ticker: 'VOW3.DE', name: 'Volkswagen AG',        sector: 'Automobile',   currency: 'EUR', currentPrice: 95,   country: '🇩🇪', type: 'Action', pea: true },
  { ticker: 'BMW.DE',  name: 'BMW AG',               sector: 'Automobile',   currency: 'EUR', currentPrice: 85,   country: '🇩🇪', type: 'Action', pea: true },
  { ticker: 'SAP.DE',  name: 'SAP SE',               sector: 'Technologie',  currency: 'EUR', currentPrice: 245,  country: '🇩🇪', type: 'Action', pea: true },
  { ticker: 'ALV.DE',  name: 'Allianz SE',           sector: 'Assurance',    currency: 'EUR', currentPrice: 320,  country: '🇩🇪', type: 'Action', pea: true },
  { ticker: 'ADS.DE',  name: 'Adidas AG',            sector: 'Sport',        currency: 'EUR', currentPrice: 245,  country: '🇩🇪', type: 'Action', pea: true },
  { ticker: 'MRK.DE',  name: 'Merck KGaA',           sector: 'Santé',        currency: 'EUR', currentPrice: 145,  country: '🇩🇪', type: 'Action', pea: true },
  // Espagne — PEA
  { ticker: 'ITX.MC',  name: 'Inditex (Zara)',       sector: 'Distribution',  currency: 'EUR', currentPrice: 53,   country: '🇪🇸', type: 'Action', pea: true },
  { ticker: 'SAN.MC',  name: 'Banco Santander',      sector: 'Finance',       currency: 'EUR', currentPrice: 7,    country: '🇪🇸', type: 'Action', pea: true },
  // Pays-Bas — PEA
  { ticker: 'ASML.AS', name: 'ASML Holding NV',      sector: 'Semiconducteurs',currency: 'EUR', currentPrice: 760, country: '🇳🇱', type: 'Action', pea: true },
  { ticker: 'HEIA.AS', name: 'Heineken NV',           sector: 'Agroalimentaire',currency: 'EUR', currentPrice: 78,  country: '🇳🇱', type: 'Action', pea: true },
  // Italie — PEA
  { ticker: 'ENI.MI',  name: 'Eni SpA',              sector: 'Énergie',       currency: 'EUR', currentPrice: 14,   country: '🇮🇹', type: 'Action', pea: true },
  { ticker: 'ENEL.MI', name: 'Enel SpA',             sector: 'Utilities',     currency: 'EUR', currentPrice: 7,    country: '🇮🇹', type: 'Action', pea: true },
  // ETF PEA-éligibles (UCITS domiciliés UE) — source: Amundi, iShares, Vanguard prospectus
  { ticker: 'WPEA.PA',  name: 'iShares MSCI World Swap PEA UCITS ETF', sector: 'ETF Monde',    currency: 'EUR', currentPrice: 6.85, country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'CW8.PA',   name: 'Amundi MSCI World UCITS ETF',           sector: 'ETF Monde',    currency: 'EUR', currentPrice: 450,  country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'PE500.PA', name: 'Amundi PEA S&P 500 UCITS ETF',          sector: 'ETF USA',      currency: 'EUR', currentPrice: 38,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'PANX.PA',  name: 'Amundi PEA NASDAQ-100 UCITS ETF',       sector: 'ETF Tech',     currency: 'EUR', currentPrice: 44,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'PAEEM.PA', name: 'Amundi PEA MSCI Emerging Markets ETF',  sector: 'ETF Émergents',currency: 'EUR', currentPrice: 14,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'EWLD.PA',  name: 'Lyxor MSCI World UCITS ETF',            sector: 'ETF Monde',    currency: 'EUR', currentPrice: 22,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'LCWD.PA',  name: 'Lyxor Core MSCI World UCITS ETF',       sector: 'ETF Monde',    currency: 'EUR', currentPrice: 22,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'C40.PA',   name: 'Amundi CAC 40 UCITS ETF',               sector: 'ETF CAC 40',   currency: 'EUR', currentPrice: 35,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'RS2K.PA',  name: 'Amundi Russell 2000 UCITS ETF',         sector: 'ETF USA',      currency: 'EUR', currentPrice: 12,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'PUST.PA',  name: 'Amundi PEA MSCI USA UCITS ETF',         sector: 'ETF USA',      currency: 'EUR', currentPrice: 18,   country: '🇫🇷', type: 'ETF', pea: true },
  { ticker: 'PCEU.PA',  name: 'Amundi PEA MSCI Europe UCITS ETF',      sector: 'ETF Europe',   currency: 'EUR', currentPrice: 21,   country: '🇫🇷', type: 'ETF', pea: true },
  // ETF non PEA (domiciliés USA)
  { ticker: 'IWDA.AS',  name: 'iShares Core MSCI World ETF',           sector: 'ETF Monde',    currency: 'EUR', currentPrice: 102,  country: '🇳🇱', type: 'ETF', pea: false },
  { ticker: 'VWCE.DE',  name: 'Vanguard FTSE All-World UCITS ETF',     sector: 'ETF Monde',    currency: 'EUR', currentPrice: 125,  country: '🇩🇪', type: 'ETF', pea: false },
  { ticker: 'SPY',      name: 'SPDR S&P 500 ETF',                      sector: 'ETF USA',      currency: 'USD', currentPrice: 580,  country: '🇺🇸', type: 'ETF', pea: false },
  { ticker: 'QQQ',      name: 'Invesco NASDAQ-100 ETF',                sector: 'ETF Tech',     currency: 'USD', currentPrice: 520,  country: '🇺🇸', type: 'ETF', pea: false },
  { ticker: 'VTI',      name: 'Vanguard Total Stock Market ETF',       sector: 'ETF USA',      currency: 'USD', currentPrice: 280,  country: '🇺🇸', type: 'ETF', pea: false },
  { ticker: 'VT',       name: 'Vanguard Total World Stock ETF',        sector: 'ETF Monde',    currency: 'USD', currentPrice: 120,  country: '🇺🇸', type: 'ETF', pea: false },
  { ticker: 'BND',      name: 'Vanguard Total Bond Market ETF',        sector: 'Obligations',  currency: 'USD', currentPrice: 72,   country: '🇺🇸', type: 'ETF', pea: false },
]

export function searchStocks(query: string, peaOnly = false): StockSearchResult[] {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return STOCK_DATABASE.filter(
    (s) =>
      (s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) &&
      (!peaOnly || s.pea)
  ).slice(0, 10)
}
