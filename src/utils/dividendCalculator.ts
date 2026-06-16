import { DIVIDEND_STOCKS, USD_TO_KRW } from '../data/dividendStocks'
import type { DividendStock, Holding, MonthlyDividend } from '../types'

export function toKRW(amount: number, currency: 'KRW' | 'USD'): number {
  return currency === 'USD' ? Math.round(amount * USD_TO_KRW) : amount
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원'
}

export function formatUSD(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function getStockById(id: string, stocks: DividendStock[] = DIVIDEND_STOCKS): DividendStock | undefined {
  return stocks.find((s) => s.id === id)
}

export function calculateMonthlyDividends(
  holdings: Holding[],
  stocks: DividendStock[] = DIVIDEND_STOCKS,
): MonthlyDividend[] {
  const months: MonthlyDividend[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalKRW: 0,
    items: [],
  }))

  for (const holding of holdings) {
    const stock = getStockById(holding.stockId, stocks)
    if (!stock || holding.shares <= 0) continue

    for (const payment of stock.payments) {
      const amountKRW = toKRW(payment.amountPerShare * holding.shares, stock.currency)
      const monthData = months[payment.month - 1]
      monthData.totalKRW += amountKRW
      monthData.items.push({
        stock,
        shares: holding.shares,
        amountKRW,
        day: payment.day,
      })
    }
  }

  for (const m of months) {
    m.items.sort((a, b) => a.day - b.day)
  }

  return months
}

export function getAnnualTotal(monthly: MonthlyDividend[]): number {
  return monthly.reduce((sum, m) => sum + m.totalKRW, 0)
}

export function getCurrentMonthDividend(monthly: MonthlyDividend[]): number {
  const currentMonth = new Date().getMonth() + 1
  return monthly[currentMonth - 1]?.totalKRW ?? 0
}

export function getNextPayment(monthly: MonthlyDividend[]): {
  month: number
  day: number
  amount: number
  stockName: string
} | null {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  const upcoming: { month: number; day: number; amount: number; stockName: string; sortKey: number }[] = []

  for (const m of monthly) {
    for (const item of m.items) {
      const sortKey = m.month * 100 + item.day
      const currentKey = currentMonth * 100 + currentDay
      if (sortKey >= currentKey || m.month < currentMonth) {
        const adjustedMonth = m.month < currentMonth ? m.month + 12 : m.month
        upcoming.push({
          month: m.month,
          day: item.day,
          amount: item.amountKRW,
          stockName: item.stock.name,
          sortKey: adjustedMonth * 100 + item.day,
        })
      }
    }
  }

  upcoming.sort((a, b) => a.sortKey - b.sortKey)
  return upcoming[0] ?? null
}
