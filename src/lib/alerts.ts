import { prisma } from './prisma'

interface NewTrade {
  ticker: string | null
  assetName: string
  tradeType: string
  amount: string
  member: { name: string; party: string | null; chamber: string }
  transactionDate: Date | null
}

function formatTradeRow(t: NewTrade): string {
  const type = t.tradeType === 'purchase' ? '🟢 BUY' : '🔴 SELL'
  const ticker = t.ticker ? `$${t.ticker}` : t.assetName
  const date = t.transactionDate
    ? new Date(t.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown date'
  const party = t.member.party === 'D' ? '(D)' : t.member.party === 'R' ? '(R)' : ''
  return `${type} ${ticker} — ${t.member.name} ${party} · ${t.amount} · ${date}`
}

export async function sendAlerts(newTrades: NewTrade[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || newTrades.length === 0) return

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const subscriptions = await prisma.alertSubscription.findMany({ where: { active: true } })

  for (const sub of subscriptions) {
    let watchedMembers: string[] = []
    let watchedTickers: string[] = []
    try {
      watchedMembers = JSON.parse(sub.members) as string[]
      watchedTickers = JSON.parse(sub.tickers) as string[]
    } catch { continue }

    const matching = newTrades.filter(t => {
      const memberMatch = watchedMembers.length === 0 || watchedMembers.includes(
        t.member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      )
      const tickerMatch = watchedTickers.length === 0 || (t.ticker && watchedTickers.includes(t.ticker))
      return memberMatch || tickerMatch
    })

    if (matching.length === 0) continue

    const tradeLines = matching.slice(0, 10).map(formatTradeRow).join('\n')

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'CapitolTrades <onboarding@resend.dev>',
        replyTo: 'noreply@resend.dev',
        to: sub.email,
        subject: `🏛️ ${matching.length} new congressional trade${matching.length > 1 ? 's' : ''} disclosed`,
        text: `New congressional trades matching your watchlist:\n\n${tradeLines}\n\n---\nView all trades at your CapitolTrades dashboard.\nTo unsubscribe, reply to this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #f4f4f4; padding: 24px; border-radius: 12px;">
            <h2 style="color: #f4f4f4; margin-top: 0;">🏛️ New Congressional Trades</h2>
            <p style="color: #888;">${matching.length} new trade${matching.length > 1 ? 's' : ''} matching your watchlist</p>
            ${matching.slice(0, 10).map(t => `
              <div style="background: #111; border: 1px solid #1f1f1f; border-radius: 8px; padding: 12px; margin: 8px 0;">
                <span style="color: ${t.tradeType === 'purchase' ? '#34d399' : '#f87171'}; font-weight: bold;">
                  ${t.tradeType === 'purchase' ? '▲ BUY' : '▼ SELL'}
                </span>
                <span style="color: #f4f4f4; margin-left: 8px; font-family: monospace;">${t.ticker ?? t.assetName}</span>
                <div style="color: #888; font-size: 13px; margin-top: 4px;">
                  ${t.member.name} · ${t.amount}
                </div>
              </div>
            `).join('')}
            <p style="color: #444; font-size: 12px; margin-top: 24px;">CapitolTrades · Public STOCK Act disclosure data</p>
          </div>
        `,
      })
    } catch {
      // Don't fail sync if email sending fails
    }
  }
}
