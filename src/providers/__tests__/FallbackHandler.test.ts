import { FallbackHandler, ErrorNotification, RetryConfig } from '../FallbackHandler'
import { IDataProvider, ProviderError, DataProviderError } from '../types'
import { Card } from '../../types/card'

// Mock provider implementation for testing
class MockProvider implements IDataProvider {
  private shouldFail: boolean = false
  private failureType: DataProviderError = DataProviderError.CONNECTION_FAILED
  private failureMessage: string = 'Mock failure'
  private callCount: number = 0

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
  }

  async disconnect(): Promise<void> {
    this.callCount++
    // Disconnect should not fail in tests
  }
}

describe('FallbackHandler', () => {
  let fallbackHandler: FallbackHandler
  let primaryProvider: MockProvider
  let fallbackProvider: MockProvider
  let notifications: ErrorNotification[]

  const mockNotificationHandler = (notification: ErrorNotification) => {
    notifications.push(notification)
  }

  beforeEach(() => {
    primaryProvider = new MockProvider('primary')
    fallbackProvider = new MockProvider('fallback')
    notifications = []
    
    fallbackHandler = new FallbackHandler(
      {
        maxRetries: 2,
        baseDelayMs: 10, // Short delays for testing
        maxDelayMs: 100,
        backoffMultiplier: 2
      },
      mockNotificationHandler
    )
  })

  describe('executeWithFallback', () => {
    it('should execute operation on primary provider when successful', async () => {
      const result = await fallbackHandler.executeWithFallback(
        primaryProvider,
        fallbackProvider,
        (provider) => provider.getCards(),
        'getCards'
      )

      expect(result).toEqual([])
      expect(primaryProvider.getCallCount()).toBe(1)
      expect(fallbackProvider.getCallCount()).toBe(0)
      expect(notifications).toHaveLength(0)
    })

    it('should fallback to secondary provider when primary fails', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Primary failed')

      const result = await fallbackHandler.executeWithFallback(
        primaryProvider,
        fallbackProvider,
        (provider) => provider.getCards(),
        'getCards'
      )

      expect(result).toEqual([])
      expect(primaryProvider.getCallCount()).toBe(3) // 1 initial + 2 retries
      expect(fallbackProvider.getCallCount()).toBe(1)
      expect(notifications).toHaveLength(4) // 2 retry warnings + 1 primary error + 1 fallback success
    })

    it('should throw error when both providers fail', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Primary failed')
      fallbackProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Fallback failed')

      await expect(
        fallbackHandler.executeWithFallback(
          primaryProvider,
          fallbackProvider,
          (provider) => provider.getCards(),
          'getCards'
        )
      ).rejects.toThrow('Primary failed')

      expect(notifications).toHaveLength(6) // 2 retry warnings for primary + 1 primary error + 2 retry warnings for fallback + 1 all providers failed
    })

    it('should throw error when no fallback provider is available', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Primary failed')

      await expect(
        fallbackHandler.executeWithFallback(
          primaryProvider,
          null,
          (provider) => provider.getCards(),
          'getCards'
        )
      ).rejects.toThrow('Primary failed')

      expect(primaryProvider.getCallCount()).toBe(3) // 1 initial + 2 retries
      expect(notifications).toHaveLength(3) // 2 retry warnings + 1 primary error
    })

    it('should not retry on non-retryable errors but should try fallback', async () => {
      primaryProvider.setFailure(true, DataProviderError.INVALID_CONFIGURATION, 'Invalid config')

      const result = await fallbackHandler.executeWithFallback(
        primaryProvider,
        fallbackProvider,
        (provider) => provider.getCards(),
        'getCards'
      )

      expect(result).toEqual([]) // Should succeed with fallback
      expect(primaryProvider.getCallCount()).toBe(1) // No retries
      expect(fallbackProvider.getCallCount()).toBe(1) // Should try fallback
    })
  })

  describe('executeWithRetry', () => {
    it('should succeed on first attempt when operation succeeds', async () => {
      const result = await fallbackHandler.executeWithRetry(
        () => primaryProvider.getCards(),
        'primary',
        'getCards'
      )

      expect(result).toEqual([])
      expect(primaryProvider.getCallCount()).toBe(1)
      expect(notifications).toHaveLength(0)
    })

    it('should retry on retryable errors', async () => {
      let attemptCount = 0
      const operation = async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new ProviderError(DataProviderError.CONNECTION_FAILED, 'Temporary failure', 'primary')
        }
        return []
      }

      const result = await fallbackHandler.executeWithRetry(operation, 'primary', 'getCards')

      expect(result).toEqual([])
      expect(attemptCount).toBe(3)
      expect(notifications).toHaveLength(2) // 2 retry warnings
    })

    it('should not retry on non-retryable errors', async () => {
      const operation = async () => {
        throw new ProviderError(DataProviderError.INVALID_CONFIGURATION, 'Invalid config', 'primary')
      }

      await expect(
        fallbackHandler.executeWithRetry(operation, 'primary', 'getCards')
      ).rejects.toThrow('Invalid config')

      expect(notifications).toHaveLength(0) // No retry warnings
    })

    it('should respect max retry limit', async () => {
      const operation = async () => {
        throw new ProviderError(DataProviderError.CONNECTION_FAILED, 'Always fails', 'primary')
      }

      await expect(
        fallbackHandler.executeWithRetry(operation, 'primary', 'getCards')
      ).rejects.toThrow('Always fails')

      expect(notifications).toHaveLength(2) // 2 retry warnings (maxRetries = 2)
    })
  })

  describe('attemptProviderRecovery', () => {
    it('should successfully recover a provider', async () => {
      // Initially failing provider
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Connection failed')
      
      // Simulate recovery after first attempt
      setTimeout(() => {
        primaryProvider.setFailure(false)
      }, 50)

      const recovered = await fallbackHandler.attemptProviderRecovery(primaryProvider, 3)

      expect(recovered).toBe(true)
      expect(notifications.some(n => n.title === 'Provider Recovered')).toBe(true)
    })

    it('should fail to recover a persistently failing provider', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Persistent failure')

      const recovered = await fallbackHandler.attemptProviderRecovery(primaryProvider, 2)

      expect(recovered).toBe(false)
      expect(notifications.some(n => n.title === 'Provider Recovery Failed')).toBe(true)
    })
  })

  describe('error classification', () => {
    it('should identify retryable connection errors', async () => {
      const retryableErrors = [
        DataProviderError.CONNECTION_FAILED,
        DataProviderError.PROVIDER_UNAVAILABLE
      ]

      for (const errorType of retryableErrors) {
        primaryProvider.resetCallCount()
        primaryProvider.setFailure(true, errorType, 'Test error')

        await expect(
          fallbackHandler.executeWithRetry(
            () => primaryProvider.getCards(),
            'primary',
            'getCards'
          )
        ).rejects.toThrow()

        expect(primaryProvider.getCallCount()).toBe(3) // 1 initial + 2 retries
      }
    })

    it('should identify non-retryable configuration errors', async () => {
      primaryProvider.setFailure(true, DataProviderError.INVALID_CONFIGURATION, 'Invalid config')

      await expect(
        fallbackHandler.executeWithRetry(
          () => primaryProvider.getCards(),
          'primary',
          'getCards'
        )
      ).rejects.toThrow()

      expect(primaryProvider.getCallCount()).toBe(1) // No retries
    })

    it('should identify retryable operation errors with network keywords', async () => {
      const networkErrors = ['timeout', 'network error', 'connection reset', 'ECONNRESET', 'ENOTFOUND']

      for (const errorMsg of networkErrors) {
        primaryProvider.resetCallCount()
        notifications.length = 0 // Clear notifications for each test
        
        // Create a ProviderError with the network error as originalError
        const networkError = new Error(errorMsg)
        const providerError = new ProviderError(
          DataProviderError.OPERATION_FAILED,
          errorMsg,
          'primary',
          networkError
        )

        const operation = async () => {
          throw providerError
        }

        await expect(
          fallbackHandler.executeWithRetry(operation, 'primary', 'getCards')
        ).rejects.toThrow()

        expect(notifications.filter(n => n.type === 'warning').length).toBe(2) // Should retry network-related errors
      }
    })
  })

  describe('configuration', () => {
    it('should allow updating retry configuration', () => {
      const newConfig: Partial<RetryConfig> = {
        maxRetries: 5,
        baseDelayMs: 500
      }

      fallbackHandler.updateRetryConfig(newConfig)
      const currentConfig = fallbackHandler.getRetryConfig()

      expect(currentConfig.maxRetries).toBe(5)
      expect(currentConfig.baseDelayMs).toBe(500)
      expect(currentConfig.backoffMultiplier).toBe(2) // Should keep existing values
    })

    it('should allow updating notification handler', async () => {
      const newNotifications: ErrorNotification[] = []
      const newHandler = (notification: ErrorNotification) => {
        newNotifications.push(notification)
      }

      fallbackHandler.updateNotificationHandler(newHandler)

      // Trigger an error to test new handler
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Test error')

      await expect(
        fallbackHandler.executeWithRetry(
          () => primaryProvider.getCards(),
          'primary',
          'getCards'
        )
      ).rejects.toThrow()

      // Original notifications array should be empty, new one should have notifications
      expect(notifications).toHaveLength(0)
      expect(newNotifications.length).toBeGreaterThan(0)
    })
  })

  describe('notification types', () => {
    it('should generate error notifications for failures', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Connection failed')

      await expect(
        fallbackHandler.executeWithFallback(
          primaryProvider,
          null,
          (provider) => provider.getCards(),
          'getCards'
        )
      ).rejects.toThrow()

      const errorNotifications = notifications.filter(n => n.type === 'error')
      expect(errorNotifications.length).toBeGreaterThan(0)
      expect(errorNotifications[0].title).toContain('Provider Failed')
    })

    it('should generate warning notifications for retries', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Connection failed')

      await expect(
        fallbackHandler.executeWithRetry(
          () => primaryProvider.getCards(),
          'primary',
          'getCards'
        )
      ).rejects.toThrow()

      const warningNotifications = notifications.filter(n => n.type === 'warning')
      expect(warningNotifications.length).toBe(2) // 2 retry attempts
      expect(warningNotifications[0].title).toBe('Retrying Operation')
    })

    it('should generate info notifications for recovery', async () => {
      primaryProvider.setFailure(true, DataProviderError.CONNECTION_FAILED, 'Connection failed')
      
      // Simulate recovery
      setTimeout(() => {
        primaryProvider.setFailure(false)
      }, 50)

      const recovered = await fallbackHandler.attemptProviderRecovery(primaryProvider, 3)

      expect(recovered).toBe(true)
      const infoNotifications = notifications.filter(n => n.type === 'info')
      expect(infoNotifications.length).toBe(1)
      expect(infoNotifications[0].title).toBe('Provider Recovered')
    })
  })
})