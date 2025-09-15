import { DataProviderManager } from '../DataProviderManager'
import { LocalStorageProvider } from '../LocalStorageProvider'
import { MongoDBProvider } from '../MongoDBProvider'
import { Card } from '../../types/card'
import { MongoDBConfig, ProviderStatus } from '../types'

// Mock localStorage for tests
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

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock MongoDB
const mockCollection = {
  find: jest.fn(),
  insertOne: jest.fn(),
  insertMany: jest.fn(),
  replaceOne: jest.fn(),
  deleteOne: jest.fn(),
  createIndex: jest.fn()
}

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection),
  command: jest.fn(),
  listCollections: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) })
}

const mockClient = {
  connect: jest.fn(),
  close: jest.fn(),
  db: jest.fn().mockReturnValue(mockDb)
}

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => mockClient)
}))

describe('End-to-End Provider Workflows', () => {
  let manager: DataProviderManager
  let localProvider: LocalStorageProvider
  let mongoProvider: MongoDBProvider
  
  const testCards: Card[] = [
    {
      id: 'card-1',
      word: 'hello',
      translation: 'hola',
      isKnown: false,
      createdAt: new Date('2023-01-01'),
      example: 'Hello world',
      exampleTranslation: 'Hola mundo'
    },
    {
      id: 'card-2',
      word: 'goodbye',
      translation: 'adiós',
      isKnown: true,
      createdAt: new Date('2023-01-02'),
      lastReviewed: new Date('2023-01-03')
    }
  ]

  const mongoConfig: MongoDBConfig = {
    connectionString: 'mongodb://localhost:27017',
    databaseName: 'testdb',
    collectionName: 'cards'
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    localStorageMock.store = {}
    
    // Setup MongoDB mocks
    mockClient.connect.mockResolvedValue(undefined)
    mockDb.command.mockResolvedValue({ ok: 1 })
    mockCollection.createIndex.mockResolvedValue('id_1')
    mockCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([])
    })
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'objectid', acknowledged: true })
    mockCollection.insertMany.mockResolvedValue({ insertedIds: {}, acknowledged: true, insertedCount: 0 })
    mockCollection.replaceOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1, acknowledged: true })
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1, acknowledged: true })

    // Create providers and manager
    localProvider = new LocalStorageProvider()
    mongoProvider = new MongoDBProvider(mongoConfig)
    manager = new DataProviderManager()
    
    manager.registerProvider('localhost', localProvider)
    manager.registerProvider('mongodb', mongoProvider)
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
      expect(cards.map(c => c.id)).toEqual(['card-1', 'card-2'])

      // Update a card
      const updatedCard = { ...testCards[0], isKnown: true, word: 'updated' }
      const result = await manager.updateCard(updatedCard)
      expect(result).toEqual(updatedCard)

      // Verify update
      cards = await manager.getCards()
      const foundCard = cards.find(c => c.id === 'card-1')
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

  describe('Complete CRUD Workflow with MongoDB', () => {
    it('should handle complete card lifecycle', async () => {
      // Connect to MongoDB
      await manager.switchProvider('mongodb')
      expect(manager.getCurrentProvider().getProviderName()).toBe('mongodb')

      // Mock MongoDB responses for the workflow
      const mockDocuments = testCards.map(card => ({
        _id: 'objectid',
        ...card
      }))

      mockCollection.find.mockReturnValue({
        toArray: jest.fn()
          .mockResolvedValueOnce([]) // Initial empty state
          .mockResolvedValueOnce(mockDocuments.slice(0, 1)) // After first save
          .mockResolvedValueOnce(mockDocuments) // After second save
          .mockResolvedValueOnce([{ ...mockDocuments[0], isKnown: true, word: 'updated' }, mockDocuments[1]]) // After update
          .mockResolvedValueOnce([{ ...mockDocuments[0], isKnown: true, word: 'updated' }]) // After delete
      })

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

      // Update a card
      const updatedCard = { ...testCards[0], isKnown: true, word: 'updated' }
      const result = await manager.updateCard(updatedCard)
      expect(result).toEqual(updatedCard)

      // Delete a card
      await manager.deleteCard('card-2')

      // Verify MongoDB methods were called
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(2)
      expect(mockCollection.replaceOne).toHaveBeenCalledTimes(1)
      expect(mockCollection.deleteOne).toHaveBeenCalledTimes(1)
    })
  })

  describe('Provider Switching Workflow', () => {
    it('should switch between providers seamlessly', async () => {
      // Start with localStorage
      await manager.switchProvider('localhost')
      
      // Add some data
      await manager.saveCard(testCards[0])
      let cards = await manager.getCards()
      expect(cards).toHaveLength(1)

      // Switch to MongoDB
      await manager.switchProvider('mongodb')
      expect(manager.getCurrentProvider().getProviderName()).toBe('mongodb')

      // MongoDB should start empty (different data source)
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      })
      cards = await manager.getCards()
      expect(cards).toHaveLength(0)

      // Add data to MongoDB
      await manager.saveCard(testCards[1])

      // Switch back to localStorage
      await manager.switchProvider('localhost')
      
      // Should still have the original localStorage data
      cards = await manager.getCards()
      expect(cards).toHaveLength(1)
      expect(cards[0].id).toBe('card-1')
    })

    it('should handle provider switching with connection failures', async () => {
      // Start with localStorage
      await manager.switchProvider('localhost')
      
      // Try to switch to MongoDB but simulate connection failure
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'))
      
      // Should fallback to localhost
      await expect(manager.switchProvider('mongodb')).rejects.toThrow('Connection failed')
      
      // Should still be using localhost
      expect(manager.getCurrentProvider().getProviderName()).toBe('localhost')
    })
  })

  describe('Fallback Mechanism Workflow', () => {
    it('should fallback from MongoDB to localStorage on failure', async () => {
      // Start with MongoDB
      await manager.switchProvider('mongodb')
      
      // Simulate MongoDB failure during operation
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database connection lost'))
      })

      // Operation should succeed using fallback
      const cards = await manager.getCards()
      expect(cards).toEqual([]) // Empty from localStorage fallback
    })

    it('should handle complete provider failure gracefully', async () => {
      // Start with MongoDB
      await manager.switchProvider('mongodb')
      
      // Simulate both providers failing
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('MongoDB failed'))
      })
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage failed')
      })

      // Should throw error when all providers fail
      await expect(manager.getCards()).rejects.toThrow()
    })
  })

  describe('Status Management Workflow', () => {
    it('should track provider status throughout operations', async () => {
      // Check initial status
      let statuses = await manager.getAllProviderStatuses()
      expect(statuses.localhost.status).toBe(ProviderStatus.DISCONNECTED)
      expect(statuses.mongodb.status).toBe(ProviderStatus.DISCONNECTED)

      // Connect to localStorage
      await manager.switchProvider('localhost')
      let status = await manager.getStatus()
      expect(status.status).toBe(ProviderStatus.CONNECTED)

      // Connect to MongoDB
      await manager.switchProvider('mongodb')
      status = await manager.getStatus()
      expect(status.status).toBe(ProviderStatus.CONNECTED)

      // Test connection
      const connectionTest = await manager.testConnection()
      expect(connectionTest).toBe(true)

      // Simulate connection failure
      mockDb.command.mockRejectedValueOnce(new Error('Connection lost'))
      status = await manager.getStatus()
      expect(status.status).toBe(ProviderStatus.ERROR)
    })

    it('should handle reconnection workflow', async () => {
      // Connect to MongoDB
      await manager.switchProvider('mongodb')
      
      // Simulate connection loss
      mockDb.command.mockRejectedValue(new Error('Connection lost'))
      let status = await manager.getStatus()
      expect(status.status).toBe(ProviderStatus.ERROR)

      // Reconnect
      mockDb.command.mockResolvedValue({ ok: 1 }) // Fix the connection
      await manager.reconnect()
      
      status = await manager.getStatus()
      expect(status.status).toBe(ProviderStatus.CONNECTED)
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

    it('should handle concurrent operations safely', async () => {
      await manager.switchProvider('localhost')
      
      // Simulate concurrent saves
      const savePromises = testCards.map(card => manager.saveCard(card))
      const results = await Promise.all(savePromises)
      
      expect(results).toHaveLength(2)
      results.forEach((result, index) => {
        expect(result).toEqual(testCards[index])
      })

      // Verify all cards were saved
      const cards = await manager.getCards()
      expect(cards).toHaveLength(2)
    })
  })

  describe('Error Recovery Workflow', () => {
    it('should recover from transient failures', async () => {
      await manager.switchProvider('mongodb')
      
      // Simulate transient failure followed by success
      mockCollection.find
        .mockReturnValueOnce({
          toArray: jest.fn().mockRejectedValue(new Error('Transient failure'))
        })
        .mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })

      // First call should use fallback
      let cards = await manager.getCards()
      expect(cards).toEqual([])

      // Second call should work normally (after recovery)
      cards = await manager.getCards()
      expect(cards).toEqual([])
    })

    it('should handle provider recovery after extended outage', async () => {
      await manager.switchProvider('mongodb')
      
      // Simulate extended outage
      mockClient.connect.mockRejectedValue(new Error('Extended outage'))
      
      // Attempt recovery
      const recovered = await manager.attemptProviderRecovery('mongodb')
      expect(recovered).toBe(false)

      // Fix the connection
      mockClient.connect.mockResolvedValue(undefined)
      
      // Retry recovery
      const recoveredAfterFix = await manager.attemptProviderRecovery('mongodb')
      expect(recoveredAfterFix).toBe(true)
    })
  })
})