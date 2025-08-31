import { IDataProvider, ProviderError, DataProviderError } from './types'

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

/**
 * Error notification interface for user feedback
 */
export interface ErrorNotification {
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  provider: string
  timestamp: Date
  canRetry: boolean
  fallbackUsed?: boolean
}

/**
 * Error notification handler function type
 */
export type ErrorNotificationHandler = (notification: ErrorNotification) => void

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
}

/**
 * FallbackHandler provides graceful provider switching and error recovery
 * with automatic fallback from MongoDB to localStorage on connection failures
 */
export class FallbackHandler {
  private retryConfig: RetryConfig
  private notificationHandler: ErrorNotificationHandler

  constructor(
    retryConfig: Partial<RetryConfig> = {},
    notificationHandler: ErrorNotificationHandler = console.error
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    this.notificationHandler = notificationHandler
  }

  /**
   * Execute an operation with automatic fallback and retry logic
   */
  async executeWithFallback<T>(
    primaryProvider: IDataProvider,
    fallbackProvider: IDataProvider | null,
    operation: (provider: IDataProvider) => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    // First try the primary provider with retry logic
    try {
      return await this.executeWithRetry(
        () => operation(primaryProvider),
        primaryProvider.getProviderName(),
        operationName
      )
    } catch (primaryError) {
      const error = primaryError as ProviderError

      // Notify about primary provider failure
      this.notifyError({
        type: 'error',
        title: `${primaryProvider.getProviderName()} Provider Failed`,
        message: `Failed to execute ${operationName}: ${error.message}`,
        provider: primaryProvider.getProviderName(),
        timestamp: new Date(),
        canRetry: this.isRetryableError(error),
        fallbackUsed: fallbackProvider !== null
      })

      // If no fallback provider available, throw the original error
      if (!fallbackProvider) {
        throw error
      }

      // Try fallback provider
      try {
        const result = await this.executeWithRetry(
          () => operation(fallbackProvider),
          fallbackProvider.getProviderName(),
          operationName
        )

        // Notify about successful fallback
        this.notifyError({
          type: 'warning',
          title: 'Fallback Provider Used',
          message: `Successfully switched to ${fallbackProvider.getProviderName()} after ${primaryProvider.getProviderName()} failed`,
          provider: fallbackProvider.getProviderName(),
          timestamp: new Date(),
          canRetry: false,
          fallbackUsed: true
        })

        return result
      } catch (fallbackError) {
        // Both providers failed
        this.notifyError({
          type: 'error',
          title: 'All Providers Failed',
          message: `Both ${primaryProvider.getProviderName()} and ${fallbackProvider.getProviderName()} providers failed`,
          provider: 'none',
          timestamp: new Date(),
          canRetry: false,
          fallbackUsed: false
        })

        // Throw the original primary error as it's likely more relevant
        throw error
      }
    }
  }

  /**
   * Execute an operation with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    providerName: string,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null
    let delay = this.retryConfig.baseDelayMs

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        const providerError = error instanceof ProviderError 
          ? error 
          : new ProviderError(
              DataProviderError.OPERATION_FAILED,
              error instanceof Error ? error.message : 'Unknown error',
              providerName,
              error instanceof Error ? error : undefined
            )

        // Don't retry on non-retryable errors
        if (!this.isRetryableError(providerError)) {
          throw providerError
        }

        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          throw providerError
        }

        // Notify about retry attempt
        this.notifyError({
          type: 'warning',
          title: 'Retrying Operation',
          message: `${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms`,
          provider: providerName,
          timestamp: new Date(),
          canRetry: true
        })

        // Wait before retrying
        await this.delay(delay)

        // Exponential backoff with jitter
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier + Math.random() * 1000,
          this.retryConfig.maxDelayMs
        )
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('Unknown error during retry operation')
  }

  /**
   * Attempt to recover a failed provider
   */
  async attemptProviderRecovery(
    provider: IDataProvider,
    maxRecoveryAttempts: number = 3
  ): Promise<boolean> {
    for (let attempt = 0; attempt < maxRecoveryAttempts; attempt++) {
      try {
        // Disconnect and reconnect
        await provider.disconnect()
        await this.delay(1000 * (attempt + 1)) // Progressive delay
        await provider.connect()

        // Test if provider is available
        const isAvailable = await provider.isAvailable()
        if (isAvailable) {
          this.notifyError({
            type: 'info',
            title: 'Provider Recovered',
            message: `${provider.getProviderName()} provider has been successfully recovered`,
            provider: provider.getProviderName(),
            timestamp: new Date(),
            canRetry: false
          })
          return true
        }
      } catch (error) {
        const providerError = error instanceof ProviderError 
          ? error 
          : new ProviderError(
              DataProviderError.CONNECTION_FAILED,
              error instanceof Error ? error.message : 'Unknown error',
              provider.getProviderName(),
              error instanceof Error ? error : undefined
            )

        if (attempt === maxRecoveryAttempts - 1) {
          this.notifyError({
            type: 'error',
            title: 'Provider Recovery Failed',
            message: `Failed to recover ${provider.getProviderName()} provider after ${maxRecoveryAttempts} attempts`,
            provider: provider.getProviderName(),
            timestamp: new Date(),
            canRetry: true
          })
        }
      }
    }

    return false
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: ProviderError): boolean {
    switch (error.type) {
      case DataProviderError.CONNECTION_FAILED:
        return true
      case DataProviderError.OPERATION_FAILED:
        // Some operation failures might be transient (network issues, timeouts)
        // Check the original error for specific cases
        if (error.originalError) {
          const originalMessage = error.originalError.message.toLowerCase()
          return (
            originalMessage.includes('timeout') ||
            originalMessage.includes('network') ||
            originalMessage.includes('connection') ||
            originalMessage.includes('econnreset') ||
            originalMessage.includes('enotfound')
          )
        }
        return false
      case DataProviderError.PROVIDER_UNAVAILABLE:
        return true
      case DataProviderError.INVALID_CONFIGURATION:
        return false // Configuration errors are not retryable
      default:
        return false
    }
  }

  /**
   * Send error notification to the handler
   */
  private notifyError(notification: ErrorNotification): void {
    try {
      this.notificationHandler(notification)
    } catch (error) {
      // Fallback to console if notification handler fails
      console.error('Error notification handler failed:', error)
      console.error('Original notification:', notification)
    }
  }

  /**
   * Utility method for creating delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
  }

  /**
   * Update notification handler
   */
  updateNotificationHandler(handler: ErrorNotificationHandler): void {
    this.notificationHandler = handler
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig }
  }
}