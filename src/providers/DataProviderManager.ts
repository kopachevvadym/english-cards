import { Card } from '../types/card'
import { IDataProvider, ProviderError, DataProviderError } from './types'

/**
 * Central manager for data provider operations and switching
 */
export class DataProviderManager implements IDataProvider {
  private currentProvider: IDataProvider | null = null
  private providers: Map<string, IDataProvider> = new Map()
  private fallbackProvider: IDataProvider | null = null

  constructor(
    private errorHandler: (error: ProviderError) => void = console.error
  ) {}

  /**
   * Register a data provider
   */
  registerProvider(name: string, provider: IDataProvider): void {
    this.providers.set(name, provider)
    
    // Set first registered provider as current if none exists
    if (!this.currentProvider) {
      this.currentProvider = provider
    }
    
    // Set localhost as fallback provider
    if (name === 'localhost') {
      this.fallbackProvider = provider
    }
  }

  /**
   * Switch to a different data provider
   */
  async switchProvider(providerName: string): Promise<void> {
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      throw new ProviderError(
        DataProviderError.PROVIDER_UNAVAILABLE,
        `Provider '${providerName}' is not registered`,
        providerName
      )
    }

    try {
      // Check if provider is available
      const isAvailable = await provider.isAvailable()
      if (!isAvailable) {
        throw new ProviderError(
          DataProviderError.PROVIDER_UNAVAILABLE,
          `Provider '${providerName}' is not available`,
          providerName
        )
      }

      // Disconnect current provider if exists
      if (this.currentProvider) {
        try {
          await this.currentProvider.disconnect()
        } catch (error) {
          // Log disconnect error but don't fail the switch
          console.warn('Error disconnecting from current provider:', error)
        }
      }

      // Connect to new provider
      await provider.connect()
      this.currentProvider = provider
      
    } catch (error) {
      await this.handleProviderError(error as Error, providerName)
    }
  }

  /**
   * Get the current active provider
   */
  getCurrentProvider(): IDataProvider {
    if (!this.currentProvider) {
      throw new ProviderError(
        DataProviderError.PROVIDER_UNAVAILABLE,
        'No data provider is currently active',
        'none'
      )
    }
    return this.currentProvider
  }

  /**
   * Get list of available provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Handle provider errors with fallback logic
   */
  private async handleProviderError(error: Error, failedProviderName: string): Promise<void> {
    const providerError = error instanceof ProviderError 
      ? error 
      : new ProviderError(
          DataProviderError.OPERATION_FAILED,
          error.message,
          failedProviderName,
          error
        )

    // Try fallback to localhost if available and not already using it
    if (this.fallbackProvider && failedProviderName !== 'localhost') {
      try {
        console.warn(`Provider '${failedProviderName}' failed, falling back to localhost`)
        await this.fallbackProvider.connect()
        this.currentProvider = this.fallbackProvider
        this.errorHandler(providerError)
        return
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError)
      }
    }

    // If no fallback possible, propagate the error
    this.errorHandler(providerError)
    throw providerError
  }

  // IDataProvider implementation - delegates to current provider
  async getCards(): Promise<Card[]> {
    try {
      return await this.getCurrentProvider().getCards()
    } catch (error) {
      await this.handleProviderError(error as Error, this.getCurrentProvider().getProviderName())
      return []
    }
  }

  async saveCard(card: Card): Promise<Card> {
    try {
      return await this.getCurrentProvider().saveCard(card)
    } catch (error) {
      await this.handleProviderError(error as Error, this.getCurrentProvider().getProviderName())
      throw error
    }
  }

  async updateCard(card: Card): Promise<Card> {
    try {
      return await this.getCurrentProvider().updateCard(card)
    } catch (error) {
      await this.handleProviderError(error as Error, this.getCurrentProvider().getProviderName())
      throw error
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      await this.getCurrentProvider().deleteCard(cardId)
    } catch (error) {
      await this.handleProviderError(error as Error, this.getCurrentProvider().getProviderName())
      throw error
    }
  }

  async saveCards(cards: Card[]): Promise<Card[]> {
    try {
      return await this.getCurrentProvider().saveCards(cards)
    } catch (error) {
      await this.handleProviderError(error as Error, this.getCurrentProvider().getProviderName())
      throw error
    }
  }

  getProviderName(): string {
    return this.getCurrentProvider().getProviderName()
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await this.getCurrentProvider().isAvailable()
    } catch {
      return false
    }
  }

  async connect(): Promise<void> {
    await this.getCurrentProvider().connect()
  }

  async disconnect(): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.disconnect()
    }
  }
}