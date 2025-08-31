'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '@/types/card'
import { DataProviderManager } from '@/providers/DataProviderManager'
import { LocalStorageProvider } from '@/providers/LocalStorageProvider'
import { useSettings } from '@/contexts/SettingsContext'
import { ProviderError, DataProviderError } from '@/providers/types'

export const useCards = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [includeKnownWords, setIncludeKnownWords] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Loading states for provider operations
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitchingProvider, setIsSwitchingProvider] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { dataProvider, mongoConfig, isValidConfiguration } = useSettings()

  // Initialize DataProviderManager with error handling
  const providerManager = useMemo(() => {
    const manager = new DataProviderManager((error: ProviderError) => {
      console.error('Provider error:', error)
      setError(error.message)
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    })

    // Register providers
    manager.registerProvider('localhost', new LocalStorageProvider())
    
    // Only register MongoDB if configuration is valid and we're in a server environment
    if (isValidConfiguration('mongodb') && typeof window === 'undefined') {
      // Dynamic import for MongoDB provider to avoid client-side bundling issues
      import('@/providers/MongoDBProvider').then(({ MongoDBProvider }) => {
        manager.registerProvider('mongodb', new MongoDBProvider(mongoConfig))
      }).catch(error => {
        console.error('Failed to load MongoDB provider:', error)
        setError('MongoDB provider is not available in this environment')
      })
    }

    return manager
  }, [mongoConfig, isValidConfiguration])

  // Load cards from current provider
  const loadCards = useCallback(async () => {
    if (!mounted) return

    setIsLoading(true)
    setError(null)

    try {
      const loadedCards = await providerManager.getCards()
      setCards(loadedCards)
    } catch (error) {
      console.error('Failed to load cards:', error)
      const errorMessage = error instanceof ProviderError 
        ? error.message 
        : 'Failed to load cards'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [mounted, providerManager])

  // Switch provider when dataProvider setting changes
  useEffect(() => {
    if (!mounted) return

    const switchProvider = async () => {
      setIsSwitchingProvider(true)
      setError(null)

      try {
        // Register MongoDB provider if switching to it and config is valid
        if (dataProvider === 'mongodb' && isValidConfiguration('mongodb')) {
          if (typeof window === 'undefined') {
            // Server-side: dynamically import MongoDB provider
            const { MongoDBProvider } = await import('@/providers/MongoDBProvider')
            providerManager.registerProvider('mongodb', new MongoDBProvider(mongoConfig))
          } else {
            // Client-side: MongoDB is not available
            throw new ProviderError(
              DataProviderError.PROVIDER_UNAVAILABLE,
              'MongoDB provider is not available in the browser. Please use localhost storage.',
              'mongodb'
            )
          }
        }

        await providerManager.switchProvider(dataProvider)
        await loadCards()
      } catch (error) {
        console.error('Failed to switch provider:', error)
        const errorMessage = error instanceof ProviderError 
          ? error.message 
          : `Failed to switch to ${dataProvider} provider`
        setError(errorMessage)
      } finally {
        setIsSwitchingProvider(false)
      }
    }

    switchProvider()
  }, [dataProvider, mongoConfig, isValidConfiguration, mounted, providerManager, loadCards])

  // Initial load
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load cards when mounted
  useEffect(() => {
    if (mounted) {
      loadCards()
    }
  }, [mounted, loadCards])

  // Save cards using current provider
  const saveCards = useCallback(async (newCards: Card[]) => {
    setIsLoading(true)
    setError(null)

    try {
      await providerManager.saveCards(newCards)
      setCards(newCards)
    } catch (error) {
      console.error('Failed to save cards:', error)
      const errorMessage = error instanceof ProviderError 
        ? error.message 
        : 'Failed to save cards'
      setError(errorMessage)
      throw error // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false)
    }
  }, [providerManager])

  const importCards = useCallback(async (jsonData: Record<string, string> | Array<{word: string, translation: string, example?: string, exampleTranslation?: string}>) => {
    const timestamp = new Date().getTime()
    let newCards: Card[]

    if (Array.isArray(jsonData)) {
      // Handle array format with full card objects
      newCards = jsonData.map((cardData, index) => ({
        id: `card-${timestamp}-${index}`,
        word: cardData.word,
        translation: cardData.translation,
        example: cardData.example,
        exampleTranslation: cardData.exampleTranslation,
        isKnown: false,
        createdAt: new Date(),
      }))
    } else {
      // Handle simple object format (backward compatibility)
      newCards = Object.entries(jsonData).map(([word, translation], index) => ({
        id: `card-${timestamp}-${index}`,
        word: word,
        translation: translation,
        isKnown: false,
        createdAt: new Date(),
      }))
    }

    const updatedCards = [...cards, ...newCards]
    await saveCards(updatedCards)
  }, [cards, saveCards])

  const markAsKnown = useCallback(async (cardId: string) => {
    const updatedCards = cards.map(card =>
      card.id === cardId
        ? { ...card, isKnown: true, lastReviewed: new Date() }
        : card
    )
    await saveCards(updatedCards)
  }, [cards, saveCards])

  const markAsUnknown = useCallback(async (cardId: string) => {
    const updatedCards = cards.map(card =>
      card.id === cardId
        ? { ...card, isKnown: false, lastReviewed: new Date() }
        : card
    )
    await saveCards(updatedCards)
  }, [cards, saveCards])

  const shuffleArray = useCallback((array: Card[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const getActiveCards = useCallback(() => {
    const activeCards = includeKnownWords 
      ? cards 
      : cards.filter(card => !card.isKnown)
    return isShuffled ? shuffleArray(activeCards) : activeCards
  }, [cards, includeKnownWords, isShuffled, shuffleArray])

  const toggleShuffle = useCallback(() => {
    setIsShuffled(!isShuffled)
    setCurrentCardIndex(0) // Reset to first card when toggling shuffle
  }, [isShuffled])

  const toggleIncludeKnownWords = useCallback(() => {
    setIncludeKnownWords(!includeKnownWords)
    setCurrentCardIndex(0) // Reset to first card when toggling mode
  }, [includeKnownWords])

  const resetProgress = useCallback(async () => {
    const resetCards = cards.map(card => ({ ...card, isKnown: false }))
    await saveCards(resetCards)
    setCurrentCardIndex(0)
  }, [cards, saveCards])

  const exportProgress = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCards: cards.length,
      knownCards: cards.filter(card => card.isKnown).length,
      cards: cards
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `english-cards-progress-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importProgress = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string
          const importData = JSON.parse(result)
          
          // Validate the import data structure
          if (!importData.cards || !Array.isArray(importData.cards)) {
            throw new Error('Invalid progress file format')
          }
          
          // Convert date strings back to Date objects
          const importedCards = importData.cards.map((card: any) => ({
            ...card,
            createdAt: new Date(card.createdAt),
            lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
          }))
          
          // Replace current cards with imported ones
          await saveCards(importedCards)
          setCurrentCardIndex(0)
          resolve()
        } catch (error) {
          reject(new Error('Failed to import progress file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [saveCards])

  const deleteCard = useCallback(async (cardId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await providerManager.deleteCard(cardId)
      
      // Update local state
      const updatedCards = cards.filter(card => card.id !== cardId)
      setCards(updatedCards)
      
      // Adjust current card index if necessary
      // Calculate active cards based on updated cards
      const activeCards = includeKnownWords 
        ? updatedCards 
        : updatedCards.filter(card => !card.isKnown)
      
      if (currentCardIndex >= activeCards.length && activeCards.length > 0) {
        setCurrentCardIndex(activeCards.length - 1)
      } else if (activeCards.length === 0) {
        setCurrentCardIndex(0)
      }
    } catch (error) {
      console.error('Failed to delete card:', error)
      const errorMessage = error instanceof ProviderError 
        ? error.message 
        : 'Failed to delete card'
      setError(errorMessage)
      throw error // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false)
    }
  }, [providerManager, cards, currentCardIndex, includeKnownWords])

  // Add a new card using the provider
  const addCard = useCallback(async (cardData: Omit<Card, 'id' | 'createdAt'>) => {
    const newCard: Card = {
      ...cardData,
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }

    setIsLoading(true)
    setError(null)

    try {
      await providerManager.saveCard(newCard)
      setCards(prevCards => [...prevCards, newCard])
      return newCard
    } catch (error) {
      console.error('Failed to add card:', error)
      const errorMessage = error instanceof ProviderError 
        ? error.message 
        : 'Failed to add card'
      setError(errorMessage)
      throw error // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false)
    }
  }, [providerManager])

  // Update an existing card using the provider
  const updateCard = useCallback(async (updatedCard: Card) => {
    setIsLoading(true)
    setError(null)

    try {
      await providerManager.updateCard(updatedCard)
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === updatedCard.id ? updatedCard : card
        )
      )
      return updatedCard
    } catch (error) {
      console.error('Failed to update card:', error)
      const errorMessage = error instanceof ProviderError 
        ? error.message 
        : 'Failed to update card'
      setError(errorMessage)
      throw error // Re-throw to allow caller to handle
    } finally {
      setIsLoading(false)
    }
  }, [providerManager])

  // Add a function to manually refresh cards from provider
  const refreshCards = useCallback(async () => {
    await loadCards()
  }, [loadCards])

  // Add function to get current provider info
  const getProviderInfo = useCallback(() => {
    try {
      return {
        name: providerManager.getProviderName(),
        isAvailable: providerManager.isAvailable(),
        hasFallback: providerManager.hasFallbackProvider(),
        fallbackName: providerManager.getFallbackProviderName()
      }
    } catch {
      return {
        name: 'unknown',
        isAvailable: Promise.resolve(false),
        hasFallback: false,
        fallbackName: null
      }
    }
  }, [providerManager])

  return {
    // Original interface (maintained for backward compatibility)
    cards,
    currentCardIndex,
    setCurrentCardIndex,
    importCards,
    markAsKnown,
    markAsUnknown,
    getActiveCards,
    resetProgress,
    isShuffled,
    toggleShuffle,
    includeKnownWords,
    toggleIncludeKnownWords,
    exportProgress,
    importProgress,
    deleteCard,
    
    // New provider-related functionality
    addCard,
    updateCard,
    isLoading,
    isSwitchingProvider,
    error,
    refreshCards,
    getProviderInfo,
    
    // Provider manager access for advanced use cases
    providerManager
  }
}