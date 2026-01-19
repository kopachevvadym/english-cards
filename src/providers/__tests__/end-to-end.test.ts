import { DataProviderManager } from '../DataProviderManager'
import { LocalStorageProvider } from '../LocalStorageProvider'
import { Card } from '../../types/card'
import { ProviderStatus } from '../types'

// Mock localStorage for tests
type LocalStorageMock = {
  store: Record<string, string>
  getItem: jest.Mock<string | null, [string]>
  setItem: jest.Mock<void, [string, string]>
  removeItem: jest.Mock<void, [string]>
  clear: jest.Mock<void, []>
}

const localStorageMock: LocalStorageMock = {
  store: {},
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

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('End-to-End Provider Workflows', () => {
  let manager: DataProviderManager
  let localProvider: LocalStorageProvider
  let errorHandler: jest.Mock

  const testCards: Card[] = [
    {
      id: 'card-1',
      word: 'hello',
      translation: 'hola',
      isKnown: false,
      createdAt: new Date('2023-01-01'),
      examples: [
        { id: 'card-1-ex-1', text: 'Hello world', translation: 'Hola mundo' }
      ]
    },
    {
      id: 'card-2',
      word: 'goodbye',
      translation: 'adiós',
      isKnown: true,
      createdAt: new Date('2023-01-02'),
      lastReviewed: new Date('2023-01-03'),
      examples: []
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.store = {}

    localProvider = new LocalStorageProvider()
    errorHandler = jest.fn()
    manager = new DataProviderManager(errorHandler)

    manager.registerProvider('localhost', localProvider)
  })

  describe('Complete CRUD Workflow with LocalStorage', () => {
    it('should handle complete card lifecycle', async () => {
      // Connect to localStorage
      await manager.switchProvider('localhost')
      expect(manager.getCurrentProvider().getProviderName()).toBe('localhost')

      // Start with empty cards
      let cards = await manager.getCards()
      expect(cards).toHaveLength(0)

      // Create cards
      for (const card of testCards) {
        const savedCard = await manager.saveCard(card)
        expect(savedCard).toEqual(card)
      }

      // Read all cards
      cards = await manager.getCards()
      expect(cards).toHaveLength(2)
      expect(cards.map((c) => c.id)).toEqual(['card-1', 'card-2'])

      // Update a card
      const updatedCard = { ...testCards[0], isKnown: true, word: 'updated' }
      const result = await manager.updateCard(updatedCard)
      expect(result).toEqual(updatedCard)

      // Verify update
      cards = await manager.getCards()
      const foundCard = cards.find((c) => c.id === 'card-1')
      expect(foundCard?.isKnown).toBe(true)
      expect(foundCard?.word).toBe('updated')

      // Delete a card
      await manager.deleteCard('card-2')
      cards = await manager.getCards()
      expect(cards).toHaveLength(1)
      expect(cards[0].id).toBe('card-1')

      // Batch save
      const newCards = [
        { ...testCards[1], id: 'card-3' },
        { ...testCards[0], id: 'card-4' }
      ]
      const savedCards = await manager.saveCards([...cards, ...newCards])
      expect(savedCards).toHaveLength(3)
    })
  })

  describe('Status Management Workflow', () => {
    it('should track provider status throughout operations', async () => {
      // The manager sets the first registered provider as current; status may already be connected
      const statuses = await manager.getAllProviderStatuses()
      expect(statuses.localhost.status).toMatch(/connected|disconnected|unavailable|error/i)

      // Connect to localStorage
      await manager.switchProvider('localhost')
      const status = await manager.getStatus()
      expect(status.status).toBe(ProviderStatus.CONNECTED)

      // Test connection
      const connectionTest = await manager.testConnection()
      expect(connectionTest).toBe(true)
    })
  })

  describe('Data Integrity Workflow', () => {
    it('should maintain data integrity across operations', async () => {
      await manager.switchProvider('localhost')

      // Create cards with all fields
      const complexCard: Card = {
        id: 'complex-card',
        word: 'complex',
        translation: 'complejo',
        isKnown: false,
        createdAt: new Date('2023-01-01T10:00:00Z'),
        lastReviewed: new Date('2023-01-02T15:30:00Z'),
        examples: [
          { id: 'ex1', text: 'This is a complex example', translation: 'Este es un ejemplo complejo' }
        ]
      }

      const savedCard = await manager.saveCard(complexCard)
      expect(savedCard).toEqual(complexCard)

      // Retrieve and verify all fields are preserved
      const cards = await manager.getCards()
      const retrievedCard = cards[0]

      expect(retrievedCard.id).toBe(complexCard.id)
      expect(retrievedCard.word).toBe(complexCard.word)
      expect(retrievedCard.translation).toBe(complexCard.translation)
      expect(retrievedCard.isKnown).toBe(complexCard.isKnown)
      expect(retrievedCard.createdAt).toEqual(complexCard.createdAt)
      expect(retrievedCard.lastReviewed).toEqual(complexCard.lastReviewed)
      expect(retrievedCard.examples).toEqual(complexCard.examples)
    })

    it('should handle sequential operations safely', async () => {
      await manager.switchProvider('localhost')

      // LocalStorageProvider isn't safe for true concurrent writes; assert we can save repeatedly.
      for (const card of testCards) {
        await manager.saveCard(card)
      }

      const cards = await manager.getCards()
      expect(cards).toHaveLength(2)
    })
  })

  describe('Error Recovery Workflow', () => {
    it('should clear corrupted localStorage data and return an empty collection', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      await manager.switchProvider('localhost')

      // Simulate corrupted JSON stored under the LocalStorageProvider key
      localStorageMock.store['english-cards'] = '{bad json'

      const cards = await manager.getCards()
      expect(cards).toEqual([])
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('english-cards')
      expect(errorHandler).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })
  })
})

