'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Live Feed', icon: '📡' },
  { href: '/members', label: 'Members', icon: '👤' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
  { href: '/late-filers', label: 'Late Filers', icon: '⚠️' },
  { href: '/watchlist', label: 'Watchlist', icon: '⭐' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSync() {
    setSyncState('loading')
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' })
      if (!res.ok) throw new Error()
      setSyncState('done')
    } catch {
      setSyncState('error')
    } finally {
      setTimeout(() => setSyncState('idle'), 3000)
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-[#1f1f1f] bg-[#0d0d0d] p-4">
      <div className="mb-8">
        <span className="text-lg font-bold text-[#f4f4f4]" style={{ fontFamily: 'var(--font-heading)' }}>
          🏛️ CapitolTrades
        </span>
        <p className="text-xs text-[#444] mt-1">Congress Stock Tracker</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === link.href
                ? 'bg-[#1f1f1f] text-[#f4f4f4]'
                : 'text-[#666] hover:text-[#f4f4f4] hover:bg-[#161616]'
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="text-xs text-[#333] mt-4 leading-relaxed">
        Data sourced from public Senate &amp; House STOCK Act disclosures
      </div>
      <div className="mt-3">
        <button
          onClick={handleSync}
          disabled={syncState === 'loading'}
          title="Only works in local dev environment"
          className="text-xs text-[#333] hover:text-[#666] transition-colors disabled:opacity-50"
        >
          {syncState === 'loading' ? 'Syncing...' : syncState === 'done' ? 'Synced!' : syncState === 'error' ? 'Error' : 'Sync (dev)'}
        </button>
      </div>
    </aside>
  )
}
