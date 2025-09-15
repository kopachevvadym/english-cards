/**
 * Example usage of the FallbackHandler and DataProviderManager
 * This file demonstrates how to set up and use the fallback system
 */

import { DataProviderManager } from '../DataProviderManager'
import { LocalStorageProvider } from '../LocalStorageProvider'
import { MongoDBProvider } from '../MongoDBProvider'
import { FallbackHandler, ErrorNotification } from '../FallbackHandler'
import { ProviderError } from '../types'

// Example: Setting up providers with fallback
export function setupProvidersWithFallback() {
  // Create error notification handler
  const handleErrorNotification = (notification: ErrorNotification) => {
    console.log(`[${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`)
    
    // You could integrate this with your UI notification system
    // For example, show toast notifications, update status indicators, etc.
    if (notification.type === 'error') {
      // Show error toast
      console.error('Provider error occurred:', notification)
    } else if (notification.type === 'warning') {
      // Show warning toast
      console.warn('Provider warning:', notification)
    } else if (notification.type === 'info') {
      // Show info toast
      console.info('Provider info:', notification)
    }
  }

  // Create error handler for backward compatibility
  const handleProviderError = (error: ProviderError) => {
    console.error('Provider error:', error.message)
    // You could also integrate this with error reporting services
  }

  // Create data provider manager with fallback support
  const manager = new DataProviderManager(handleProviderError, handleErrorNotification)

  // Configure fallback handler with custom retry settings
  manager.getFallbackHandler().updateRetryConfig({
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  })

  // Register providers
  const localProvider = new LocalStorageProvider()
  const mongoProvider = new MongoDBProvider({
    connectionString: process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017',
    databaseName: 'flashcards',
    collectionName: 'cards'
  })

  manager.registerProvider('localhost', localProvider)
  manager.registerProvider('mongodb', mongoProvider)

  return manager
}

// Example: Using the manager with automatic fallback
export async function demonstrateFallbackUsage() {
  const manager = setupProvidersWithFallback()

  try {
    // Switch to MongoDB provider
    await manager.switchProvider('mongodb')
    console.log('Successfully switched to MongoDB provider')

    // Perform operations - these will automatically fallback to localStorage if MongoDB fails
    const cards = await manager.getCards()
    console.log(`Retrieved ${cards.length} cards`)

    // Save a new card
    const newCard = {
      id: 'demo-1',
      word: 'example',
      translation: 'ejemplo',
      isKnown: false,
      createdAt: new Date()
    }

    const savedCard = await manager.saveCard(newCard)
    console.log('Saved card:', savedCard.word)

  } catch (error) {
    console.error('Operation failed even with fallback:', error)
  }
}

// Example: Manual provider recovery
export async function demonstrateProviderRecovery() {
  const manager = setupProvidersWithFallback()

  // Attempt to recover MongoDB provider
  const recovered = await manager.attemptProviderRecovery('mongodb')
  
  if (recovered) {
    console.log('MongoDB provider recovered successfully')
    // Switch back to MongoDB if desired
    await manager.switchProvider('mongodb')
  } else {
    console.log('Failed to recover MongoDB provider, staying with fallback')
  }
}

// Example: Custom fallback handler usage
export async function demonstrateCustomFallbackHandler() {
  // Create a custom fallback handler with specific configuration
  const customFallbackHandler = new FallbackHandler(
    {
      maxRetries: 5,
      baseDelayMs: 500,
      maxDelayMs: 30000,
      backoffMultiplier: 1.5
    },
    (notification) => {
      // Custom notification handling
      console.log(`Custom handler: ${notification.title}`)
      
      // Example: Send to analytics or monitoring service
      if (notification.type === 'error') {
        // analytics.track('provider_error', { provider: notification.provider })
      }
    }
  )

  // Use the fallback handler directly
  const primaryProvider = new MongoDBProvider({
    connectionString: 'mongodb://localhost:27017',
    databaseName: 'flashcards',
    collectionName: 'cards'
  })

  const fallbackProvider = new LocalStorageProvider()

  try {
    const result = await customFallbackHandler.executeWithFallback(
      primaryProvider,
      fallbackProvider,
      (provider) => provider.getCards(),
      'getCards'
    )

    console.log('Operation completed with result:', result)
  } catch (error) {
    console.error('All providers failed:', error)
  }
}

// Example: Error notification types and handling
export function setupAdvancedErrorHandling() {
  const handleNotification = (notification: ErrorNotification) => {
    switch (notification.type) {
      case 'error':
        // Critical errors that need immediate attention
        if (notification.title.includes('All Providers Failed')) {
          // Show critical error modal
          console.error('CRITICAL: All data providers failed!')
          // Maybe redirect to offline mode or show maintenance page
        } else {
          // Regular error notification
          console.error(`Error: ${notification.message}`)
        }
        break

      case 'warning':
        // Warnings about fallbacks or retries
        if (notification.title === 'Fallback Provider Used') {
          // Show status indicator that we're using fallback
          console.warn('Using fallback provider')
          // Maybe show a banner: "Currently using local storage due to connection issues"
        } else if (notification.title === 'Retrying Operation') {
          // Show loading indicator with retry info
          console.warn(`Retrying... ${notification.message}`)
        }
        break

      case 'info':
        // Informational messages about recovery
        if (notification.title === 'Provider Recovered') {
          // Show success message
          console.info('Connection restored!')
          // Maybe show a banner: "Connection to cloud storage restored"
        }
        break
    }
  }

  return new DataProviderManager(console.error, handleNotification)
}

// Example usage in a React component context
export const fallbackManagerExample = {
  setupProvidersWithFallback,
  demonstrateFallbackUsage,
  demonstrateProviderRecovery,
  demonstrateCustomFallbackHandler,
  setupAdvancedErrorHandling
}