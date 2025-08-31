import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { ProviderStatusIndicator } from '../ProviderStatusIndicator'
import { ProviderStatus, ProviderStatusInfo, DataProviderError, ProviderError } from '../../providers/types'

// Add jest-dom matchers
import '@testing-library/jest-dom'

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

const mockConnectingStatus: ProviderStatusInfo = {
  status: ProviderStatus.CONNECTING,
  message: 'Establishing connection...',
  lastChecked: new Date('2023-01-01T12:00:00Z'),
  connectionTime: 1500
}

const mockDisconnectedStatus: ProviderStatusInfo = {
  status: ProviderStatus.DISCONNECTED,
  message: 'Not connected',
  lastChecked: new Date('2023-01-01T12:00:00Z')
}

const mockUnavailableStatus: ProviderStatusInfo = {
  status: ProviderStatus.UNAVAILABLE,
  message: 'Provider unavailable',
  lastChecked: new Date('2023-01-01T12:00:00Z')
}

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('ProviderStatusIndicator', () => {
  const user = userEvent.setup()

  describe('Compact Mode', () => {
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

    it('renders all status types in compact mode', () => {
      const statuses = [
        { status: mockStatus, text: 'Connected' },
        { status: mockErrorStatus, text: 'Error' },
        { status: mockConnectingStatus, text: 'Connecting' },
        { status: mockDisconnectedStatus, text: 'Disconnected' },
        { status: mockUnavailableStatus, text: 'Unavailable' }
      ]

      statuses.forEach(({ status, text }) => {
        const { unmount } = renderWithTheme(
          <ProviderStatusIndicator
            providerName="localhost"
            status={status}
            compact={true}
          />
        )

        expect(screen.getByText(text)).toBeInTheDocument()
        unmount()
      })
    })

    it('shows tooltip on hover in compact mode', async () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockStatus}
          compact={true}
        />
      )

      const chip = screen.getByText('Connected')
      await user.hover(chip)

      await waitFor(() => {
        expect(screen.getByText('mongodb: Connected')).toBeInTheDocument()
      })
    })
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

  describe('Full Mode', () => {
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

    it('shows provider icons correctly', () => {
      const providers = [
        { name: 'localhost', displayName: 'Local Storage' },
        { name: 'mongodb', displayName: 'MongoDB' }
      ]

      providers.forEach(({ name, displayName }) => {
        const { unmount } = renderWithTheme(
          <ProviderStatusIndicator
            providerName={name}
            status={mockStatus}
            compact={false}
            showDetails={true}
          />
        )

        expect(screen.getByText(displayName)).toBeInTheDocument()
        unmount()
      })
    })

    it('opens details popover when clicked', async () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockStatus}
          compact={false}
          showDetails={true}
        />
      )

      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        expect(screen.getByText('Connected successfully')).toBeInTheDocument()
      })
    })

    it('shows connection time in details when available', async () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockConnectingStatus}
          compact={false}
          showDetails={true}
        />
      )

      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        expect(screen.getByText(/Connection time: 1.5s/)).toBeInTheDocument()
      })
    })

    it('formats last checked time correctly', async () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockStatus}
          compact={false}
          showDetails={true}
        />
      )

      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        expect(screen.getByText(/Last checked:/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error status correctly', async () => {
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
      
      // Click to open details
      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        expect(screen.getAllByText('Connection failed')).toHaveLength(2) // One in message, one in error alert
      })
    })

    it('shows reconnect button for error status', async () => {
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
      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
        expect(reconnectButton).toBeInTheDocument()
      })
    })

    it('shows reconnect button for disconnected status', async () => {
      const mockReconnect = jest.fn().mockResolvedValue(undefined)
      
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockDisconnectedStatus}
          onReconnect={mockReconnect}
          compact={false}
          showDetails={true}
        />
      )

      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
        expect(reconnectButton).toBeInTheDocument()
      })
    })

    it('shows reconnect button for unavailable status', async () => {
      const mockReconnect = jest.fn().mockResolvedValue(undefined)
      
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockUnavailableStatus}
          onReconnect={mockReconnect}
          compact={false}
          showDetails={true}
        />
      )

      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
        expect(reconnectButton).toBeInTheDocument()
      })
    })
  })

  describe('Callback Functions', () => {
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
      await user.click(refreshButton)

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1)
      })
    })

    it('calls onReconnect when reconnect button is clicked', async () => {
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
      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        const reconnectButton = screen.getByRole('button', { name: /reconnect/i })
        return user.click(reconnectButton)
      })

      await waitFor(() => {
        expect(mockReconnect).toHaveBeenCalledTimes(1)
      })
    })

    it('shows loading state during refresh', async () => {
      let resolveRefresh: () => void
      const mockRefresh = jest.fn(() => new Promise<void>(resolve => {
        resolveRefresh = resolve
      }))
      
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
      await user.click(refreshButton)

      // Should show loading state
      expect(refreshButton).toBeDisabled()

      // Resolve the promise
      resolveRefresh!()
      
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled()
      })
    })

    it('shows loading state during reconnect', async () => {
      let resolveReconnect: () => void
      const mockReconnect = jest.fn(() => new Promise<void>(resolve => {
        resolveReconnect = resolve
      }))
      
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
      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      const reconnectButton = await screen.findByRole('button', { name: /reconnect/i })
      await user.click(reconnectButton)

      // Should show loading state
      expect(reconnectButton).toBeDisabled()

      // Resolve the promise
      resolveReconnect!()
      
      await waitFor(() => {
        expect(reconnectButton).not.toBeDisabled()
      })
    })
  })

  describe('Status Types', () => {
    it('handles connecting status', () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockConnectingStatus}
          compact={true}
        />
      )

      expect(screen.getByText('Connecting')).toBeInTheDocument()
    })

    it('handles unavailable status', () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="localhost"
          status={mockUnavailableStatus}
          compact={true}
        />
      )

      expect(screen.getByText('Unavailable')).toBeInTheDocument()
    })

    it('handles disconnected status', () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="localhost"
          status={mockDisconnectedStatus}
          compact={true}
        />
      )

      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockStatus}
          compact={false}
          showDetails={true}
        />
      )

      const refreshButton = screen.getByLabelText('Refresh provider status')
      expect(refreshButton).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockStatus}
          compact={false}
          showDetails={true}
        />
      )

      const refreshButton = screen.getByLabelText('Refresh provider status')
      
      // Focus the button
      refreshButton.focus()
      expect(refreshButton).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={mockStatus}
          compact={false}
          showDetails={true}
        />
      )

      // Should render without crashing even without callbacks
      expect(screen.getByText('MongoDB')).toBeInTheDocument()
    })

    it('handles unknown provider names', () => {
      renderWithTheme(
        <ProviderStatusIndicator
          providerName="unknown"
          status={mockStatus}
          compact={false}
          showDetails={true}
        />
      )

      // Should still render with default icon
      expect(screen.getByText('unknown')).toBeInTheDocument()
    })

    it('handles status without message', async () => {
      const statusWithoutMessage: ProviderStatusInfo = {
        status: ProviderStatus.CONNECTED,
        lastChecked: new Date('2023-01-01T12:00:00Z')
      }

      renderWithTheme(
        <ProviderStatusIndicator
          providerName="mongodb"
          status={statusWithoutMessage}
          compact={false}
          showDetails={true}
        />
      )

      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      // Should still show details without crashing
      await waitFor(() => {
        expect(screen.getByText(/Last checked:/)).toBeInTheDocument()
      })
    })

    it('closes popover when clicking outside', async () => {
      renderWithTheme(
        <div>
          <ProviderStatusIndicator
            providerName="mongodb"
            status={mockStatus}
            compact={false}
            showDetails={true}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      )

      // Open popover
      const providerElement = screen.getByText('MongoDB')
      await user.click(providerElement)

      await waitFor(() => {
        expect(screen.getByText('Connected successfully')).toBeInTheDocument()
      })

      // Click outside
      const outsideElement = screen.getByTestId('outside')
      await user.click(outsideElement)

      await waitFor(() => {
        expect(screen.queryByText('Connected successfully')).not.toBeInTheDocument()
      })
    })
  })
})