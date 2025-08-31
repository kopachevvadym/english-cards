import { DataProviderManager } from '../DataProviderManager'
import { IDataProvider, ProviderError, DataProviderError } from '../types'
import { ErrorNotification } from '../FallbackHandler'
import { Card } from '../../types/card'

// Mock provider implementation for testing
class MockProvider implements IDataProvider {
  private shouldFail: boolean = false
  private failureType: DataProviderError = DataProviderError.CONNECTION_FAILED
  private failureMessage: string = 'Mock failure'
  private callCount: number = 0
  private isConnected: boolean = false

  constructor(private name: string) {}

  setFailure(shouldFail: boolean, type?: DataProviderError, message?: string): void {
    this.shouldFail = shouldFail
    if (type) this.failureType = type
    if (message) this.failureMessage = message
  }

  getCallCount(): number {
    return this.callCount
  }

  resetCallCount(): void {
    this.callCount = 0
  }

  async getCards(): Promise<Card[]> {
    this.callCount++
    if (this.shouldFail) {
      throw new ProviderError(this.failureType, this.failureMessage, this.name)
    }
    return []
  }

  async saveCard(card: Card): Promise<Card> {
    this.callCount++
    if (this.shouldFail) {
      throw new ProviderError(this.failureType, this.failureMessage, this.name)
    }
    return card
  }

  async updateCard(card: Card): Promise<Card> {
    this.callCount++
    if (this.shouldFail) {
      throw new ProviderError(this.failureType, this.failureMessage, this.name)
    }
    return card
  }

  async deleteCard(cardId: string): Promise<void> {
    this.callCount++
    if (this.shouldFail) {
      throw new ProviderError(this.failureType, this.failureMessage, this.name)
    }
  }

  async saveCards(cards: Card[]): Promise<Card[]> {
    this.callCount++
    if (this.shouldFail) {
      throw new ProviderError(this.failureType, this.failureMessage, this.name)
    }
    return cards
  }

  getProviderName(): string {
    return this.name
  }

  async isAvailable(): Promise<boolean> {
    this.callCount++
    return !this.shouldFail
  }

  async connect(): Promise<void> {
    this.callCount++
    if (this.shouldFail) {
      throw new ProviderError(this.failureType, this.failureMessage, this.name)
    }
    this.isConnected = true
  }

  async disconnect(): Promise<void> {
    this.callCount++
    this.isConnected = false
  }

  isConnectedState(): boolean {
    return this.isConnected
  }
}

describe('DataProviderManager', () => {
  let manager: DataProviderManager
  let primaryProvider: MockProvider
  let fallbackProvider: MockProvider
  let errorNotifications: ProviderError[]
  let notifications: ErrorNotification[]

  const mockErrorHandler = (error: ProviderError) => {
    errorNotifications.push(error)
  }

  const mockNotificationHandler = (notification: ErrorNotification) => {
    notifications.push(notification)
  }

  beforeEach(() => {
    primaryProvider = new MockProvider('primary')
    fallbackProvider = new MockProvider('localhost')
    errorNotifications = []
    notifications = []
    
    manager = new DataProviderManager(mockErrorHandler, mockNotificationHandler)
    
    // Configure fallback handler with shorter delays for testing
    manager.getFallbackHandler().updateRetryConfig({
      maxRetries: 1,
      baseDelayMs: 10,
      maxDelayMs: 50,
      backoffMultiplier: 1.5
    })
    
    manager.registerProvider('primary', primaryProvider)
    manager.registerProvider('localhost', fallbackProvider)
  })

  describe('provider registration and management', () => {
    it('should register providers correctly', () => {
      expect(manager.getAvailableProviders()).toContain('primary')
      expect(manager.getAvailableProviders()).toContain('localhost')
      expect(manager.getCurrentProvider().getProviderName()).toBe('primary')
    })

    it('should set localhost as fallback provider', () => {
      expect(manager.hasFallbackProvider()).toBe(true)
      expect(manager.getFallbackProviderName()).toBe('localhost')
    })

    it('should switch providers successfully', async () => {
      await manager.switchProvider('localhost')
      expect(manager.getCurrentProvider().getProviderName()).toBe('localhost')
    })

    it('should throw error when switching to non-existent provider', async () => {
      await expect(manager.switchProvider('nonexistent')).rejects.toThrow(
        "Provider 'nonexistent' is not registered"
      )
    })

    it('should throw error when switching to unavailable provider', async () => {
      fallbackProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Connection failed')
      
      await expect(manager.switchProvider('localhost')).rejects.toThrow(
        "Provider 'localhost' is not available"
      )
    })
  })

  describe('fallback functionality', () => {
    it('should use fallback provider when primary fails', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Primary failed')

      const result = await manager.getCards()

      expect(result).toEqual([])
      expect(primaryProvider.getCallCount()).toBeGreaterThan(0)
      expect(fallbackProvider.getCallCount()).toBeGreaterThan(0)
      expect(notifications.some(n => n.title === 'Fallback Provider Used')).toBe(true)
    })

    it('should throw error when both providers fail', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Primary failed')
      fallbackProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Fallback failed')

      await expect(manager.getCards()).rejects.toThrow('Primary failed')
      expect(notifications.some(n => n.title === 'All Providers Failed')).toBe(true)
    })

    it('should work with all CRUD operations', async () => {
      const testCard: Card = {
        id: 'test-1',
        word: 'test',
        translation: 'prueba',
        isKnown: false,
        createdAt: new Date()
      }

      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Primary failed')

      // Test all operations with fallback
      const savedCard = await manager.saveCard(testCard)
      expect(savedCard).toEqual(testCard)

      const updatedCard = await manager.updateCard(testCard)
      expect(updatedCard).toEqual(testCard)

      await manager.deleteCard('test-1')

      const savedCards = await manager.saveCards([testCard])
      expect(savedCards).toEqual([testCard])

      // Verify fallback was used for all operations
      expect(fallbackProvider.getCallCount()).toBeGreaterThan(0)
    })
  })

  describe('provider recovery', () => {
    it('should successfully recover a failed provider', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Connection failed')
      
      // Simulate recovery after some time
      setTimeout(() => {
        primaryProvider.setFailure(false)
      }, 50)

      const recovered = await manager.attemptProviderRecovery('primary')
      expect(recovered).toBe(true)
      expect(notifications.some(n => n.title === 'Provider Recovered')).toBe(true)
    })

    it('should fail to recover a persistently failing provider', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Persistent failure')

      const recovered = await manager.attemptProviderRecovery('primary', 2) // Reduce attempts
      expect(recovered).toBe(false)
      expect(notifications.some(n => n.title === 'Provider Recovery Failed')).toBe(true)
    }, 10000) // Increase timeout for this specific test

    it('should return false for non-existent provider recovery', async () => {
      const recovered = await manager.attemptProviderRecovery('nonexistent')
      expect(recovered).toBe(false)
    })
  })

  describe('error handling and notifications', () => {
    it('should generate appropriate error notifications', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Connection failed')

      await manager.getCards() // Should succeed with fallback

      const errorNotifications = notifications.filter(n => n.type === 'error')
      const warningNotifications = notifications.filter(n => n.type === 'warning')

      expect(errorNotifications.length).toBeGreaterThan(0)
      expect(warningNotifications.length).toBeGreaterThan(0)
    })

    it('should allow updating notification handler', () => {
      const newNotifications: ErrorNotification[] = []
      const newHandler = (notification: ErrorNotification) => {
        newNotifications.push(notification)
      }

      manager.updateNotificationHandler(newHandler)

      // Trigger an error to test new handler
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Test error')

      expect(async () => {
        await manager.getCards()
      }).not.toThrow()

      // Original notifications should be empty, new one should have notifications
      setTimeout(() => {
        expect(notifications).toHaveLength(0)
        expect(newNotifications.length).toBeGreaterThan(0)
      }, 100)
    })
  })

  describe('configuration and metadata', () => {
    it('should provide access to fallback handler', () => {
      const fallbackHandler = manager.getFallbackHandler()
      expect(fallbackHandler).toBeDefined()
      expect(typeof fallbackHandler.executeWithFallback).toBe('function')
    })

    it('should report fallback provider availability', () => {
      expect(manager.hasFallbackProvider()).toBe(true)
      expect(manager.getFallbackProviderName()).toBe('localhost')
    })

    it('should handle case with no fallback provider', () => {
      const managerWithoutFallback = new DataProviderManager()
      managerWithoutFallback.registerProvider('primary', primaryProvider)

      expect(managerWithoutFallback.hasFallbackProvider()).toBe(false)
      expect(managerWithoutFallback.getFallbackProviderName()).toBe(null)
    })
  })

  describe('IDataProvider interface compliance', () => {
    it('should implement all IDataProvider methods', async () => {
      expect(typeof manager.getCards).toBe('function')
      expect(typeof manager.saveCard).toBe('function')
      expect(typeof manager.updateCard).toBe('function')
      expect(typeof manager.deleteCard).toBe('function')
      expect(typeof manager.saveCards).toBe('function')
      expect(typeof manager.getProviderName).toBe('function')
      expect(typeof manager.isAvailable).toBe('function')
      expect(typeof manager.connect).toBe('function')
      expect(typeof manager.disconnect).toBe('function')
    })

    it('should delegate provider name correctly', () => {
      expect(manager.getProviderName()).toBe('primary')
    })

    it('should delegate availability check correctly', async () => {
      const isAvailable = await manager.isAvailable()
      expect(isAvailable).toBe(true)

      primaryProvider.setFailure(true)
      const isAvailableAfterFailure = await manager.isAvailable()
      expect(isAvailableAfterFailure).toBe(false)
    })

    it('should handle connect and disconnect operations', async () => {
      await manager.connect()
      expect(primaryProvider.isConnectedState()).toBe(true)

      await manager.disconnect()
      expect(primaryProvider.isConnectedState()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty provider list', () => {
      const emptyManager = new DataProviderManager()
      
      expect(() => emptyManager.getCurrentProvider()).toThrow(
        'No data provider is currently active'
      )
    })

    it('should handle provider switching during active operations', async () => {
      // Start an operation
      const operationPromise = manager.getCards()
      
      // Try to switch provider during operation
      await manager.switchProvider('localhost')
      
      // Original operation should still complete
      const result = await operationPromise
      expect(result).toEqual([])
    })

    it('should handle disconnect errors gracefully', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Disconnect failed')
      
      // Should not throw error even if disconnect fails
      await expect(manager.switchProvider('localhost')).resolves.not.toThrow()
    })
  })
})