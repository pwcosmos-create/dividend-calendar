import type { DividendItem, KrDividendRawItem } from '../types/dividendApi'
import type { DividendPayment, DividendStock } from '../types'

const API_BASE =
  'http://apis.data.go.kr/1160100/GetStocDiviInfoService_V2/getDiviInfo_V2'

export function isinToTicker(isinCd: string): string {
  if (isinCd.length >= 9) return isinCd.slice(3, 9)
  return isinCd
}

export function parseYmd(ymd: string): { year: number; month: number; day: number } | null {
  if (!ymd || ymd.length !== 8) return null
  const year = Number(ymd.slice(0, 4))
  const month = Number(ymd.slice(4, 6))
  const day = Number(ymd.slice(6, 8))
  if (!year || !month || !day) return null
  return { year, month, day }
}

export function inferCycle(count: number): DividendItem['cycle'] {
  if (count >= 10) return 'M'
  if (count >= 3) return 'Q'
  if (count === 1) return 'Y'
  return 'U'
}

export function rawToDividendItems(
  items: KrDividendRawItem[],
  expectedTicker?: string,
): DividendItem[] {
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
      if (expectedTicker && isinToTicker(item.isinCd) !== expectedTicker) return false
      return true
    })
    .map((item) => ({
      ticker: isinToTicker(item.isinCd),
      name: item.isinCdNm || item.stckIssuCmpyNm,
      country: 'KR' as const,
      currency: 'KRW' as const,
      dividendAmount: Number(item.stckGenrDvdnAmt),
      exDividendDate: formatYmd(item.dvdnBasDt),
      paymentDate: formatYmd(item.cashDvdnPayDt),
      cycle: 'U' as const,
    }))
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate))
}

function formatYmd(ymd: string): string {
  if (ymd.length !== 8) return ymd
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

/** 최근 1년 지급 패턴 → 올해 예상 payments */
export function itemsToForecastPayments(items: DividendItem[]): DividendPayment[] {
  if (items.length === 0) return []

  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  const lastYearItems = items.filter((i) => i.paymentDate.startsWith(String(lastYear)))
  const source = lastYearItems.length > 0 ? lastYearItems : items.slice(-4)

  const payments: DividendPayment[] = source.map((item) => {
    const d = parseYmd(item.paymentDate.replace(/-/g, ''))
    if (!d) return { month: 1, day: 1, amountPerShare: item.dividendAmount }
    return {
      month: d.month,
      day: d.day,
      amountPerShare: item.dividendAmount,
    }
  })

  return payments
}

export function buildKrDividendStock(
  id: string,
  searchName: string,
  ticker: string,
  category: string,
  items: DividendItem[],
): DividendStock | null {
  const payments = itemsToForecastPayments(items)
  if (payments.length === 0) return null

  const name = items[items.length - 1]?.name ?? searchName

  return {
    id,
    name,
    ticker,
    market: 'KR',
    currency: 'KRW',
    category,
    payments,
  }
}

export async function fetchKrDividendRaw(
  serviceKey: string,
  companyName: string,
  pageNo = 1,
  numOfRows = 100,
): Promise<{ items: KrDividendRawItem[]; totalCount: number }> {
  const params = new URLSearchParams({
    serviceKey,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    resultType: 'json',
    stckIssuCmpyNm: companyName,
  })

  const res = await fetch(`${API_BASE}?${params}`)
  const json = await res.json()

  const header = json?.response?.header
  if (header?.resultCode !== '00') {
    throw new Error(header?.resultMsg ?? 'API 오류')
  }

  const body = json.response.body
  const raw = body?.items?.item
  const items: KrDividendRawItem[] = raw ? (Array.isArray(raw) ? raw : [raw]) : []
  return { items, totalCount: Number(body?.totalCount ?? 0) }
}

export async function fetchAllKrDividendsForCompany(
  serviceKey: string,
  companyName: string,
  expectedTicker: string,
): Promise<DividendItem[]> {
  const allRaw: KrDividendRawItem[] = []
  let page = 1
  let total = 0

  do {
    const { items, totalCount } = await fetchKrDividendRaw(serviceKey, companyName, page, 100)
    total = totalCount
    allRaw.push(...items)
    page++
    if (items.length === 0) break
  } while (allRaw.length < total && page <= 20)

  return rawToDividendItems(allRaw, expectedTicker)
}
