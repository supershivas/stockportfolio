export interface Position {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currency: 'USD' | 'EUR';
  sector: string;
  pea?: boolean;
}

export type Page = 'dashboard' | 'portfolio' | 'projections' | 'recommendations' | 'indicators' | 'risk' | 'undervalued' | 'dividends';

export type InvestmentHouse = 'Vanguard' | 'BlackRock' | 'Fidelity' | 'JPMorgan' | 'Goldman Sachs' | 'Morgan Stanley';

export interface HouseRecommendation {
  house: InvestmentHouse;
  outlook: string;
  allocation: { equities: number; bonds: number; alternatives: number; cash: number };
  topFunds: { ticker: string; name: string; category: string; expectedReturn: number; risk: 'Faible' | 'Modéré' | 'Élevé' }[];
  overweights: string[];
  underweights: string[];
}

export interface MarketIndicator {
  name: string;
  value: number;
  unit: string;
  change: number;
  status: 'good' | 'neutral' | 'bad';
  history: number[];
  description: string;
}
