import type { StockPrice } from '../types/price'
import { USD_TO_KRW } from '../data/dividendStocks'
import { formatKRW, formatUSD, toKRW } from './dividendCalculator'

export function formatPriceDual(price: StockPrice): { main: string; sub?: string } {
  if (price.currency === 'USD') {
    const krw = toKRW(price.closePrice, 'USD')
    return {
      main: formatUSD(price.closePrice),
      sub: `≈ ${formatKRW(krw)}`,
    }
  }
  const usd = price.closePrice / USD_TO_KRW
  return {
    main: formatKRW(price.closePrice),
    sub: `≈ ${formatUSD(usd)}`,
  }
}

export function formatChangeRate(rate: number): string {
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`
}
