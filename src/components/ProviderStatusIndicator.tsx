'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  Popover,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material'
import { ProviderStatus, ProviderStatusInfo } from '../providers/types'

interface ProviderStatusIndicatorProps {
  providerName: string
  status: ProviderStatusInfo
  onRefresh?: () => Promise<void>
  onReconnect?: () => Promise<void>
  compact?: boolean
  showDetails?: boolean
}

export const ProviderStatusIndicator = ({
  providerName,
  status,
  onRefresh,
  onReconnect,
  compact = false,
  showDetails = true
}: ProviderStatusIndicatorProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (showDetails) {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleRefresh = async () => {
    if (!onRefresh) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleReconnect = async () => {
    if (!onReconnect) return
    
    setIsReconnecting(true)
    try {
      await onReconnect()
    } finally {
      setIsReconnecting(false)
    }
  }

  const getStatusColor = (status: ProviderStatus) => {
    switch (status) {
      case ProviderStatus.CONNECTED:
        return 'success'
      case ProviderStatus.CONNECTING:
        return 'info'
      case ProviderStatus.DISCONNECTED:
        return 'default'
      case ProviderStatus.ERROR:
        return 'error'
      case ProviderStatus.UNAVAILABLE:
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: ProviderStatus) => {
    switch (status) {
      case ProviderStatus.CONNECTED:
        return <CheckCircleIcon fontSize="small" />
      case ProviderStatus.CONNECTING:
        return <CircularProgress size={16} />
      case ProviderStatus.DISCONNECTED:
        return <InfoIcon fontSize="small" />
      case ProviderStatus.ERROR:
        return <ErrorIcon fontSize="small" />
      case ProviderStatus.UNAVAILABLE:
        return <WarningIcon fontSize="small" />
      default:
        return <InfoIcon fontSize="small" />
    }
  }

  const getProviderIcon = (providerName: string) => {
    switch (providerName) {
      case 'localhost':
        return <StorageIcon fontSize="small" />
      case 'mongodb':
        return <CloudIcon fontSize="small" />
      default:
        return <InfoIcon fontSize="small" />
    }
  }

  const getStatusText = (status: ProviderStatus) => {
    switch (status) {
      case ProviderStatus.CONNECTED:
        return 'Connected'
      case ProviderStatus.CONNECTING:
        return 'Connecting'
      case ProviderStatus.DISCONNECTED:
        return 'Disconnected'
      case ProviderStatus.ERROR:
        return 'Error'
      case ProviderStatus.UNAVAILABLE:
        return 'Unavailable'
      default:
        return 'Unknown'
    }
  }

  const formatConnectionTime = (connectionTime?: number) => {
    if (!connectionTime) return null
    
    if (connectionTime < 1000) {
      return `${connectionTime}ms`
    } else {
      return `${(connectionTime / 1000).toFixed(1)}s`
    }
  }

  const formatLastChecked = (lastChecked: Date) => {
    // Avoid hydration mismatches by using consistent formatting
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(lastChecked)
  }

  if (compact) {
    return (
      <Tooltip title={`${providerName}: ${getStatusText(status.status)}`}>
        <Chip
          icon={getStatusIcon(status.status)}
          label={getStatusText(status.status)}
          color={getStatusColor(status.status) as any}
          size="small"
          variant="outlined"
          onClick={showDetails ? handleClick : undefined}
          sx={{ cursor: showDetails ? 'pointer' : 'default' }}
        />
      </Tooltip>
    )
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: showDetails ? 'pointer' : 'default',
          p: 1,
          borderRadius: 1,
          '&:hover': showDetails ? {
            bgcolor: 'action.hover'
          } : {}
        }}
        onClick={handleClick}
      >
        {getProviderIcon(providerName)}
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {providerName === 'localhost' ? 'Local Storage' : 'MongoDB'}
        </Typography>
        <Chip
          icon={getStatusIcon(status.status)}
          label={getStatusText(status.status)}
          color={getStatusColor(status.status) as any}
          size="small"
          variant="outlined"
        />
        {showDetails && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              handleRefresh()
            }}
            disabled={isRefreshing}
            aria-label="Refresh provider status"
          >
            {isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {showDetails && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Card sx={{ minWidth: 300, maxWidth: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getProviderIcon(providerName)}
                <Typography variant="h6">
                  {providerName === 'localhost' ? 'Local Storage' : 'MongoDB'}
                </Typography>
                <Chip
                  icon={getStatusIcon(status.status)}
                  label={getStatusText(status.status)}
                  color={getStatusColor(status.status) as any}
                  size="small"
                />
              </Box>

              {status.message && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {status.message}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Last checked: {formatLastChecked(status.lastChecked)}
                </Typography>
                
                {status.connectionTime && (
                  <Typography variant="caption" color="text.secondary">
                    Connection time: {formatConnectionTime(status.connectionTime)}
                  </Typography>
                )}
              </Box>

              {status.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {status.error.message}
                  </Typography>
                </Alert>
              )}

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={isRefreshing || !onRefresh}
                >
                  Refresh
                </Button>
                
                {(status.status === ProviderStatus.ERROR || 
                  status.status === ProviderStatus.DISCONNECTED ||
                  status.status === ProviderStatus.UNAVAILABLE) && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={isReconnecting ? <CircularProgress size={16} /> : <RefreshIcon />}
                    onClick={handleReconnect}
                    disabled={isReconnecting || !onReconnect}
                  >
                    Reconnect
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Popover>
      )}
    </>
  )
}