import { useMemo } from 'react'
import type { Holding } from '../types'
import {
  calculateMonthlyDividends,
  formatKRW,
  getAnnualTotal,
  getCurrentMonthDividend,
  getNextPayment,
  getStockById,
} from '../utils/dividendCalculator'

interface HomeScreenProps {
  holdings: Holding[]
  onAddClick: () => void
  onUpdateShares: (stockId: string, shares: number) => void
  onRemove: (stockId: string) => void
}

export default function HomeScreen({
  holdings,
  onAddClick,
  onUpdateShares,
  onRemove,
}: HomeScreenProps) {
  const monthly = useMemo(() => calculateMonthlyDividends(holdings), [holdings])
  const annualTotal = getAnnualTotal(monthly)
  const thisMonth = getCurrentMonthDividend(monthly)
  const nextPayment = getNextPayment(monthly)
  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <p className="text-toss-gray-600 text-sm font-medium">나의 월급 외 수당</p>
        <h1 className="text-2xl font-bold text-toss-gray-900 mt-1">배당금 달력</h1>
      </header>

      {/* Hero Card */}
      <div className="mx-5 rounded-2xl bg-gradient-to-br from-toss-blue to-toss-blue-dark p-6 text-white shadow-lg shadow-toss-blue/20">
        <p className="text-white/80 text-sm font-medium">올해 예상 배당 총액</p>
        <p className="text-3xl font-bold mt-2 tracking-tight">
          {holdings.length > 0 ? formatKRW(annualTotal) : '0원'}
        </p>
        <div className="flex gap-4 mt-5 pt-5 border-t border-white/20">
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
        ) : (
          <div className="space-y-3">
            {holdings.map((h) => {
              const stock = getStockById(h.stockId)
              if (!stock) return null
              const stockAnnual = calculateMonthlyDividends([h])
              const stockTotal = getAnnualTotal(stockAnnual)

              return (
                <HoldingCard
                  key={h.stockId}
                  name={stock.name}
                  ticker={stock.ticker}
                  market={stock.market}
                  category={stock.category}
                  shares={h.shares}
                  annualDividend={stockTotal}
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
  onUpdateShares,
  onRemove,
}: {
  name: string
  ticker: string
  market: 'KR' | 'US'
  category: string
  shares: number
  annualDividend: number
  onUpdateShares: (shares: number) => void
  onRemove: () => void
}) {
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
          <p className="text-xs text-toss-gray-400">연간 예상 배당</p>
          <p className="text-base font-bold text-toss-blue mt-1">{formatKRW(annualDividend)}</p>
        </div>
      </div>
    </div>
  )
}
