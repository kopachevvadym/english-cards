import {
  loadSettings,
  saveSettings,
  clearSettings,
  isStorageAvailable,
  SETTINGS_STORAGE_KEY
} from '../settingsStorage'
import { AppSettings } from '../../providers/types'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('settingsStorage', () => {
  const defaultSettings: AppSettings = {
    selectedProvider: 'localhost',
    showTranslationFirst: false,
    providers: {
      localhost: {
        name: 'localhost',
        displayName: 'Local Storage',
        isDefault: true
      },
      mongodb: {
        name: 'mongodb',
        displayName: 'MongoDB',
        isDefault: false,
        config: {
          connectionString: '',
          databaseName: 'flashcards',
          collectionName: 'cards'
        }
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('loadSettings', () => {
    it('should return default settings when no stored settings exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = loadSettings(defaultSettings)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(defaultSettings)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY)
    })

    it('should load and merge valid stored settings', () => {
      const storedSettings: AppSettings = {
        selectedProvider: 'mongodb',
        showTranslationFirst: true,
        providers: {
          localhost: {
            name: 'localhost',
            displayName: 'Local Storage',
            isDefault: true
          },
          mongodb: {
            name: 'mongodb',
            displayName: 'MongoDB',
            isDefault: false,
            config: {
              connectionString: 'mongodb://test:27017',
              databaseName: 'testdb',
              collectionName: 'testcollection'
            }
          }
        }
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedSettings))

      const result = loadSettings(defaultSettings)

      expect(result.success).toBe(true)
      expect(result.data?.selectedProvider).toBe('mongodb')
      expect(result.data?.providers.mongodb.config.connectionString).toBe('mongodb://test:27017')
    })

    it('should return defaults when stored settings are invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const result = loadSettings(defaultSettings)

      expect(result.success).toBe(false)
      expect(result.data).toEqual(defaultSettings)
      expect(result.error).toBeDefined()
    })

    it('should return defaults when stored settings fail validation', () => {
      const invalidSettings = {
        selectedProvider: 'mongodb',
        providers: {
          mongodb: {
            name: 'mongodb',
            displayName: 'MongoDB',
            isDefault: false,
            config: {
              connectionString: '', // Invalid - empty
              databaseName: '',     // Invalid - empty
              collectionName: ''    // Invalid - empty
            }
          }
        }
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidSettings))

      const result = loadSettings(defaultSettings)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(defaultSettings)
      expect(result.error).toBeDefined()
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = loadSettings(defaultSettings)

      expect(result.success).toBe(false)
      expect(result.data).toEqual(defaultSettings)
      expect(result.error).toBe('Storage error')
    })
  })

  describe('saveSettings', () => {
    it('should save valid settings to localStorage', () => {
      const validSettings: AppSettings = {
        selectedProvider: 'mongodb',
        showTranslationFirst: false,
        providers: {
          localhost: {
            name: 'localhost',
            displayName: 'Local Storage',
            isDefault: true
          },
          mongodb: {
            name: 'mongodb',
            displayName: 'MongoDB',
            isDefault: false,
            config: {
              connectionString: 'mongodb://localhost:27017',
              databaseName: 'flashcards',
              collectionName: 'cards'
            }
          }
        }
      }

      const result = saveSettings(validSettings)

      expect(result.success).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(validSettings, null, 2)
      )
    })

    it('should reject invalid settings', () => {
      const invalidSettings: AppSettings = {
        selectedProvider: 'mongodb',
        showTranslationFirst: false,
        providers: {
          localhost: {
            name: 'localhost',
            displayName: 'Local Storage',
            isDefault: true
          },
          mongodb: {
            name: 'mongodb',
            displayName: 'MongoDB',
            isDefault: false,
            config: {
              connectionString: '', // Invalid
              databaseName: '',     // Invalid
              collectionName: ''    // Invalid
            }
          }
        }
      }

      const result = saveSettings(invalidSettings)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = saveSettings(defaultSettings)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage error')
    })
  })

  describe('clearSettings', () => {
    it('should clear settings from localStorage', () => {
      const result = clearSettings()

      expect(result.success).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY)
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = clearSettings()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage error')
    })
  })

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      // Reset mocks to default behavior
      mockLocalStorage.setItem.mockImplementation(() => {})
      mockLocalStorage.removeItem.mockImplementation(() => {})
      
      const result = isStorageAvailable()
      expect(result).toBe(true)
    })

    it('should return false when localStorage throws errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage not available')
      })

      const result = isStorageAvailable()
      expect(result).toBe(false)
    })
  })
})