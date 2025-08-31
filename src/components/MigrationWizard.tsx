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
  Typography,
  Box,
  Alert,
  Chip,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import { 
  ArrowForward as ArrowRight, 
  Storage as Database, 
  Computer as HardDrive, 
  Warning as AlertTriangle, 
  CheckCircle, 
  Cancel as XCircle, 
  Security as Shield,
  Refresh as RefreshCw
} from '@mui/icons-material'
import { DataMigrationService, MigrationStatus, MigrationProgress, MigrationOptions, MigrationResult } from '../providers/DataMigration'
import { IDataProvider } from '../providers/types'

interface MigrationWizardProps {
  isOpen: boolean
  onClose: () => void
  sourceProvider: IDataProvider
  targetProvider: IDataProvider
  onMigrationComplete: (result: MigrationResult) => void
}

const steps = ['Configure', 'Confirm', 'Migrate', 'Complete']

export function MigrationWizard({
  isOpen,
  onClose,
  sourceProvider,
  targetProvider,
  onMigrationComplete
}: MigrationWizardProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [migrationService] = useState(() => new DataMigrationService())
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [sourceCardCount, setSourceCardCount] = useState<number>(0)
  const [targetCardCount, setTargetCardCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  
  const [options, setOptions] = useState<MigrationOptions>({
    createBackup: true,
    validateData: true,
    overwriteExisting: false,
    batchSize: 100,
    retryAttempts: 3
  })

  // Load card counts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCardCounts()
      setActiveStep(0)
      setMigrationProgress(null)
      setMigrationResult(null)
    }
  }, [isOpen, sourceProvider, targetProvider])

  // Set up migration progress listener
  useEffect(() => {
    const handleProgress = (progress: MigrationProgress) => {
      setMigrationProgress(progress)
    }

    migrationService.addProgressListener(handleProgress)
    
    return () => {
      migrationService.removeProgressListener(handleProgress)
    }
  }, [migrationService])

  const loadCardCounts = async () => {
    setIsLoading(true)
    try {
      const [sourceCards, targetCards] = await Promise.all([
        sourceProvider.getCards(),
        targetProvider.getCards()
      ])
      setSourceCardCount(sourceCards.length)
      setTargetCardCount(targetCards.length)
    } catch (error) {
      console.error('Failed to load card counts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartMigration = async () => {
    setActiveStep(2) // Move to migration step
    
    try {
      const result = await migrationService.migrateData(
        sourceProvider,
        targetProvider,
        options
      )
      
      setMigrationResult(result)
      setActiveStep(3) // Move to complete step
      onMigrationComplete(result)
      
    } catch (error) {
      console.error('Migration failed:', error)
      // The error will be captured in the migration result
    }
  }

  const handleCancel = () => {
    if (activeStep === 2) {
      migrationService.cancelMigration()
    }
    onClose()
  }

  const getProviderIcon = (providerName: string) => {
    return providerName === 'mongodb' ? <Database /> : <HardDrive />
  }

  const getProviderDisplayName = (providerName: string) => {
    return providerName === 'mongodb' ? 'MongoDB' : 'Local Storage'
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Migration Configuration
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getProviderIcon(sourceProvider.getProviderName())}
                <Typography variant="body1">
                  {getProviderDisplayName(sourceProvider.getProviderName())}
                </Typography>
                <Chip label={`${sourceCardCount} cards`} size="small" />
              </Box>
              <ArrowRight sx={{ mx: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getProviderIcon(targetProvider.getProviderName())}
                <Typography variant="body1">
                  {getProviderDisplayName(targetProvider.getProviderName())}
                </Typography>
                <Chip label={`${targetCardCount} cards`} size="small" />
              </Box>
            </Box>

            {targetCardCount > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                The target provider already contains {targetCardCount} cards. 
                Enable "Overwrite Existing" to replace them.
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.createBackup}
                    onChange={(e) => setOptions(prev => ({ ...prev, createBackup: e.target.checked }))}
                  />
                }
                label="Create backup before migration"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Recommended. Creates a backup of target data that can be restored if needed.
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.validateData}
                    onChange={(e) => setOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                  />
                }
                label="Validate data integrity"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                Verifies that all data was migrated correctly using checksums.
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.overwriteExisting}
                    onChange={(e) => setOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                  />
                }
                label="Overwrite existing data"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Replace any existing data in the target provider.
              </Typography>
            </Box>
          </Box>
        )

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Confirm Migration
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Migration Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Source:</Typography>
                  <Typography variant="body2">
                    {getProviderDisplayName(sourceProvider.getProviderName())}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Target:</Typography>
                  <Typography variant="body2">
                    {getProviderDisplayName(targetProvider.getProviderName())}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Cards to migrate:</Typography>
                  <Chip label={sourceCardCount} size="small" />
                </Box>
              </CardContent>
            </Card>

            {options.overwriteExisting && targetCardCount > 0 && (
              <Alert severity="warning">
                <strong>Warning:</strong> This will permanently replace {targetCardCount} existing cards 
                in {getProviderDisplayName(targetProvider.getProviderName())}.
                {options.createBackup && " A backup will be created first."}
              </Alert>
            )}
          </Box>
        )

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Migration in Progress
            </Typography>
            
            {migrationProgress && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {migrationProgress.status === MigrationStatus.COMPLETED ? (
                      <CheckCircle color="success" />
                    ) : migrationProgress.status === MigrationStatus.FAILED ? (
                      <XCircle color="error" />
                    ) : (
                      <RefreshCw className="animate-spin" />
                    )}
                    <Typography variant="subtitle1">
                      {migrationProgress.currentStep}
                    </Typography>
                    <Chip 
                      label={migrationProgress.status} 
                      size="small"
                      color={
                        migrationProgress.status === MigrationStatus.COMPLETED ? 'success' :
                        migrationProgress.status === MigrationStatus.FAILED ? 'error' :
                        'default'
                      }
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Overall Progress</Typography>
                      <Typography variant="body2">
                        {migrationProgress.completedSteps}/{migrationProgress.totalSteps} steps
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(migrationProgress.completedSteps / migrationProgress.totalSteps) * 100} 
                    />
                  </Box>

                  {migrationProgress.totalItems > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Items Processed</Typography>
                        <Typography variant="body2">
                          {migrationProgress.processedItems}/{migrationProgress.totalItems}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(migrationProgress.processedItems / migrationProgress.totalItems) * 100} 
                      />
                    </Box>
                  )}

                  {migrationProgress.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {migrationProgress.error.message}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        )

      case 3:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Migration Complete
            </Typography>
            
            {migrationResult && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {migrationResult.success ? (
                      <CheckCircle color="success" />
                    ) : (
                      <XCircle color="error" />
                    )}
                    <Typography variant="subtitle1">
                      {migrationResult.success ? 'Success' : 'Failed'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Cards:</Typography>
                      <Typography variant="body1">{migrationResult.totalCards}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Migrated:</Typography>
                      <Typography variant="body1" color="success.main">{migrationResult.migratedCards}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Skipped:</Typography>
                      <Typography variant="body1" color="warning.main">{migrationResult.skippedCards}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Duration:</Typography>
                      <Typography variant="body1">{Math.round(migrationResult.duration / 1000)}s</Typography>
                    </Box>
                  </Box>

                  {migrationResult.backupLocation && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Shield />
                        <Typography variant="body2">
                          Backup created: {migrationResult.backupLocation}
                        </Typography>
                      </Box>
                    </Alert>
                  )}

                  {migrationResult.errors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Errors:
                      </Typography>
                      {migrationResult.errors.map((error, index) => (
                        <Alert key={index} severity="error" sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            {error.message}
                          </Typography>
                        </Alert>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    if (activeStep === 0) {
      return targetCardCount === 0 || options.overwriteExisting
    }
    return true
  }

  const handleNext = () => {
    if (activeStep === 1) {
      handleStartMigration()
    } else {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Database />
          <Typography variant="h6">Data Migration Wizard</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Migrate your flashcard data between storage providers
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>
          Cancel
        </Button>
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
          >
            {activeStep === 1 ? 'Start Migration' : 'Next'}
          </Button>
        )}
        {activeStep === 3 && (
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}