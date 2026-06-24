// JérômeIndex Ultra — Composite stocks-vs-bonds allocation index
// Score 0-100:
//   > 65  = "Surpondérer Actions"      (green)
//   45-65 = "Neutre / Mixte"           (yellow)
//   < 45  = "Surpondérer Obligations"  (blue/indigo)

export interface JeromeUltraComponent {
  name: string
  weight: number           // % weight in the index (all weights sum to 100)
  value: number            // current value
  normalizedScore: number  // 0-100 contribution score
  trend7d: number          // change over 7 days
  trend3m: number          // change over 3 months
  trend1y: number          // change over 1 year
  unit: string
  interpretation: string
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export const JEROME_ULTRA_COMPONENTS: JeromeUltraComponent[] = [
  {
    // Earnings yield S&P500 (1/CAPE ≈ 3.7%) minus 10Y Treasury (4.25%) = -0.55%
    // gap > 2% → 85 | 0–2% → 60 | −1–0% → 40 | < −1% → 20
    name: 'Yield Gap (Actions vs Obligations)',
    weight: 30,
    value: -0.55,
    normalizedScore: 38,
    trend7d: +0.05,
    trend3m: -0.3,
    trend1y: -1.2,
    unit: '%',
    interpretation: 'Obligations légèrement plus attractives que les actions',
  },
  {
    // 10Y Treasury (4.25%) minus CPI (3.2%) = real rate 1.05%
    // < −1% → 80 | 0–1% → 60 | 1–2% → 40 | > 2% → 20
    name: 'Taux Réels (10Y − CPI)',
    weight: 20,
    value: 1.05,
    normalizedScore: 42,
    trend7d: 0,
    trend3m: +0.3,
    trend1y: +2.1,
    unit: '%',
    interpretation: 'Taux réels positifs — obligations plus compétitives',
  },
  {
    // CAPE Shiller P/E = 27
    // < 15 → 80 | 15–20 → 70 | 20–25 → 55 | 25–30 → 40 | > 30 → 25
    name: 'CAPE Shiller P/E',
    weight: 20,
    value: 27,
    normalizedScore: 40,
    trend7d: 0,
    trend3m: +1.2,
    trend1y: +3.5,
    unit: 'x',
    interpretation: 'Valorisation élevée — prime de risque réduite pour les actions',
  },
  {
    // PMI Composite = 52.1
    // > 55 → 80 | 52–55 → 65 | 50–52 → 50 | 48–50 → 35 | < 48 → 20
    name: 'PMI Composite (Momentum)',
    weight: 15,
    value: 52.1,
    normalizedScore: 65,
    trend7d: 0,
    trend3m: +1.8,
    trend1y: -0.5,
    unit: 'pts',
    interpretation: 'Légère expansion économique — favorable aux actions',
  },
  {
    // Yield Curve 30Y − 2Y: 4.5% − 4.8% = −0.3%
    // > 1% → 80 | 0–1% → 65 | −0.5–0% → 45 | < −0.5% → 25
    name: 'Courbe des Taux (30Y − 2Y)',
    weight: 10,
    value: -0.3,
    normalizedScore: 45,
    trend7d: +0.05,
    trend3m: +0.2,
    trend1y: -0.6,
    unit: '%',
    interpretation: 'Courbe légèrement inversée — signale une prudence cyclique',
  },
  {
    // CPI = 3.2%, trend: falling
    // falling toward 2% → 65 | stable → 50 | rising → 30
    name: "Momentum Inflation (CPI)",
    weight: 5,
    value: 3.2,
    normalizedScore: 60,
    trend7d: 0,
    trend3m: -0.5,
    trend1y: -1.8,
    unit: '%',
    interpretation: 'Désinflation en cours — positif pour les deux classes d\'actifs',
  },
]

// ---------------------------------------------------------------------------
// Composite score
// ---------------------------------------------------------------------------

function computeScore(components: JeromeUltraComponent[]): number {
  const total = components.reduce(
    (acc, c) => acc + (c.normalizedScore * c.weight) / 100,
    0,
  )
  return Math.round(total * 10) / 10
}

export const JEROME_ULTRA_SCORE: number = computeScore(JEROME_ULTRA_COMPONENTS)
// = 30×38 + 20×42 + 20×40 + 15×65 + 10×45 + 5×60 all / 100
// = 1140 + 840 + 800 + 975 + 450 + 300 = 4505 / 100 = 45.05 → ~45.1

// ---------------------------------------------------------------------------
// Recommendation
// ---------------------------------------------------------------------------

export function getJeromeUltraRecommendation(score: number): {
  label: string
  color: string
  bg: string
  description: string
  allocation: { stocks: number; bonds: number; cash: number }
} {
  if (score > 65) {
    return {
      label: 'Surpondérer Actions',
      color: 'text-green-700',
      bg: 'bg-green-50',
      description:
        'Les conditions macro et de valorisation favorisent nettement les actions. Privilégiez une exposition actions élevée.',
      allocation: { stocks: 70, bonds: 20, cash: 10 },
    }
  }
  if (score >= 45) {
    return {
      label: 'Neutre / Mixte',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
      description:
        'Les signaux sont partagés entre actions et obligations. Un portefeuille équilibré est recommandé.',
      allocation: { stocks: 50, bonds: 40, cash: 10 },
    }
  }
  return {
    label: 'Surpondérer Obligations',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    description:
      "Le rendement obligataire et les taux réels rendent les obligations plus attractives que les actions dans le contexte actuel.",
    allocation: { stocks: 30, bonds: 60, cash: 10 },
  }
}

// ---------------------------------------------------------------------------
// Macro Regime
// ---------------------------------------------------------------------------

export type MacroRegime = 'goldilocks' | 'reflation' | 'stagflation' | 'deflation'

export interface MacroRegimeInfo {
  regime: MacroRegime
  label: string
  color: string
  description: string
  recommended: string
}

export function detectMacroRegime(pmi: number, cpiTrend: number): MacroRegimeInfo {
  const growth = pmi > 50
  const highInflation = cpiTrend > 3

  if (growth && !highInflation) {
    return {
      regime: 'goldilocks',
      label: 'Goldilocks',
      color: 'text-green-600',
      description: 'Croissance solide avec inflation maîtrisée — environnement idéal pour les actifs risqués.',
      recommended: 'Actions, Tech, Growth',
    }
  }
  if (growth && highInflation) {
    return {
      regime: 'reflation',
      label: 'Reflation',
      color: 'text-orange-600',
      description: 'Croissance soutenue mais inflation élevée — les actifs réels surperforment.',
      recommended: 'Actions Value, Matières premières, TIPS',
    }
  }
  if (!growth && highInflation) {
    return {
      regime: 'stagflation',
      label: 'Stagflation',
      color: 'text-red-600',
      description: "Croissance faible combinée à une inflation élevée — environnement difficile pour la plupart des actifs.",
      recommended: 'Or, Cash, Obligations indexées',
    }
  }
  // !growth && !highInflation
  return {
    regime: 'deflation',
    label: 'Déflation / Récession',
    color: 'text-blue-600',
    description: 'Croissance faible et inflation basse — les actifs défensifs et obligataires dominent.',
    recommended: 'Obligations longues, Cash, Dividendes',
  }
}

// Current regime: PMI=52.1 (>50 = growth), CPI=3.2 (>3 = high inflation) → Reflation
export const CURRENT_MACRO_REGIME: MacroRegimeInfo = detectMacroRegime(52.1, 3.2)

// ---------------------------------------------------------------------------
// Historical data
// ---------------------------------------------------------------------------

// 30 daily values (most recent last)
export const JEROME_ULTRA_HISTORY_30D = [
  42, 43, 42, 44, 43, 42, 44, 45, 44, 43,
  42, 43, 44, 45, 43, 42, 43, 44, 45, 44,
  43, 44, 45, 44, 43, 44, 45, 44, 43, 44,
]

// 12 monthly values — last 12 months (most recent last)
export const JEROME_ULTRA_HISTORY_1Y = [48, 46, 44, 42, 40, 39, 41, 43, 42, 41, 42, 43]

// 104 weekly values — ~2 years, declining from ~55 to ~44 with volatility (most recent last)
export const JEROME_ULTRA_HISTORY_2Y = [
  55, 56, 55, 54, 55, 54, 53, 54, 53, 54,
  53, 52, 53, 52, 53, 52, 51, 52, 51, 52,
  53, 52, 51, 50, 51, 50, 51, 50, 49, 50,
  51, 50, 49, 50, 49, 48, 49, 50, 49, 48,
  49, 48, 47, 48, 49, 48, 47, 48, 47, 46,
  47, 48, 47, 46, 47, 46, 45, 46, 47, 46,
  45, 46, 45, 46, 45, 44, 45, 46, 45, 44,
  45, 44, 43, 44, 45, 44, 43, 44, 45, 44,
  43, 44, 45, 44, 43, 44, 43, 44, 45, 44,
  43, 44, 45, 44, 43, 44, 45, 44, 43, 44,
  43, 44, 45, 44,
]
