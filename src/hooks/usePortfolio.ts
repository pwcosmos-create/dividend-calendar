import { useCallback, useEffect, useState } from 'react'
import type { Holding } from '../types'

const STORAGE_KEY = 'dividend-portfolio'

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
  }, [holdings])

  const addHolding = useCallback((stockId: string, shares: number) => {
    setHoldings((prev) => {
      const existing = prev.find((h) => h.stockId === stockId)
      if (existing) {
        return prev.map((h) =>
          h.stockId === stockId ? { ...h, shares: h.shares + shares } : h,
        )
      }
      return [...prev, { stockId, shares }]
    })
  }, [])

  const updateShares = useCallback((stockId: string, shares: number) => {
    if (shares <= 0) {
      setHoldings((prev) => prev.filter((h) => h.stockId !== stockId))
    } else {
      setHoldings((prev) =>
        prev.map((h) => (h.stockId === stockId ? { ...h, shares } : h)),
      )
    }
  }, [])

  const removeHolding = useCallback((stockId: string) => {
    setHoldings((prev) => prev.filter((h) => h.stockId !== stockId))
  }, [])

  return { holdings, addHolding, updateShares, removeHolding }
}
