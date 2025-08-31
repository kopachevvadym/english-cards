import { Card } from '../types/card'
import { IDataProvider, ProviderError, DataProviderError } from './types'

/**
 * LocalStorage implementation of the IDataProvider interface
 * Handles all card data operations using browser localStorage
 */
export class LocalStorageProvider implements IDataProvider {
  private readonly storageKey = 'english-cards'
  private readonly providerName = 'localhost'

  /**
   * Retrieve all cards from localStorage
   */
  async getCards(): Promise<Card[]> {
    try {
      const savedCards = localStorage.getItem(this.storageKey)
      if (!savedCards) {
        return []
      }

      const parsedCards = JSON.parse(savedCards)
      
      // Validate that we have an array
      if (!Array.isArray(parsedCards)) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          'Invalid data format: expected array',
          this.providerName
        )
      }

      // Convert date strings back to Date objects and validate card structure
      return parsedCards.map((card: any) => this.validateAndTransformCard(card))
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      if (error instanceof SyntaxError) {
        // Clear corrupted data and return empty array
        localStorage.removeItem(this.storageKey)
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          'Corrupted data detected and cleared. Starting with empty card collection.',
          this.providerName,
          error
        )
      }
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Failed to retrieve cards from localStorage',
        this.providerName,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Save a single card to localStorage
   */
  async saveCard(card: Card): Promise<Card> {
    try {
      this.validateCard(card)
      const cards = await this.getCards()
      
      // Check if card already exists
      const existingIndex = cards.findIndex(c => c.id === card.id)
      if (existingIndex >= 0) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          `Card with id ${card.id} already exists. Use updateCard instead.`,
          this.providerName
        )
      }

      const updatedCards = [...cards, card]
      await this.saveCards(updatedCards)
      return card
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Failed to save card to localStorage',
        this.providerName,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Update an existing card in localStorage
   */
  async updateCard(card: Card): Promise<Card> {
    try {
      this.validateCard(card)
      const cards = await this.getCards()
      
      const existingIndex = cards.findIndex(c => c.id === card.id)
      if (existingIndex === -1) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          `Card with id ${card.id} not found`,
          this.providerName
        )
      }

      const updatedCards = [...cards]
      updatedCards[existingIndex] = card
      await this.saveCards(updatedCards)
      return card
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Failed to update card in localStorage',
        this.providerName,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Delete a card from localStorage
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      if (!cardId || typeof cardId !== 'string') {
        throw new Error('Invalid card ID provided')
      }

      const cards = await this.getCards()
      const filteredCards = cards.filter(card => card.id !== cardId)
      
      if (filteredCards.length === cards.length) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          `Card with id ${cardId} not found`,
          this.providerName
        )
      }

      await this.saveCards(filteredCards)
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Failed to delete card from localStorage',
        this.providerName,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Save multiple cards to localStorage (replaces all existing cards)
   */
  async saveCards(cards: Card[]): Promise<Card[]> {
    try {
      if (!Array.isArray(cards)) {
        throw new Error('Cards must be an array')
      }

      // Validate all cards before saving
      cards.forEach(card => this.validateCard(card))

      localStorage.setItem(this.storageKey, JSON.stringify(cards))
      return cards
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          'localStorage quota exceeded. Please free up space or use a different storage provider.',
          this.providerName,
          error
        )
      }
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Failed to save cards to localStorage',
        this.providerName,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return this.providerName
  }

  /**
   * Check if localStorage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test localStorage availability
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Connect to localStorage (no-op for localStorage)
   */
  async connect(): Promise<void> {
    const available = await this.isAvailable()
    if (!available) {
      throw new ProviderError(
        DataProviderError.PROVIDER_UNAVAILABLE,
        'localStorage is not available in this environment',
        this.providerName
      )
    }
  }

  /**
   * Disconnect from localStorage (no-op for localStorage)
   */
  async disconnect(): Promise<void> {
    // No cleanup needed for localStorage
  }

  /**
   * Validate card structure and required fields
   */
  private validateCard(card: Card): void {
    if (!card || typeof card !== 'object') {
      throw new Error('Card must be an object')
    }

    const requiredFields = ['id', 'word', 'translation', 'isKnown', 'createdAt']
    for (const field of requiredFields) {
      if (!(field in card)) {
        throw new Error(`Card is missing required field: ${field}`)
      }
    }

    if (typeof card.id !== 'string' || card.id.trim() === '') {
      throw new Error('Card id must be a non-empty string')
    }

    if (typeof card.word !== 'string' || card.word.trim() === '') {
      throw new Error('Card word must be a non-empty string')
    }

    if (typeof card.translation !== 'string' || card.translation.trim() === '') {
      throw new Error('Card translation must be a non-empty string')
    }

    if (typeof card.isKnown !== 'boolean') {
      throw new Error('Card isKnown must be a boolean')
    }

    if (!(card.createdAt instanceof Date) || isNaN(card.createdAt.getTime())) {
      throw new Error('Card createdAt must be a valid Date')
    }

    // Validate optional fields
    if (card.lastReviewed !== undefined) {
      if (!(card.lastReviewed instanceof Date) || isNaN(card.lastReviewed.getTime())) {
        throw new Error('Card lastReviewed must be a valid Date or undefined')
      }
    }

    if (card.example !== undefined && typeof card.example !== 'string') {
      throw new Error('Card example must be a string or undefined')
    }

    if (card.exampleTranslation !== undefined && typeof card.exampleTranslation !== 'string') {
      throw new Error('Card exampleTranslation must be a string or undefined')
    }
  }

  /**
   * Validate and transform card data from storage
   */
  private validateAndTransformCard(cardData: any): Card {
    if (!cardData || typeof cardData !== 'object') {
      throw new Error('Invalid card data')
    }

    // Transform date strings to Date objects
    const card: Card = {
      ...cardData,
      createdAt: new Date(cardData.createdAt),
      lastReviewed: cardData.lastReviewed ? new Date(cardData.lastReviewed) : undefined,
    }

    // Validate the transformed card
    this.validateCard(card)
    return card
  }
}