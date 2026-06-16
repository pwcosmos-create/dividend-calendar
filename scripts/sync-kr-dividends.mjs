/**
 * 국내 배당 데이터 동기화 스크립트
 * 사용법: npm run sync:kr
 * API 키: .env.local 의 DATA_GO_KR_SERVICE_KEY
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadServiceKey() {
  const envPath = join(root, '.env.local')
  const content = readFileSync(envPath, 'utf8')
  const match = content.match(/DATA_GO_KR_SERVICE_KEY=(.+)/)
  if (!match?.[1]?.trim()) {
    throw new Error('.env.local 에 DATA_GO_KR_SERVICE_KEY 가 없습니다.')
  }
  return match[1].trim()
}

const API_BASE =
  'http://apis.data.go.kr/1160100/GetStocDiviInfoService_V2/getDiviInfo_V2'

const KR_TARGETS = [
  { id: 'samsung-elec', names: ['삼성전자'], ticker: '005930', category: '국내 배당주' },
  { id: 'sk-telecom', names: ['SK텔레콤'], ticker: '017670', category: '국내 배당주' },
  { id: 'kb-financial', names: ['KB금융'], ticker: '105560', category: '국내 배당주' },
  { id: 'posco', names: ['포스코홀딩스', 'POSCO홀딩스'], ticker: '005490', category: '국내 배당주' },
  { id: 'macquarie', names: ['맥쿼리'], ticker: '088980', category: '국내 인프라' },
  { id: 'kodex-high-div', names: ['KODEX 고배당'], ticker: '229720', category: '국내 ETF' },
  { id: 'tiger-div', names: ['TIGER 미국배당'], ticker: '458730', category: '국내 ETF' },
  { id: 'ace-us-div', names: ['ACE 미국배당'], ticker: '441640', category: '국내 ETF' },
  { id: 'hd-hyundai', names: ['현대중공업', 'HD현대중공업'], ticker: '329180', category: '국내 배당주' },
]

function isinToTicker(isinCd) {
  return isinCd.length >= 9 ? isinCd.slice(3, 9) : isinCd
}

function parseYmd(ymd) {
  if (!ymd || ymd.length !== 8) return null
  return {
    year: Number(ymd.slice(0, 4)),
    month: Number(ymd.slice(4, 6)),
    day: Number(ymd.slice(6, 8)),
  }
}

function rawToItems(items, expectedTicker) {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 2)

  return items
    .filter((item) => {
      if (item.scrsItmsKcdNm !== '보통주') return false
      if (item.stckDvdnRcdNm !== '현금배당') return false
      const amt = Number(item.stckGenrDvdnAmt)
      if (!amt || amt <= 0) return false
      if (!item.cashDvdnPayDt) return false
      const pay = parseYmd(item.cashDvdnPayDt)
      if (!pay) return false
      const payDate = new Date(pay.year, pay.month - 1, pay.day)
      if (payDate < cutoff) return false
      if (isinToTicker(item.isinCd) !== expectedTicker) return false
      return true
    })
    .map((item) => ({
      ticker: isinToTicker(item.isinCd),
      name: item.isinCdNm || item.stckIssuCmpyNm,
      dividendAmount: Number(item.stckGenrDvdnAmt),
      paymentDate: item.cashDvdnPayDt,
      exDividendDate: item.dvdnBasDt,
    }))
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))
}

function itemsToPayments(items) {
  if (items.length === 0) return []

  const currentYear = new Date().getFullYear()
  const lastYear = String(currentYear - 1)
  const lastYearItems = items.filter((i) => i.paymentDate.startsWith(lastYear))
  const source = lastYearItems.length > 0 ? lastYearItems : items.slice(-4)

  return source.map((item) => {
    const d = parseYmd(item.paymentDate)
    return {
      month: d.month,
      day: d.day,
      amountPerShare: item.dividendAmount,
    }
  })
}

async function fetchPage(serviceKey, companyName, pageNo) {
  const params = new URLSearchParams({
    serviceKey,
    pageNo: String(pageNo),
    numOfRows: '100',
    resultType: 'json',
    stckIssuCmpyNm: companyName,
  })

  const res = await fetch(`${API_BASE}?${params}`)
  const json = await res.json()
  const code = json?.response?.header?.resultCode
  if (code !== '00') {
    throw new Error(json?.response?.header?.resultMsg ?? 'API 오류')
  }

  const body = json.response.body
  const raw = body?.items?.item
  const items = raw ? (Array.isArray(raw) ? raw : [raw]) : []
  return { items, totalCount: Number(body?.totalCount ?? 0) }
}

async function fetchCompany(serviceKey, target) {
  let dividendItems = []
  for (const name of target.names) {
    const allRaw = []
    let page = 1
    let total = 0
    do {
      const { items, totalCount } = await fetchPage(serviceKey, name, page)
      total = totalCount
      allRaw.push(...items)
      page++
      if (items.length === 0) break
    } while (allRaw.length < total && page <= 30)

    dividendItems = rawToItems(allRaw, target.ticker)
    if (dividendItems.length > 0) break
  }

  const payments = itemsToPayments(dividendItems)
  if (payments.length === 0) return null

  return {
    id: target.id,
    name: dividendItems[dividendItems.length - 1].name,
    ticker: target.ticker,
    market: 'KR',
    currency: 'KRW',
    category: target.category,
    payments,
    _meta: {
      recordCount: dividendItems.length,
      lastPayment: dividendItems[dividendItems.length - 1].paymentDate,
    },
  }
}

async function main() {
  const serviceKey = loadServiceKey()
  console.log('🇰🇷 국내 배당 데이터 동기화 시작...\n')

  const stocks = []
  for (const target of KR_TARGETS) {
    process.stdout.write(`  ${target.names[0]} (${target.ticker}) ... `)
    try {
      const stock = await fetchCompany(serviceKey, target)
      if (stock) {
        const { _meta, ...clean } = stock
        stocks.push(clean)
        console.log(`✓ ${clean.payments.length}건 예측 (${_meta.lastPayment})`)
      } else {
        console.log('⚠ 배당 데이터 없음')
      }
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  const output = {
    syncedAt: new Date().toISOString(),
    source: 'data.go.kr/GetStocDiviInfoService_V2',
    stocks,
  }

  const outDir = join(root, 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'kr-dividends.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n✅ ${stocks.length}개 종목 저장 → public/data/kr-dividends.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
