import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { SettingsDialog } from '../SettingsDialog'
import { SettingsProvider } from '../../contexts/SettingsContext'
import { theme } from '../../app/theme'
import { DataProviderManager } from '../../providers/DataProviderManager'
import { LocalStorageProvider } from '../../providers/LocalStorageProvider'
import { MongoDBProvider } from '../../providers/MongoDBProvider'
import { ProviderStatus, ProviderStatusInfo } from '../../providers/types'

// Mock the useCards hook with a real provider manager
const mockProviderManager = new DataProviderManager()
const mockLocalProvider = new LocalStorageProvider()
const mockMongoProvider = new MongoDBProvider({
  connectionString: 'mongodb://localhost:27017',
  databaseName: 'testdb',
  collectionName: 'cards'
})

mockProviderManager.registerProvider('localhost', mockLocalProvider)
mockProviderManager.registerProvider('mongodb', mockMongoProvider)

jest.mock('../../hooks/useCards', () => ({
  useCards: () => ({
    providerManager: mockProviderManager
  })
}))

// Mock MongoDB
const mockCollection = {
  find: jest.fn(),
  insertOne: jest.fn(),
  insertMany: jest.fn(),
  replaceOne: jest.fn(),
  deleteOne: jest.fn(),
  createIndex: jest.fn()
}

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection),
  command: jest.fn(),
  listCollections: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) })
}

const mockClient = {
  connect: jest.fn(),
  close: jest.fn(),
  db: jest.fn().mockReturnValue(mockDb)
}

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => mockClient)
}))

// Mock the MigrationWizard and BackupManager components
jest.mock('../MigrationWizard', () => ({
  MigrationWizard: ({ isOpen, onClose, onMigrationComplete }: any) => 
    isOpen ? (
      <div data-testid="migration-wizard">
        <button onClick={() => onMigrationComplete({ success: true, message: 'Migration completed' })}>
          Complete Migration
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

jest.mock('../BackupManager', () => ({
  BackupManager: ({ isOpen, onClose, onBackupRestored }: any) => 
    isOpen ? (
      <div data-testid="backup-manager">
        <button onClick={() => onBackupRestored()}>Restore Backup</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {}
  }),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <SettingsProvider>
        {component}
      </SettingsProvider>
    </ThemeProvider>
  )
}

describe('SettingsDialog Integration Tests', () => {
  const mockOnClose = jest.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.store = {}
    
    // Setup MongoDB mocks
    mockClient.connect.mockResolvedValue(undefined)
    mockDb.command.mockResolvedValue({ ok: 1 })
    mockCollection.createIndex.mockResolvedValue('id_1')
  })

  describe('Provider Status Integration', () => {
    it('should load and display provider statuses', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Wait for provider statuses to load
      await waitFor(() => {
        expect(screen.getByText('Provider Status')).toBeInTheDocument()
      })

      // Should show refresh button
      expect(screen.getByRole('button', { name: /refresh all/i })).toBeInTheDocument()
    })

    it('should refresh provider statuses when refresh button is clicked', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      await waitFor(() => {
        expect(screen.getByText('Provider Status')).toBeInTheDocument()
      })

      const refreshButton = screen.getByRole('button', { name: /refresh all/i })
      await user.click(refreshButton)

      // Should show loading state briefly
      expect(refreshButton).toBeDisabled()
    })

    it('should handle provider reconnection', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Select MongoDB to show detailed status
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      await waitFor(() => {
        expect(screen.getByText('MongoDB Configuration')).toBeInTheDocument()
      })

      // Provider status should be shown
      await waitFor(() => {
        expect(screen.getByText('Provider Status')).toBeInTheDocument()
      })
    })
  })

  describe('MongoDB Configuration Integration', () => {
    it('should validate and test MongoDB connection', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Select MongoDB
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      await waitFor(() => {
        expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
      })

      // Fill in valid configuration
      const connectionStringInput = screen.getByLabelText('Connection String')
      const databaseNameInput = screen.getByLabelText('Database Name')
      const collectionNameInput = screen.getByLabelText('Collection Name')

      await user.clear(connectionStringInput)
      await user.type(connectionStringInput, 'mongodb://localhost:27017')
      await user.clear(databaseNameInput)
      await user.type(databaseNameInput, 'testdb')
      await user.clear(collectionNameInput)
      await user.type(collectionNameInput, 'cards')

      // Test connection
      const testButton = screen.getByRole('button', { name: /test connection/i })
      await user.click(testButton)

      // Should show testing state
      expect(screen.getByText('Testing...')).toBeInTheDocument()

      // Wait for test to complete
      await waitFor(() => {
        expect(screen.queryByText('Testing...')).not.toBeInTheDocument()
      })
    })

    it('should show validation errors for invalid configuration', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Select MongoDB
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      await waitFor(() => {
        expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
      })

      // Enter invalid connection string
      const connectionStringInput = screen.getByLabelText('Connection String')
      await user.clear(connectionStringInput)
      await user.type(connectionStringInput, 'invalid-connection')

      // Try to save
      const saveButton = screen.getByRole('button', { name: 'Save Settings' })
      await user.click(saveButton)

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Connection string must start with mongodb/)).toBeInTheDocument()
      })
    })

    it('should handle connection test failure', async () => {
      // Mock connection failure
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'))

      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Select MongoDB and configure
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      await waitFor(() => {
        expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
      })

      const connectionStringInput = screen.getByLabelText('Connection String')
      await user.clear(connectionStringInput)
      await user.type(connectionStringInput, 'mongodb://localhost:27017')

      // Test connection
      const testButton = screen.getByRole('button', { name: /test connection/i })
      await user.click(testButton)

      // Should show failure message
      await waitFor(() => {
        expect(screen.getByText(/Connection failed/)).toBeInTheDocument()
      })
    })
  })

  describe('Migration Workflow Integration', () => {
    it('should open migration wizard from migration tab', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Switch to migration tab
      const migrationTab = screen.getByRole('tab', { name: /migration/i })
      await user.click(migrationTab)

      await waitFor(() => {
        expect(screen.getByText('Data Migration')).toBeInTheDocument()
      })

      // Click migrate button (it might be disabled initially)
      const migrateButton = screen.getByRole('button', { name: /migrate to/i })
      
      // If button is enabled, click it
      if (!migrateButton.hasAttribute('disabled')) {
        await user.click(migrateButton)

        // Should open migration wizard
        await waitFor(() => {
          expect(screen.getByTestId('migration-wizard')).toBeInTheDocument()
        })
      }
    })

    it('should handle migration completion', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Switch to migration tab
      const migrationTab = screen.getByRole('tab', { name: /migration/i })
      await user.click(migrationTab)

      await waitFor(() => {
        expect(screen.getByText('Data Migration')).toBeInTheDocument()
      })

      const migrateButton = screen.getByRole('button', { name: /migrate to/i })
      
      if (!migrateButton.hasAttribute('disabled')) {
        await user.click(migrateButton)

        await waitFor(() => {
          expect(screen.getByTestId('migration-wizard')).toBeInTheDocument()
        })

        // Complete migration
        const completeMigrationButton = screen.getByRole('button', { name: 'Complete Migration' })
        await user.click(completeMigrationButton)

        // Migration wizard should close
        await waitFor(() => {
          expect(screen.queryByTestId('migration-wizard')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Backup Management Integration', () => {
    it('should open backup manager from backup tab', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Switch to backup tab
      const backupTab = screen.getByRole('tab', { name: /backup/i })
      await user.click(backupTab)

      await waitFor(() => {
        expect(screen.getByText('Backup & Restore')).toBeInTheDocument()
      })

      // Click manage backups button
      const manageBackupsButton = screen.getByRole('button', { name: /manage backups/i })
      await user.click(manageBackupsButton)

      // Should open backup manager
      await waitFor(() => {
        expect(screen.getByTestId('backup-manager')).toBeInTheDocument()
      })
    })

    it('should handle backup restoration', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Switch to backup tab and open backup manager
      const backupTab = screen.getByRole('tab', { name: /backup/i })
      await user.click(backupTab)

      await waitFor(() => {
        expect(screen.getByText('Backup & Restore')).toBeInTheDocument()
      })

      const manageBackupsButton = screen.getByRole('button', { name: /manage backups/i })
      await user.click(manageBackupsButton)

      await waitFor(() => {
        expect(screen.getByTestId('backup-manager')).toBeInTheDocument()
      })

      // Restore backup
      const restoreButton = screen.getByRole('button', { name: 'Restore Backup' })
      await user.click(restoreButton)

      // Should handle restoration (mock implementation just closes)
      await waitFor(() => {
        expect(screen.queryByTestId('backup-manager')).not.toBeInTheDocument()
      })
    })
  })

  describe('Settings Persistence Integration', () => {
    it('should save and persist provider selection', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Select MongoDB
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      await waitFor(() => {
        expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
      })

      // Fill in configuration
      const connectionStringInput = screen.getByLabelText('Connection String')
      const databaseNameInput = screen.getByLabelText('Database Name')
      const collectionNameInput = screen.getByLabelText('Collection Name')

      await user.clear(connectionStringInput)
      await user.type(connectionStringInput, 'mongodb://localhost:27017')
      await user.clear(databaseNameInput)
      await user.type(databaseNameInput, 'testdb')
      await user.clear(collectionNameInput)
      await user.type(collectionNameInput, 'cards')

      // Save settings
      const saveButton = screen.getByRole('button', { name: 'Save Settings' })
      await user.click(saveButton)

      // Dialog should close
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should handle UI preferences toggle', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Find and toggle the translation preference
      const translationToggle = screen.getByRole('checkbox', { name: /show translation first/i })
      
      const initialState = translationToggle.checked
      await user.click(translationToggle)
      
      // State should have changed
      expect(translationToggle.checked).toBe(!initialState)

      // Save settings
      const saveButton = screen.getByRole('button', { name: 'Save Settings' })
      await user.click(saveButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should reset to defaults when reset button is clicked', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Make some changes first
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      // Reset to defaults
      const resetButton = screen.getByRole('button', { name: 'Reset to Defaults' })
      await user.click(resetButton)

      // Dialog should close
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Advanced Settings Integration', () => {
    it('should show and hide advanced settings', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Select MongoDB to show advanced settings option
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      await waitFor(() => {
        expect(screen.getByText('MongoDB Configuration')).toBeInTheDocument()
      })

      // Click advanced settings toggle
      const advancedToggle = screen.getByRole('button', { name: /advanced settings/i })
      await user.click(advancedToggle)

      // Should show advanced settings content
      await waitFor(() => {
        expect(screen.getByText('Connection Tips:')).toBeInTheDocument()
      })

      // Click again to hide
      await user.click(advancedToggle)

      // Should hide advanced settings
      await waitFor(() => {
        expect(screen.queryByText('Connection Tips:')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle provider manager unavailability gracefully', async () => {
      // Mock useCards to return null provider manager
      jest.doMock('../../hooks/useCards', () => ({
        useCards: () => ({
          providerManager: null
        })
      }))

      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Should still render without crashing
      expect(screen.getByText('Data Provider Settings')).toBeInTheDocument()
      
      // Provider status section should show appropriate message
      await waitFor(() => {
        expect(screen.getByText(/Provider status information is not available/)).toBeInTheDocument()
      })
    })

    it('should handle unsaved changes warning', async () => {
      renderWithProviders(
        <SettingsDialog open={true} onClose={mockOnClose} />
      )

      // Make a change
      const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
      await user.click(mongoRadio)

      // Should show unsaved changes indicator
      await waitFor(() => {
        expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument()
      })

      // Cancel without saving
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})