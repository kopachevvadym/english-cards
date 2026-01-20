import { renderHook, waitFor } from '@testing-library/react'
import { useCards } from '@/hooks/useCards'

jest.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    dataProvider: 'localhost',
    mongoConfig: {},
    isValidConfiguration: () => false,
  }),
}))

const store: { cards: any[] } = { cards: [] }
const deleteCardMock = jest.fn(async (cardId) => {})

jest.mock('@/providers/DataProviderManager', () => {
  return {
    DataProviderManager: class {
      registerProvider() {}
      async switchProvider() {}
      async getCards() { return store.cards }
      async saveCards(cards: any[]) { store.cards = cards }
      async saveCard(card: any) { store.cards = [...store.cards, card] }
      async updateCard(card: any) {
        store.cards = store.cards.map((c) => (c.id === card.id ? card : c))
        return card
      }
      async deleteCard(cardId: string) {
        deleteCardMock(cardId)
        store.cards = store.cards.filter((c) => c.id !== cardId)
      }
      getProviderName() { return 'localhost' }
      isAvailable() { return Promise.resolve(true) }
      hasFallbackProvider() { return false }
      getFallbackProviderName() { return null }
    },
  }
})

describe('useCards word set isolation', () => {
  beforeEach(() => {
    localStorage.clear()
    store.cards = []
    deleteCardMock.mockClear()
  })

  it('does not show cards assigned to a custom set in the main set', async () => {
    // Seed provider with 2 cards, and assign one of them to a custom set.
    store.cards = [
      { id: 'c1', word: 'hello', translation: 'hola', examples: [], isKnown: false, createdAt: new Date() },
      { id: 'c2', word: 'world', translation: 'mundo', examples: [], isKnown: false, createdAt: new Date() },
    ]

    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [{ id: 'set-1', name: 'Travel', createdAt: new Date().toISOString() }],
        selectedSetId: null,
      })
    )

    localStorage.setItem(
      'english-cards-word-set-assignments',
      JSON.stringify({ c2: 'set-1' })
    )

    const { result } = renderHook(() => useCards())

    // Let effects run: mount + provider load
    await waitFor(async () => {})

    // Main set should only include unassigned card c1
    const mainCards = result.current.getActiveCards().map((c) => c.id)
    expect(mainCards).toEqual(['c1'])

    // Switch to set-1 and ensure only c2 appears
    await waitFor(async () => {
      result.current.wordSets.switchToSet('set-1')
    })

    const setCards = result.current.getActiveCards().map((c) => c.id)
    expect(setCards).toEqual(['c2'])
  })

  it('deletes only from current custom set (unassigns), not globally', async () => {
    store.cards = [
      { id: 'c1', word: 'hello', translation: 'hola', examples: [], isKnown: false, createdAt: new Date() },
    ]

    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [{ id: 'set-1', name: 'Travel', createdAt: new Date().toISOString() }],
        selectedSetId: 'set-1',
      })
    )

    localStorage.setItem(
      'english-cards-word-set-assignments',
      JSON.stringify({ c1: 'set-1' })
    )

    const { result } = renderHook(() => useCards())
    await waitFor(async () => {})

    // In the custom set, we start with c1
    expect(result.current.getActiveCards().map((c) => c.id)).toEqual(['c1'])

    // Delete from custom set: should unassign, NOT delete from provider
    await waitFor(async () => {
      await result.current.deleteCard('c1')
    })

    expect(deleteCardMock).not.toHaveBeenCalled()

    // The card should no longer be in set-1...
    expect(result.current.getActiveCards().map((c) => c.id)).toEqual([])

    // ...but should appear in main (unassigned)
    await waitFor(async () => {
      result.current.wordSets.switchToMain()
    })

    expect(result.current.getActiveCards().map((c) => c.id)).toEqual(['c1'])
  })
})
