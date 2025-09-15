// Core interfaces and types
export type { 
  IDataProvider, 
  MongoDBConfig, 
  ProviderConfig, 
  AppSettings 
} from './types'

export { 
  DataProviderError, 
  ProviderError 
} from './types'

// Core infrastructure
export { DataProviderManager } from './DataProviderManager'
export { FallbackHandler } from './FallbackHandler'

// Data providers
export { LocalStorageProvider } from './LocalStorageProvider'
export { MongoDBProvider } from './MongoDBProvider'

// Migration services
export { DataMigrationService } from './DataMigration'
export type { 
  MigrationStatus, 
  MigrationProgress, 
  MigrationOptions, 
  MigrationResult,
  DataExport 
} from './DataMigration'