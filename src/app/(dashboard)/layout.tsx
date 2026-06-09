'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AlertSubscribe from '@/components/AlertSubscribe'

const navLinks = [
  { href: '/', label: 'Live Feed', icon: '📡' },
  { href: '/members', label: 'Members', icon: '👤' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/watchlist', label: 'Watchlist', icon: '★' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-[#1f1f1f] bg-[#0d0d0d] p-4 fixed top-0 left-0 bottom-0">
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
        <div className="mb-4"><AlertSubscribe /></div>
        <div className="text-xs text-[#333] mt-4 leading-relaxed">
          Data sourced from public Senate &amp; House STOCK Act disclosures
        </div>
      </aside>

      {/* Main content - offset by sidebar width */}
      <main className="flex-1 md:ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
