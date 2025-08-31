import { Card } from '../types/card'
import { IDataProvider, IDataProviderWithStatus, ProviderError, DataProviderError, ProviderStatus, ProviderStatusInfo } from './types'
import { FallbackHandler, ErrorNotification, ErrorNotificationHandler } from './FallbackHandler'

/**
 * Central manager for data provider operations and switching
 */
export class DataProviderManager implements IDataProviderWithStatus {
  private currentProvider: IDataProvider | null = null
  private providers: Map<string, IDataProvider> = new Map()
  private fallbackProvider: IDataProvider | null = null
  private fallbackHandler: FallbackHandler
  private statusListeners: Map<string, (status: ProviderStatusInfo) => void> = new Map()
  
  public onStatusChange?: (status: ProviderStatusInfo) => void

  constructor(
    private errorHandler: (error: ProviderError) => void = console.error,
    notificationHandler?: ErrorNotificationHandler
  ) {
    // Create fallback handler with error notification integration
    const defaultNotificationHandler: ErrorNotificationHandler = (notification: ErrorNotification) => {
      // Convert notification to ProviderError for backward compatibility
      const error = new ProviderError(
        notification.type === 'error' ? DataProviderError.OPERATION_FAILED : DataProviderError.CONNECTION_FAILED,
        notification.message,
        notification.provider
      )
      this.errorHandler(error)
    }

    this.fallbackHandler = new FallbackHandler(
      {}, // Use default retry config
      notificationHandler || defaultNotificationHandler
    )
  }

  /**
   * Register a data provider
   */
  registerProvider(name: string, provider: IDataProvider): void {
    this.providers.set(name, provider)
    
    // Set up status change listener if provider supports it
    if ('onStatusChange' in provider && typeof provider.onStatusChange === 'function') {
      const statusProvider = provider as IDataProviderWithStatus
      statusProvider.onStatusChange = (status: ProviderStatusInfo) => {
        // Forward status changes to our listeners
        const listener = this.statusListeners.get(name)
        if (listener) {
          listener(status)
        }
        
        // If this is the current provider, forward to our own listeners
        if (this.currentProvider === provider && this.onStatusChange) {
          this.onStatusChange(status)
        }
      }
    }
    
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
   * Get a specific provider by name
   */
  getProvider(name: string): IDataProvider | null {
    return this.providers.get(name) || null
  }

  /**
   * Handle provider errors with fallback logic using FallbackHandler
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

  // IDataProvider implementation - delegates to current provider with fallback support
  async getCards(): Promise<Card[]> {
    return await this.fallbackHandler.executeWithFallback(
      this.getCurrentProvider(),
      this.fallbackProvider,
      (provider) => provider.getCards(),
      'getCards'
    )
  }

  async saveCard(card: Card): Promise<Card> {
    return await this.fallbackHandler.executeWithFallback(
      this.getCurrentProvider(),
      this.fallbackProvider,
      (provider) => provider.saveCard(card),
      'saveCard'
    )
  }

  async updateCard(card: Card): Promise<Card> {
    return await this.fallbackHandler.executeWithFallback(
      this.getCurrentProvider(),
      this.fallbackProvider,
      (provider) => provider.updateCard(card),
      'updateCard'
    )
  }

  async deleteCard(cardId: string): Promise<void> {
    return await this.fallbackHandler.executeWithFallback(
      this.getCurrentProvider(),
      this.fallbackProvider,
      (provider) => provider.deleteCard(cardId),
      'deleteCard'
    )
  }

  async saveCards(cards: Card[]): Promise<Card[]> {
    return await this.fallbackHandler.executeWithFallback(
      this.getCurrentProvider(),
      this.fallbackProvider,
      (provider) => provider.saveCards(cards),
      'saveCards'
    )
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

  /**
   * Attempt to recover a failed provider
   */
  async attemptProviderRecovery(providerName?: string): Promise<boolean> {
    const targetProvider = providerName 
      ? this.providers.get(providerName)
      : this.currentProvider

    if (!targetProvider) {
      return false
    }

    return await this.fallbackHandler.attemptProviderRecovery(targetProvider)
  }

  /**
   * Get the fallback handler for advanced configuration
   */
  getFallbackHandler(): FallbackHandler {
    return this.fallbackHandler
  }

  /**
   * Update the error notification handler
   */
  updateNotificationHandler(handler: ErrorNotificationHandler): void {
    this.fallbackHandler.updateNotificationHandler(handler)
  }

  /**
   * Check if a fallback provider is available
   */
  hasFallbackProvider(): boolean {
    return this.fallbackProvider !== null
  }

  /**
   * Get the current fallback provider name
   */
  getFallbackProviderName(): string | null {
    return this.fallbackProvider?.getProviderName() || null
  }

  /**
   * Get the status of the current provider
   */
  async getStatus(): Promise<ProviderStatusInfo> {
    const provider = this.getCurrentProvider()
    
    if ('getStatus' in provider && typeof provider.getStatus === 'function') {
      return await (provider as IDataProviderWithStatus).getStatus()
    }
    
    // Fallback for providers that don't implement status
    const isAvailable = await provider.isAvailable()
    return {
      status: isAvailable ? ProviderStatus.CONNECTED : ProviderStatus.UNAVAILABLE,
      message: isAvailable ? 'Provider is available' : 'Provider is unavailable',
      lastChecked: new Date()
    }
  }

  /**
   * Get the status of a specific provider
   */
  async getProviderStatus(providerName: string): Promise<ProviderStatusInfo> {
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      return {
        status: ProviderStatus.UNAVAILABLE,
        message: `Provider '${providerName}' is not registered`,
        lastChecked: new Date(),
        error: new ProviderError(
          DataProviderError.PROVIDER_UNAVAILABLE,
          `Provider '${providerName}' is not registered`,
          providerName
        )
      }
    }
    
    if ('getStatus' in provider && typeof provider.getStatus === 'function') {
      return await (provider as IDataProviderWithStatus).getStatus()
    }
    
    // Fallback for providers that don't implement status
    const isAvailable = await provider.isAvailable()
    return {
      status: isAvailable ? ProviderStatus.CONNECTED : ProviderStatus.UNAVAILABLE,
      message: isAvailable ? 'Provider is available' : 'Provider is unavailable',
      lastChecked: new Date()
    }
  }

  /**
   * Test connection for the current provider
   */
  async testConnection(): Promise<boolean> {
    const provider = this.getCurrentProvider()
    
    if ('testConnection' in provider && typeof provider.testConnection === 'function') {
      return await (provider as IDataProviderWithStatus).testConnection()
    }
    
    // Fallback to isAvailable check
    return await provider.isAvailable()
  }

  /**
   * Test connection for a specific provider
   */
  async testProviderConnection(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      return false
    }
    
    if ('testConnection' in provider && typeof provider.testConnection === 'function') {
      return await (provider as IDataProviderWithStatus).testConnection()
    }
    
    // Fallback to isAvailable check
    return await provider.isAvailable()
  }

  /**
   * Reconnect the current provider
   */
  async reconnect(): Promise<void> {
    const provider = this.getCurrentProvider()
    
    if ('reconnect' in provider && typeof provider.reconnect === 'function') {
      await (provider as IDataProviderWithStatus).reconnect()
    } else {
      // Fallback: disconnect and connect again
      await provider.disconnect()
      await provider.connect()
    }
  }

  /**
   * Reconnect a specific provider
   */
  async reconnectProvider(providerName: string): Promise<void> {
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      throw new ProviderError(
        DataProviderError.PROVIDER_UNAVAILABLE,
        `Provider '${providerName}' is not registered`,
        providerName
      )
    }
    
    if ('reconnect' in provider && typeof provider.reconnect === 'function') {
      await (provider as IDataProviderWithStatus).reconnect()
    } else {
      // Fallback: disconnect and connect again
      await provider.disconnect()
      await provider.connect()
    }
  }

  /**
   * Add a status change listener for a specific provider
   */
  addStatusListener(providerName: string, listener: (status: ProviderStatusInfo) => void): void {
    this.statusListeners.set(providerName, listener)
  }

  /**
   * Remove a status change listener for a specific provider
   */
  removeStatusListener(providerName: string): void {
    this.statusListeners.delete(providerName)
  }

  /**
   * Get all provider statuses
   */
  async getAllProviderStatuses(): Promise<Record<string, ProviderStatusInfo>> {
    const statuses: Record<string, ProviderStatusInfo> = {}
    
    for (const name of Array.from(this.providers.keys())) {
      try {
        statuses[name] = await this.getProviderStatus(name)
      } catch (error) {
        statuses[name] = {
          status: ProviderStatus.ERROR,
          message: `Failed to get status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastChecked: new Date(),
          error: error instanceof ProviderError ? error : new ProviderError(
            DataProviderError.OPERATION_FAILED,
            error instanceof Error ? error.message : 'Unknown error',
            name,
            error instanceof Error ? error : undefined
          )
        }
      }
    }
    
    return statuses
  }
}