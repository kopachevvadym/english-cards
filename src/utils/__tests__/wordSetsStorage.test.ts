import { createWordSet, selectWordSet } from '../wordSetsStorage'

describe('wordSetsStorage', () => {
  it('creates a set and selects it', () => {
    const state = { sets: [], selectedSetId: null }
    const next = createWordSet(state, 'Travel')

    expect(next.sets).toHaveLength(1)
    expect(next.selectedSetId).toBe(next.sets[0].id)
    expect(next.sets[0].name).toBe('Travel')
  })

  it('does not create duplicates by name (case-insensitive)', () => {
    const state = {
      sets: [{ id: 'a', name: 'Travel', createdAt: new Date('2024-01-01') }],
      selectedSetId: null,
    }

    const next = createWordSet(state, 'travel')
    expect(next.sets).toHaveLength(1)
  })

  it('switches to main when setId is null', () => {
    const state = {
      sets: [{ id: 'a', name: 'Travel', createdAt: new Date('2024-01-01') }],
      selectedSetId: 'a',
    }

    const next = selectWordSet(state, null)
    expect(next.selectedSetId).toBeNull()
  })

  it('does not select unknown set', () => {
    const state = {
      sets: [{ id: 'a', name: 'Travel', createdAt: new Date('2024-01-01') }],
      selectedSetId: null,
    }

    const next = selectWordSet(state, 'missing')
    expect(next.selectedSetId).toBeNull()
  })
})
