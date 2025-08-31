import { Card } from '../types/card'

/**
 * Error types for data provider operations
 */
export enum DataProviderError {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  OPERATION_FAILED = 'OPERATION_FAILED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION'
}

/**
 * Custom error class for provider-specific errors
 */
export class ProviderError extends Error {
  constructor(
    public type: DataProviderError,
    message: string,
    public provider: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

/**
 * Common interface for all data providers
 */
export interface IDataProvider {
  // Core CRUD operations
  getCards(): Promise<Card[]>
  saveCard(card: Card): Promise<Card>
  updateCard(card: Card): Promise<Card>
  deleteCard(cardId: string): Promise<void>
  saveCards(cards: Card[]): Promise<Card[]>
  
  // Provider metadata
  getProviderName(): string
  isAvailable(): Promise<boolean>
  
  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
}

/**
 * Configuration for MongoDB provider
 */
export interface MongoDBConfig {
  connectionString: string
  databaseName: string
  collectionName: string
}

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  name: string
  displayName: string
  isDefault: boolean
  config?: Record<string, any>
}

/**
 * Application settings interface
 */
export interface AppSettings {
  selectedProvider: string
  providers: {
    localhost: ProviderConfig
    mongodb: ProviderConfig & {
      config: MongoDBConfig
    }
  }
}