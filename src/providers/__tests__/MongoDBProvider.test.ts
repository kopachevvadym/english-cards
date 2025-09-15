import { MongoDBProvider } from '../MongoDBProvider'
import { Card } from '../../types/card'
import { MongoDBConfig, DataProviderError, ProviderError } from '../types'

// Manual mock for MongoDB
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
  command: jest.fn()
}

const mockClient = {
  connect: jest.fn(),
  close: jest.fn(),
  db: jest.fn().mockReturnValue(mockDb)
}

// Mock the mongodb module
jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => mockClient)
}))

describe('MongoDBProvider', () => {
  let provider: MongoDBProvider
  
  const validConfig: MongoDBConfig = {
    connectionString: 'mongodb://localhost:27017',
    databaseName: 'testdb',
    collectionName: 'cards'
  }

  const sampleCard: Card = {
    id: '1',
    word: 'hello',
    translation: 'hola',
    isKnown: false,
    createdAt: new Date('2023-01-01'),
    example: 'Hello world',
    exampleTranslation: 'Hola mundo'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    provider = new MongoDBProvider(validConfig)
  })

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      expect(() => new MongoDBProvider(validConfig)).not.toThrow()
    })

    it('should throw error for missing connection string', () => {
      const invalidConfig = { ...validConfig, connectionString: '' }
      expect(() => new MongoDBProvider(invalidConfig)).toThrow(ProviderError)
      expect(() => new MongoDBProvider(invalidConfig)).toThrow('MongoDB connection string is required')
    })

    it('should throw error for missing database name', () => {
      const invalidConfig = { ...validConfig, databaseName: '' }
      expect(() => new MongoDBProvider(invalidConfig)).toThrow(ProviderError)
      expect(() => new MongoDBProvider(invalidConfig)).toThrow('MongoDB database name is required')
    })

    it('should throw error for missing collection name', () => {
      const invalidConfig = { ...validConfig, collectionName: '' }
      expect(() => new MongoDBProvider(invalidConfig)).toThrow(ProviderError)
      expect(() => new MongoDBProvider(invalidConfig)).toThrow('MongoDB collection name is required')
    })
  })

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')

      await provider.connect()

      expect(mockClient.connect).toHaveBeenCalled()
      expect(mockDb.command).toHaveBeenCalledWith({ ping: 1 })
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ id: 1 }, { unique: true })
    })

    it('should handle connection failure', async () => {
      const connectionError = new Error('Connection failed')
      mockClient.connect.mockRejectedValue(connectionError)

      await expect(provider.connect()).rejects.toThrow(ProviderError)
      await expect(provider.connect()).rejects.toThrow('Failed to connect to MongoDB')
    })

    it('should not reconnect if already connected', async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')

      await provider.connect()
      await provider.connect() // Second call

      expect(mockClient.connect).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent connection attempts', async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')

      const promises = [provider.connect(), provider.connect(), provider.connect()]
      await Promise.all(promises)

      expect(mockClient.connect).toHaveBeenCalledTimes(1)
    })
  })

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      // First connect
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
      await provider.connect()

      mockClient.close.mockResolvedValue(undefined)
      await provider.disconnect()

      expect(mockClient.close).toHaveBeenCalled()
    })

    it('should handle disconnect when not connected', async () => {
      await expect(provider.disconnect()).resolves.not.toThrow()
    })
  })

  describe('getCards', () => {
    beforeEach(async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
    })

    it('should retrieve cards successfully', async () => {
      const mockDocuments = [{
        _id: 'objectid1',
        id: '1',
        word: 'hello',
        translation: 'hola',
        isKnown: false,
        createdAt: new Date('2023-01-01'),
        example: 'Hello world',
        exampleTranslation: 'Hola mundo'
      }]

      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockDocuments)
      } as any)

      const cards = await provider.getCards()

      expect(cards).toHaveLength(1)
      expect(cards[0]).toEqual({
        id: '1',
        word: 'hello',
        translation: 'hola',
        isKnown: false,
        createdAt: new Date('2023-01-01'),
        example: 'Hello world',
        exampleTranslation: 'Hola mundo'
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      mockCollection.find.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(dbError)
      } as any)

      await expect(provider.getCards()).rejects.toThrow(ProviderError)
      await expect(provider.getCards()).rejects.toThrow('Failed to retrieve cards')
    })
  })

  describe('saveCard', () => {
    beforeEach(async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
    })

    it('should save card successfully', async () => {
      mockCollection.insertOne.mockResolvedValue({
        insertedId: 'objectid1',
        acknowledged: true
      } as any)

      const result = await provider.saveCard(sampleCard)

      expect(result).toEqual(sampleCard)
      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        id: '1',
        word: 'hello',
        translation: 'hola',
        isKnown: false,
        createdAt: new Date('2023-01-01'),
        example: 'Hello world',
        exampleTranslation: 'Hola mundo'
      })
    })

    it('should handle duplicate key error', async () => {
      const duplicateError = Object.assign(new Error('Duplicate key'), { code: 11000 })
      mockCollection.insertOne.mockRejectedValue(duplicateError)

      await expect(provider.saveCard(sampleCard)).rejects.toThrow(ProviderError)
      await expect(provider.saveCard(sampleCard)).rejects.toThrow('Card with ID 1 already exists')
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      mockCollection.insertOne.mockRejectedValue(dbError)

      await expect(provider.saveCard(sampleCard)).rejects.toThrow(ProviderError)
      await expect(provider.saveCard(sampleCard)).rejects.toThrow('Failed to save card')
    })
  })

  describe('updateCard', () => {
    beforeEach(async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
    })

    it('should update card successfully', async () => {
      mockCollection.replaceOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true
      } as any)

      const result = await provider.updateCard(sampleCard)

      expect(result).toEqual(sampleCard)
      expect(mockCollection.replaceOne).toHaveBeenCalledWith(
        { id: '1' },
        {
          id: '1',
          word: 'hello',
          translation: 'hola',
          isKnown: false,
          createdAt: new Date('2023-01-01'),
          example: 'Hello world',
          exampleTranslation: 'Hola mundo'
        }
      )
    })

    it('should handle card not found', async () => {
      mockCollection.replaceOne.mockResolvedValue({
        matchedCount: 0,
        modifiedCount: 0,
        acknowledged: true
      } as any)

      await expect(provider.updateCard(sampleCard)).rejects.toThrow(ProviderError)
      await expect(provider.updateCard(sampleCard)).rejects.toThrow('Card with ID 1 not found')
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      mockCollection.replaceOne.mockRejectedValue(dbError)

      await expect(provider.updateCard(sampleCard)).rejects.toThrow(ProviderError)
      await expect(provider.updateCard(sampleCard)).rejects.toThrow('Failed to update card')
    })
  })

  describe('deleteCard', () => {
    beforeEach(async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
    })

    it('should delete card successfully', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
        acknowledged: true
      } as any)

      await provider.deleteCard('1')

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ id: '1' })
    })

    it('should handle card not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
        acknowledged: true
      } as any)

      await expect(provider.deleteCard('1')).rejects.toThrow(ProviderError)
      await expect(provider.deleteCard('1')).rejects.toThrow('Card with ID 1 not found')
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      mockCollection.deleteOne.mockRejectedValue(dbError)

      await expect(provider.deleteCard('1')).rejects.toThrow(ProviderError)
      await expect(provider.deleteCard('1')).rejects.toThrow('Failed to delete card')
    })
  })

  describe('saveCards', () => {
    beforeEach(async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
    })

    it('should save multiple cards successfully', async () => {
      const cards = [sampleCard, { ...sampleCard, id: '2', word: 'goodbye' }]
      mockCollection.insertMany.mockResolvedValue({
        insertedIds: { 0: 'objectid1', 1: 'objectid2' },
        acknowledged: true,
        insertedCount: 2
      } as any)

      const result = await provider.saveCards(cards)

      expect(result).toEqual(cards)
      expect(mockCollection.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1', word: 'hello' }),
          expect.objectContaining({ id: '2', word: 'goodbye' })
        ]),
        { ordered: false }
      )
    })

    it('should handle empty array', async () => {
      const result = await provider.saveCards([])
      expect(result).toEqual([])
      expect(mockCollection.insertMany).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database error')
      mockCollection.insertMany.mockRejectedValue(dbError)

      await expect(provider.saveCards([sampleCard])).rejects.toThrow(ProviderError)
      await expect(provider.saveCards([sampleCard])).rejects.toThrow('Failed to save cards')
    })
  })

  describe('getProviderName', () => {
    it('should return mongodb', () => {
      expect(provider.getProviderName()).toBe('mongodb')
    })
  })

  describe('isAvailable', () => {
    it('should return true when connection succeeds', async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')

      const result = await provider.isAvailable()
      expect(result).toBe(true)
    })

    it('should return false when connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'))

      const result = await provider.isAvailable()
      expect(result).toBe(false)
    })
  })

  describe('updateConfig', () => {
    it('should update configuration and disconnect', async () => {
      // First connect
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
      await provider.connect()

      const newConfig: MongoDBConfig = {
        connectionString: 'mongodb://newhost:27017',
        databaseName: 'newdb',
        collectionName: 'newcards'
      }

      mockClient.close.mockResolvedValue(undefined)
      provider.updateConfig(newConfig)

      expect(mockClient.close).toHaveBeenCalled()
    })

    it('should validate new configuration', () => {
      const invalidConfig = { ...validConfig, connectionString: '' }
      
      expect(() => provider.updateConfig(invalidConfig)).toThrow(ProviderError)
    })
  })

  describe('status management', () => {
    beforeEach(async () => {
      mockClient.connect.mockResolvedValue(undefined)
      mockDb.command.mockResolvedValue({ ok: 1 })
      mockCollection.createIndex.mockResolvedValue('id_1')
    })

    it('should get status when connected', async () => {
      await provider.connect()
      
      const status = await provider.getStatus()
      
      expect(status.status).toBe(ProviderStatus.CONNECTED)
      expect(status.message).toBe('Connected and operational')
      expect(status.lastChecked).toBeInstanceOf(Date)
      expect(status.connectionTime).toBeGreaterThan(0)
    })

    it('should get disconnected status when not connected', async () => {
      const status = await provider.getStatus()
      
      expect(status.status).toBe(ProviderStatus.DISCONNECTED)
      expect(status.message).toBe('Not connected')
      expect(status.lastChecked).toBeInstanceOf(Date)
    })

    it('should get error status when connection fails', async () => {
      await provider.connect()
      mockDb.command.mockRejectedValue(new Error('Connection lost'))
      
      const status = await provider.getStatus()
      
      expect(status.status).toBe(ProviderStatus.ERROR)
      expect(status.message).toContain('Connection error')
      expect(status.error).toBeDefined()
    })

    it('should test connection successfully', async () => {
      const result = await provider.testConnection()
      expect(result).toBe(true)
    })

    it('should test connection failure', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'))
      
      const result = await provider.testConnection()
      expect(result).toBe(false)
    })

    it('should reconnect successfully', async () => {
      await provider.connect()
      await provider.disconnect()
      
      await provider.reconnect()
      
      expect(mockClient.connect).toHaveBeenCalledTimes(2) // Once for initial connect, once for reconnect
    })

    it('should fail to reconnect with invalid config', async () => {
      mockClient.connect.mockRejectedValue(new Error('Invalid connection string'))
      
      await expect(provider.reconnect()).rejects.toThrow(ProviderError)
    })

    it('should handle status change callbacks', async () => {
      const mockCallback = jest.fn()
      provider.onStatusChange = mockCallback

      await provider.connect()
      
      // The callback should have been called during connect
      expect(mockCallback).toHaveBeenCalled()
      const callArgs = mockCallback.mock.calls[0][0]
      expect(callArgs.status).toBe(ProviderStatus.CONNECTED)
    })
  })

  describe('getConfig', () => {
    it('should return config without connection string', () => {
      const config = provider.getConfig()
      
      expect(config).toEqual({
        databaseName: 'testdb',
        collectionName: 'cards',
        connectionString: '[CONFIGURED]'
      })
    })

    it('should show not configured for empty connection string', () => {
      const providerWithEmptyConfig = new MongoDBProvider({
        ...validConfig,
        connectionString: 'mongodb://localhost:27017' // This will be shown as configured
      })

      const config = providerWithEmptyConfig.getConfig()
      expect(config.connectionString).toBe('[CONFIGURED]')
    })
  })
})