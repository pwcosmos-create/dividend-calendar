export interface DividendPayment {
  month: number
  day: number
  amountPerShare: number
}

export interface DividendStock {
  id: string
  name: string
  ticker: string
  market: 'KR' | 'US'
  currency: 'KRW' | 'USD'
  category: string
  payments: DividendPayment[]
}

export interface Holding {
  stockId: string
  shares: number
}

export interface MonthlyDividend {
  month: number
  totalKRW: number
  items: {
    stock: DividendStock
    shares: number
    amountKRW: number
    day: number
  }[]
}

export interface ChallengeGoal {
  id: string
  label: string
  amount: number
  emoji: string
}
