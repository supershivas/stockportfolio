import { useState, useEffect, useCallback } from 'react'
import { fetchMultipleQuotes, QuoteResult, isApiConfigured } from '../services/marketData'

interface UseLiveQuotesResult {
  quotes: Map<string, QuoteResult>
  loading: boolean
  lastUpdated: Date | null
  refresh: () => Promise<void>
  configured: boolean
}

export function useLiveQuotes(tickers: string[], autoFetch = true): UseLiveQuotesResult {
  const [quotes, setQuotes] = useState<Map<string, QuoteResult>>(new Map())
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [configured, setConfigured] = useState(isApiConfigured())

  // fetchQuote() already falls back to Yahoo Finance (no key required) when
  // no Finnhub key is set — so fetching must never be gated on isApiConfigured.
  // That flag only reflects whether a Finnhub key is present (higher rate
  // limits, real news feed); it says nothing about whether live prices are
  // available, which they always are via the Yahoo fallback.
  const refresh = useCallback(async () => {
    if (tickers.length === 0) return
    setLoading(true)
    const results = await fetchMultipleQuotes(tickers)
    setQuotes(results)
    setLastUpdated(new Date())
    setLoading(false)
  }, [tickers.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setConfigured(isApiConfigured())
    if (autoFetch) {
      refresh()
    }
  }, [refresh, autoFetch])

  return { quotes, loading, lastUpdated, refresh, configured }
}
