import { useMemo } from 'react'
import type { DividendStock, Holding } from '../types'
import type { StockPrice } from '../types/price'
import { getStockPrice } from '../hooks/useStockPrices'
import PriceLine from './PriceLine'
import {
  calculateMonthlyDividends,
  formatKRW,
  getAnnualTotal,
  getCurrentMonthDividend,
  getNextPayment,
  getStockById,
  toKRW,
} from '../utils/dividendCalculator'

interface HomeScreenProps {
  holdings: Holding[]
  stocks: DividendStock[]
  loading?: boolean
  syncedAt?: string | null
  hasLiveKrData?: boolean
  hasLiveUsData?: boolean
  krPrices?: Map<string, StockPrice>
  stockPrices?: Map<string, StockPrice>
  priceBasDt?: string | null
  hasUsPrices?: boolean
  onAddClick: () => void
  onUpdateShares: (stockId: string, shares: number) => void
  onRemove: (stockId: string) => void
}

export default function HomeScreen({
  holdings,
  stocks,
  loading,
  syncedAt,
  hasLiveKrData,
  hasLiveUsData,
  krPrices,
  stockPrices,
  priceBasDt,
  hasUsPrices,
  onAddClick,
  onUpdateShares,
  onRemove,
}: HomeScreenProps) {
  const monthly = useMemo(() => calculateMonthlyDividends(holdings, stocks), [holdings, stocks])
  const prices = stockPrices ?? krPrices ?? new Map<string, StockPrice>()
  const annualTotal = getAnnualTotal(monthly)
  const thisMonth = getCurrentMonthDividend(monthly)
  const nextPayment = getNextPayment(monthly)
  const currentMonth = new Date().getMonth() + 1

  const totalMarketValueKRW = useMemo(() => {
    if (holdings.length === 0) return 0
    return holdings.reduce((sum, h) => {
      const stock = getStockById(h.stockId, stocks)
      if (!stock) return sum
      const price = getStockPrice(prices, stock.ticker)
      if (!price) return sum
      return sum + toKRW(price.closePrice * h.shares, price.currency)
    }, 0)
  }, [holdings, prices, stocks])

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <p className="text-toss-gray-600 text-sm font-medium">나의 월급 외 수당</p>
        <h1 className="text-2xl font-bold text-toss-gray-900 mt-1">배당금 달력</h1>
        {hasLiveKrData && syncedAt && (
          <p className="text-[11px] text-toss-gray-400 mt-2">
            🇰🇷 국내 배당 · 공공데이터 ({new Date(syncedAt).toLocaleDateString('ko-KR')})
          </p>
        )}
        {hasLiveUsData && (
          <p className="text-[11px] text-toss-gray-400 mt-1">
            🇺🇸 미국 배당 · FMP 실데이터 연동
          </p>
        )}
        {priceBasDt && prices && prices.size > 0 && (
          <p className="text-[11px] text-toss-gray-400 mt-1">
            📈 국내 시세 · {priceBasDt.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')} 종가
            {hasUsPrices && ' · 🇺🇸 미국 시세 연동'}
          </p>
        )}
        {loading && (
          <p className="text-[11px] text-toss-gray-400 mt-2">배당 데이터 불러오는 중...</p>
        )}
      </header>

      {/* Hero Card */}
      <div className="mx-5 rounded-2xl bg-gradient-to-br from-toss-blue to-toss-blue-dark p-6 text-white shadow-lg shadow-toss-blue/20">
        <p className="text-white/80 text-sm font-medium">올해 예상 배당 총액</p>
        <p className="text-3xl font-bold mt-2 tracking-tight">
          {holdings.length > 0 ? formatKRW(annualTotal) : '0원'}
        </p>
        <div className="flex gap-4 mt-5 pt-5 border-t border-white/20">
          {totalMarketValueKRW > 0 && (
            <div className="flex-1">
              <p className="text-white/70 text-xs">총 평가금액</p>
              <p className="text-lg font-bold mt-0.5">{formatKRW(totalMarketValueKRW)}</p>
            </div>
          )}
          <div className="flex-1">
            <p className="text-white/70 text-xs">이번 달 ({currentMonth}월)</p>
            <p className="text-lg font-bold mt-0.5">{formatKRW(thisMonth)}</p>
          </div>
          {nextPayment && (
            <div className="flex-1">
              <p className="text-white/70 text-xs">다음 입금 예정</p>
              <p className="text-sm font-bold mt-0.5">
                {nextPayment.month}/{nextPayment.day} · {nextPayment.stockName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Holdings */}
      <section className="mt-8 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-toss-gray-900">내 배당 저금통</h2>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1 bg-toss-blue text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            <span className="text-base leading-none">+</span> 종목 추가
          </button>
        </div>

        {holdings.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-10 text-center">
              <div className="text-5xl mb-4">💰</div>
              <p className="text-toss-gray-900 font-semibold">아직 등록된 종목이 없어요</p>
              <p className="text-toss-gray-400 text-sm mt-2">
                관심 배당 종목을 추가하고<br />매달 들어올 수당을 확인해 보세요
              </p>
              <button
                onClick={onAddClick}
                className="mt-6 w-full bg-toss-gray-100 text-toss-blue font-semibold py-3.5 rounded-xl active:bg-toss-gray-200 transition-colors"
              >
                첫 종목 추가하기
              </button>
            </div>
            {prices.size > 0 && (
              <PopularPrices prices={prices} onAddClick={onAddClick} stocks={stocks} />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.map((h) => {
              const stock = getStockById(h.stockId, stocks)
              if (!stock) return null
              const stockAnnual = calculateMonthlyDividends([h], stocks)
              const stockTotal = getAnnualTotal(stockAnnual)

              const price = getStockPrice(prices, stock.ticker)

              return (
                <HoldingCard
                  key={h.stockId}
                  name={stock.name}
                  ticker={stock.ticker}
                  market={stock.market}
                  category={stock.category}
                  shares={h.shares}
                  annualDividend={stockTotal}
                  price={price}
                  onUpdateShares={(shares) => onUpdateShares(h.stockId, shares)}
                  onRemove={() => onRemove(h.stockId)}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function HoldingCard({
  name,
  ticker,
  market,
  category,
  shares,
  annualDividend,
  price,
  onUpdateShares,
  onRemove,
}: {
  name: string
  ticker: string
  market: 'KR' | 'US'
  category: string
  shares: number
  annualDividend: number
  price?: StockPrice
  onUpdateShares: (shares: number) => void
  onRemove: () => void
}) {
  const marketValueKRW = price
    ? toKRW(price.closePrice * shares, price.currency)
    : null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
            market === 'US' ? 'bg-blue-50 text-toss-blue' : 'bg-red-50 text-red-500'
          }`}>
            {market}
          </div>
          <div>
            <p className="font-bold text-toss-gray-900">{name}</p>
            <p className="text-xs text-toss-gray-400 mt-0.5">{ticker} · {category}</p>
          </div>
        </div>
        <button onClick={onRemove} className="text-toss-gray-400 text-xs px-2 py-1">삭제</button>
      </div>

      {price && (
        <div className="mt-3 flex items-center justify-between bg-toss-gray-50 rounded-xl px-4 py-3">
          <span className="text-xs text-toss-gray-500 font-medium">현재가</span>
          <PriceLine price={price} size="md" />
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-toss-gray-100">
        <div>
          <p className="text-xs text-toss-gray-400">보유 수량</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onUpdateShares(Math.max(0, shares - 1))}
              className="w-8 h-8 rounded-lg bg-toss-gray-100 text-toss-gray-600 font-bold flex items-center justify-center active:bg-toss-gray-200"
            >
              −
            </button>
            <span className="text-lg font-bold w-12 text-center">{shares}</span>
            <button
              onClick={() => onUpdateShares(shares + 1)}
              className="w-8 h-8 rounded-lg bg-toss-gray-100 text-toss-gray-600 font-bold flex items-center justify-center active:bg-toss-gray-200"
            >
              +
            </button>
          </div>
        </div>
        <div className="text-right">
          {marketValueKRW !== null && (
            <>
              <p className="text-xs text-toss-gray-400">평가금액</p>
              <p className="text-sm font-bold text-toss-gray-900">{formatKRW(marketValueKRW)}</p>
            </>
          )}
          <p className="text-xs text-toss-gray-400 mt-2">연간 예상 배당</p>
          <p className="text-base font-bold text-toss-blue mt-0.5">{formatKRW(annualDividend)}</p>
        </div>
      </div>
    </div>
  )
}

const POPULAR_TICKERS = ['005930', 'SCHD', 'JEPI', '088980', 'O']

function PopularPrices({
  prices,
  stocks,
  onAddClick,
}: {
  prices: Map<string, StockPrice>
  stocks: DividendStock[]
  onAddClick: () => void
}) {
  const items = POPULAR_TICKERS.map((ticker) => {
    const price = getStockPrice(prices, ticker)
    const stock = stocks.find((s) => s.ticker === ticker)
    return price && stock ? { price, stock } : null
  }).filter(Boolean) as { price: StockPrice; stock: DividendStock }[]

  if (items.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-bold text-toss-gray-900 mb-3">📈 인기 종목 현재가</h3>
      <div className="space-y-2">
        {items.map(({ price, stock }) => (
          <div key={stock.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-semibold text-toss-gray-900">{stock.name}</p>
              <p className="text-xs text-toss-gray-400 mt-0.5">{stock.ticker}</p>
            </div>
            <div className="text-right">
              <PriceLine price={price} size="sm" />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onAddClick}
        className="mt-3 w-full text-sm text-toss-blue font-semibold py-2"
      >
        종목 추가하러 가기 →
      </button>
    </div>
  )
}
