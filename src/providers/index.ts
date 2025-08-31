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