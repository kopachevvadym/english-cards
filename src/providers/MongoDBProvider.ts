import { MongoClient, Db, Collection, ObjectId } from 'mongodb'
import { Card } from '../types/card'
import { IDataProvider, MongoDBConfig, DataProviderError, ProviderError } from './types'

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
  example?: string
  exampleTranslation?: string
}

/**
 * MongoDB provider implementation
 */
export class MongoDBProvider implements IDataProvider {
  private client: MongoClient | null = null
  private db: Db | null = null
  private collection: Collection<CardDocument> | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

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
    } catch (error) {
      this.connectionPromise = null
      this.isConnected = false
      
      throw new ProviderError(
        DataProviderError.CONNECTION_FAILED,
        `Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'mongodb',
        error instanceof Error ? error : undefined
      )
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
      example: doc.example,
      exampleTranslation: doc.exampleTranslation
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
      example: card.example,
      exampleTranslation: card.exampleTranslation
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
  getConfig(): Omit<MongoDBConfig, 'connectionString'> {
    return {
      databaseName: this.config.databaseName,
      collectionName: this.config.collectionName,
      connectionString: this.config.connectionString ? '[CONFIGURED]' : '[NOT CONFIGURED]'
    }
  }
}