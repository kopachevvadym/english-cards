import { loadWordSetState, saveWordSetState } from '../wordSetsStorage'

describe('wordSetsStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves created sets to localStorage and loads them back', () => {
    const state = {
      sets: [
        { id: 'set-1', name: 'Travel', createdAt: new Date('2024-01-01T00:00:00.000Z') },
        { id: 'set-2', name: 'Food', createdAt: new Date('2024-01-02T00:00:00.000Z') },
      ],
      selectedSetId: 'set-2',
    }

    saveWordSetState(state)

    const loaded = loadWordSetState()
    expect(loaded.sets).toHaveLength(2)
    expect(loaded.sets[0].name).toBe('Travel')
    expect(loaded.sets[0].createdAt).toBeInstanceOf(Date)
    expect(loaded.selectedSetId).toBe('set-2')
  })

  it('falls back to main set if selectedSetId does not exist', () => {
    saveWordSetState({
      sets: [{ id: 'set-1', name: 'Travel', createdAt: new Date('2024-01-01T00:00:00.000Z') }],
      selectedSetId: 'missing',
    })

    const loaded = loadWordSetState()
    expect(loaded.selectedSetId).toBeNull()
  })

  it('keeps selectedSetId when persisted sets are missing createdAt (backward compatible)', () => {
    localStorage.setItem(
      'english-cards-word-sets',
      JSON.stringify({
        sets: [{ id: 'set-1', name: 'Travel' }],
        selectedSetId: 'set-1',
      })
    )

    const loaded = loadWordSetState()
    expect(loaded.sets).toHaveLength(1)
    expect(loaded.sets[0].id).toBe('set-1')
    expect(loaded.sets[0].createdAt).toBeInstanceOf(Date)
    expect(loaded.selectedSetId).toBe('set-1')
  })
})
