import { useEffect, useMemo, useState } from 'react'
import { DIVIDEND_STOCKS } from '../data/dividendStocks'
import type { DividendStock } from '../types'
import type { KrDividendCacheFile } from '../types/dividendApi'

const KR_CACHE_URL = `${import.meta.env.BASE_URL}data/kr-dividends.json`
const US_CACHE_URL = `${import.meta.env.BASE_URL}data/us-dividends.json`

function mergeStocks(
  live: DividendStock[],
  fallback: DividendStock[],
): DividendStock[] {
  if (live.length === 0) return fallback
  const liveIds = new Set(live.map((s) => s.id))
  const remaining = fallback.filter((s) => !liveIds.has(s.id))
  return [...live, ...remaining]
}

export function useDividendStocks() {
  const [krStocks, setKrStocks] = useState<DividendStock[]>([])
  const [usStocks, setUsStocks] = useState<DividendStock[]>([])
  const [krSyncedAt, setKrSyncedAt] = useState<string | null>(null)
  const [usSyncedAt, setUsSyncedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch(KR_CACHE_URL).then((res) => (res.ok ? res.json() : null)),
      fetch(US_CACHE_URL).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([krData, usData]: [KrDividendCacheFile | null, KrDividendCacheFile | null]) => {
        if (cancelled) return
        if (krData?.stocks) {
          setKrStocks(krData.stocks)
          setKrSyncedAt(krData.syncedAt)
        }
        if (usData?.stocks) {
          setUsStocks(usData.stocks)
          setUsSyncedAt(usData.syncedAt)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const stocks = useMemo(() => {
    const usFallback = DIVIDEND_STOCKS.filter((s) => s.market === 'US')
    const krFallback = DIVIDEND_STOCKS.filter((s) => s.market === 'KR')
    const mergedUs = mergeStocks(usStocks, usFallback)
    const mergedKr = mergeStocks(krStocks, krFallback)
    return [...mergedUs, ...mergedKr]
  }, [krStocks, usStocks])

  return {
    stocks,
    loading,
    syncedAt: krSyncedAt ?? usSyncedAt,
    krSyncedAt,
    usSyncedAt,
    hasLiveKrData: krStocks.length > 0,
    hasLiveUsData: usStocks.length > 0,
  }
}
