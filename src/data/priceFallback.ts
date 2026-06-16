import type { StockPrice } from '../types/price'

/** 앱에 내장된 시세 (sync 전·오프라인에서도 표시) */
export const FALLBACK_PRICES: StockPrice[] = [
  // 국내
  { ticker: '005930', name: '삼성전자', closePrice: 337000, changeRate: 4.5, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '017670', name: 'SK텔레콤', closePrice: 105400, changeRate: 2.33, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '105560', name: 'KB금융', closePrice: 169600, changeRate: 5.21, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '005490', name: 'POSCO홀딩스', closePrice: 395000, changeRate: 4.77, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '088980', name: '맥쿼리인프라', closePrice: 10950, changeRate: -1.08, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '329180', name: 'HD현대중공업', closePrice: 714000, changeRate: 9.85, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '229720', name: 'KODEX 고배당', closePrice: 14200, changeRate: 0.5, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '458730', name: 'TIGER 미국배당', closePrice: 12850, changeRate: 0.3, market: 'KR', currency: 'KRW', basDt: '20260615' },
  { ticker: '441640', name: 'ACE 미국배당', closePrice: 11980, changeRate: 0.2, market: 'KR', currency: 'KRW', basDt: '20260615' },
  // 미국
  { ticker: 'SCHD', name: 'SCHD', closePrice: 32.63, changeRate: -0.58, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'JEPI', name: 'JEPI', closePrice: 56.37, changeRate: 0.59, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'O', name: '리얼티인컴', closePrice: 62.14, changeRate: -0.92, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'VYM', name: 'VYM', closePrice: 160.46, changeRate: 0.08, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'MAIN', name: 'MAIN', closePrice: 51.29, changeRate: -1.4, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'QYLD', name: 'QYLD', closePrice: 18.21, changeRate: 0.66, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'KO', name: '코카콜라', closePrice: 80.91, changeRate: -2.07, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'JEPQ', name: 'JEPQ', closePrice: 61.18, changeRate: 2.21, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'SPYD', name: 'SPYD', closePrice: 48.65, changeRate: -0.96, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'DGRO', name: 'DGRO', closePrice: 75.63, changeRate: -0.37, market: 'US', currency: 'USD', basDt: '20260616' },
  { ticker: 'ALL', name: 'Aristocrat', closePrice: 221.81, changeRate: 0.08, market: 'US', currency: 'USD', basDt: '20260616' },
]

export function buildPriceMap(list: StockPrice[]): Map<string, StockPrice> {
  return new Map(list.map((p) => [p.ticker, p]))
}

export const FALLBACK_PRICE_MAP = buildPriceMap(FALLBACK_PRICES)
