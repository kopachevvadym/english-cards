import { LocalStorageProvider } from '../LocalStorageProvider'
import { IDataProvider } from '../types'
import { Card } from '../../types/card'

// Mock localStorage for integration test
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {}
  }),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('LocalStorageProvider Integration', () => {
  let provider: IDataProvider
  let testCard: Card

  beforeEach(() => {
    localStorageMock.store = {}
    localStorageMock.clear()
    jest.clearAllMocks()
    
    provider = new LocalStorageProvider()
    testCard = {
      id: 'integration-test-card',
      word: 'integration',
      translation: 'integración',
      isKnown: false,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      example: 'This is an integration test',
      exampleTranslation: 'Esta es una prueba de integración',
    }
  })

  it('should implement IDataProvider interface correctly', () => {
    expect(provider.getCards).toBeDefined()
    expect(provider.saveCard).toBeDefined()
    expect(provider.updateCard).toBeDefined()
    expect(provider.deleteCard).toBeDefined()
    expect(provider.saveCards).toBeDefined()
    expect(provider.getProviderName).toBeDefined()
    expect(provider.isAvailable).toBeDefined()
    expect(provider.connect).toBeDefined()
    expect(provider.disconnect).toBeDefined()
  })

  it('should handle complete CRUD workflow', async () => {
    // Connect
    await provider.connect()
    expect(await provider.isAvailable()).toBe(true)

    // Start with empty cards
    let cards = await provider.getCards()
    expect(cards).toHaveLength(0)

    // Create a card
    const savedCard = await provider.saveCard(testCard)
    expect(savedCard).toEqual(testCard)

    // Read the card
    cards = await provider.getCards()
    expect(cards).toHaveLength(1)
    expect(cards[0]).toEqual(testCard)

    // Update the card
    const updatedCard = { ...testCard, word: 'updated', isKnown: true }
    const result = await provider.updateCard(updatedCard)
    expect(result).toEqual(updatedCard)

    // Verify update
    cards = await provider.getCards()
    expect(cards).toHaveLength(1)
    expect(cards[0]).toEqual(updatedCard)

    // Delete the card
    await provider.deleteCard(testCard.id)

    // Verify deletion
    cards = await provider.getCards()
    expect(cards).toHaveLength(0)

    // Disconnect
    await provider.disconnect()
  })

  it('should handle batch operations', async () => {
    const batchCards: Card[] = [
      { ...testCard, id: 'batch-1', word: 'first' },
      { ...testCard, id: 'batch-2', word: 'second' },
      { ...testCard, id: 'batch-3', word: 'third' },
    ]

    // Save multiple cards
    const savedCards = await provider.saveCards(batchCards)
    expect(savedCards).toEqual(batchCards)

    // Verify all cards are saved
    const cards = await provider.getCards()
    expect(cards).toHaveLength(3)
    expect(cards.map(c => c.word)).toEqual(['first', 'second', 'third'])
  })

  it('should maintain data consistency across operations', async () => {
    // Save initial card
    await provider.saveCard(testCard)

    // Add another card
    const secondCard = { ...testCard, id: 'second-card', word: 'second' }
    await provider.saveCard(secondCard)

    // Update first card
    const updatedFirst = { ...testCard, isKnown: true }
    await provider.updateCard(updatedFirst)

    // Verify both cards exist and first is updated
    const cards = await provider.getCards()
    expect(cards).toHaveLength(2)
    
    const firstCard = cards.find(c => c.id === testCard.id)
    const secondCardResult = cards.find(c => c.id === 'second-card')
    
    expect(firstCard?.isKnown).toBe(true)
    expect(secondCardResult?.isKnown).toBe(false)
  })
})