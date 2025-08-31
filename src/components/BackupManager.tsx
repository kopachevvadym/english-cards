'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import { 
  Download, 
  Upload, 
  Delete as Trash2, 
  Security as Shield, 
  Event as Calendar,
  Storage as Database,
  Computer as HardDrive,
  Warning as AlertTriangle,
  CheckCircle,
  Description as FileText
} from '@mui/icons-material'
import { DataMigrationService, DataExport } from '../providers/DataMigration'
import { IDataProvider } from '../providers/types'

interface BackupManagerProps {
  isOpen: boolean
  onClose: () => void
  currentProvider: IDataProvider
  onBackupRestored: () => void
}

interface BackupInfo {
  key: string
  provider: string
  date: Date
  cardCount: number
}

export function BackupManager({
  isOpen,
  onClose,
  currentProvider,
  onBackupRestored
}: BackupManagerProps) {
  const [migrationService] = useState(() => new DataMigrationService())
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  const [showConfirmRestore, setShowConfirmRestore] = useState<BackupInfo | null>(null)

  // Load backups when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadBackups()
    }
  }, [isOpen])

  const loadBackups = () => {
    const availableBackups = migrationService.getAvailableBackups()
    setBackups(availableBackups)
  }

  const handleCreateBackup = async () => {
    setIsLoading(true)
    try {
      const backupLocation = await migrationService.createBackup(currentProvider)
      loadBackups() // Refresh the list
      
      // Show success message or notification
      console.log('Backup created:', backupLocation)
    } catch (error) {
      console.error('Failed to create backup:', error)
      // Show error message
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBackup = (backupKey: string) => {
    migrationService.deleteBackup(backupKey)
    loadBackups() // Refresh the list
    setShowConfirmDelete(null)
  }

  const handleRestoreBackup = async (backup: BackupInfo) => {
    setIsLoading(true)
    try {
      await migrationService.restoreFromBackup(currentProvider, backup.key, {
        createBackup: true, // Create backup before restore
        validateData: true,
        overwriteExisting: true,
        batchSize: 100,
        retryAttempts: 3
      })
      
      onBackupRestored()
      setShowConfirmRestore(null)
      
      // Show success message
      console.log('Backup restored successfully')
    } catch (error) {
      console.error('Failed to restore backup:', error)
      // Show error message
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportBackup = async (backup: BackupInfo) => {
    try {
      const backupData = localStorage.getItem(backup.key)
      if (!backupData) {
        throw new Error('Backup data not found')
      }

      const exportData: DataExport = JSON.parse(backupData)
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flashcards-backup-${backup.provider}-${backup.date.toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export backup:', error)
    }
  }

  const handleImportBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const exportData: DataExport = JSON.parse(text)
        
        // Validate the import data
        if (!exportData.version || !exportData.cards || !Array.isArray(exportData.cards)) {
          throw new Error('Invalid backup file format')
        }

        // Store as a new backup
        const backupKey = `imported_backup_${Date.now()}`
        localStorage.setItem(backupKey, text)
        
        loadBackups() // Refresh the list
        console.log('Backup imported successfully')
      } catch (error) {
        console.error('Failed to import backup:', error)
      }
    }
    input.click()
  }

  const getProviderIcon = (providerName: string) => {
    return providerName === 'mongodb' ? <Database /> : <HardDrive />
  }

  const getProviderDisplayName = (providerName: string) => {
    return providerName === 'mongodb' ? 'MongoDB' : 'Local Storage'
  }

  const formatDate = (date: Date) => {
    // Use ISO string to avoid hydration mismatches between server and client
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }

  const formatFileSize = (cardCount: number) => {
    // Rough estimate: each card is about 200 bytes on average
    const bytes = cardCount * 200
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield />
          <Typography variant="h6">Backup Manager</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Create, manage, and restore backups of your flashcard data
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Current Provider Info */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              avatar={getProviderIcon(currentProvider.getProviderName())}
              title={`Current Provider: ${getProviderDisplayName(currentProvider.getProviderName())}`}
              subheader="Create a backup of your current flashcard data"
            />
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained"
                  onClick={handleCreateBackup} 
                  disabled={isLoading}
                  startIcon={<Shield />}
                >
                  Create Backup
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleImportBackup}
                  startIcon={<Upload />}
                >
                  Import Backup
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Backup List */}
          <Card variant="outlined">
            <CardHeader
              title="Available Backups"
              subheader={
                backups.length === 0 
                  ? 'No backups found. Create your first backup to get started.'
                  : `${backups.length} backup${backups.length === 1 ? '' : 's'} available`
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {backups.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Shield sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No backups available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a backup to protect your data
                  </Typography>
                </Box>
              ) : (
                <List>
                  {backups.map((backup, index) => (
                    <ListItem key={backup.key} divider={index < backups.length - 1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {getProviderIcon(backup.provider)}
                      </Box>
                      <ListItemText
                        primary={`${getProviderDisplayName(backup.provider)} Backup`}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Calendar sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {formatDate(backup.date)}
                              </Typography>
                            </Box>
                            <Chip 
                              label={`${backup.cardCount} cards`} 
                              size="small" 
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              ~{formatFileSize(backup.cardCount)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleExportBackup(backup)}
                            title="Export"
                          >
                            <Download />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            onClick={() => setShowConfirmRestore(backup)}
                            disabled={isLoading}
                            title="Restore"
                          >
                            <Upload />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            onClick={() => setShowConfirmDelete(backup.key)}
                            color="error"
                            title="Delete"
                          >
                            <Trash2 />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Dialogs */}
          {showConfirmDelete && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Are you sure you want to delete this backup? This action cannot be undone.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleDeleteBackup(showConfirmDelete)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowConfirmDelete(null)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Alert>
          )}

          {showConfirmRestore && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Warning:</strong> Restoring this backup will replace all current data in your {getProviderDisplayName(currentProvider.getProviderName())} provider.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  This backup contains <strong>{showConfirmRestore.cardCount} cards</strong> from {formatDate(showConfirmRestore.date)}.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  A backup of your current data will be created before the restore.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleRestoreBackup(showConfirmRestore)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Restoring...' : 'Restore Backup'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowConfirmRestore(null)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Alert>
          )}

          {/* Help Text */}
          <Card variant="outlined" sx={{ mt: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                About Backups:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Backups are stored locally in your browser's storage
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Export backups to save them as files on your computer
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Import backup files to restore them in any browser
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Backups include all card data and metadata
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Regular backups are recommended before switching providers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}