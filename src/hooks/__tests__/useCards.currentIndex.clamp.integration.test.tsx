import { renderHook, act } from '@testing-library/react'
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
    await act(async () => {})

    // Main has only c1 (unassigned)
    expect(result.current.getActiveCards().map((c) => c.id)).toEqual(['c1'])

    await act(async () => {
      result.current.setCurrentCardIndex(5)
    })

    // Effect should clamp
    await act(async () => {})
    expect(result.current.currentCardIndex).toBe(0)

    // Switch to set-1 (has only c2), ensure clamp still valid
    await act(async () => {
      result.current.wordSets.switchToSet('set-1')
    })
    await act(async () => {})
    expect(result.current.getActiveCards().map((c) => c.id)).toEqual(['c2'])
    expect(result.current.currentCardIndex).toBe(0)
  })
})
