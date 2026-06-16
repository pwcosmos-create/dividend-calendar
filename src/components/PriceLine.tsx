import type { StockPrice } from '../types/price'
import { formatChangeRate, formatPriceDual } from '../utils/formatPrice'

interface PriceLineProps {
  price: StockPrice
  size?: 'sm' | 'md'
  align?: 'left' | 'right'
}

export default function PriceLine({ price, size = 'sm', align = 'right' }: PriceLineProps) {
  const { main, sub } = formatPriceDual(price)
  const alignClass = align === 'right' ? 'text-right' : 'text-left'
  const mainClass = size === 'md' ? 'text-base font-bold' : 'text-sm font-bold'

  return (
    <div className={alignClass}>
      <p className={`${mainClass} text-toss-gray-900`}>{main}</p>
      {sub && <p className="text-[11px] text-toss-gray-500 mt-0.5">{sub}</p>}
      <p className={`text-[11px] font-semibold mt-0.5 ${price.changeRate >= 0 ? 'text-red-500' : 'text-toss-blue'}`}>
        {formatChangeRate(price.changeRate)}
      </p>
    </div>
  )
}
