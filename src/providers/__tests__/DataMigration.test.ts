import { DataMigrationService, MigrationStatus, MigrationOptions } from '../DataMigration'
import { LocalStorageProvider } from '../LocalStorageProvider'
import { Card } from '../../types/card'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    get length() {
      return Object.keys(store).length
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock provider for testing
class MockProvider {
  private cards: Card[] = []
  private shouldFail = false

  constructor(private name: string, initialCards: Card[] = []) {
    this.cards = [...initialCards]
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail
  }

  async getCards(): Promise<Card[]> {
    if (this.shouldFail) {
      throw new Error('Mock provider failure')
    }
    return [...this.cards]
  }

  async saveCard(card: Card): Promise<Card> {
    if (this.shouldFail) {
      throw new Error('Mock provider failure')
    }
    this.cards.push(card)
    return card
  }

  async updateCard(card: Card): Promise<Card> {
    if (this.shouldFail) {
      throw new Error('Mock provider failure')
    }
    const index = this.cards.findIndex(c => c.id === card.id)
    if (index >= 0) {
      this.cards[index] = card
    }
    return card
  }

  async deleteCard(cardId: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Mock provider failure')
    }
    this.cards = this.cards.filter(c => c.id !== cardId)
  }

  async saveCards(cards: Card[]): Promise<Card[]> {
    if (this.shouldFail) {
      throw new Error('Mock provider failure')
    }
    this.cards = [...cards]
    return cards
  }

  getProviderName(): string {
    return this.name
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail
  }

  async connect(): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Mock provider connection failure')
    }
  }

  async disconnect(): Promise<void> {
    // No-op for mock
  }
}

describe('DataMigrationService', () => {
  let migrationService: DataMigrationService
  let sourceProvider: MockProvider
  let targetProvider: MockProvider

  const createTestCard = (id: string, word: string): Card => ({
    id,
    word,
    translation: `translation_${word}`,
    isKnown: false,
    createdAt: new Date(),
    example: `example_${word}`,
    exampleTranslation: `example_translation_${word}`
  })

  beforeEach(() => {
    localStorageMock.clear()
    migrationService = new DataMigrationService()
    sourceProvider = new MockProvider('source', [
      createTestCard('1', 'hello'),
      createTestCard('2', 'world'),
      createTestCard('3', 'test')
    ])
    targetProvider = new MockProvider('target')
  })

  describe('exportData', () => {
    it('should export data from provider', async () => {
      const exportData = await migrationService.exportData(sourceProvider as any)

      expect(exportData.version).toBe('1.0.0')
      expect(exportData.sourceProvider).toBe('source')
      expect(exportData.totalCards).toBe(3)
      expect(exportData.cards).toHaveLength(3)
      expect(exportData.cards[0].word).toBe('hello')
      expect(exportData.metadata.checksum).toBeDefined()
    })

    it('should handle export errors', async () => {
      sourceProvider.setShouldFail(true)

      await expect(migrationService.exportData(sourceProvider as any))
        .rejects.toThrow('Export failed')
    })
  })

  describe('importData', () => {
    it('should import data to provider', async () => {
      const exportData = await migrationService.exportData(sourceProvider as any)
      
      await migrationService.importData(targetProvider as any, exportData)

      const targetCards = await targetProvider.getCards()
      expect(targetCards).toHaveLength(3)
      expect(targetCards[0].word).toBe('hello')
    })

    it('should validate import data', async () => {
      const invalidExportData = {
        version: '1.0.0',
        exportDate: new Date(),
        sourceProvider: 'source',
        totalCards: 2,
        cards: [createTestCard('1', 'hello')], // Mismatch: says 2 but only 1 card
        metadata: {
          exportedBy: 'test',
          checksum: 'invalid'
        }
      }

      await expect(migrationService.importData(targetProvider as any, invalidExportData))
        .rejects.toThrow('Export data card count mismatch')
    })

    it('should respect overwriteExisting option', async () => {
      // Add some cards to target first
      await targetProvider.saveCard(createTestCard('existing', 'existing'))
      
      const exportData = await migrationService.exportData(sourceProvider as any)

      // Should fail without overwriteExisting
      await expect(migrationService.importData(targetProvider as any, exportData, {
        createBackup: false,
        validateData: false,
        overwriteExisting: false,
        batchSize: 100,
        retryAttempts: 1
      })).rejects.toThrow('Target provider contains existing data')

      // Should succeed with overwriteExisting
      await migrationService.importData(targetProvider as any, exportData, {
        createBackup: false,
        validateData: false,
        overwriteExisting: true,
        batchSize: 100,
        retryAttempts: 1
      })

      const targetCards = await targetProvider.getCards()
      expect(targetCards).toHaveLength(3)
    })
  })

  describe('migrateData', () => {
    it('should migrate data between providers', async () => {
      const result = await migrationService.migrateData(
        sourceProvider as any,
        targetProvider as any,
        {
          createBackup: false,
          validateData: true,
          overwriteExisting: true,
          batchSize: 100,
          retryAttempts: 1
        }
      )

      expect(result.success).toBe(true)
      expect(result.totalCards).toBe(3)
      expect(result.migratedCards).toBe(3)
      expect(result.skippedCards).toBe(0)
      expect(result.errors).toHaveLength(0)

      const targetCards = await targetProvider.getCards()
      expect(targetCards).toHaveLength(3)
    })

    it('should handle migration failures', async () => {
      targetProvider.setShouldFail(true)

      const result = await migrationService.migrateData(
        sourceProvider as any,
        targetProvider as any,
        {
          createBackup: false,
          validateData: false,
          overwriteExisting: true,
          batchSize: 100,
          retryAttempts: 1
        }
      )

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should create backup when requested', async () => {
      // Add some data to target first
      await targetProvider.saveCard(createTestCard('target1', 'target'))

      const result = await migrationService.migrateData(
        sourceProvider as any,
        targetProvider as any,
        {
          createBackup: true,
          validateData: false,
          overwriteExisting: true,
          batchSize: 100,
          retryAttempts: 1
        }
      )

      expect(result.success).toBe(true)
      expect(result.backupLocation).toBeDefined()
      
      // Verify backup was created
      const backupData = localStorage.getItem(result.backupLocation!)
      expect(backupData).toBeDefined()
      
      const backup = JSON.parse(backupData!)
      expect(backup.totalCards).toBe(1)
      expect(backup.cards[0].word).toBe('target')
    })
  })

  describe('backup management', () => {
    it('should create and restore backups', async () => {
      const backupLocation = await migrationService.createBackup(sourceProvider as any)
      
      expect(backupLocation).toBeDefined()
      expect(localStorage.getItem(backupLocation)).toBeDefined()

      // Clear target and restore
      await targetProvider.saveCards([])
      await migrationService.restoreFromBackup(targetProvider as any, backupLocation, {
        createBackup: false,
        validateData: false,
        overwriteExisting: true,
        batchSize: 100,
        retryAttempts: 1
      })

      const restoredCards = await targetProvider.getCards()
      expect(restoredCards).toHaveLength(3)
      expect(restoredCards[0].word).toBe('hello')
    })

    it('should list available backups', async () => {
      await migrationService.createBackup(sourceProvider as any)
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      await migrationService.createBackup(targetProvider as any)

      const backups = migrationService.getAvailableBackups()
      expect(backups).toHaveLength(2)
      expect(backups[0].provider).toBe('target') // Most recent first
      expect(backups[1].provider).toBe('source')
    })

    it('should delete backups', async () => {
      const backupLocation = await migrationService.createBackup(sourceProvider as any)
      
      expect(localStorage.getItem(backupLocation)).toBeDefined()
      
      migrationService.deleteBackup(backupLocation)
      
      expect(localStorage.getItem(backupLocation)).toBeNull()
    })
  })

  describe('progress tracking', () => {
    it('should track migration progress', async () => {
      const progressUpdates: any[] = []
      
      migrationService.addProgressListener((progress) => {
        progressUpdates.push({ ...progress })
      })

      await migrationService.migrateData(
        sourceProvider as any,
        targetProvider as any,
        {
          createBackup: false,
          validateData: false,
          overwriteExisting: true,
          batchSize: 100,
          retryAttempts: 1
        }
      )

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[0].status).toBe(MigrationStatus.PREPARING)
      expect(progressUpdates[progressUpdates.length - 1].status).toBe(MigrationStatus.COMPLETED)
    })

    it('should allow cancellation', () => {
      // Test that cancellation updates the progress status
      migrationService.updateProgress({
        status: MigrationStatus.PREPARING,
        currentStep: 'Test step',
        totalSteps: 1,
        completedSteps: 0,
        processedItems: 0,
        totalItems: 0,
        startTime: new Date()
      })

      migrationService.cancelMigration()

      const currentProgress = migrationService.getCurrentProgress()
      expect(currentProgress?.status).toBe(MigrationStatus.CANCELLED)
    })
  })
})