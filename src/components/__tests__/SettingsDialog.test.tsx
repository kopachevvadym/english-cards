import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { SettingsDialog } from '../SettingsDialog'
import { SettingsProvider } from '../../contexts/SettingsContext'
import { theme } from '../../app/theme'

// Mock the useCards hook
jest.mock('../../hooks/useCards', () => ({
  useCards: () => ({
    providerManager: null
  })
}))

// Mock the MigrationWizard and BackupManager components
jest.mock('../MigrationWizard', () => ({
  MigrationWizard: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="migration-wizard">Migration Wizard</div> : null
}))

jest.mock('../BackupManager', () => ({
  BackupManager: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="backup-manager">Backup Manager</div> : null
}))

// Mock the ProviderStatusIndicator component
jest.mock('../ProviderStatusIndicator', () => ({
  ProviderStatusIndicator: ({ providerName, status }: any) => (
    <div data-testid={`status-indicator-${providerName}`}>
      Status: {status.status}
    </div>
  )
}))

// Mock the settings context
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <SettingsProvider>
        {component}
      </SettingsProvider>
    </ThemeProvider>
  )
}

describe('SettingsDialog', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('should render the dialog when open', () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Data Provider Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage your flashcard data storage and migration')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderWithProviders(
      <SettingsDialog open={false} onClose={mockOnClose} />
    )

    expect(screen.queryByText('Data Provider Settings')).not.toBeInTheDocument()
  })

  it('should display provider options', () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    expect(screen.getAllByText('Local Storage')).toHaveLength(2) // One in radio button, one in status
    expect(screen.getByText('MongoDB Database')).toBeInTheDocument()
    expect(screen.getByText('Store data locally in your browser. Data stays on this device only.')).toBeInTheDocument()
    expect(screen.getByText('Store data in a MongoDB database. Access your data from anywhere.')).toBeInTheDocument()
  })

  it('should show MongoDB configuration when MongoDB is selected', async () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    // Click on MongoDB radio button
    const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
    fireEvent.click(mongoRadio)

    await waitFor(() => {
      expect(screen.getByText('MongoDB Configuration')).toBeInTheDocument()
      expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
      expect(screen.getByLabelText('Database Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Collection Name')).toBeInTheDocument()
    })
  })

  it('should validate MongoDB configuration fields', async () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    // Select MongoDB
    const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
    fireEvent.click(mongoRadio)

    await waitFor(() => {
      expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
    })

    // Try to save without filling required fields
    const saveButton = screen.getByRole('button', { name: 'Save Settings' })
    expect(saveButton).toBeDisabled()
  })

  it('should call onClose when cancel is clicked', () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show test connection button for MongoDB', async () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    // Select MongoDB
    const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
    fireEvent.click(mongoRadio)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Test Connection' })).toBeInTheDocument()
    })
  })

  it('should show current status information', () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Current Status:')).toBeInTheDocument()
    expect(screen.getByText(/Active Provider:/)).toBeInTheDocument()
  })

  it('should show migration tab', async () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    const migrationTab = screen.getByRole('tab', { name: /migration/i })
    fireEvent.click(migrationTab)

    await waitFor(() => {
      expect(screen.getByText('Data Migration')).toBeInTheDocument()
    })
  })

  it('should show backup tab', async () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    const backupTab = screen.getByRole('tab', { name: /backup/i })
    fireEvent.click(backupTab)

    await waitFor(() => {
      expect(screen.getByText('Backup & Restore')).toBeInTheDocument()
    })
  })

  it('should handle UI preferences toggle', async () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    const translationToggle = screen.getByRole('checkbox', { name: /show translation first/i })
    fireEvent.click(translationToggle)

    // The toggle should be checked after clicking
    expect(translationToggle).toBeChecked()
  })

  it('should validate MongoDB configuration', async () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    // Select MongoDB
    const mongoRadio = screen.getByRole('radio', { name: /MongoDB Database/ })
    fireEvent.click(mongoRadio)

    await waitFor(() => {
      expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
    })

    // Enter invalid connection string
    const connectionStringInput = screen.getByLabelText('Connection String')
    fireEvent.change(connectionStringInput, { target: { value: 'invalid-connection' } })

    // Try to save
    const saveButton = screen.getByRole('button', { name: 'Save Settings' })
    fireEvent.click(saveButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Connection string must start with mongodb/)).toBeInTheDocument()
    })
  })

  it('should show reset confirmation', () => {
    renderWithProviders(
      <SettingsDialog open={true} onClose={mockOnClose} />
    )

    const resetButton = screen.getByRole('button', { name: 'Reset to Defaults' })
    expect(resetButton).toBeInTheDocument()
  })
})