import { useState, useEffect, useCallback } from 'react'
import { ProviderStatusInfo, ProviderStatus } from '../providers/types'

interface UseProviderStatusOptions {
  providerName: string
  getStatus: () => Promise<ProviderStatusInfo>
  testConnection?: () => Promise<boolean>
  reconnect?: () => Promise<void>
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseProviderStatusReturn {
  status: ProviderStatusInfo | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  testConnection: () => Promise<boolean>
  reconnect: () => Promise<void>
}

export const useProviderStatus = ({
  providerName,
  getStatus,
  testConnection,
  reconnect,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UseProviderStatusOptions): UseProviderStatusReturn => {
  const [status, setStatus] = useState<ProviderStatusInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const newStatus = await getStatus()
      setStatus(newStatus)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get provider status')
      setError(error)
      
      // Set error status if we can't get the actual status
      setStatus({
        status: ProviderStatus.ERROR,
        message: error.message,
        lastChecked: new Date(),
        error: err as any
      })
    } finally {
      setIsLoading(false)
    }
  }, [getStatus])

  const handleTestConnection = useCallback(async (): Promise<boolean> => {
    if (!testConnection) {
      // Fallback to refresh status
      await refresh()
      return status?.status === ProviderStatus.CONNECTED || false
    }

    try {
      const result = await testConnection()
      // Refresh status after test
      await refresh()
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Connection test failed'))
      return false
    }
  }, [testConnection, refresh, status])

  const handleReconnect = useCallback(async (): Promise<void> => {
    if (!reconnect) {
      throw new Error('Reconnect not supported for this provider')
    }

    try {
      setError(null)
      await reconnect()
      // Refresh status after reconnect
      await refresh()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Reconnection failed')
      setError(error)
      throw error
    }
  }, [reconnect, refresh])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Only auto-refresh if we're not in an error state or if enough time has passed
      if (!status || status.status !== ProviderStatus.ERROR || 
          Date.now() - status.lastChecked.getTime() > refreshInterval * 2) {
        refresh()
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refresh]) // Remove status dependency to avoid recreating interval

  return {
    status,
    isLoading,
    error,
    refresh,
    testConnection: handleTestConnection,
    reconnect: handleReconnect
  }
}