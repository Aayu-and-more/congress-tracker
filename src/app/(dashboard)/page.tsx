import TradesFeed from '@/components/TradesFeed'
import SignalsBar from '@/components/SignalsBar'
import ClusterAlerts from '@/components/ClusterAlerts'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getLastSync() {
  try {
    const log = await prisma.syncLog.findFirst({
      where: { status: 'success' },
      orderBy: { syncedAt: 'desc' },
    })
    return log?.syncedAt ?? null
  } catch {
    return null
  }
}

export default async function FeedPage() {
  const lastSync = await getLastSync()
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
            Live Feed
          </h1>
          <p className="text-[#666] text-sm mt-1">
            All publicly disclosed stock trades by US senators and representatives
          </p>
        </div>
        {lastSync && (
          <span className="text-xs text-[#444] bg-[#111111] border border-[#1f1f1f] px-3 py-1.5 rounded-lg">
            Last synced: {new Date(lastSync).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <SignalsBar />
      <ClusterAlerts />
      <TradesFeed />
    </div>
  )
}
