export type Chamber = 'senate' | 'house'
export type Party = 'D' | 'R' | 'I' | 'unknown'
export type TradeType = 'purchase' | 'sale_full' | 'sale_partial' | 'sale' | 'exchange' | 'unknown'

export interface RawSenateTrade {
  senator?: string
  first_name?: string
  last_name?: string
  state?: string
  party?: string
  transaction_date?: string
  owner?: string
  ticker?: string
  asset_description?: string
  type?: string
  amount?: string
  ptr_link?: string
  disclosure_date?: string
  comment?: string
}

export interface RawHouseTrade {
  disclosure_year?: number
  disclosure_date?: string
  transaction_date?: string
  owner?: string
  ticker?: string
  asset_description?: string
  type?: string
  amount?: string
  representative?: string
  district?: string
  ptr_link?: string
  cap_gains_over_200_usd?: boolean
}

export interface TradeWithMember {
  id: string
  ticker: string | null
  assetName: string
  tradeType: string
  amount: string
  transactionDate: Date | null
  disclosureDate: Date | null
  filedLate: boolean
  source: string
  member: {
    id: string
    name: string
    party: string | null
    chamber: string
    state: string | null
    slug: string
  }
}
