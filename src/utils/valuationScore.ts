import { StockFundamentals } from '../data/fundamentals';

export interface ValuationScore {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  color: string;
  components: {
    valuation: number;
    profitability: number;
    growth: number;
    health: number;
  };
  signals: string[];
}

export function calculateValuationScore(stock: StockFundamentals): ValuationScore {
  const signals: string[] = [];

  // --- Valuation (0-25) ---
  let valuation = 0;

  // PE vs sector (max 10 pts)
  if (stock.pe > 0 && stock.sectorPE > 0) {
    const peDiscount = (stock.sectorPE - stock.pe) / stock.sectorPE;
    if (peDiscount >= 0.4) { valuation += 10; signals.push(`P/E ${Math.round(peDiscount * 100)}% sous la moyenne sectorielle`); }
    else if (peDiscount >= 0.2) { valuation += 7; signals.push(`P/E ${Math.round(peDiscount * 100)}% sous la moyenne sectorielle`); }
    else if (peDiscount >= 0.05) { valuation += 4; }
    else if (peDiscount < -0.3) { signals.push(`P/E ${Math.round(-peDiscount * 100)}% au-dessus de la moyenne sectorielle`); }
  }

  // PB vs sector (max 5 pts)
  if (stock.pb > 0 && stock.sectorPB > 0) {
    const pbDiscount = (stock.sectorPB - stock.pb) / stock.sectorPB;
    if (pbDiscount >= 0.4) { valuation += 5; signals.push(`P/B attractif (${stock.pb.toFixed(1)}x vs secteur ${stock.sectorPB.toFixed(1)}x)`); }
    else if (pbDiscount >= 0.2) { valuation += 3; }
    else if (pbDiscount >= 0) { valuation += 1; }
  }

  // EV/EBITDA (max 5 pts)
  if (stock.ev_ebitda < 6) { valuation += 5; signals.push(`EV/EBITDA très attractif (${stock.ev_ebitda.toFixed(1)}x)`); }
  else if (stock.ev_ebitda < 10) { valuation += 3; }
  else if (stock.ev_ebitda < 15) { valuation += 1; }

  // Analyst upside bonus (max 5 pts)
  if (stock.analystUpside >= 30) { valuation += 5; signals.push(`Potentiel analyste +${stock.analystUpside.toFixed(0)}% (${stock.numAnalysts} analystes)`); }
  else if (stock.analystUpside >= 20) { valuation += 3; signals.push(`Potentiel analyste +${stock.analystUpside.toFixed(0)}%`); }
  else if (stock.analystUpside >= 10) { valuation += 1; }

  // Compare to Graham value
  if (stock.grahamValue > 0 && stock.currentPrice < stock.grahamValue) {
    const discount = ((stock.grahamValue - stock.currentPrice) / stock.grahamValue) * 100;
    signals.push(`Décote de ${discount.toFixed(0)}% vs valeur Graham (${stock.grahamValue.toFixed(0)} ${stock.currency})`);
  }

  valuation = Math.min(25, valuation);

  // --- Profitability (0-25) ---
  let profitability = 0;

  // ROE (max 8 pts)
  if (stock.roe >= 25) { profitability += 8; signals.push(`ROE exceptionnel (${stock.roe.toFixed(1)}%)`); }
  else if (stock.roe >= 15) { profitability += 6; signals.push(`ROE solide (${stock.roe.toFixed(1)}%)`); }
  else if (stock.roe >= 10) { profitability += 3; }
  else if (stock.roe < 5) { signals.push(`ROE faible (${stock.roe.toFixed(1)}%)`); }

  // ROIC (max 7 pts)
  if (stock.roic >= 20) { profitability += 7; signals.push(`ROIC excellent (${stock.roic.toFixed(1)}%)`); }
  else if (stock.roic >= 12) { profitability += 4; }
  else if (stock.roic >= 8) { profitability += 2; }

  // Operating margin (max 5 pts)
  if (stock.operatingMargin >= 30) { profitability += 5; signals.push(`Marge opérationnelle élevée (${stock.operatingMargin.toFixed(1)}%)`); }
  else if (stock.operatingMargin >= 20) { profitability += 3; }
  else if (stock.operatingMargin >= 10) { profitability += 1; }

  // Gross margin (max 5 pts)
  if (stock.grossMargin >= 70) { profitability += 5; }
  else if (stock.grossMargin >= 50) { profitability += 3; }
  else if (stock.grossMargin >= 30) { profitability += 1; }

  profitability = Math.min(25, profitability);

  // --- Growth (0-25) ---
  let growth = 0;

  // EPS growth YoY (max 10 pts)
  if (stock.epsGrowthYoY >= 20) { growth += 10; signals.push(`Croissance BPA forte +${stock.epsGrowthYoY.toFixed(1)}% (a/a)`); }
  else if (stock.epsGrowthYoY >= 10) { growth += 7; signals.push(`Croissance BPA +${stock.epsGrowthYoY.toFixed(1)}% (a/a)`); }
  else if (stock.epsGrowthYoY >= 5) { growth += 4; }
  else if (stock.epsGrowthYoY >= 0) { growth += 1; }
  else if (stock.epsGrowthYoY < -20) { signals.push(`BPA en forte baisse (${stock.epsGrowthYoY.toFixed(1)}% a/a)`); }

  // EPS growth 5Y CAGR (max 8 pts)
  if (stock.epsGrowth5Y >= 15) { growth += 8; signals.push(`Croissance long terme robuste (${stock.epsGrowth5Y.toFixed(1)}% TCAM 5 ans)`); }
  else if (stock.epsGrowth5Y >= 8) { growth += 5; }
  else if (stock.epsGrowth5Y >= 3) { growth += 2; }

  // Revenue growth (max 7 pts)
  if (stock.revenueGrowthYoY >= 15) { growth += 7; }
  else if (stock.revenueGrowthYoY >= 5) { growth += 4; }
  else if (stock.revenueGrowthYoY >= 0) { growth += 2; }

  growth = Math.min(25, growth);

  // --- Health (0-25) ---
  let health = 0;

  // Debt/Equity (max 8 pts) - banks have high D/E by nature
  const isBank = stock.sector === 'Finance';
  if (!isBank) {
    if (stock.debtToEquity <= 0.3) { health += 8; signals.push(`Bilan solide (D/E ${stock.debtToEquity.toFixed(2)})`); }
    else if (stock.debtToEquity <= 0.7) { health += 5; }
    else if (stock.debtToEquity <= 1.2) { health += 2; }
    else { signals.push(`Endettement élevé (D/E ${stock.debtToEquity.toFixed(2)})`); }
  } else {
    // For banks, use a more lenient scale
    health += 4;
  }

  // Current ratio (max 7 pts)
  if (stock.currentRatio >= 2) { health += 7; }
  else if (stock.currentRatio >= 1.5) { health += 4; }
  else if (stock.currentRatio >= 1) { health += 2; }
  else { signals.push(`Liquidité insuffisante (ratio courant ${stock.currentRatio.toFixed(1)})`); }

  // Interest coverage (max 5 pts)
  if (stock.interestCoverage >= 20) { health += 5; }
  else if (stock.interestCoverage >= 8) { health += 3; }
  else if (stock.interestCoverage >= 4) { health += 1; }
  else { signals.push(`Couverture des intérêts faible (${stock.interestCoverage.toFixed(1)}x)`); }

  // Dividend yield bonus (max 5 pts)
  if (stock.dividendYield >= 4 && stock.payoutRatio <= 70) {
    health += 5;
    signals.push(`Dividende attractif ${stock.dividendYield.toFixed(1)}% (payout ${stock.payoutRatio.toFixed(0)}%)`);
  } else if (stock.dividendYield >= 2) {
    health += 2;
  }

  health = Math.min(25, health);

  const total = Math.round(valuation + profitability + growth + health);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let label: string;
  let color: string;

  if (total >= 75) {
    grade = 'A';
    label = 'Très Sous-Évalué';
    color = 'green';
  } else if (total >= 60) {
    grade = 'B';
    label = 'Sous-Évalué';
    color = 'emerald';
  } else if (total >= 45) {
    grade = 'C';
    label = 'Juste Valeur';
    color = 'yellow';
  } else if (total >= 30) {
    grade = 'D';
    label = 'Sur-Évalué';
    color = 'orange';
  } else {
    grade = 'F';
    label = 'Très Sur-Évalué';
    color = 'red';
  }

  return {
    total,
    grade,
    label,
    color,
    components: { valuation, profitability, growth, health },
    signals: signals.slice(0, 6),
  };
}
