import { renderHook, act } from '@testing-library/react'
import { useWordSets } from '@/hooks/useWordSets'

describe('useWordSets createSet persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists a newly created set and loads it back after "reload" (new hook instance)', async () => {
    const { result, unmount } = renderHook(() => useWordSets())

    // Let hydration run
    await act(async () => {})

    await act(async () => {
      result.current.createSet('Travel')
    })

    const persisted1 = JSON.parse(localStorage.getItem('english-cards-word-sets') as string)
    expect(persisted1.sets).toHaveLength(1)
    expect(persisted1.sets[0].name).toBe('Travel')

    unmount()

    // Simulate page reload by creating a new hook instance
    const { result: result2 } = renderHook(() => useWordSets())
    await act(async () => {})

    expect(result2.current.sets).toHaveLength(1)
    expect(result2.current.sets[0].name).toBe('Travel')
  })
})
