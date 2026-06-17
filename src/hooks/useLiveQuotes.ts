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

  const refresh = useCallback(async () => {
    if (!isApiConfigured() || tickers.length === 0) return
    setLoading(true)
    const results = await fetchMultipleQuotes(tickers)
    setQuotes(results)
    setLastUpdated(new Date())
    setLoading(false)
  }, [tickers.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setConfigured(isApiConfigured())
    if (autoFetch && isApiConfigured()) {
      refresh()
    }
  }, [refresh, autoFetch])

  return { quotes, loading, lastUpdated, refresh, configured }
}
