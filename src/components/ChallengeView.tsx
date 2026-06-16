import { useMemo } from 'react'
import { CHALLENGE_GOALS } from '../data/dividendStocks'
import type { Holding } from '../types'
import {
  calculateMonthlyDividends,
  formatKRW,
  getAnnualTotal,
  getCurrentMonthDividend,
} from '../utils/dividendCalculator'

interface ChallengeViewProps {
  holdings: Holding[]
}

export default function ChallengeView({ holdings }: ChallengeViewProps) {
  const monthly = useMemo(() => calculateMonthlyDividends(holdings), [holdings])
  const monthlyAmount = getCurrentMonthDividend(monthly)
  const annualAmount = getAnnualTotal(monthly)

  const completed = CHALLENGE_GOALS.filter((g) => monthlyAmount >= g.amount)
  const nextGoal = CHALLENGE_GOALS.find((g) => monthlyAmount < g.amount)
  const progress = nextGoal ? Math.min((monthlyAmount / nextGoal.amount) * 100, 100) : 100

  return (
    <div className="pb-24 animate-fade-in">
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-toss-gray-900">생활비 챌린지</h1>
        <p className="text-toss-gray-400 text-sm mt-1">배당금으로 일상 비용을 해결해 보세요</p>
      </header>

      {holdings.length === 0 ? (
        <div className="mx-5 bg-white rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-toss-gray-900 font-semibold">종목을 추가하면 챌린지가 시작됩니다</p>
        </div>
      ) : (
        <>
          {/* Current Progress Hero */}
          <div className="mx-5 bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-toss-gray-400 font-medium">이번 달 배당으로 커버 가능</p>
            <p className="text-3xl font-bold text-toss-gray-900 mt-2">{formatKRW(monthlyAmount)}</p>

            {nextGoal ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <span>{nextGoal.emoji}</span> 다음 목표: {nextGoal.label}
                  </span>
                  <span className="text-sm font-bold text-toss-blue">{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-toss-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-toss-blue to-toss-blue-dark rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-toss-gray-400 mt-2">
                  {formatKRW(nextGoal.amount - monthlyAmount)} 더 모으면 달성!
                </p>
              </div>
            ) : (
              <div className="mt-4 bg-green-50 rounded-xl p-4 text-center">
                <p className="text-green-600 font-bold">🎉 모든 챌린지 달성!</p>
                <p className="text-green-600/70 text-sm mt-1">이번 달 배당으로 월세까지 커버 가능해요</p>
              </div>
            )}
          </div>

          {/* Completed */}
          {completed.length > 0 && (
            <section className="mt-8 px-5">
              <h2 className="text-lg font-bold mb-4">✅ 달성 완료</h2>
              <div className="space-y-2">
                {completed.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border-l-4 border-green-400"
                  >
                    <span className="text-2xl">{goal.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-toss-gray-900">{goal.label}</p>
                      <p className="text-xs text-green-500 font-medium mt-0.5">해결 완료!</p>
                    </div>
                    <p className="text-sm text-toss-gray-400">{formatKRW(goal.amount)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Goals */}
          <section className="mt-8 px-5">
            <h2 className="text-lg font-bold mb-4">전체 챌린지 목록</h2>
            <div className="space-y-2">
              {CHALLENGE_GOALS.map((goal) => {
                const isDone = monthlyAmount >= goal.amount
                const pct = Math.min((monthlyAmount / goal.amount) * 100, 100)
                return (
                  <div
                    key={goal.id}
                    className={`bg-white rounded-xl p-4 shadow-sm ${isDone ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{goal.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-toss-gray-900">{goal.label}</p>
                        <p className="text-xs text-toss-gray-400">{formatKRW(goal.amount)}</p>
                      </div>
                      {isDone ? (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">완료</span>
                      ) : (
                        <span className="text-xs text-toss-gray-400 font-medium">{Math.round(pct)}%</span>
                      )}
                    </div>
                    {!isDone && (
                      <div className="h-1.5 bg-toss-gray-100 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-toss-blue/60 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Annual insight */}
          <div className="mx-5 mt-8 mb-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-5 text-white">
            <p className="text-white/80 text-sm">연간 배당으로 가능한 것</p>
            <p className="text-lg font-bold mt-2">
              {CHALLENGE_GOALS.filter((g) => annualAmount >= g.amount).length}개 챌린지 달성 가능
            </p>
            <p className="text-white/70 text-sm mt-1">연 예상 배당 {formatKRW(annualAmount)}</p>
          </div>
        </>
      )}
    </div>
  )
}
