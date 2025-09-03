import { MongoClient, Db, Collection, ObjectId } from 'mongodb'
import { Card, Example } from '../types/card'
import { IDataProvider, IDataProviderWithStatus, MongoDBConfig, DataProviderError, ProviderError, ProviderStatus, ProviderStatusInfo } from './types'

/**
 * MongoDB document interface for cards
 */
interface CardDocument {
  _id?: ObjectId
  id: string
  word: string
  translation: string
  isKnown: boolean
  createdAt: Date
  lastReviewed?: Date
  examples: Example[]
}

/**
 * MongoDB provider implementation
 */
export class MongoDBProvider implements IDataProviderWithStatus {
  private client: MongoClient | null = null
  private db: Db | null = null
  private collection: Collection<CardDocument> | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null
  private currentStatus: ProviderStatus = ProviderStatus.DISCONNECTED
  private lastError: ProviderError | null = null
  private connectionStartTime: number | null = null
  
  public onStatusChange?: (status: ProviderStatusInfo) => void

  constructor(private config: MongoDBConfig) {
    this.validateConfig()
  }

  /**
   * Validates the MongoDB configuration
   */
  private validateConfig(): void {
    if (!this.config.connectionString) {
      throw new ProviderError(
        DataProviderError.INVALID_CONFIGURATION,
        'MongoDB connection string is required',
        'mongodb'
      )
    }

    if (!this.config.databaseName) {
      throw new ProviderError(
        DataProviderError.INVALID_CONFIGURATION,
        'MongoDB database name is required',
        'mongodb'
      )
    }

    if (!this.config.collectionName) {
      throw new ProviderError(
        DataProviderError.INVALID_CONFIGURATION,
        'MongoDB collection name is required',
        'mongodb'
      )
    }
  }

  /**
   * Establishes connection to MongoDB
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    // If connection is already in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.performConnection()
    return this.connectionPromise
  }

  /**
   * Performs the actual connection to MongoDB
   */
  private async performConnection(): Promise<void> {
    this.connectionStartTime = Date.now()
    this.updateStatus(ProviderStatus.CONNECTING, 'Establishing connection...')

    try {
      this.client = new MongoClient(this.config.connectionString, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 10000, // 10 second connection timeout
        socketTimeoutMS: 45000, // 45 second socket timeout
      })

      await this.client.connect()
      
      // Test the connection
      await this.client.db('admin').command({ ping: 1 })
      
      this.db = this.client.db(this.config.databaseName)
      this.collection = this.db.collection<CardDocument>(this.config.collectionName)
      
      // Create index on id field for better performance
      await this.collection.createIndex({ id: 1 }, { unique: true })
      
      this.isConnected = true
      this.connectionPromise = null
      
      this.updateStatus(ProviderStatus.CONNECTED, 'Connected successfully')
    } catch (error) {
      this.connectionPromise = null
      this.isConnected = false
      
      const providerError = new ProviderError(
        DataProviderError.CONNECTION_FAILED,
        `Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
      
      this.updateStatus(ProviderStatus.ERROR, providerError.message, providerError)
      throw providerError
    }
  }

  /**
   * Disconnects from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
      this.collection = null
      this.isConnected = false
      this.connectionPromise = null
      this.connectionStartTime = null
      
      this.updateStatus(ProviderStatus.DISCONNECTED, 'Disconnected')
    }
  }

  /**
   * Ensures connection is established before operations
   */
  private async ensureConnection(): Promise<Collection<CardDocument>> {
    if (!this.isConnected || !this.collection) {
      await this.connect()
    }

    if (!this.collection) {
      throw new ProviderError(
        DataProviderError.CONNECTION_FAILED,
        'MongoDB collection is not available',
        'mongodb'
      )
    }

    return this.collection
  }

  /**
   * Converts MongoDB document to Card interface
   */
  private documentToCard(doc: CardDocument): Card {
    return {
      id: doc.id,
      word: doc.word,
      translation: doc.translation,
      isKnown: doc.isKnown,
      createdAt: doc.createdAt,
      lastReviewed: doc.lastReviewed,
      examples: doc.examples || []
    }
  }

  /**
   * Converts Card interface to MongoDB document
   */
  private cardToDocument(card: Card): Omit<CardDocument, '_id'> {
    return {
      id: card.id,
      word: card.word,
      translation: card.translation,
      isKnown: card.isKnown,
      createdAt: card.createdAt,
      lastReviewed: card.lastReviewed,
      examples: card.examples
    }
  }

  /**
   * Retrieves all cards from MongoDB
   */
  async getCards(): Promise<Card[]> {
    try {
      const collection = await this.ensureConnection()
      const documents = await collection.find({}).toArray()
      return documents.map(doc => this.documentToCard(doc))
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Failed to retrieve cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Saves a new card to MongoDB
   */
  async saveCard(card: Card): Promise<Card> {
    try {
      const collection = await this.ensureConnection()
      const document = this.cardToDocument(card)
      
      await collection.insertOne(document)
      return card
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }

      // Handle duplicate key error
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          `Card with ID ${card.id} already exists`,
          'mongodb',
          error
        )
      }
      
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Failed to save card: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Updates an existing card in MongoDB
   */
  async updateCard(card: Card): Promise<Card> {
    try {
      const collection = await this.ensureConnection()
      const document = this.cardToDocument(card)
      
      const result = await collection.replaceOne(
        { id: card.id },
        document
      )

      if (result.matchedCount === 0) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          `Card with ID ${card.id} not found`,
          'mongodb'
        )
      }

      return card
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Failed to update card: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Deletes a card from MongoDB
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      const collection = await this.ensureConnection()
      
      const result = await collection.deleteOne({ id: cardId })

      if (result.deletedCount === 0) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          `Card with ID ${cardId} not found`,
          'mongodb'
        )
      }
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Failed to delete card: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Saves multiple cards to MongoDB (batch operation)
   */
  async saveCards(cards: Card[]): Promise<Card[]> {
    if (cards.length === 0) {
      return []
    }

    try {
      const collection = await this.ensureConnection()
      const documents = cards.map(card => this.cardToDocument(card))
      
      // Use insertMany for better performance
      await collection.insertMany(documents, { ordered: false })
      return cards
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Failed to save cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Returns the provider name
   */
  getProviderName(): string {
    return 'mongodb'
  }

  /**
   * Checks if MongoDB is available and accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.connect()
      return this.isConnected
    } catch (error) {
      return false
    }
  }

  /**
   * Updates the MongoDB configuration
   */
  updateConfig(config: MongoDBConfig): void {
    // Disconnect if configuration changes
    if (this.isConnected) {
      this.disconnect().catch(console.error)
    }
    
    this.config = config
    this.validateConfig()
  }

  /**
   * Gets current configuration (without sensitive data)
   */
  getConfig(): { databaseName: string; collectionName: string; connectionString: string } {
    return {
      databaseName: this.config.databaseName,
      collectionName: this.config.collectionName,
      connectionString: this.config.connectionString ? '[CONFIGURED]' : '[NOT CONFIGURED]'
    }
  }

  /**
   * Updates the current status and notifies listeners
   */
  private updateStatus(status: ProviderStatus, message?: string, error?: ProviderError): void {
    this.currentStatus = status
    if (error) {
      this.lastError = error
    }

    const statusInfo: ProviderStatusInfo = {
      status,
      message,
      lastChecked: new Date(),
      connectionTime: this.connectionStartTime ? Date.now() - this.connectionStartTime : undefined,
      error
    }

    if (this.onStatusChange) {
      this.onStatusChange(statusInfo)
    }
  }

  /**
   * Gets the current provider status
   */
  async getStatus(): Promise<ProviderStatusInfo> {
    let status = this.currentStatus
    let message = ''

    try {
      if (this.isConnected && this.client) {
        // Test the connection with a ping
        await this.client.db('admin').command({ ping: 1 })
        status = ProviderStatus.CONNECTED
        message = 'Connected and operational'
      } else {
        status = ProviderStatus.DISCONNECTED
        message = 'Not connected'
      }
    } catch (error) {
      status = ProviderStatus.ERROR
      message = `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      this.lastError = new ProviderError(
        DataProviderError.CONNECTION_FAILED,
        message,
        'mongodb',
        error instanceof Error ? error : undefined
      )
    }

    this.currentStatus = status

    return {
      status,
      message,
      lastChecked: new Date(),
      connectionTime: this.connectionStartTime ? Date.now() - this.connectionStartTime : undefined,
      error: this.lastError || undefined
    }
  }

  /**
   * Tests the connection without changing the current connection state
   */
  async testConnection(): Promise<boolean> {
    this.updateStatus(ProviderStatus.CONNECTING, 'Testing connection...')

    try {
      // Create a temporary client for testing
      const testClient = new MongoClient(this.config.connectionString, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      })

      await testClient.connect()
      
      // Test the connection
      await testClient.db('admin').command({ ping: 1 })
      
      // Test database access
      const testDb = testClient.db(this.config.databaseName)
      await testDb.listCollections().toArray()
      
      await testClient.close()
      
      this.updateStatus(
        this.isConnected ? ProviderStatus.CONNECTED : ProviderStatus.DISCONNECTED,
        'Connection test successful'
      )
      
      return true
    } catch (error) {
      const providerError = new ProviderError(
        DataProviderError.CONNECTION_FAILED,
        `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
      
      this.updateStatus(ProviderStatus.ERROR, providerError.message, providerError)
      return false
    }
  }

  /**
   * Attempts to reconnect to MongoDB
   */
  async reconnect(): Promise<void> {
    this.updateStatus(ProviderStatus.CONNECTING, 'Reconnecting...')

    try {
      // Disconnect first if connected
      if (this.isConnected) {
        await this.disconnect()
      }

      // Clear any existing connection promise
      this.connectionPromise = null
      
      // Attempt to connect
      await this.connect()
      
      this.updateStatus(ProviderStatus.CONNECTED, 'Reconnected successfully')
    } catch (error) {
      const providerError = error instanceof ProviderError 
        ? error 
        : new ProviderError(
            DataProviderError.CONNECTION_FAILED,
            `Reconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'mongodb',
            error instanceof Error ? error : undefined
          )
      
      this.updateStatus(ProviderStatus.ERROR, providerError.message, providerError)
      throw providerError
    }
  }
}