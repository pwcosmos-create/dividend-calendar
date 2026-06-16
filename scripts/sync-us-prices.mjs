/**
 * 미국 주식 시세 동기화 (FMP stable/profile — 무료 플랜)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const US_TICKERS = [
  'SCHD', 'JEPI', 'O', 'VYM', 'MAIN', 'QYLD', 'KO', 'JEPQ', 'SPYD', 'DGRO', 'ALL',
]

function loadFmpKey() {
  const content = readFileSync(join(root, '.env.local'), 'utf8')
  const key = content.match(/FMP_API_KEY=(.+)/)?.[1]?.trim()
  if (!key) throw new Error('.env.local 에 FMP_API_KEY 가 없습니다.')
  return key
}

async function fetchProfile(apiKey, ticker) {
  const url = `https://financialmodelingprep.com/stable/profile?symbol=${ticker}&apikey=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()
  if (data?.['Error Message']) throw new Error(data['Error Message'])
  const item = Array.isArray(data) ? data[0] : data
  if (!item?.price) return null

  return {
    ticker: item.symbol,
    name: item.companyName ?? item.symbol,
    closePrice: Number(item.price),
    changeRate: Number(item.changePercentage ?? 0),
    market: 'US',
    currency: 'USD',
    basDt: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    lastDividend: Number(item.lastDividend ?? 0),
  }
}

async function main() {
  const apiKey = loadFmpKey()
  console.log('🇺🇸 미국 주식 시세 동기화 (FMP profile)...\n')

  const prices = []
  for (const ticker of US_TICKERS) {
    process.stdout.write(`  ${ticker} ... `)
    try {
      const p = await fetchProfile(apiKey, ticker)
      if (p) {
        prices.push(p)
        console.log(`✓ $${p.closePrice} (${p.changeRate >= 0 ? '+' : ''}${p.changeRate.toFixed(2)}%)`)
      } else {
        console.log('⚠ 시세 없음')
      }
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  const output = {
    syncedAt: new Date().toISOString(),
    source: 'financialmodelingprep.com/stable/profile',
    prices: prices.map(({ lastDividend: _ld, ...p }) => p),
  }

  const outDir = join(root, 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'us-prices.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n✅ ${prices.length}개 종목 → public/data/us-prices.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
