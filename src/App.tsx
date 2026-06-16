import { useState } from 'react'
import AddStockModal from './components/AddStockModal'
import BottomNav from './components/BottomNav'
import CalendarView from './components/CalendarView'
import ChallengeView from './components/ChallengeView'
import HomeScreen from './components/HomeScreen'
import { usePortfolio } from './hooks/usePortfolio'

type Tab = 'home' | 'calendar' | 'challenge'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [showAddModal, setShowAddModal] = useState(false)
  const { holdings, addHolding, updateShares, removeHolding } = usePortfolio()

  return (
    <div className="min-h-dvh bg-toss-gray-100">
      {tab === 'home' && (
        <HomeScreen
          holdings={holdings}
          onAddClick={() => setShowAddModal(true)}
          onUpdateShares={updateShares}
          onRemove={removeHolding}
        />
      )}
      {tab === 'calendar' && <CalendarView holdings={holdings} />}
      {tab === 'challenge' && <ChallengeView holdings={holdings} />}

      <BottomNav active={tab} onChange={setTab} />

      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onAdd={addHolding}
          existingIds={holdings.map((h) => h.stockId)}
        />
      )}
    </div>
  )
}
