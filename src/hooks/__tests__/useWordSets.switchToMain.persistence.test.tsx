import { renderHook, act } from '@testing-library/react'
import { useWordSets } from '@/hooks/useWordSets'

describe('useWordSets switchToMain persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not delete existing custom sets when switching to main', async () => {
    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [
          { id: 'set-1', name: 'Travel', createdAt: new Date().toISOString() },
          { id: 'set-2', name: 'Food', createdAt: new Date().toISOString() },
        ],
        selectedSetId: 'set-2',
      })
    )

    const { result } = renderHook(() => useWordSets())

    // Let the mount effect run and hydrate from localStorage
    await act(async () => {})

    await act(async () => {
      result.current.switchToMain()
    })

    const persisted = JSON.parse(localStorage.getItem('english-cards-word-sets') as string)
    expect(persisted.sets).toHaveLength(2)
    expect(persisted.sets.map((s: any) => s.id).sort()).toEqual(['set-1', 'set-2'])
    expect(persisted.selectedSetId).toBeNull()
  })
})
