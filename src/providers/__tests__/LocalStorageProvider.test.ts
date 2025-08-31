import { LocalStorageProvider } from '../LocalStorageProvider'
import { Card } from '../../types/card'
import { ProviderError, DataProviderError } from '../types'

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}

  const mock = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get store() { return store },
    set store(newStore: Record<string, string>) { store = newStore }
  }

  return mock
}

const localStorageMock = createLocalStorageMock()

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider
  let mockCard: Card

  beforeEach(() => {
    // Reset the store and clear all mocks
    localStorageMock.store = {}
    localStorageMock.clear()
    jest.clearAllMocks()
    
    // Reset all mock implementations to their default behavior
    localStorageMock.getItem.mockImplementation((key: string) => localStorageMock.store[key] || null)
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store[key] = value
    })
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete localStorageMock.store[key]
    })
    
    provider = new LocalStorageProvider()

    mockCard = {
      id: 'test-card-1',
      word: 'hello',
      translation: 'hola',
      isKnown: false,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastReviewed: new Date('2023-01-02T00:00:00.000Z'),
      example: 'Hello, world!',
      exampleTranslation: '¡Hola, mundo!',
    }
  })

  describe('getProviderName', () => {
    it('should return localhost', () => {
      expect(provider.getProviderName()).toBe('localhost')
    })
  })

  describe('isAvailable', () => {
    it('should return true when localStorage is available', async () => {
      const result = await provider.isAvailable()
      expect(result).toBe(true)
    })

    it('should return false when localStorage throws an error', async () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('localStorage not available')
      })

      const result = await provider.isAvailable()
      expect(result).toBe(false)
    })
  })

  describe('connect', () => {
    it('should connect successfully when localStorage is available', async () => {
      await expect(provider.connect()).resolves.toBeUndefined()
    })

    it('should throw ProviderError when localStorage is not available', async () => {
      // Mock both setItem and removeItem to throw errors
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      await expect(provider.connect()).rejects.toThrow(ProviderError)
      await expect(provider.connect()).rejects.toThrow('localStorage is not available')
      
      // Reset mocks
      localStorageMock.setItem.mockReset()
      localStorageMock.removeItem.mockReset()
    })
  })

  describe('disconnect', () => {
    it('should disconnect without errors', async () => {
      await expect(provider.disconnect()).resolves.toBeUndefined()
    })
  })

  describe('getCards', () => {
    it('should return empty array when no cards are stored', async () => {
      const cards = await provider.getCards()
      expect(cards).toEqual([])
    })

    it('should return stored cards with proper date conversion', async () => {
      const storedCards = [mockCard]
      localStorageMock.store['english-cards'] = JSON.stringify(storedCards)

      const cards = await provider.getCards()
      expect(cards).toHaveLength(1)
      expect(cards[0]).toEqual(mockCard)
      expect(cards[0].createdAt).toBeInstanceOf(Date)
      expect(cards[0].lastReviewed).toBeInstanceOf(Date)
    })

    it('should handle cards without optional fields', async () => {
      const minimalCard = {
        id: 'minimal-card',
        word: 'test',
        translation: 'prueba',
        isKnown: true,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
      }
      localStorageMock.store['english-cards'] = JSON.stringify([minimalCard])

      const cards = await provider.getCards()
      expect(cards).toHaveLength(1)
      expect(cards[0].lastReviewed).toBeUndefined()
      expect(cards[0].example).toBeUndefined()
      expect(cards[0].exampleTranslation).toBeUndefined()
    })

    it('should throw ProviderError and clear corrupted data', async () => {
      localStorageMock.store['english-cards'] = 'invalid json'

      await expect(provider.getCards()).rejects.toThrow(ProviderError)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('english-cards')
    })

    it('should throw ProviderError when data is not an array', async () => {
      localStorageMock.store['english-cards'] = JSON.stringify({ not: 'array' })

      await expect(provider.getCards()).rejects.toThrow(ProviderError)
      await expect(provider.getCards()).rejects.toThrow('Invalid data format: expected array')
    })

    it('should throw ProviderError when card data is invalid', async () => {
      const invalidCard = { id: 'test', word: 'hello' } // missing required fields
      localStorageMock.store['english-cards'] = JSON.stringify([invalidCard])

      await expect(provider.getCards()).rejects.toThrow(ProviderError)
    })
  })

  describe('saveCard', () => {
    it('should save a new card successfully', async () => {
      const result = await provider.saveCard(mockCard)
      
      expect(result).toEqual(mockCard)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'english-cards',
        JSON.stringify([mockCard])
      )
    })

    it('should add card to existing cards', async () => {
      const existingCard = { ...mockCard, id: 'existing-card' }
      localStorageMock.store['english-cards'] = JSON.stringify([existingCard])

      const result = await provider.saveCard(mockCard)
      
      expect(result).toEqual(mockCard)
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
        'english-cards',
        JSON.stringify([existingCard, mockCard])
      )
    })

    it('should throw ProviderError when card already exists', async () => {
      localStorageMock.store['english-cards'] = JSON.stringify([mockCard])

      await expect(provider.saveCard(mockCard)).rejects.toThrow(ProviderError)
      await expect(provider.saveCard(mockCard)).rejects.toThrow('already exists')
    })

    it('should throw ProviderError for invalid card', async () => {
      const invalidCard = { ...mockCard, word: '' } as Card

      await expect(provider.saveCard(invalidCard)).rejects.toThrow(ProviderError)
    })
  })

  describe('updateCard', () => {
    it('should update an existing card successfully', async () => {
      // First save the card directly to mock storage
      localStorageMock.store['english-cards'] = JSON.stringify([mockCard])
      
      // Verify the card is there
      let cards = await provider.getCards()
      expect(cards).toHaveLength(1)
      expect(cards[0].id).toBe(mockCard.id)
      
      const updatedCard = { ...mockCard, word: 'updated', isKnown: true }
      
      const result = await provider.updateCard(updatedCard)
      
      expect(result).toEqual(updatedCard)
      
      // Check that setItem was called with the updated data
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'english-cards',
        JSON.stringify([updatedCard])
      )
      
      cards = await provider.getCards()
      expect(cards).toHaveLength(1)
      expect(cards[0]).toEqual(updatedCard)
    })

    it('should throw ProviderError when card does not exist', async () => {
      const nonExistentCard = { ...mockCard, id: 'non-existent' }

      await expect(provider.updateCard(nonExistentCard)).rejects.toThrow(ProviderError)
      await expect(provider.updateCard(nonExistentCard)).rejects.toThrow('not found')
    })

    it('should throw ProviderError for invalid card', async () => {
      const invalidCard = { ...mockCard, translation: '' } as Card

      await expect(provider.updateCard(invalidCard)).rejects.toThrow(ProviderError)
    })
  })

  describe('deleteCard', () => {
    it('should delete an existing card successfully', async () => {
      // First save the card directly to mock storage
      localStorageMock.store['english-cards'] = JSON.stringify([mockCard])
      
      // Verify the card is there
      let cards = await provider.getCards()
      expect(cards).toHaveLength(1)
      
      await provider.deleteCard(mockCard.id)
      
      // Check that setItem was called with empty array
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'english-cards',
        JSON.stringify([])
      )
      
      cards = await provider.getCards()
      expect(cards).toHaveLength(0)
    })

    it('should throw ProviderError when card does not exist', async () => {
      await expect(provider.deleteCard('non-existent')).rejects.toThrow(ProviderError)
      await expect(provider.deleteCard('non-existent')).rejects.toThrow('not found')
    })

    it('should throw ProviderError for invalid card ID', async () => {
      await expect(provider.deleteCard('')).rejects.toThrow(ProviderError)
      await expect(provider.deleteCard(null as any)).rejects.toThrow(ProviderError)
    })
  })

  describe('saveCards', () => {
    it('should save multiple cards successfully', async () => {
      const cards = [
        mockCard,
        { ...mockCard, id: 'card-2', word: 'goodbye', translation: 'adiós' }
      ]
      
      const result = await provider.saveCards(cards)
      
      expect(result).toEqual(cards)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'english-cards',
        JSON.stringify(cards)
      )
    })

    it('should save empty array successfully', async () => {
      const result = await provider.saveCards([])
      
      expect(result).toEqual([])
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'english-cards',
        JSON.stringify([])
      )
    })

    it('should throw ProviderError when input is not an array', async () => {
      await expect(provider.saveCards('not an array' as any)).rejects.toThrow(ProviderError)
    })

    it('should throw ProviderError when any card is invalid', async () => {
      const invalidCards = [
        mockCard,
        { ...mockCard, id: '', word: 'invalid' } // invalid card
      ]

      await expect(provider.saveCards(invalidCards)).rejects.toThrow(ProviderError)
    })

    it('should throw ProviderError when localStorage quota is exceeded', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      await expect(provider.saveCards([mockCard])).rejects.toThrow(ProviderError)
      await expect(provider.saveCards([mockCard])).rejects.toThrow('quota exceeded')
      
      // Reset mock
      localStorageMock.setItem.mockReset()
    })
  })

  describe('card validation', () => {
    it('should validate required fields', async () => {
      const invalidCards = [
        { ...mockCard, id: '' },
        { ...mockCard, word: '' },
        { ...mockCard, translation: '' },
        { ...mockCard, isKnown: 'not boolean' as any },
        { ...mockCard, createdAt: 'not a date' as any },
      ]

      for (const invalidCard of invalidCards) {
        await expect(provider.saveCard(invalidCard)).rejects.toThrow(ProviderError)
      }
    })

    it('should validate optional date fields', async () => {
      const invalidCard = { ...mockCard, lastReviewed: 'invalid date' as any }
      
      await expect(provider.saveCard(invalidCard)).rejects.toThrow(ProviderError)
    })

    it('should validate optional string fields', async () => {
      const invalidCards = [
        { ...mockCard, example: 123 as any },
        { ...mockCard, exampleTranslation: true as any },
      ]

      for (const invalidCard of invalidCards) {
        await expect(provider.saveCard(invalidCard)).rejects.toThrow(ProviderError)
      }
    })

    it('should accept valid cards with all optional fields', async () => {
      const validCard = {
        ...mockCard,
        lastReviewed: undefined,
        example: undefined,
        exampleTranslation: undefined,
      }

      await expect(provider.saveCard(validCard)).resolves.toEqual(validCard)
    })
  })

  describe('error handling', () => {
    it('should wrap localStorage errors in ProviderError', async () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error')
      })

      await expect(provider.getCards()).rejects.toThrow(ProviderError)
      
      try {
        await provider.getCards()
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError)
        expect((error as ProviderError).type).toBe(DataProviderError.OPERATION_FAILED)
        expect((error as ProviderError).provider).toBe('localhost')
        expect((error as ProviderError).originalError).toBeInstanceOf(Error)
      }
    })

    it('should preserve ProviderError when re-throwing', async () => {
      const existingCard = mockCard
      localStorageMock.setItem('english-cards', JSON.stringify([existingCard]))

      try {
        await provider.saveCard(mockCard) // Should throw because card exists
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError)
        expect((error as ProviderError).type).toBe(DataProviderError.OPERATION_FAILED)
      }
    })
  })
})