import { useMemo, useState } from 'react'
import type { StockPrice } from '../types/price'
import { getStockPrice } from '../hooks/useStockPrices'
import type { DividendStock } from '../types'
import PriceLine from './PriceLine'

interface AddStockModalProps {
  onClose: () => void
  onAdd: (stockId: string, shares: number) => void
  existingIds: string[]
  stocks: DividendStock[]
  stockPrices?: Map<string, StockPrice>
}

function PriceTag({ prices, ticker }: { prices: Map<string, StockPrice>; ticker: string }) {
  const price = getStockPrice(prices, ticker)
  if (!price) return null
  return <PriceLine price={price} size="sm" />
}

export default function AddStockModal({
  onClose,
  onAdd,
  existingIds,
  stocks,
  stockPrices,
}: AddStockModalProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DividendStock | null>(null)
  const [shares, setShares] = useState(10)

  const prices = stockPrices ?? new Map<string, StockPrice>()

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return stocks
    return stocks.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().includes(q) ||
        s.category.includes(q),
    )
  }, [search, stocks])

  const selectedPrice = selected ? getStockPrice(prices, selected.ticker) : undefined

  const handleAdd = () => {
    if (!selected) return
    onAdd(selected.id, shares)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl animate-slide-up max-h-[85dvh] flex flex-col">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-toss-gray-200" />
        </div>

        <div className="px-5 pb-4">
          <h2 className="text-xl font-bold">{selected ? '수량 입력' : '종목 검색'}</h2>
          {!selected && (
            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="종목명, 티커 검색 (예: SCHD, 맥쿼리)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-toss-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-toss-blue/30 placeholder:text-toss-gray-400"
                autoFocus
              />
            </div>
          )}
        </div>

        {selected ? (
          <div className="px-5 pb-8 flex-1">
            <div className="bg-toss-gray-50 rounded-2xl p-5 text-center">
              <div className={`inline-flex w-14 h-14 rounded-2xl items-center justify-center text-lg font-bold mb-3 ${
                selected.market === 'US' ? 'bg-blue-100 text-toss-blue' : 'bg-red-100 text-red-500'
              }`}>
                {selected.ticker.slice(0, 2)}
              </div>
              <p className="text-lg font-bold">{selected.name}</p>
              <p className="text-sm text-toss-gray-400 mt-1">{selected.ticker} · {selected.category}</p>
              {selectedPrice && (
                <div className="mt-4 inline-flex items-center gap-4 bg-white rounded-xl px-5 py-3 shadow-sm">
                  <span className="text-xs text-toss-gray-500">현재가</span>
                  <PriceLine price={selectedPrice} size="md" align="left" />
                </div>
              )}
            </div>

            <div className="mt-8">
              <p className="text-sm text-toss-gray-600 font-medium text-center mb-4">예상 보유 수량</p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setShares(Math.max(1, shares - 1))}
                  className="w-12 h-12 rounded-2xl bg-toss-gray-100 text-2xl font-bold text-toss-gray-600 active:bg-toss-gray-200"
                >
                  −
                </button>
                <span className="text-4xl font-bold w-20 text-center">{shares}</span>
                <button
                  onClick={() => setShares(shares + 1)}
                  className="w-12 h-12 rounded-2xl bg-toss-gray-100 text-2xl font-bold text-toss-gray-600 active:bg-toss-gray-200"
                >
                  +
                </button>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                value={shares}
                onChange={(e) => setShares(Number(e.target.value))}
                className="w-full mt-6 accent-toss-blue"
              />
              <div className="flex justify-between text-xs text-toss-gray-400 mt-1">
                <span>1</span>
                <span>500</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-4 rounded-xl bg-toss-gray-100 font-semibold text-toss-gray-600"
              >
                뒤로
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 py-4 rounded-xl bg-toss-blue text-white font-semibold active:bg-toss-blue-dark"
              >
                추가하기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <div className="space-y-2">
              {filtered.map((stock) => (
                <button
                  key={stock.id}
                  onClick={() => setSelected(stock)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-toss-gray-100 hover:border-toss-blue/30 active:bg-toss-gray-50 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    stock.market === 'US' ? 'bg-blue-50 text-toss-blue' : 'bg-red-50 text-red-500'
                  }`}>
                    {stock.market}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-toss-gray-900">{stock.name}</p>
                      {existingIds.includes(stock.id) && (
                        <span className="text-[10px] bg-toss-blue/10 text-toss-blue px-1.5 py-0.5 rounded font-medium">보유중</span>
                      )}
                    </div>
                    <p className="text-xs text-toss-gray-400 mt-0.5">{stock.ticker} · {stock.category}</p>
                  </div>
                  <PriceTag prices={prices} ticker={stock.ticker} />
                  <span className="text-toss-gray-400 ml-1">›</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-toss-gray-400 py-10">검색 결과가 없습니다</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
