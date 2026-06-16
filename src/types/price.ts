export interface StockPrice {
  ticker: string
  name: string
  closePrice: number
  changeRate: number
  market: 'KR' | 'US'
  currency: 'KRW' | 'USD'
  basDt: string
}
