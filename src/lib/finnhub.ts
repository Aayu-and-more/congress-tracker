const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? ''

export interface Candle {
  t: number[]  // timestamps
  c: number[]  // close prices
  s: string    // 'ok' or 'no_data'
}

export async function getCandles(
  ticker: string,
  from: number, // unix timestamp
  to: number
): Promise<Candle | null> {
  if (!FINNHUB_KEY || !ticker) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8_000)
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 3600 } })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (data.s !== 'ok') return null
    return data as Candle
  } catch {
    return null
  }
}

export interface Quote {
  c: number  // current price
  pc: number // previous close
  o: number  // open
  h: number  // high
  l: number  // low
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  // Validate ticker: only uppercase letters, digits, dots, carets — max 10 chars
  if (!FINNHUB_KEY || !ticker) return null
  const safeTicker = ticker.replace(/[^A-Za-z0-9.^]/g, '').toUpperCase()
  if (!safeTicker || safeTicker.length > 10) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000) // 10 s timeout
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(safeTicker)}&token=${FINNHUB_KEY}`,
      { signal: controller.signal, next: { revalidate: 300 } } // cache 5 min
    )
    clearTimeout(timer)
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (typeof data !== 'object' || data === null) return null
    const q = data as Record<string, unknown>
    if (!q.c) return null
    return data as Quote
  } catch {
    return null
  }
}
