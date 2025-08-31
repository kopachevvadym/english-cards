'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  Box,
  Alert,
  Divider,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Tab,
  Tabs,
} from '@mui/material'
import {
  Storage as StorageIcon,
  Cloud as CloudIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  SwapHoriz as SwapHorizIcon,
  Backup as BackupIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useSettings, DataProviderType } from '../contexts/SettingsContext'
import { MongoDBConfig, ProviderStatusInfo, ProviderStatus } from '../providers/types'
import { ProviderStatusIndicator } from './ProviderStatusIndicator'
import { useProviderStatus } from '../hooks/useProviderStatus'
import { useCards } from '../hooks/useCards'
import { MigrationWizard } from './MigrationWizard'
import { BackupManager } from './BackupManager'
import { MigrationResult } from '../providers/DataMigration'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

interface ValidationErrors {
  connectionString?: string
  databaseName?: string
  collectionName?: string
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const {
    dataProvider,
    setDataProvider,
    mongoConfig,
    setMongoConfig,
    isValidConfiguration,
    resetToDefaults,
    isStorageAvailable
  } = useSettings()

  const [selectedProvider, setSelectedProvider] = useState<DataProviderType>(dataProvider)
  const [mongoSettings, setMongoSettings] = useState<MongoDBConfig>(mongoConfig)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderStatusInfo>>({})
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [showMigrationWizard, setShowMigrationWizard] = useState(false)
  const [showBackupManager, setShowBackupManager] = useState(false)

  // Get access to provider manager through useCards
  const { providerManager } = useCards()

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProvider(dataProvider)
      setMongoSettings(mongoConfig)
      setValidationErrors({})
      setConnectionTestResult(null)
      setHasUnsavedChanges(false)
      setShowAdvancedSettings(false)
      setActiveTab(0)
      setShowMigrationWizard(false)
      setShowBackupManager(false)
    }
  }, [open, dataProvider, mongoConfig])

  // Track changes
  useEffect(() => {
    const hasProviderChange = selectedProvider !== dataProvider
    const hasMongoChange = JSON.stringify(mongoSettings) !== JSON.stringify(mongoConfig)
    setHasUnsavedChanges(hasProviderChange || hasMongoChange)
  }, [selectedProvider, mongoSettings, dataProvider, mongoConfig])

  // Load provider statuses
  const loadProviderStatuses = async () => {
    if (!providerManager) return

    setIsLoadingStatuses(true)
    try {
      const statuses = await providerManager.getAllProviderStatuses()
      setProviderStatuses(statuses)
    } catch (error) {
      console.error('Failed to load provider statuses:', error)
    } finally {
      setIsLoadingStatuses(false)
    }
  }

  // Load statuses when dialog opens
  useEffect(() => {
    if (open && providerManager) {
      loadProviderStatuses()
    }
  }, [open, providerManager])

  // Handle provider reconnection
  const handleProviderReconnect = async (providerName: string) => {
    if (!providerManager) return

    try {
      await providerManager.reconnectProvider(providerName)
      await loadProviderStatuses() // Refresh statuses
    } catch (error) {
      console.error(`Failed to reconnect ${providerName}:`, error)
    }
  }

  // Handle provider connection test
  const handleProviderTest = async (providerName: string) => {
    if (!providerManager) return false

    try {
      const result = await providerManager.testProviderConnection(providerName)
      await loadProviderStatuses() // Refresh statuses
      return result
    } catch (error) {
      console.error(`Failed to test ${providerName}:`, error)
      return false
    }
  }

  const validateMongoConfig = (config: MongoDBConfig): ValidationErrors => {
    const errors: ValidationErrors = {}

    if (!config.connectionString.trim()) {
      errors.connectionString = 'Connection string is required'
    } else if (!config.connectionString.startsWith('mongodb://') && !config.connectionString.startsWith('mongodb+srv://')) {
      errors.connectionString = 'Connection string must start with mongodb:// or mongodb+srv://'
    }

    if (!config.databaseName.trim()) {
      errors.databaseName = 'Database name is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.databaseName)) {
      errors.databaseName = 'Database name can only contain letters, numbers, underscores, and hyphens'
    }

    if (!config.collectionName.trim()) {
      errors.collectionName = 'Collection name is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.collectionName)) {
      errors.collectionName = 'Collection name can only contain letters, numbers, underscores, and hyphens'
    }

    return errors
  }

  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newProvider = event.target.value as DataProviderType
    setSelectedProvider(newProvider)
    setConnectionTestResult(null)
  }

  const handleMongoConfigChange = (field: keyof MongoDBConfig, value: string) => {
    const newConfig = { ...mongoSettings, [field]: value }
    setMongoSettings(newConfig)
    setConnectionTestResult(null)
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleTestConnection = async () => {
    const errors = validateMongoConfig(mongoSettings)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsTestingConnection(true)
    setConnectionTestResult(null)

    try {
      // Use the actual provider test if available
      const success = await handleProviderTest('mongodb')
      
      if (success) {
        setConnectionTestResult({
          success: true,
          message: 'Connection successful! MongoDB provider is ready to use.'
        })
      } else {
        setConnectionTestResult({
          success: false,
          message: 'Connection failed. Please check your connection string and try again.'
        })
      }
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: 'Connection test failed. Please verify your MongoDB configuration.'
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSave = () => {
    // Validate MongoDB config if MongoDB is selected
    if (selectedProvider === 'mongodb') {
      const errors = validateMongoConfig(mongoSettings)
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        return
      }
    }

    // Save settings
    setDataProvider(selectedProvider)
    if (selectedProvider === 'mongodb') {
      setMongoConfig(mongoSettings)
    }

    onClose()
  }

  const handleReset = () => {
    resetToDefaults()
    onClose()
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      // In a real app, you might want to show a confirmation dialog
      // For now, we'll just close without saving
    }
    onClose()
  }

  const handleMigrationComplete = (result: MigrationResult) => {
    // Refresh provider statuses after migration
    loadProviderStatuses()
    
    // If migration was successful, update the selected provider
    if (result.success) {
      // The migration wizard should handle provider switching
      console.log('Migration completed successfully:', result)
    }
  }

  const handleBackupRestored = () => {
    // Refresh provider statuses after backup restore
    loadProviderStatuses()
    console.log('Backup restored successfully')
  }

  const getOtherProvider = (): DataProviderType => {
    return dataProvider === 'localhost' ? 'mongodb' : 'localhost'
  }

  const canMigrate = (): boolean => {
    if (!providerManager) return false
    
    const otherProvider = getOtherProvider()
    const otherProviderStatus = providerStatuses[otherProvider]
    
    // Can migrate if the other provider is available/connected
    return otherProviderStatus?.status === ProviderStatus.CONNECTED
  }

  const getProviderStatus = (provider: DataProviderType) => {
    if (provider === 'localhost') {
      return isStorageAvailable ? 'available' : 'unavailable'
    } else {
      return isValidConfiguration(provider) ? 'configured' : 'needs-config'
    }
  }

  const renderProviderOption = (provider: DataProviderType, label: string, icon: React.ReactNode, description: string) => {
    const status = getProviderStatus(provider)
    const providerStatus = providerStatuses[provider]
    
    return (
      <Box
        sx={{
          border: 1,
          borderColor: selectedProvider === provider ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 2,
          mb: 2,
          bgcolor: selectedProvider === provider ? 'primary.50' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50'
          }
        }}
      >
        <FormControlLabel
          value={provider}
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              {icon}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* New provider status indicator */}
                {providerStatus ? (
                  <ProviderStatusIndicator
                    providerName={provider}
                    status={providerStatus}
                    compact={true}
                    showDetails={false}
                  />
                ) : (
                  <>
                    {/* Legacy status chips for backward compatibility */}
                    {status === 'available' && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Available"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {status === 'configured' && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Configured"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {status === 'needs-config' && (
                      <Chip
                        icon={<ErrorIcon />}
                        label="Needs Setup"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    {status === 'unavailable' && (
                      <Chip
                        icon={<ErrorIcon />}
                        label="Unavailable"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </>
                )}
              </Box>
            </Box>
          }
          sx={{ margin: 0, width: '100%' }}
        />
        
        {/* Detailed status information */}
        {providerStatus && selectedProvider === provider && (
          <Box sx={{ mt: 2, pl: 4 }}>
            <ProviderStatusIndicator
              providerName={provider}
              status={providerStatus}
              onRefresh={() => loadProviderStatuses()}
              onReconnect={() => handleProviderReconnect(provider)}
              compact={false}
              showDetails={true}
            />
          </Box>
        )}
      </Box>
    )
  }

  const renderProviderSettings = () => (
    <Box sx={{ py: 1 }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 500 }}>
          Select Data Provider
        </FormLabel>
        
        <RadioGroup
          value={selectedProvider}
          onChange={handleProviderChange}
        >
          {renderProviderOption(
            'localhost',
            'Local Storage',
            <StorageIcon color="primary" />,
            'Store data locally in your browser. Data stays on this device only.'
          )}
          
          {renderProviderOption(
            'mongodb',
            'MongoDB Database',
            <CloudIcon color="primary" />,
            'Store data in a MongoDB database. Access your data from anywhere.'
          )}
        </RadioGroup>
      </FormControl>

      {/* MongoDB Configuration */}
      <Collapse in={selectedProvider === 'mongodb'}>
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudIcon />
            MongoDB Configuration
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Configure your MongoDB connection. You'll need a MongoDB Atlas account or a local MongoDB instance.
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="Connection String"
            value={mongoSettings.connectionString}
            onChange={(e) => handleMongoConfigChange('connectionString', e.target.value)}
            placeholder="mongodb+srv://username:password@cluster.mongodb.net/"
            error={!!validationErrors.connectionString}
            helperText={validationErrors.connectionString || 'Your MongoDB connection string'}
            sx={{ mb: 2 }}
            type="password"
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Database Name"
              value={mongoSettings.databaseName}
              onChange={(e) => handleMongoConfigChange('databaseName', e.target.value)}
              placeholder="flashcards"
              error={!!validationErrors.databaseName}
              helperText={validationErrors.databaseName || 'Name of the database to use'}
            />
            
            <TextField
              fullWidth
              label="Collection Name"
              value={mongoSettings.collectionName}
              onChange={(e) => handleMongoConfigChange('collectionName', e.target.value)}
              placeholder="cards"
              error={!!validationErrors.collectionName}
              helperText={validationErrors.collectionName || 'Name of the collection to store cards'}
            />
          </Box>

          {/* Advanced Settings Toggle */}
          <Box sx={{ mb: 2 }}>
            <Button
              startIcon={showAdvancedSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              variant="text"
              size="small"
            >
              Advanced Settings
            </Button>
          </Box>

          <Collapse in={showAdvancedSettings}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Connection Tips:
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • For MongoDB Atlas: Use the connection string from your cluster's "Connect" button
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • For local MongoDB: Use mongodb://localhost:27017/
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Make sure to whitelist your IP address in MongoDB Atlas
              </Typography>
            </Box>
          </Collapse>

          {/* Connection Test */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !mongoSettings.connectionString}
              startIcon={isTestingConnection ? <CircularProgress size={16} /> : undefined}
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {connectionTestResult && (
              <Alert 
                severity={connectionTestResult.success ? 'success' : 'error'}
                sx={{ flexGrow: 1 }}
              >
                {connectionTestResult.message}
              </Alert>
            )}
          </Box>
        </Box>
      </Collapse>

      {/* Provider Status Overview */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Provider Status
          </Typography>
          <Button
            size="small"
            startIcon={isLoadingStatuses ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={loadProviderStatuses}
            disabled={isLoadingStatuses}
          >
            Refresh All
          </Button>
        </Box>
        
        {Object.keys(providerStatuses).length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(providerStatuses).map(([name, status]) => (
              <Card key={name} variant="outlined" sx={{ p: 1 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <ProviderStatusIndicator
                    providerName={name}
                    status={status}
                    onRefresh={() => loadProviderStatuses()}
                    onReconnect={() => handleProviderReconnect(name)}
                    compact={false}
                    showDetails={true}
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Alert severity="info">
            Provider status information is not available. Make sure you have providers configured.
          </Alert>
        )}
      </Box>

      {/* Current Status */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Current Status:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Active Provider: <strong>{dataProvider === 'localhost' ? 'Local Storage' : 'MongoDB'}</strong>
        </Typography>
        {hasUnsavedChanges && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            You have unsaved changes
          </Typography>
        )}
      </Box>
    </Box>
  )

  const renderMigrationTab = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapHorizIcon />
        Data Migration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Migrate your flashcard data between different storage providers. This is useful when switching 
          from local storage to MongoDB or vice versa.
        </Typography>
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Current Provider: {dataProvider === 'localhost' ? 'Local Storage' : 'MongoDB'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {dataProvider === 'localhost' ? <StorageIcon /> : <CloudIcon />}
            <Typography variant="body2" color="text.secondary">
              {dataProvider === 'localhost' 
                ? 'Your data is stored locally in this browser'
                : 'Your data is stored in MongoDB database'
              }
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<SwapHorizIcon />}
            onClick={() => setShowMigrationWizard(true)}
            disabled={!canMigrate()}
            sx={{ mt: 1 }}
          >
            Migrate to {getOtherProvider() === 'localhost' ? 'Local Storage' : 'MongoDB'}
          </Button>
          
          {!canMigrate() && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {getOtherProvider() === 'mongodb' 
                ? 'Configure and test MongoDB connection first'
                : 'Local storage is not available'
              }
            </Typography>
          )}
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Migration Features:
      </Typography>
      
      <Box sx={{ pl: 2 }}>
        <Typography variant="body2" paragraph>
          • <strong>Safe Migration:</strong> Automatic backup creation before migration
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Data Validation:</strong> Integrity checks ensure all data is transferred correctly
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Progress Tracking:</strong> Real-time progress updates during migration
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Error Recovery:</strong> Automatic retry and fallback mechanisms
        </Typography>
      </Box>
    </Box>
  )

  const renderBackupTab = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BackupIcon />
        Backup & Restore
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Create backups of your flashcard data for safekeeping. Backups can be exported as files 
          or restored to any provider.
        </Typography>
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Backup Management
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Create and manage backups of your current flashcard data. Backups include all cards 
            with their translations, examples, and metadata.
          </Typography>

          <Button
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={() => setShowBackupManager(true)}
            sx={{ mt: 1 }}
          >
            Manage Backups
          </Button>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Backup Features:
      </Typography>
      
      <Box sx={{ pl: 2 }}>
        <Typography variant="body2" paragraph>
          • <strong>Local Backups:</strong> Store backups in your browser for quick access
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Export/Import:</strong> Download backups as files or import from files
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Data Integrity:</strong> Checksums ensure backup data is not corrupted
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Restore Options:</strong> Restore to any configured provider
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Data Provider Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your flashcard data storage and migration
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<SettingsIcon />} 
            label="Provider Settings" 
            iconPosition="start"
          />
          <Tab 
            icon={<SwapHorizIcon />} 
            label="Migration" 
            iconPosition="start"
          />
          <Tab 
            icon={<BackupIcon />} 
            label="Backup & Restore" 
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderProviderSettings()}
          {activeTab === 1 && renderMigrationTab()}
          {activeTab === 2 && renderBackupTab()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {activeTab === 0 && (
          <>
            <Button onClick={handleReset} color="error" variant="outlined">
              Reset to Defaults
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={selectedProvider === 'mongodb' && Object.keys(validateMongoConfig(mongoSettings)).length > 0}
            >
              Save Settings
            </Button>
          </>
        )}
        {(activeTab === 1 || activeTab === 2) && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={handleClose}>
              Close
            </Button>
          </>
        )}
      </DialogActions>

      {/* Migration Wizard */}
      {showMigrationWizard && providerManager && (
        <MigrationWizard
          isOpen={showMigrationWizard}
          onClose={() => setShowMigrationWizard(false)}
          sourceProvider={providerManager.getProvider(dataProvider)!}
          targetProvider={providerManager.getProvider(getOtherProvider())!}
          onMigrationComplete={handleMigrationComplete}
        />
      )}

      {/* Backup Manager */}
      {showBackupManager && providerManager && (
        <BackupManager
          isOpen={showBackupManager}
          onClose={() => setShowBackupManager(false)}
          currentProvider={providerManager.getCurrentProvider()}
          onBackupRestored={handleBackupRestored}
        />
      )}
    </Dialog>
  )
}