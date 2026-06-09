'use client'

import { useState, useEffect } from 'react'
import { isWatched, toggleWatch } from '@/lib/watchlist'

interface WatchButtonProps {
  type: 'member' | 'ticker'
  id: string
  label?: string
}

export default function WatchButton({ type, id, label }: WatchButtonProps) {
  const [watched, setWatched] = useState(false)

  useEffect(() => {
    setWatched(isWatched(type, id))
  }, [type, id])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const nowWatched = toggleWatch(type, id)
    setWatched(nowWatched)
  }

  return (
    <button
      onClick={handleClick}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`text-lg transition-all hover:scale-110 active:scale-95 ${
        watched ? 'text-yellow-400' : 'text-[#333] hover:text-[#666]'
      }`}
    >
      {watched ? '★' : '☆'}
    </button>
  )
}
