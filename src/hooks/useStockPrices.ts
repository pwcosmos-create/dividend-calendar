import { useEffect, useState } from 'react'
import { FALLBACK_PRICE_MAP } from '../data/priceFallback'
import type { StockPrice } from '../types/price'

export type { StockPrice }

interface PriceCache {
  syncedAt: string
  basDt?: string | null
  prices: Array<{
    ticker: string
    name: string
    closePrice: number
    changeRate: number
    basDt: string
    market?: string
    currency?: string
  }>
}

const KR_URL = `${import.meta.env.BASE_URL}data/kr-prices.json`
const US_URL = `${import.meta.env.BASE_URL}data/us-prices.json`

function toStockPrice(
  p: PriceCache['prices'][0],
  market: 'KR' | 'US',
): StockPrice {
  return {
    ticker: p.ticker,
    name: p.name,
    closePrice: p.closePrice,
    changeRate: p.changeRate,
    market,
    currency: market === 'US' ? 'USD' : 'KRW',
    basDt: p.basDt,
  }
}

function mergePrices(fetched: Map<string, StockPrice>): Map<string, StockPrice> {
  const map = new Map(FALLBACK_PRICE_MAP)
  for (const [ticker, price] of fetched) {
    map.set(ticker, price)
  }
  return map
}

export function useStockPrices() {
  const [prices, setPrices] = useState<Map<string, StockPrice>>(() => new Map(FALLBACK_PRICE_MAP))
  const [krBasDt, setKrBasDt] = useState<string | null>('20260615')
  const [usSyncedAt, setUsSyncedAt] = useState<string | null>(null)
  const [hasUsPrices, setHasUsPrices] = useState(true)

  useEffect(() => {
    const fetched = new Map<string, StockPrice>()

    Promise.all([
      fetch(KR_URL).then((res) => (res.ok ? res.json() : null)),
      fetch(US_URL).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([krData, usData]: [PriceCache | null, PriceCache | null]) => {
        if (krData?.prices) {
          for (const p of krData.prices) {
            fetched.set(p.ticker, toStockPrice(p, 'KR'))
          }
          setKrBasDt(krData.basDt ?? krData.prices[0]?.basDt ?? null)
        }

        if (usData?.prices?.length) {
          for (const p of usData.prices) {
            fetched.set(p.ticker, toStockPrice(p, 'US'))
          }
          setUsSyncedAt(usData.syncedAt)
          setHasUsPrices(true)
        }

        setPrices(mergePrices(fetched))
      })
      .catch(() => {})
  }, [])

  return { prices, krBasDt, usSyncedAt, hasUsPrices }
}

export function getStockPrice(
  prices: Map<string, StockPrice>,
  ticker: string,
): StockPrice | undefined {
  return prices.get(ticker) ?? FALLBACK_PRICE_MAP.get(ticker)
}
