import {
  validateMongoConnectionString,
  validateDatabaseName,
  validateCollectionName,
  validateMongoDBConfig,
  validateProviderConfiguration,
  validateAppSettings
} from '../settingsValidation'
import { MongoDBConfig, AppSettings } from '../../providers/types'

describe('settingsValidation', () => {
  describe('validateMongoConnectionString', () => {
    it('should validate correct MongoDB connection strings', () => {
      const validStrings = [
        'mongodb://localhost:27017',
        'mongodb://user:pass@localhost:27017',
        'mongodb+srv://cluster.mongodb.net',
        'mongodb://localhost:27017/database'
      ]

      validStrings.forEach(connectionString => {
        const result = validateMongoConnectionString(connectionString)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid MongoDB connection strings', () => {
      const invalidStrings = [
        '',
        '   ',
        'http://localhost:27017',
        'localhost:27017',
        'mongodb://',
        'mongodb'
      ]

      invalidStrings.forEach(connectionString => {
        const result = validateMongoConnectionString(connectionString)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })
  })

  describe('validateDatabaseName', () => {
    it('should validate correct database names', () => {
      const validNames = [
        'flashcards',
        'test_db',
        'myDatabase123',
        'a'
      ]

      validNames.forEach(databaseName => {
        const result = validateDatabaseName(databaseName)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid database names', () => {
      const invalidNames = [
        '',
        '   ',
        'database/name',
        'database\\name',
        'database.name',
        'database name',
        'database$name',
        'database*name',
        'database<name',
        'database>name',
        'database:name',
        'database|name',
        'database?name',
        'a'.repeat(65) // too long
      ]

      invalidNames.forEach(databaseName => {
        const result = validateDatabaseName(databaseName)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })
  })

  describe('validateCollectionName', () => {
    it('should validate correct collection names', () => {
      const validNames = [
        'cards',
        'test_collection',
        'myCollection123',
        'a'
      ]

      validNames.forEach(collectionName => {
        const result = validateCollectionName(collectionName)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject invalid collection names', () => {
      const invalidNames = [
        '',
        '   ',
        'system.users',
        'system.indexes',
        'collection$name'
      ]

      invalidNames.forEach(collectionName => {
        const result = validateCollectionName(collectionName)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })
  })

  describe('validateMongoDBConfig', () => {
    it('should validate complete valid MongoDB configuration', () => {
      const validConfig: MongoDBConfig = {
        connectionString: 'mongodb://localhost:27017',
        databaseName: 'flashcards',
        collectionName: 'cards'
      }

      const result = validateMongoDBConfig(validConfig)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject configuration with invalid fields', () => {
      const invalidConfig: MongoDBConfig = {
        connectionString: 'invalid-connection',
        databaseName: 'database/invalid',
        collectionName: 'system.invalid'
      }

      const result = validateMongoDBConfig(invalidConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject configuration with empty fields', () => {
      const emptyConfig: MongoDBConfig = {
        connectionString: '',
        databaseName: '',
        collectionName: ''
      }

      const result = validateMongoDBConfig(emptyConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateProviderConfiguration', () => {
    const validSettings: AppSettings = {
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
            connectionString: 'mongodb://localhost:27017',
            databaseName: 'flashcards',
            collectionName: 'cards'
          }
        }
      }
    }

    it('should validate localhost provider', () => {
      const result = validateProviderConfiguration('localhost', validSettings)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate mongodb provider with valid config', () => {
      const result = validateProviderConfiguration('mongodb', validSettings)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject mongodb provider with invalid config', () => {
      const invalidSettings: AppSettings = {
        ...validSettings,
        providers: {
          ...validSettings.providers,
          mongodb: {
            ...validSettings.providers.mongodb,
            config: {
              connectionString: '',
              databaseName: '',
              collectionName: ''
            }
          }
        }
      }

      const result = validateProviderConfiguration('mongodb', invalidSettings)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateAppSettings', () => {
    const validSettings: AppSettings = {
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
            connectionString: 'mongodb://localhost:27017',
            databaseName: 'flashcards',
            collectionName: 'cards'
          }
        }
      }
    }

    it('should validate complete valid settings', () => {
      const result = validateAppSettings(validSettings)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject settings with invalid selected provider', () => {
      const invalidSettings: AppSettings = {
        ...validSettings,
        selectedProvider: 'nonexistent' as any
      }

      const result = validateAppSettings(invalidSettings)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject settings with missing provider fields', () => {
      const invalidSettings: AppSettings = {
        ...validSettings,
        providers: {
          ...validSettings.providers,
          localhost: {
            name: '',
            displayName: '',
            isDefault: true
          }
        }
      }

      const result = validateAppSettings(invalidSettings)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})