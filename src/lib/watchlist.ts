const KEY = 'capitaltrades-watchlist'

interface WatchlistData {
  members: string[]  // slugs
  tickers: string[]  // symbols
}

function load(): WatchlistData {
  if (typeof window === 'undefined') return { members: [], tickers: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { members: [], tickers: [] }
    return JSON.parse(raw) as WatchlistData
  } catch {
    return { members: [], tickers: [] }
  }
}

function save(data: WatchlistData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function isWatched(type: 'member' | 'ticker', id: string): boolean {
  const data = load()
  return type === 'member' ? data.members.includes(id) : data.tickers.includes(id)
}

export function toggleWatch(type: 'member' | 'ticker', id: string): boolean {
  const data = load()
  const list = type === 'member' ? data.members : data.tickers
  const idx = list.indexOf(id)
  if (idx === -1) {
    list.push(id)
  } else {
    list.splice(idx, 1)
  }
  if (type === 'member') data.members = list
  else data.tickers = list
  save(data)
  return idx === -1 // returns true if now watched
}

export function getWatchlist(): WatchlistData {
  return load()
}
