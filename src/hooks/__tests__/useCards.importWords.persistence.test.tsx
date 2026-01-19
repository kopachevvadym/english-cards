import { renderHook, act } from '@testing-library/react'
import { useCards } from '@/hooks/useCards'

jest.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    dataProvider: 'localhost',
    mongoConfig: {},
    isValidConfiguration: () => false,
  }),
}))

type Store = { cards: any[] }
const store: Store = { cards: [] }

jest.mock('@/providers/DataProviderManager', () => {
  return {
    DataProviderManager: class {
      registerProvider() {}
      async switchProvider() {}
      async getCards() { return store.cards }
      async saveCards(cards: any[]) { store.cards = cards }
      async saveCard(card: any) { store.cards = [...store.cards, card] }
      async updateCard(card: any) { return card }
      async deleteCard() {}
      getProviderName() { return 'localhost' }
      isAvailable() { return Promise.resolve(true) }
      hasFallbackProvider() { return false }
      getFallbackProviderName() { return null }
    },
  }
})

describe('useCards importWords assignment persists across reload', () => {
  beforeEach(() => {
    localStorage.clear()
    store.cards = []
  })

  it('keeps imported words in the selected word set after reload', async () => {
    // Persist a selected set
    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [{ id: 'set-1', name: 'Travel', createdAt: new Date().toISOString() }],
        selectedSetId: 'set-1',
      })
    )

    const { result, unmount } = renderHook(() => useCards())

    await act(async () => {
      await result.current.importCards({ hello: 'hola' })
    })

    // Switch explicitly (in case hydration started as main)
    await act(async () => {
      result.current.wordSets.switchToSet('set-1')
    })

    // Ensure it's visible in the set
    expect(result.current.getActiveCards().map((c) => c.word)).toEqual(['hello'])

    // And hidden from main
    await act(async () => {
      result.current.wordSets.switchToMain()
    })
    expect(result.current.getActiveCards().map((c) => c.word)).toEqual([])

    // "Reload": new hook instance
    unmount()

    const { result: result2 } = renderHook(() => useCards())

    // Let mount effects run (provider load + wordSets hydration)
    await act(async () => {})

    // Should still be in set-1
    await act(async () => {
      result2.current.wordSets.switchToSet('set-1')
    })
    expect(result2.current.getActiveCards().map((c) => c.word)).toEqual(['hello'])

    // Should still be hidden from main
    await act(async () => {
      result2.current.wordSets.switchToMain()
    })
    expect(result2.current.getActiveCards().map((c) => c.word)).toEqual([])
  })
})
