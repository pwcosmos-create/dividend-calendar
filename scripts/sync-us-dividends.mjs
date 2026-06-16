/**
 * 미국 배당 데이터 동기화 (Financial Modeling Prep)
 * 사용법: npm run sync:us
 * API 키: .env.local 의 FMP_API_KEY
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const US_TARGETS = [
  { id: 'schd', ticker: 'SCHD', name: 'SCHD', category: '미국 ETF' },
  { id: 'jepi', ticker: 'JEPI', name: 'JEPI', category: '미국 ETF' },
  { id: 'o', ticker: 'O', name: '리얼티인컴', category: '미국 리츠' },
  { id: 'vym', ticker: 'VYM', name: 'VYM', category: '미국 ETF' },
  { id: 'main', ticker: 'MAIN', name: 'MAIN', category: '미국 BDC' },
  { id: 'qyld', ticker: 'QYLD', name: 'QYLD', category: '미국 ETF' },
  { id: 'ko', ticker: 'KO', name: '코카콜라', category: '미국 배당주' },
  { id: 'jepq', ticker: 'JEPQ', name: 'JEPQ', category: '미국 ETF' },
  { id: 'spyd', ticker: 'SPYD', name: 'SPYD', category: '미국 ETF' },
  { id: 'dgro', ticker: 'DGRO', name: 'DGRO', category: '미국 ETF' },
  { id: 'aristocrat', ticker: 'ALL', name: 'Aristocrat', category: '미국 배당주' },
]

function loadEnv() {
  const envPath = join(root, '.env.local')
  const content = readFileSync(envPath, 'utf8')
  const fmp = content.match(/FMP_API_KEY=(.+)/)?.[1]?.trim()
  if (!fmp) {
    throw new Error('.env.local 에 FMP_API_KEY 가 없습니다. FMP 대시보드에서 키를 복사해 넣어주세요.')
  }
  return { fmpKey: fmp }
}

function parseDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return { year: y, month: m, day: d }
}

function dividendsToPayments(records) {
  if (!records.length) return []

  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  const withPayDate = records
    .map((r) => {
      const payIso = r.paymentDate || r.date
      const parsed = parseDate(payIso)
      if (!parsed) return null
      return {
        year: parsed.year,
        month: parsed.month,
        day: parsed.day,
        amount: Number(r.dividend ?? r.adjDividend ?? 0),
      }
    })
    .filter((r) => r && r.amount > 0)

  const lastYearItems = withPayDate.filter((r) => r.year === lastYear)
  const source = lastYearItems.length > 0 ? lastYearItems : withPayDate.slice(-6)

  return source.map((r) => ({
    month: r.month,
    day: r.day,
    amountPerShare: r.amount,
  }))
}

async function fetchStableDividends(apiKey, ticker) {
  const url = `https://financialmodelingprep.com/stable/dividends?symbol=${ticker}&limit=24&apikey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data?.['Error Message']) throw new Error(data['Error Message'])
  return Array.isArray(data) ? data : []
}

async function fetchV3Dividends(apiKey, ticker) {
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${ticker}?apikey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data?.['Error Message']) throw new Error(data['Error Message'])
  return data?.historical ?? []
}

async function fetchCompany(apiKey, target) {
  let records = []
  try {
    records = await fetchStableDividends(apiKey, target.ticker)
  } catch {
    records = await fetchV3Dividends(apiKey, target.ticker)
  }

  const payments = dividendsToPayments(records)
  if (payments.length === 0) return null

  return {
    id: target.id,
    name: target.name,
    ticker: target.ticker,
    market: 'US',
    currency: 'USD',
    category: target.category,
    payments,
    _meta: { recordCount: records.length },
  }
}

async function main() {
  const { fmpKey } = loadEnv()
  console.log('🇺🇸 미국 배당 데이터 동기화 시작 (FMP)...\n')

  const stocks = []
  let calls = 0

  for (const target of US_TARGETS) {
    if (calls >= 20) {
      console.log('\n⚠ 무료 플랜 보호: 20회 호출 후 중단 (나머지는 다음 sync에서)')
      break
    }

    process.stdout.write(`  ${target.ticker} ... `)
    calls++

    try {
      const stock = await fetchCompany(fmpKey, target)
      if (stock) {
        const { _meta, ...clean } = stock
        stocks.push(clean)
        console.log(`✓ ${clean.payments.length}건 예측 (${_meta.recordCount}개 이력)`)
      } else {
        console.log('⚠ 배당 데이터 없음')
      }
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }

    await new Promise((r) => setTimeout(r, 400))
  }

  const output = {
    syncedAt: new Date().toISOString(),
    source: 'financialmodelingprep.com/stable/dividends',
    stocks,
  }

  const outDir = join(root, 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'us-dividends.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n✅ ${stocks.length}개 종목 저장 → public/data/us-dividends.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
