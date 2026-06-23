// JoseIndex2000 — Composite market health index
// Score 0-100: <35 = danger zone, 35-50 = stress, 50-65 = neutral, 65-80 = favorable, >80 = euphoria

export interface JoseComponent {
  name: string
  weight: number        // % weight in the index
  value: number         // current value
  normalizedScore: number  // 0-100 contribution score
  trend7d: number       // % change over 7 days
  trend3m: number       // % change over 3 months
  trend1y: number       // % change over 1 year
  unit: string
  interpretation: string // what it means for the index
}

// Historical JoseIndex2000 scores — weekly over ~2 years (most recent last)
export const JOSE_HISTORY_2Y = [
  52, 49, 47, 44, 46, 50, 53, 51, 48, 45, 43, 41, 40, 42, 45, 48,
  50, 53, 55, 57, 54, 52, 56, 58, 61, 63, 60, 58, 55, 57, 59, 62,
  64, 66, 68, 65, 63, 61, 59, 57, 55, 53, 51, 54, 56, 58, 60, 62,
  64, 62, 60, 58, 61, 63, 65, 63, 61, 59, 57, 60, 62, 64, 66, 68,
  66, 64, 62, 60, 63, 65, 67, 65, 63, 61, 59, 57, 59, 61, 63, 64,
  62, 60, 58, 61, 63, 62, 60, 62, 61, 59, 58, 60, 62, 63, 62, 61,
  63, 64, 63, 62, 61, 62, 63, 62
]

// Monthly aggregates for 3M view (last 12 months)
export const JOSE_HISTORY_1Y = [58, 61, 63, 66, 68, 65, 62, 59, 61, 63, 62, 62]

// Daily for 30-day view
export const JOSE_HISTORY_30D = [
  61, 62, 60, 61, 63, 62, 61, 60, 62, 63,
  64, 62, 61, 63, 62, 61, 60, 62, 63, 61,
  62, 63, 62, 61, 62, 63, 62, 61, 62, 62,
]

export const JOSE_COMPONENTS: JoseComponent[] = [
  {
    name: 'VIX (Volatilité)',
    weight: 20,
    value: 18.5,
    normalizedScore: 68, // VIX 18.5 = relativement calme → bon pour l'index
    trend7d: -5.1,
    trend3m: -12.3,
    trend1y: -28.4,
    unit: 'pts',
    interpretation: 'Faible anxiété du marché · favorable',
  },
  {
    name: 'Taux Fed / BCE',
    weight: 18,
    value: 5.25,
    normalizedScore: 38, // Taux élevés = pression sur les actions
    trend7d: 0,
    trend3m: 0,
    trend1y: +5.0,
    unit: '%',
    interpretation: 'Taux restrictifs · pression sur valorisations',
  },
  {
    name: 'Pétrole (WTI)',
    weight: 12,
    value: 78.4,
    normalizedScore: 58, // Prix modéré = neutre
    trend7d: +2.1,
    trend3m: -8.4,
    trend1y: -11.2,
    unit: '$/b',
    interpretation: 'Prix modéré · impact neutre sur l\'économie',
  },
  {
    name: 'Sentiment (Fear & Greed)',
    weight: 15,
    value: 62,
    normalizedScore: 62,
    trend7d: +8.2,
    trend3m: +14.5,
    trend1y: +18.3,
    unit: '/100',
    interpretation: 'Sentiment positif · légère avidité',
  },
  {
    name: 'Courbe des taux (10Y-2Y)',
    weight: 12,
    value: -0.3,
    normalizedScore: 35, // Inversion = signal de récession
    trend7d: +0.05,
    trend3m: +0.2,
    trend1y: -0.8,
    unit: '%',
    interpretation: 'Courbe inversée · risque de récession',
  },
  {
    name: 'Dollar Index (DXY)',
    weight: 8,
    value: 103.5,
    normalizedScore: 52,
    trend7d: -0.3,
    trend3m: +1.2,
    trend1y: -2.1,
    unit: 'pts',
    interpretation: 'Dollar stable · neutre pour les marchés',
  },
  {
    name: 'Inflation US (CPI)',
    weight: 10,
    value: 3.2,
    normalizedScore: 55, // En baisse mais > 2%
    trend7d: 0,
    trend3m: -0.5,
    trend1y: -1.8,
    unit: '%',
    interpretation: 'Désinflation en cours · signal positif',
  },
  {
    name: 'Momentum S&P 500',
    weight: 5,
    value: 5850,
    normalizedScore: 72,
    trend7d: +0.8,
    trend3m: +6.2,
    trend1y: +21.4,
    unit: 'pts',
    interpretation: 'Tendance haussière · momentum favorable',
  },
]

function computeJoseScore(components: JoseComponent[]): number {
  const totalWeight = components.reduce((s, c) => s + c.weight, 0)
  const score = components.reduce((s, c) => s + (c.normalizedScore * c.weight), 0) / totalWeight
  return Math.round(score * 10) / 10
}

export const JOSE_SCORE = computeJoseScore(JOSE_COMPONENTS)

export function getJoseStatus(score: number): { label: string; color: string; bg: string; description: string } {
  if (score >= 75) return { label: 'Euphorie', color: '#f87171', bg: 'rgba(248,113,113,0.1)', description: 'Marchés en surchauffe — prudence recommandée' }
  if (score >= 65) return { label: 'Favorable', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', description: 'Conditions de marché globalement positives' }
  if (score >= 50) return { label: 'Neutre', color: '#facc15', bg: 'rgba(250,204,21,0.1)', description: 'Environnement mixte — sélectivité requise' }
  if (score >= 35) return { label: 'Stress', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', description: 'Tensions visibles — réduire l\'exposition risquée' }
  return { label: 'Danger', color: '#f87171', bg: 'rgba(239,68,68,0.15)', description: 'Conditions dégradées — mode défensif conseillé' }
}
