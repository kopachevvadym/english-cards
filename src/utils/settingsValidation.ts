import { MongoDBConfig, AppSettings } from '../providers/types'
import { DataProviderType } from '../contexts/SettingsContext'

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validates MongoDB connection string format
 */
export function validateMongoConnectionString(connectionString: string): ValidationResult {
  const errors: string[] = []
  
  if (!connectionString || connectionString.trim().length === 0) {
    errors.push('Connection string is required')
    return { isValid: false, errors }
  }

  const trimmed = connectionString.trim()
  
  // Basic MongoDB connection string format validation
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    errors.push('Connection string must start with mongodb:// or mongodb+srv://')
  }

  // Check for basic structure
  if (trimmed.length < 12) { // minimum: mongodb://x
    errors.push('Connection string appears to be too short')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates database name
 */
export function validateDatabaseName(databaseName: string): ValidationResult {
  const errors: string[] = []
  
  if (!databaseName || databaseName.trim().length === 0) {
    errors.push('Database name is required')
    return { isValid: false, errors }
  }

  const trimmed = databaseName.trim()
  
  // MongoDB database name restrictions
  if (trimmed.length > 64) {
    errors.push('Database name must be 64 characters or less')
  }

  // Check for invalid characters
  const invalidChars = /[\/\\. "$*<>:|?]/
  if (invalidChars.test(trimmed)) {
    errors.push('Database name contains invalid characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates collection name
 */
export function validateCollectionName(collectionName: string): ValidationResult {
  const errors: string[] = []
  
  if (!collectionName || collectionName.trim().length === 0) {
    errors.push('Collection name is required')
    return { isValid: false, errors }
  }

  const trimmed = collectionName.trim()
  
  // MongoDB collection name restrictions
  if (trimmed.startsWith('system.')) {
    errors.push('Collection name cannot start with "system."')
  }

  if (trimmed.includes('$')) {
    errors.push('Collection name cannot contain "$" character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates complete MongoDB configuration
 */
export function validateMongoDBConfig(config: MongoDBConfig): ValidationResult {
  const errors: string[] = []
  
  const connectionResult = validateMongoConnectionString(config.connectionString)
  const databaseResult = validateDatabaseName(config.databaseName)
  const collectionResult = validateCollectionName(config.collectionName)
  
  errors.push(...connectionResult.errors)
  errors.push(...databaseResult.errors)
  errors.push(...collectionResult.errors)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates provider configuration based on type
 */
export function validateProviderConfiguration(
  provider: DataProviderType, 
  settings: AppSettings
): ValidationResult {
  switch (provider) {
    case 'localhost':
      // localStorage is always available in browser environment
      return { isValid: true, errors: [] }
    
    case 'mongodb':
      return validateMongoDBConfig(settings.providers.mongodb.config)
    
    default:
      return { 
        isValid: false, 
        errors: [`Unknown provider type: ${provider}`] 
      }
  }
}

/**
 * Validates complete application settings
 */
export function validateAppSettings(settings: AppSettings): ValidationResult {
  const errors: string[] = []
  
  // Validate selected provider exists
  if (!settings.providers[settings.selectedProvider as keyof typeof settings.providers]) {
    errors.push(`Selected provider "${settings.selectedProvider}" is not configured`)
  }
  
  // Validate each provider configuration
  Object.entries(settings.providers).forEach(([providerName, config]) => {
    if (!config.name || !config.displayName) {
      errors.push(`Provider "${providerName}" is missing required fields`)
    }
  })
  
  // Validate the currently selected provider
  const selectedProviderResult = validateProviderConfiguration(
    settings.selectedProvider as DataProviderType, 
    settings
  )
  
  if (!selectedProviderResult.isValid) {
    errors.push(`Selected provider configuration is invalid: ${selectedProviderResult.errors.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}