import { useState } from 'react'
import AddStockModal from './components/AddStockModal'
import BottomNav from './components/BottomNav'
import CalendarView from './components/CalendarView'
import ChallengeView from './components/ChallengeView'
import HomeScreen from './components/HomeScreen'
import { useDividendStocks } from './hooks/useDividendStocks'
import { useStockPrices } from './hooks/useStockPrices'
import { usePortfolio } from './hooks/usePortfolio'

type Tab = 'home' | 'calendar' | 'challenge'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [showAddModal, setShowAddModal] = useState(false)
  const { holdings, addHolding, updateShares, removeHolding } = usePortfolio()
  const { stocks, loading, syncedAt, hasLiveKrData, hasLiveUsData } = useDividendStocks()
  const { prices: stockPrices, krBasDt: priceBasDt, hasUsPrices } = useStockPrices()

  return (
    <div className="min-h-dvh bg-toss-gray-100">
      {tab === 'home' && (
        <HomeScreen
          holdings={holdings}
          stocks={stocks}
          loading={loading}
          syncedAt={syncedAt}
          hasLiveKrData={hasLiveKrData}
          hasLiveUsData={hasLiveUsData}
          stockPrices={stockPrices}
          priceBasDt={priceBasDt}
          hasUsPrices={hasUsPrices}
          onAddClick={() => setShowAddModal(true)}
          onUpdateShares={updateShares}
          onRemove={removeHolding}
        />
      )}
      {tab === 'calendar' && <CalendarView holdings={holdings} stocks={stocks} />}
      {tab === 'challenge' && <ChallengeView holdings={holdings} stocks={stocks} />}

      <BottomNav active={tab} onChange={setTab} />

      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onAdd={addHolding}
          existingIds={holdings.map((h) => h.stockId)}
          stocks={stocks}
          stockPrices={stockPrices}
        />
      )}
    </div>
  )
}
