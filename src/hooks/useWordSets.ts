'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { WordSetState, WordSetId } from '@/types/wordSet'
import { createWordSet, loadWordSetState, saveWordSetState, selectWordSet } from '@/utils/wordSetsStorage'

export const useWordSets = () => {
  const [state, setState] = useState<WordSetState>(() => ({ sets: [], selectedSetId: null }))

  // Initial load
  useEffect(() => {
    setState(loadWordSetState())
  }, [])

  // Persist
  useEffect(() => {
    saveWordSetState(state)
  }, [state])

  const sets = state.sets
  const selectedSetId = state.selectedSetId

  const selectedSet = useMemo(() => {
    if (!selectedSetId) return null
    return sets.find((s) => s.id === selectedSetId) ?? null
  }, [sets, selectedSetId])

  const createSet = useCallback((name: string) => {
    setState((prev) => {
      const next = createWordSet(prev, name)
      // Extra safety: persist immediately
      saveWordSetState(next)
      return next
    })
  }, [])

  const switchToMain = useCallback(() => {
    setState((prev) => {
      const next = selectWordSet(prev, null)
      saveWordSetState(next)
      return next
    })
  }, [])

  const switchToSet = useCallback((id: WordSetId) => {
    setState((prev) => {
      const next = selectWordSet(prev, id)
      saveWordSetState(next)
      return next
    })
  }, [])

  return {
    sets,
    selectedSetId,
    selectedSet,
    createSet,
    switchToMain,
    switchToSet,
  }
}
