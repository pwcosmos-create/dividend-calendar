/**
 * 국내 주식 시세 동기화 (금융위원회_주식시세정보)
 * 사용법: npm run sync:prices
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const PRICE_API =
  'http://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo'

const TICKERS = [
  '005930', '017670', '105560', '005490', '088980',
  '229720', '458730', '441640', '329180',
]

function loadServiceKey() {
  const envPath = join(root, '.env.local')
  const content = readFileSync(envPath, 'utf8')
  const match = content.match(/DATA_GO_KR_SERVICE_KEY=(.+)/)
  if (!match?.[1]?.trim()) {
    throw new Error('.env.local 에 DATA_GO_KR_SERVICE_KEY 가 없습니다.')
  }
  return match[1].trim()
}

async function fetchPrice(serviceKey, ticker) {
  const params = new URLSearchParams({
    serviceKey,
    pageNo: '1',
    numOfRows: '1',
    resultType: 'json',
    likeSrtnCd: ticker,
  })

  const res = await fetch(`${PRICE_API}?${params}`)
  const json = await res.json()
  const code = json?.response?.header?.resultCode
  if (code !== '00') {
    throw new Error(json?.response?.header?.resultMsg ?? 'API 오류')
  }

  const raw = json.response.body?.items?.item
  const items = raw ? (Array.isArray(raw) ? raw : [raw]) : []
  const item = items.find((i) => i.srtnCd === ticker)
  if (!item) return null

  return {
    ticker: item.srtnCd,
    name: item.itmsNm,
    closePrice: Number(item.clpr),
    changeRate: Number(item.fltRt),
    market: item.mrktCtg,
    basDt: item.basDt,
  }
}

async function main() {
  const serviceKey = loadServiceKey()
  console.log('📈 국내 주식 시세 동기화 시작...\n')

  const prices = []
  for (const ticker of TICKERS) {
    process.stdout.write(`  ${ticker} ... `)
    try {
      const price = await fetchPrice(serviceKey, ticker)
      if (price) {
        prices.push(price)
        console.log(`✓ ${price.name} ${price.closePrice.toLocaleString()}원`)
      } else {
        console.log('⚠ 시세 없음')
      }
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  const output = {
    syncedAt: new Date().toISOString(),
    source: 'data.go.kr/GetStockSecuritiesInfoService',
    basDt: prices[0]?.basDt ?? null,
    prices,
  }

  const outDir = join(root, 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'kr-prices.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n✅ ${prices.length}개 종목 시세 저장 → public/data/kr-prices.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
