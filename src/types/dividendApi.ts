/** 공공데이터포털 GetStocDiviInfoService_V2 원본 항목 */
export interface KrDividendRawItem {
  basDt: string
  crno: string
  isinCd: string
  stckIssuCmpyNm: string
  isinCdNm: string
  scrsItmsKcd: string
  scrsItmsKcdNm: string
  dvdnBasDt: string
  cashDvdnPayDt: string
  stckDvdnRcd: string
  stckDvdnRcdNm: string
  stckGenrDvdnAmt: string
  stckGrdnDvdnAmt: string
}

/** 정제된 배당 이력 (API 통일 스키마) */
export interface DividendItem {
  ticker: string
  name: string
  country: 'KR' | 'US'
  currency: 'KRW' | 'USD'
  dividendAmount: number
  exDividendDate: string
  paymentDate: string
  cycle: 'M' | 'Q' | 'Y' | 'U'
}

export interface KrDividendCacheFile {
  syncedAt: string
  source: 'data.go.kr/GetStocDiviInfoService_V2'
  stocks: import('./index').DividendStock[]
}
