'use client'

import { useState } from 'react'

export default function AlertSubscribe() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, members: [], tickers: [] }),
      })
      if (res.ok) {
        setStatus('success')
        setMessage('Subscribed! You\'ll get alerts when new trades are disclosed.')
        setEmail('')
      } else {
        const data = await res.json() as { error?: string }
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[#f4f4f4] mb-1">Get Trade Alerts</h3>
      <p className="text-xs text-[#555] mb-4">Email when new congressional trades are disclosed</p>
      {status === 'success' ? (
        <p className="text-emerald-400 text-sm">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] text-[#f4f4f4] placeholder-[#444] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#444] min-w-0"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-[#f4f4f4] text-[#0a0a0a] text-sm font-medium rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="text-red-400 text-xs mt-2">{message}</p>}
    </div>
  )
}
