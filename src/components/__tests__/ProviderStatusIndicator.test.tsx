import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { ProviderStatusIndicator } from '../ProviderStatusIndicator'
import { ProviderStatus, ProviderStatusInfo, DataProviderError, ProviderError } from '../../providers/types'

const theme = createTheme()

const mockStatus: ProviderStatusInfo = {
  status: ProviderStatus.CONNECTED,
  message: 'Connected successfully',
  lastChecked: new Date('2023-01-01T12:00:00Z')
}

const mockErrorStatus: ProviderStatusInfo = {
  status: ProviderStatus.ERROR,
  message: 'Connection failed',
  lastChecked: new Date('2023-01-01T12:00:00Z'),
  error: new ProviderError(
    DataProviderError.CONNECTION_FAILED,
    'Connection failed',
    'mongodb'
  )
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('ProviderStatusIndicator', () => {
  it('renders compact status indicator', () => {
    renderWithTheme(
      <ProviderStatusIndicator
        providerName="localhost"
        status={mockStatus}
        compact={true}
      />
    )

    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('renders full status indicator with details', () => {
    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={mockStatus}
        compact={false}
        showDetails={true}
      />
    )

    expect(screen.getByText('MongoDB')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows error status correctly', () => {
    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={mockErrorStatus}
        compact={false}
        showDetails={true}
      />
    )

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('MongoDB')).toBeInTheDocument()
    // The message appears in the popover when clicked
    fireEvent.click(screen.getByText('MongoDB'))
    expect(screen.getAllByText('Connection failed')).toHaveLength(2) // One in message, one in error alert
  })

  it('calls onRefresh when refresh button is clicked', async () => {
    const mockRefresh = jest.fn().mockResolvedValue(undefined)
    
    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={mockStatus}
        onRefresh={mockRefresh}
        compact={false}
        showDetails={true}
      />
    )

    const refreshButton = screen.getByLabelText('Refresh provider status')
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onReconnect when reconnect button is clicked for error status', async () => {
    const mockReconnect = jest.fn().mockResolvedValue(undefined)
    
    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={mockErrorStatus}
        onReconnect={mockReconnect}
        compact={false}
        showDetails={true}
      />
    )

    // Click to open details
    fireEvent.click(screen.getByText('MongoDB'))

    await waitFor(() => {
      const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
      fireEvent.click(reconnectButton)
    })

    await waitFor(() => {
      expect(mockReconnect).toHaveBeenCalledTimes(1)
    })
  })

  it('shows connection time when available', async () => {
    const statusWithConnectionTime: ProviderStatusInfo = {
      ...mockStatus,
      connectionTime: 1500
    }

    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={statusWithConnectionTime}
        compact={false}
        showDetails={true}
      />
    )

    // Click to open details
    fireEvent.click(screen.getByText('MongoDB'))

    await waitFor(() => {
      expect(screen.getByText(/Connection time: 1.5s/)).toBeInTheDocument()
    })
  })

  it('formats last checked time correctly', async () => {
    const recentStatus: ProviderStatusInfo = {
      ...mockStatus,
      lastChecked: new Date(Date.now() - 30000) // 30 seconds ago
    }

    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={recentStatus}
        compact={false}
        showDetails={true}
      />
    )

    // Click to open details
    fireEvent.click(screen.getByText('MongoDB'))

    await waitFor(() => {
      expect(screen.getByText(/Last checked:/)).toBeInTheDocument()
    })
  })

  it('shows correct icon for localhost provider', () => {
    renderWithTheme(
      <ProviderStatusIndicator
        providerName="localhost"
        status={mockStatus}
        compact={false}
        showDetails={true}
      />
    )

    expect(screen.getByText('Local Storage')).toBeInTheDocument()
  })

  it('shows correct icon for mongodb provider', () => {
    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={mockStatus}
        compact={false}
        showDetails={true}
      />
    )

    expect(screen.getByText('MongoDB')).toBeInTheDocument()
  })

  it('handles connecting status', () => {
    const connectingStatus: ProviderStatusInfo = {
      status: ProviderStatus.CONNECTING,
      message: 'Connecting...',
      lastChecked: new Date()
    }

    renderWithTheme(
      <ProviderStatusIndicator
        providerName="mongodb"
        status={connectingStatus}
        compact={true}
      />
    )

    expect(screen.getByText('Connecting')).toBeInTheDocument()
  })

  it('handles unavailable status', () => {
    const unavailableStatus: ProviderStatusInfo = {
      status: ProviderStatus.UNAVAILABLE,
      message: 'Provider unavailable',
      lastChecked: new Date()
    }

    renderWithTheme(
      <ProviderStatusIndicator
        providerName="localhost"
        status={unavailableStatus}
        compact={true}
      />
    )

    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })
})