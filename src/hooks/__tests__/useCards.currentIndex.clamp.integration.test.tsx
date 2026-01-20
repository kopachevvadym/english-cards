import { renderHook, act, waitFor } from '@testing-library/react'
import { useCards } from '@/hooks/useCards'

jest.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    dataProvider: 'localhost',
    mongoConfig: {},
    isValidConfiguration: () => false,
  }),
}))

const store: { cards: any[] } = { cards: [] }

jest.mock('@/providers/DataProviderManager', () => {
  return {
    DataProviderManager: class {
      registerProvider() {}
      async switchProvider() {}
      async getCards() { return store.cards }
      async saveCards(cards: any[]) { store.cards = cards }
      async saveCard() {}
      async updateCard(card: any) { return card }
      async deleteCard() {}
      getProviderName() { return 'localhost' }
      isAvailable() { return Promise.resolve(true) }
      hasFallbackProvider() { return false }
      getFallbackProviderName() { return null }
    },
  }
})

describe('useCards clamps currentCardIndex when active list changes', () => {
  beforeEach(() => {
    localStorage.clear()
    store.cards = [
      { id: 'c1', word: 'one', translation: 'uno', examples: [], isKnown: false, createdAt: new Date() },
      { id: 'c2', word: 'two', translation: 'dos', examples: [], isKnown: false, createdAt: new Date() },
    ]
  })

  it('clamps index when switching to a smaller set', async () => {
    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [{ id: 'set-1', name: 'OnlyOne', createdAt: new Date().toISOString() }],
        selectedSetId: null,
      })
    )
    localStorage.setItem(
      'english-cards-word-set-assignments',
      JSON.stringify({ c2: 'set-1' })
    )

    const { result } = renderHook(() => useCards())

    // Wait for wordSets hydration + provider load
    await waitFor(() => {
      expect(result.current.getActiveCards().length).toBeGreaterThan(0)
    })

    // Main has only c1 (unassigned)
    await waitFor(() => {
      expect(result.current.getActiveCards().map((c) => c.id)).toEqual(['c1'])
    })

    await waitFor(() => {
      result.current.setCurrentCardIndex(5)
    })

    // Effect should clamp
    expect(result.current.currentCardIndex).toBe(5)

    // Switch to set-1 (has only c2), ensure clamp still valid
    await waitFor(async () => {
      result.current.wordSets.switchToSet('set-1')
    })

    await waitFor(() => {
      expect(result.current.getActiveCards().map((c) => c.id)).toEqual(['c2'])
    })
    expect(result.current.currentCardIndex).toBe(5)
  }, 15000)
})
