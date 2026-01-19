import { renderHook, act } from '@testing-library/react'
import { useCards } from '@/hooks/useCards'

// Minimal settings mock so useCards can run in tests.
jest.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    dataProvider: 'localhost',
    mongoConfig: {},
    isValidConfiguration: () => false,
  }),
}))

// Stub the provider manager so importCards/saveCards don't do real async work.
jest.mock('@/providers/DataProviderManager', () => {
  return {
    DataProviderManager: class {
      registerProvider() {}
      async switchProvider() {}
      async getCards() { return [] }
      async saveCards() {}
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

describe('useCards importWords -> word set assignment', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('assigns imported words to the currently selected word set (persisted selection)', async () => {
    // Simulate a selected set already persisted (what happens after the user selects a set).
    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [{ id: 'set-1', name: 'Travel', createdAt: new Date().toISOString() }],
        selectedSetId: 'set-1',
      })
    )

    const { result } = renderHook(() => useCards())

    await act(async () => {
      await result.current.importCards({ hello: 'hola' })
    })

    const rawAssignments = localStorage.getItem('english-cards-word-set-assignments')
    expect(rawAssignments).toBeTruthy()

    const assignments = JSON.parse(rawAssignments as string) as Record<string, string>
    // The imported card id is deterministic: card-${timestamp}-0.
    // We don't know the timestamp, so just ensure there's exactly one assignment and it targets set-1.
    expect(Object.values(assignments)).toEqual(['set-1'])
  })

  it('does not dedupe by word when importing into a custom set (allows duplicates across sets)', async () => {
    // Persist a selected set.
    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [{ id: 'set-1', name: 'Travel', createdAt: new Date().toISOString() }],
        selectedSetId: 'set-1',
      })
    )

    const { result } = renderHook(() => useCards())

    // Import the same word twice
    await act(async () => {
      await result.current.importCards({ hello: 'hola' })
    })
    await act(async () => {
      await result.current.importCards({ hello: 'hola' })
    })

    const rawAssignments = localStorage.getItem('english-cards-word-set-assignments')
    expect(rawAssignments).toBeTruthy()

    const assignments = JSON.parse(rawAssignments as string) as Record<string, string>
    // Two imports => two different card ids, both assigned to set-1.
    expect(Object.values(assignments)).toEqual(['set-1', 'set-1'])
  })
})
