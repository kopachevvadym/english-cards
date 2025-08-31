import { ProviderError, DataProviderError } from './types'

/**
 * Utility class for handling fallback operations between providers
 */
export class FallbackHandler {
  /**
   * Execute an operation with automatic fallback on failure
   */
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    errorHandler: (error: Error) => void,
    retryAttempts: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    // Try primary operation with retries
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await primaryOperation()
      } catch (error) {
        lastError = error as Error
        
        // If it's a connection error and we have more attempts, wait and retry
        if (
          error instanceof ProviderError && 
          error.type === DataProviderError.CONNECTION_FAILED &&
          attempt < retryAttempts
        ) {
          await this.delay(retryDelay * attempt) // Exponential backoff
          continue
        }
        
        // For other errors or final attempt, break and try fallback
        break
      }
    }

    // Primary operation failed, try fallback
    try {
      console.warn('Primary operation failed, attempting fallback')
      errorHandler(lastError!)
      return await fallbackOperation()
    } catch (fallbackError) {
      // Both operations failed
      const combinedError = new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Both primary and fallback operations failed. Primary: ${lastError?.message}, Fallback: ${(fallbackError as Error).message}`,
        'fallback-handler',
        fallbackError as Error
      )
      
      errorHandler(combinedError)
      throw combinedError
    }
  }

  /**
   * Utility method for creating delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: Error): boolean {
    if (error instanceof ProviderError) {
      return error.type === DataProviderError.CONNECTION_FAILED
    }
    
    // Check for common network/connection error patterns
    const retryablePatterns = [
      'network',
      'timeout',
      'connection',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ]
    
    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    )
  }
}