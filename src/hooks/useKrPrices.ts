import { useEffect, useState } from 'react'

export interface KrPrice {
  ticker: string
  name: string
  closePrice: number
  changeRate: number
  market: string
  basDt: string
}

interface KrPriceCache {
  syncedAt: string
  basDt: string | null
  prices: KrPrice[]
}

const PRICE_URL = `${import.meta.env.BASE_URL}data/kr-prices.json`

export function useKrPrices() {
  const [prices, setPrices] = useState<Map<string, KrPrice>>(new Map())
  const [basDt, setBasDt] = useState<string | null>(null)

  useEffect(() => {
    fetch(PRICE_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: KrPriceCache | null) => {
        if (!data?.prices) return
        setPrices(new Map(data.prices.map((p) => [p.ticker, p])))
        setBasDt(data.basDt)
      })
      .catch(() => {})
  }, [])

  return { prices, basDt }
}
