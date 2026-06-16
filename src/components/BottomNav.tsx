interface BottomNavProps {
  active: 'home' | 'calendar' | 'challenge'
  onChange: (tab: 'home' | 'calendar' | 'challenge') => void
}

const tabs = [
  { id: 'home' as const, label: '홈', icon: '🏠' },
  { id: 'calendar' as const, label: '달력', icon: '📅' },
  { id: 'challenge' as const, label: '챌린지', icon: '🎯' },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-toss-gray-200 px-6 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
              active === tab.id
                ? 'text-toss-blue'
                : 'text-toss-gray-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-xs ${active === tab.id ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
