/**
 * 미국 배당 데이터 동기화 (FMP stable/profile + dividends-calendar)
 * 무료 플랜: profile의 lastDividend(연간) + 알려진 지급 주기로 예측
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

/** cycle: M=월배당, Q=분기배당 / payments: {month, day} */
const US_TARGETS = [
  { id: 'schd', ticker: 'SCHD', name: 'SCHD', category: '미국 ETF', cycle: 'Q', payMonths: [3, 6, 9, 12], day: 20 },
  { id: 'jepi', ticker: 'JEPI', name: 'JEPI', category: '미국 ETF', cycle: 'M', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: 5 },
  { id: 'o', ticker: 'O', name: '리얼티인컴', category: '미국 리츠', cycle: 'M', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: 15 },
  { id: 'vym', ticker: 'VYM', name: 'VYM', category: '미국 ETF', cycle: 'Q', payMonths: [3, 6, 9, 12], day: 25 },
  { id: 'main', ticker: 'MAIN', name: 'MAIN', category: '미국 BDC', cycle: 'M', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: 15 },
  { id: 'qyld', ticker: 'QYLD', name: 'QYLD', category: '미국 ETF', cycle: 'M', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: 20 },
  { id: 'ko', ticker: 'KO', name: '코카콜라', category: '미국 배당주', cycle: 'Q', payMonths: [4, 7, 10, 12], day: 1 },
  { id: 'jepq', ticker: 'JEPQ', name: 'JEPQ', category: '미국 ETF', cycle: 'M', payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: 5 },
  { id: 'spyd', ticker: 'SPYD', name: 'SPYD', category: '미국 ETF', cycle: 'Q', payMonths: [1, 4, 7, 10], day: 25 },
  { id: 'dgro', ticker: 'DGRO', name: 'DGRO', category: '미국 ETF', cycle: 'Q', payMonths: [3, 6, 9, 12], day: 20 },
  { id: 'aristocrat', ticker: 'ALL', name: 'Aristocrat', category: '미국 배당주', cycle: 'Q', payMonths: [3, 6, 9, 12], day: 1 },
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
  return Array.isArray(data) ? data[0] : data
}

async function fetchDividendCalendar(apiKey) {
  const url = `https://financialmodelingprep.com/stable/dividends-calendar?apikey=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data
}

function buildPayments(target, annualDividend, calendarEntries) {
  const perPayment =
    target.cycle === 'M'
      ? annualDividend / 12
      : annualDividend / target.payMonths.length

  const calForTicker = calendarEntries.filter((c) => c.symbol === target.ticker)

  return target.payMonths.map((month) => {
    const cal = calForTicker.find((c) => {
      const d = c.paymentDate ?? c.date ?? ''
      return d && Number(d.slice(5, 7)) === month
    })
    return {
      month,
      day: cal?.paymentDate ? Number(cal.paymentDate.slice(8, 10)) : target.day,
      amountPerShare: cal ? Number(cal.dividend ?? cal.adjDividend ?? perPayment) : perPayment,
    }
  })
}

async function main() {
  const apiKey = loadFmpKey()
  console.log('🇺🇸 미국 배당 데이터 동기화 (FMP profile)...\n')

  const calendar = await fetchDividendCalendar(apiKey)
  console.log(`  📅 배당 캘린더 ${calendar.length}건 로드\n`)

  const stocks = []
  for (const target of US_TARGETS) {
    process.stdout.write(`  ${target.ticker} ... `)
    try {
      const profile = await fetchProfile(apiKey, target.ticker)
      const annual = Number(profile?.lastDividend ?? 0)
      if (!annual) {
        console.log('⚠ 배당 데이터 없음')
        continue
      }

      const payments = buildPayments(target, annual, calendar)
      stocks.push({
        id: target.id,
        name: profile.companyName ?? target.name,
        ticker: target.ticker,
        market: 'US',
        currency: 'USD',
        category: target.category,
        payments,
      })
      console.log(`✓ 연 $${annual.toFixed(2)} → ${payments.length}건 예측`)
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  const output = {
    syncedAt: new Date().toISOString(),
    source: 'financialmodelingprep.com/stable/profile+dividends-calendar',
    note: 'lastDividend(연간) 기준 예측 — 참고용',
    stocks,
  }

  const outDir = join(root, 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'us-dividends.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n✅ ${stocks.length}개 종목 → public/data/us-dividends.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
