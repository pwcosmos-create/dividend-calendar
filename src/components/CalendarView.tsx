import { useMemo, useState } from 'react'
import type { Holding } from '../types'
import { calculateMonthlyDividends, formatKRW } from '../utils/dividendCalculator'

interface CalendarViewProps {
  holdings: Holding[]
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function CalendarView({ holdings }: CalendarViewProps) {
  const monthly = useMemo(() => calculateMonthlyDividends(holdings), [holdings])
  const maxAmount = Math.max(...monthly.map((m) => m.totalKRW), 1)
  const currentMonth = new Date().getMonth() + 1
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth)

  const selected = selectedMonth ? monthly[selectedMonth - 1] : null

  return (
    <div className="pb-24 animate-fade-in">
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-toss-gray-900">배당 달력</h1>
        <p className="text-toss-gray-400 text-sm mt-1">월별 예상 배당금 일정</p>
      </header>

      {holdings.length === 0 ? (
        <div className="mx-5 bg-white rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-toss-gray-900 font-semibold">종목을 추가하면 달력이 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="mx-5 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-end gap-1.5 h-40">
              {monthly.map((m) => {
                const height = (m.totalKRW / maxAmount) * 100
                const isCurrent = m.month === currentMonth
                const isSelected = m.month === selectedMonth
                return (
                  <button
                    key={m.month}
                    onClick={() => setSelectedMonth(m.month)}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <div className="w-full flex items-end justify-center h-32">
                      <div
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                          isSelected || isCurrent
                            ? 'bg-toss-blue'
                            : m.totalKRW > 0
                              ? 'bg-toss-blue/30 group-hover:bg-toss-blue/50'
                              : 'bg-toss-gray-100'
                        }`}
                        style={{ height: `${Math.max(height, m.totalKRW > 0 ? 8 : 2)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${
                      isCurrent ? 'text-toss-blue font-bold' : 'text-toss-gray-400'
                    }`}>
                      {m.month}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Month Detail */}
          {selected && (
            <section className="mt-6 px-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {MONTH_NAMES[selected.month - 1]} 배당
                  {selected.month === currentMonth && (
                    <span className="ml-2 text-xs bg-toss-blue/10 text-toss-blue px-2 py-0.5 rounded-full font-medium">이번 달</span>
                  )}
                </h2>
                <p className="text-lg font-bold text-toss-blue">{formatKRW(selected.totalKRW)}</p>
              </div>

              {selected.items.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-toss-gray-400 text-sm">
                  이 달에는 배당 일정이 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-toss-gray-100 flex items-center justify-center text-sm font-bold text-toss-gray-600">
                        {item.day}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-toss-gray-900">{item.stock.name}</p>
                        <p className="text-xs text-toss-gray-400 mt-0.5">
                          {item.day}일 · {item.shares}주
                        </p>
                      </div>
                      <p className="font-bold text-toss-blue">{formatKRW(item.amountKRW)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}