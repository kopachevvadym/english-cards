import { Card } from '../types/card'
import { IDataProvider, ProviderError, DataProviderError } from './types'

/**
 * Migration status enumeration
 */
export enum MigrationStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  EXPORTING = 'exporting',
  IMPORTING = 'importing',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Migration progress information
 */
export interface MigrationProgress {
  status: MigrationStatus
  currentStep: string
  totalSteps: number
  completedSteps: number
  processedItems: number
  totalItems: number
  startTime: Date
  estimatedTimeRemaining?: number
  error?: ProviderError
}

/**
 * Migration options
 */
export interface MigrationOptions {
  createBackup: boolean
  validateData: boolean
  overwriteExisting: boolean
  batchSize: number
  retryAttempts: number
}

/**
 * Export/Import data format
 */
export interface DataExport {
  version: string
  exportDate: Date
  sourceProvider: string
  totalCards: number
  cards: Card[]
  metadata: {
    exportedBy: string
    checksum: string
  }
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean
  sourceProvider: string
  targetProvider: string
  totalCards: number
  migratedCards: number
  skippedCards: number
  errors: ProviderError[]
  duration: number
  backupLocation?: string
}

/**
 * Data migration service for transferring data between providers
 */
export class DataMigrationService {
  private currentMigration: MigrationProgress | null = null
  private migrationListeners: ((progress: MigrationProgress) => void)[] = []
  private abortController: AbortController | null = null

  /**
   * Default migration options
   */
  private readonly defaultOptions: MigrationOptions = {
    createBackup: true,
    validateData: true,
    overwriteExisting: false,
    batchSize: 100,
    retryAttempts: 3
  }

  /**
   * Export data from a provider
   */
  async exportData(provider: IDataProvider): Promise<DataExport> {
    try {
      this.updateProgress({
        status: MigrationStatus.EXPORTING,
        currentStep: 'Retrieving data from provider',
        totalSteps: 3,
        completedSteps: 0,
        processedItems: 0,
        totalItems: 0,
        startTime: new Date()
      })

      // Get all cards from the provider
      const cards = await provider.getCards()
      
      this.updateProgress({
        status: MigrationStatus.EXPORTING,
        currentStep: 'Processing card data',
        totalSteps: 3,
        completedSteps: 1,
        processedItems: 0,
        totalItems: cards.length,
        startTime: this.currentMigration!.startTime
      })

      // Create export data structure
      const exportData: DataExport = {
        version: '1.0.0',
        exportDate: new Date(),
        sourceProvider: provider.getProviderName(),
        totalCards: cards.length,
        cards: cards,
        metadata: {
          exportedBy: 'DataMigrationService',
          checksum: this.calculateChecksum(cards)
        }
      }

      this.updateProgress({
        status: MigrationStatus.EXPORTING,
        currentStep: 'Finalizing export',
        totalSteps: 3,
        completedSteps: 2,
        processedItems: cards.length,
        totalItems: cards.length,
        startTime: this.currentMigration!.startTime
      })

      this.updateProgress({
        status: MigrationStatus.COMPLETED,
        currentStep: 'Export completed',
        totalSteps: 3,
        completedSteps: 3,
        processedItems: cards.length,
        totalItems: cards.length,
        startTime: this.currentMigration!.startTime
      })

      return exportData

    } catch (error) {
      const providerError = error instanceof ProviderError 
        ? error 
        : new ProviderError(
            DataProviderError.OPERATION_FAILED,
            `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            provider.getProviderName(),
            error instanceof Error ? error : undefined
          )

      this.updateProgress({
        status: MigrationStatus.FAILED,
        currentStep: 'Export failed',
        totalSteps: 3,
        completedSteps: 0,
        processedItems: 0,
        totalItems: 0,
        startTime: this.currentMigration?.startTime || new Date(),
        error: providerError
      })

      throw providerError
    }
  }

  /**
   * Import data to a provider
   */
  async importData(
    provider: IDataProvider, 
    exportData: DataExport, 
    options: Partial<MigrationOptions> = {}
  ): Promise<void> {
    const mergedOptions = { ...this.defaultOptions, ...options }

    try {
      this.updateProgress({
        status: MigrationStatus.IMPORTING,
        currentStep: 'Validating import data',
        totalSteps: 4,
        completedSteps: 0,
        processedItems: 0,
        totalItems: exportData.totalCards,
        startTime: new Date()
      })

      // Validate export data
      this.validateExportData(exportData)

      this.updateProgress({
        status: MigrationStatus.IMPORTING,
        currentStep: 'Preparing import',
        totalSteps: 4,
        completedSteps: 1,
        processedItems: 0,
        totalItems: exportData.totalCards,
        startTime: this.currentMigration!.startTime
      })

      // Check for existing data if not overwriting
      if (!mergedOptions.overwriteExisting) {
        const existingCards = await provider.getCards()
        if (existingCards.length > 0) {
          throw new ProviderError(
            DataProviderError.OPERATION_FAILED,
            'Target provider contains existing data. Use overwriteExisting option to replace.',
            provider.getProviderName()
          )
        }
      }

      this.updateProgress({
        status: MigrationStatus.IMPORTING,
        currentStep: 'Importing cards',
        totalSteps: 4,
        completedSteps: 2,
        processedItems: 0,
        totalItems: exportData.totalCards,
        startTime: this.currentMigration!.startTime
      })

      // Import cards in batches
      await this.importCardsInBatches(provider, exportData.cards, mergedOptions)

      if (mergedOptions.validateData) {
        this.updateProgress({
          status: MigrationStatus.VALIDATING,
          currentStep: 'Validating imported data',
          totalSteps: 4,
          completedSteps: 3,
          processedItems: exportData.totalCards,
          totalItems: exportData.totalCards,
          startTime: this.currentMigration!.startTime
        })

        await this.validateImportedData(provider, exportData)
      }

      this.updateProgress({
        status: MigrationStatus.COMPLETED,
        currentStep: 'Import completed',
        totalSteps: 4,
        completedSteps: 4,
        processedItems: exportData.totalCards,
        totalItems: exportData.totalCards,
        startTime: this.currentMigration!.startTime
      })

    } catch (error) {
      const providerError = error instanceof ProviderError 
        ? error 
        : new ProviderError(
            DataProviderError.OPERATION_FAILED,
            `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            provider.getProviderName(),
            error instanceof Error ? error : undefined
          )

      this.updateProgress({
        status: MigrationStatus.FAILED,
        currentStep: 'Import failed',
        totalSteps: 4,
        completedSteps: 0,
        processedItems: 0,
        totalItems: exportData.totalCards,
        startTime: this.currentMigration?.startTime || new Date(),
        error: providerError
      })

      throw providerError
    }
  }

  /**
   * Migrate data from one provider to another
   */
  async migrateData(
    sourceProvider: IDataProvider,
    targetProvider: IDataProvider,
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult> {
    const mergedOptions = { ...this.defaultOptions, ...options }
    const startTime = Date.now()
    let backupLocation: string | undefined
    const errors: ProviderError[] = []

    // Create abort controller for cancellation
    this.abortController = new AbortController()

    try {
      this.updateProgress({
        status: MigrationStatus.PREPARING,
        currentStep: 'Preparing migration',
        totalSteps: 6,
        completedSteps: 0,
        processedItems: 0,
        totalItems: 0,
        startTime: new Date()
      })

      // Check for cancellation
      if (this.abortController.signal.aborted) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          'Migration was cancelled',
          'migration'
        )
      }

      // Create backup if requested
      if (mergedOptions.createBackup) {
        this.updateProgress({
          status: MigrationStatus.PREPARING,
          currentStep: 'Creating backup',
          totalSteps: 6,
          completedSteps: 1,
          processedItems: 0,
          totalItems: 0,
          startTime: this.currentMigration!.startTime
        })

        backupLocation = await this.createBackup(targetProvider)
      }

      // Export data from source
      this.updateProgress({
        status: MigrationStatus.EXPORTING,
        currentStep: 'Exporting from source provider',
        totalSteps: 6,
        completedSteps: 2,
        processedItems: 0,
        totalItems: 0,
        startTime: this.currentMigration!.startTime
      })

      const exportData = await this.exportData(sourceProvider)

      // Import data to target
      this.updateProgress({
        status: MigrationStatus.IMPORTING,
        currentStep: 'Importing to target provider',
        totalSteps: 6,
        completedSteps: 3,
        processedItems: 0,
        totalItems: exportData.totalCards,
        startTime: this.currentMigration!.startTime
      })

      await this.importData(targetProvider, exportData, mergedOptions)

      const duration = Date.now() - startTime

      const result: MigrationResult = {
        success: true,
        sourceProvider: sourceProvider.getProviderName(),
        targetProvider: targetProvider.getProviderName(),
        totalCards: exportData.totalCards,
        migratedCards: exportData.totalCards,
        skippedCards: 0,
        errors,
        duration,
        backupLocation
      }

      this.updateProgress({
        status: MigrationStatus.COMPLETED,
        currentStep: 'Migration completed successfully',
        totalSteps: 6,
        completedSteps: 6,
        processedItems: exportData.totalCards,
        totalItems: exportData.totalCards,
        startTime: this.currentMigration!.startTime
      })

      return result

    } catch (error) {
      const duration = Date.now() - startTime
      const providerError = error instanceof ProviderError 
        ? error 
        : new ProviderError(
            DataProviderError.OPERATION_FAILED,
            `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'migration',
            error instanceof Error ? error : undefined
          )

      errors.push(providerError)

      this.updateProgress({
        status: MigrationStatus.FAILED,
        currentStep: 'Migration failed',
        totalSteps: 6,
        completedSteps: 0,
        processedItems: 0,
        totalItems: 0,
        startTime: this.currentMigration?.startTime || new Date(),
        error: providerError
      })

      return {
        success: false,
        sourceProvider: sourceProvider.getProviderName(),
        targetProvider: targetProvider.getProviderName(),
        totalCards: 0,
        migratedCards: 0,
        skippedCards: 0,
        errors,
        duration,
        backupLocation
      }
    } finally {
      this.abortController = null
    }
  }

  /**
   * Create a backup of the target provider's data
   */
  async createBackup(provider: IDataProvider): Promise<string> {
    try {
      const exportData = await this.exportData(provider)
      const backupKey = `backup_${provider.getProviderName()}_${Date.now()}`
      
      // Store backup in localStorage with a special key
      localStorage.setItem(backupKey, JSON.stringify(exportData))
      
      return backupKey
    } catch (error) {
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider.getProviderName(),
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Restore data from a backup
   */
  async restoreFromBackup(
    provider: IDataProvider, 
    backupLocation: string,
    options: Partial<MigrationOptions> = {}
  ): Promise<void> {
    try {
      const backupData = localStorage.getItem(backupLocation)
      if (!backupData) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          `Backup not found: ${backupLocation}`,
          provider.getProviderName()
        )
      }

      const exportData: DataExport = JSON.parse(backupData)
      await this.importData(provider, exportData, options)
      
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error
      }
      
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider.getProviderName(),
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * List available backups
   */
  getAvailableBackups(): Array<{ key: string; provider: string; date: Date; cardCount: number }> {
    const backups: Array<{ key: string; provider: string; date: Date; cardCount: number }> = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('backup_')) {
        try {
          const backupData = localStorage.getItem(key)
          if (backupData) {
            const exportData: DataExport = JSON.parse(backupData)
            backups.push({
              key,
              provider: exportData.sourceProvider,
              date: new Date(exportData.exportDate),
              cardCount: exportData.totalCards
            })
          }
        } catch (error) {
          // Skip invalid backup entries
          console.warn(`Invalid backup entry: ${key}`, error)
        }
      }
    }
    
    return backups.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  /**
   * Delete a backup
   */
  deleteBackup(backupLocation: string): void {
    localStorage.removeItem(backupLocation)
  }

  /**
   * Cancel ongoing migration
   */
  cancelMigration(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
    
    if (this.currentMigration && this.currentMigration.status !== MigrationStatus.COMPLETED) {
      this.updateProgress({
        ...this.currentMigration,
        status: MigrationStatus.CANCELLED,
        currentStep: 'Migration cancelled by user'
      })
    }
  }

  /**
   * Get current migration progress
   */
  getCurrentProgress(): MigrationProgress | null {
    return this.currentMigration
  }

  /**
   * Add progress listener
   */
  addProgressListener(listener: (progress: MigrationProgress) => void): void {
    this.migrationListeners.push(listener)
  }

  /**
   * Remove progress listener
   */
  removeProgressListener(listener: (progress: MigrationProgress) => void): void {
    const index = this.migrationListeners.indexOf(listener)
    if (index > -1) {
      this.migrationListeners.splice(index, 1)
    }
  }

  /**
   * Import cards in batches for better performance
   */
  private async importCardsInBatches(
    provider: IDataProvider, 
    cards: Card[], 
    options: MigrationOptions
  ): Promise<void> {
    const batchSize = options.batchSize
    let processedCount = 0

    for (let i = 0; i < cards.length; i += batchSize) {
      // Check for cancellation
      if (this.abortController?.signal.aborted) {
        throw new ProviderError(
          DataProviderError.OPERATION_FAILED,
          'Migration was cancelled',
          provider.getProviderName()
        )
      }

      const batch = cards.slice(i, i + batchSize)
      let retryCount = 0
      
      while (retryCount <= options.retryAttempts) {
        try {
          await provider.saveCards(batch)
          processedCount += batch.length
          
          // Update progress
          this.updateProgress({
            ...this.currentMigration!,
            processedItems: processedCount,
            currentStep: `Importing cards (${processedCount}/${cards.length})`
          })
          
          break // Success, move to next batch
          
        } catch (error) {
          retryCount++
          if (retryCount > options.retryAttempts) {
            throw error // Max retries exceeded
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        }
      }
    }
  }

  /**
   * Validate export data structure
   */
  private validateExportData(exportData: DataExport): void {
    if (!exportData.version || !exportData.cards || !Array.isArray(exportData.cards)) {
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Invalid export data format',
        'migration'
      )
    }

    if (exportData.totalCards !== exportData.cards.length) {
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Export data card count mismatch',
        'migration'
      )
    }

    // Validate checksum
    const calculatedChecksum = this.calculateChecksum(exportData.cards)
    if (calculatedChecksum !== exportData.metadata.checksum) {
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Export data integrity check failed',
        'migration'
      )
    }
  }

  /**
   * Validate imported data matches export
   */
  private async validateImportedData(provider: IDataProvider, exportData: DataExport): Promise<void> {
    const importedCards = await provider.getCards()
    
    if (importedCards.length !== exportData.totalCards) {
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        `Import validation failed: expected ${exportData.totalCards} cards, found ${importedCards.length}`,
        provider.getProviderName()
      )
    }

    // Validate checksum of imported data
    const importedChecksum = this.calculateChecksum(importedCards)
    if (importedChecksum !== exportData.metadata.checksum) {
      throw new ProviderError(
        DataProviderError.OPERATION_FAILED,
        'Imported data integrity check failed',
        provider.getProviderName()
      )
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(cards: Card[]): string {
    const dataString = JSON.stringify(cards.map(card => ({
      id: card.id,
      word: card.word,
      translation: card.translation,
      isKnown: card.isKnown,
      examples: card.examples
    })).sort((a, b) => a.id.localeCompare(b.id)))
    
    // Simple hash function for checksum
    let hash = 0
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return hash.toString(16)
  }

  /**
   * Update migration progress and notify listeners
   */
  updateProgress(progress: MigrationProgress): void {
    this.currentMigration = progress
    this.migrationListeners.forEach(listener => listener(progress))
  }
}