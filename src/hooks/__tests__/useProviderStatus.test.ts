import { renderHook, act, waitFor } from '@testing-library/react'
import { useProviderStatus } from '../useProviderStatus'
import { ProviderStatus, ProviderStatusInfo, DataProviderError, ProviderError } from '../../providers/types'

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

describe('useProviderStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('loads initial status', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        autoRefresh: false
      })
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.status).toEqual(mockStatus)
    expect(result.current.error).toBeNull()
    expect(mockGetStatus).toHaveBeenCalledTimes(1)
  })

  it('handles status loading error', async () => {
    const mockError = new Error('Failed to get status')
    const mockGetStatus = jest.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        autoRefresh: false
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.status?.status).toBe(ProviderStatus.ERROR)
  })

  it('refreshes status manually', async () => {
    const mockGetStatus = jest.fn()
      .mockResolvedValueOnce(mockStatus)
      .mockResolvedValueOnce({ ...mockStatus, message: 'Refreshed' })

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        autoRefresh: false
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.status?.message).toBe('Connected successfully')

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.status?.message).toBe('Refreshed')
    expect(mockGetStatus).toHaveBeenCalledTimes(2)
  })

  it('tests connection', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)
    const mockTestConnection = jest.fn().mockResolvedValue(true)

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        testConnection: mockTestConnection,
        autoRefresh: false
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let testResult: boolean
    await act(async () => {
      testResult = await result.current.testConnection()
    })

    expect(testResult!).toBe(true)
    expect(mockTestConnection).toHaveBeenCalledTimes(1)
    expect(mockGetStatus).toHaveBeenCalledTimes(2) // Initial load + refresh after test
  })

  it('reconnects provider', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)
    const mockReconnect = jest.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        reconnect: mockReconnect,
        autoRefresh: false
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.reconnect()
    })

    expect(mockReconnect).toHaveBeenCalledTimes(1)
    expect(mockGetStatus).toHaveBeenCalledTimes(2) // Initial load + refresh after reconnect
  })

  it('handles reconnect failure', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)
    const mockError = new Error('Reconnect failed')
    const mockReconnect = jest.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        reconnect: mockReconnect,
        autoRefresh: false
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      try {
        await result.current.reconnect()
      } catch (error) {
        expect(error).toEqual(mockError)
      }
    })

    expect(result.current.error).toEqual(mockError)
  })

  it('disables auto-refresh when autoRefresh is false', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)

    renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        autoRefresh: false,
        refreshInterval: 100
      })
    )

    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledTimes(1)
    })

    // Fast-forward time - should not trigger refresh
    act(() => {
      jest.advanceTimersByTime(200)
    })

    // Should still be 1 call
    expect(mockGetStatus).toHaveBeenCalledTimes(1)
  })

  it('auto-refreshes at specified interval', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)

    renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        autoRefresh: true,
        refreshInterval: 100 // Short interval for testing
      })
    )

    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledTimes(1)
    })

    // Fast-forward time by interval
    act(() => {
      jest.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledTimes(2)
    })
  })

  it('falls back to refresh for test connection when testConnection not provided', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'mongodb',
        getStatus: mockGetStatus,
        autoRefresh: false
      })
    )

    await waitFor(() => {
      expect(result.current.status).not.toBeNull()
    })

    let testResult: boolean
    await act(async () => {
      testResult = await result.current.testConnection()
    })

    expect(testResult!).toBe(true) // Should return true because status is CONNECTED
    expect(mockGetStatus).toHaveBeenCalledTimes(2) // Initial load + refresh
  })

  it('throws error when reconnect not supported', async () => {
    const mockGetStatus = jest.fn().mockResolvedValue(mockStatus)

    const { result } = renderHook(() =>
      useProviderStatus({
        providerName: 'localhost',
        getStatus: mockGetStatus,
        autoRefresh: false
      })
    )

    await waitFor(() => {
      expect(result.current.status).not.toBeNull()
    })

    await act(async () => {
      try {
        await result.current.reconnect()
        fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).toBe('Reconnect not supported for this provider')
      }
    })
  })
})