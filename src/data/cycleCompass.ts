export interface CyclePhase {
  id: 'early' | 'late' | 'slowdown' | 'recession'
  label: string
  labelFr: string
  clockPosition: string
  color: string
  description: string
  indicators: string[]
  bestAssets: string[]
  avoidAssets: string[]
  typicalDuration: string
  angle: number
}

export const CYCLE_PHASES: CyclePhase[] = [
  {
    id: 'early',
    label: 'Early Cycle',
    labelFr: 'Expansion précoce',
    clockPosition: '12h-3h',
    color: '#4ade80',
    description: 'Phase de reprise après une récession. La croissance redémarre, le crédit se détend, les entreprises recrutent à nouveau.',
    indicators: [
      'PMI remontant depuis moins de 50',
      'Taux de chômage en baisse',
      'Crédit en expansion',
      'Courbe des taux en pentification',
    ],
    bestAssets: [
      'Small caps',
      'Valeurs cycliques',
      'Immobilier (REITs)',
      'Obligations high yield',
    ],
    avoidAssets: [
      'Obligations longues (duration élevée)',
      'Secteurs défensifs surpondérés',
      'Cash (coût d\'opportunité élevé)',
    ],
    typicalDuration: '12-24 mois',
    angle: 45,
  },
  {
    id: 'late',
    label: 'Late Cycle',
    labelFr: 'Expansion tardive',
    clockPosition: '3h-6h',
    color: '#facc15',
    description: 'Phase de surchauffe. La croissance est forte mais l\'inflation monte, la courbe s\'aplatit et les marges commencent à plafonner.',
    indicators: [
      'PMI > 55',
      'Inflation en hausse',
      'Courbe des taux en aplatissement',
      'Marges bénéficiaires au pic',
    ],
    bestAssets: [
      'Énergie',
      'Matériaux et matières premières',
      'Commodités',
      'TIPS (obligations indexées inflation)',
      'Obligations courte duration',
    ],
    avoidAssets: [
      'Growth / Tech à duration longue',
      'Small caps sensibles aux taux',
      'Obligations longues nominales',
    ],
    typicalDuration: '12-18 mois',
    angle: 135,
  },
  {
    id: 'slowdown',
    label: 'Slowdown',
    labelFr: 'Ralentissement',
    clockPosition: '6h-9h',
    color: '#fb923c',
    description: 'La croissance décélère. Les révisions bénéficiaires deviennent négatives, le crédit se resserre et les indicateurs avancés fléchissent.',
    indicators: [
      'PMI en baisse depuis son pic',
      'Révisions de bénéfices négatives',
      'Resserrement des conditions de crédit',
    ],
    bestAssets: [
      'Santé (Healthcare)',
      'Consommation de base (Staples)',
      'Obligations de qualité (Investment Grade)',
      'Cash',
    ],
    avoidAssets: [
      'Cycliques et industriels',
      'High yield / crédit risqué',
      'Matières premières (demande en baisse)',
    ],
    typicalDuration: '6-12 mois',
    angle: 225,
  },
  {
    id: 'recession',
    label: 'Recession',
    labelFr: 'Récession',
    clockPosition: '9h-12h',
    color: '#f87171',
    description: 'Contraction économique. Le chômage monte, les spreads de crédit s\'écartent et la courbe des taux commence à se normaliser.',
    indicators: [
      'PMI < 50',
      'Chômage en hausse',
      'Spreads de crédit larges',
      'Courbe des taux en désinversion',
    ],
    bestAssets: [
      'Obligations longues (duration élevée)',
      'Or',
      'Cash',
      'Positions short sur actions (couverture)',
    ],
    avoidAssets: [
      'Actions cycliques',
      'High yield',
      'Immobilier commercial',
      'Matières premières industrielles',
    ],
    typicalDuration: '6-18 mois',
    angle: 315,
  },
]

export const CURRENT_PHASE_ID: 'early' | 'late' | 'slowdown' | 'recession' = 'late'

export const CYCLE_CONFIDENCE: number = 68

export const CYCLE_TRANSITION: string = 'Transition vers Ralentissement attendue dans 3-6 mois'

export interface LeadingIndicator {
  name: string
  value: string
  signal: 'positive' | 'neutral' | 'negative'
  description: string
}

export const CYCLE_LEADING_INDICATORS: LeadingIndicator[] = [
  {
    name: 'PMI Composite',
    value: '52.1',
    signal: 'neutral',
    description: 'Croissance modérée, pic peut-être atteint',
  },
  {
    name: 'Courbe des taux',
    value: '-0.3%',
    signal: 'negative',
    description: 'Inversion historiquement précurseur de récession sous 12-18 mois',
  },
  {
    name: 'Chômage US',
    value: '3.7%',
    signal: 'positive',
    description: 'Marché du travail robuste',
  },
  {
    name: 'ISM New Orders',
    value: '51.2',
    signal: 'neutral',
    description: 'Nouvelles commandes en légère expansion',
  },
  {
    name: 'Credit Spreads HY',
    value: '3.8%',
    signal: 'neutral',
    description: 'Spreads contenus — pas de stress de crédit',
  },
  {
    name: 'Earnings Revisions',
    value: '-2.1%',
    signal: 'negative',
    description: 'Révisions à la baisse des bénéfices',
  },
  {
    name: 'Indice Conference Board Leading',
    value: '-0.4%',
    signal: 'negative',
    description: 'Signal de ralentissement à 6-9 mois',
  },
  {
    name: 'M2 Money Supply growth',
    value: '1.2%',
    signal: 'neutral',
    description: 'Croissance monétaire faible',
  },
]

export const CYCLE_HISTORY_24M: Array<{ month: string; phase: CyclePhase['id'] }> = [
  { month: '2024-07', phase: 'early' },
  { month: '2024-08', phase: 'early' },
  { month: '2024-09', phase: 'early' },
  { month: '2024-10', phase: 'early' },
  { month: '2024-11', phase: 'early' },
  { month: '2024-12', phase: 'early' },
  { month: '2025-01', phase: 'early' },
  { month: '2025-02', phase: 'early' },
  { month: '2025-03', phase: 'early' },
  { month: '2025-04', phase: 'early' },
  { month: '2025-05', phase: 'late' },
  { month: '2025-06', phase: 'late' },
  { month: '2025-07', phase: 'late' },
  { month: '2025-08', phase: 'late' },
  { month: '2025-09', phase: 'late' },
  { month: '2025-10', phase: 'late' },
  { month: '2025-11', phase: 'late' },
  { month: '2025-12', phase: 'late' },
  { month: '2026-01', phase: 'late' },
  { month: '2026-02', phase: 'late' },
  { month: '2026-03', phase: 'late' },
  { month: '2026-04', phase: 'late' },
  { month: '2026-05', phase: 'late' },
  { month: '2026-06', phase: 'late' },
]
