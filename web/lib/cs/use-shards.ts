// web/lib/cs/use-shards.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Mode, Wallet } from './types'
import { readWallet, writeWallet, applyAward, applySpend, setModeFor } from './wallet'
import { DEFAULT_WALLET } from './types'

export function useShards() {
  const [wallet, setWallet] = useState<Wallet>(DEFAULT_WALLET)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setWallet(readWallet())
    setReady(true)
  }, [])

  const award = useCallback((unitKey: string, mode: Mode) => {
    setWallet(prev => {
      const next = applyAward(prev, unitKey, mode)
      writeWallet(next)
      return next
    })
  }, [])

  const spend = useCallback((cost: number, unlockId: string): boolean => {
    let ok = false
    setWallet(prev => {
      const res = applySpend(prev, cost, unlockId)
      ok = res.ok
      if (res.ok) writeWallet(res.wallet)
      return res.wallet
    })
    return ok
  }, [])

  const setMode = useCallback((unitKey: string, mode: Mode) => {
    setWallet(prev => {
      const next = setModeFor(prev, unitKey, mode)
      writeWallet(next)
      return next
    })
  }, [])

  const getMode = useCallback(
    (unitKey: string): Mode | undefined => wallet.modeByUnit[unitKey],
    [wallet],
  )

  const unlocked = useCallback(
    (unlockId: string): boolean => wallet.unlocks.includes(unlockId),
    [wallet],
  )

  return {
    balance: wallet.balance,
    award,
    spend,
    setMode,
    getMode,
    unlocked,
    ready,
  }
}
