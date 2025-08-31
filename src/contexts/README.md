# Settings Management System

This module provides a comprehensive settings management system for the flashcard application, allowing users to configure and switch between different data providers (localStorage and MongoDB).

## Features

- **React Context**: Centralized settings management using React Context API
- **Persistent Storage**: Automatic persistence to localStorage with validation
- **Provider Switching**: Seamless switching between localStorage and MongoDB providers
- **Validation**: Comprehensive validation for all configuration options
- **Error Handling**: Graceful error handling with fallback mechanisms
- **TypeScript Support**: Full TypeScript support with proper type definitions

## Usage

### Basic Setup

```tsx
import { SettingsProvider } from '../contexts'

function App() {
  return (
    <SettingsProvider>
      <YourAppComponents />
    </SettingsProvider>
  )
}
```

### Using Settings in Components

```tsx
import { useSettings } from '../contexts'

function MyComponent() {
  const {
    dataProvider,
    setDataProvider,
    mongoConfig,
    setMongoConfig,
    isValidConfiguration,
    resetToDefaults
  } = useSettings()

  const handleProviderSwitch = () => {
    setDataProvider('mongodb')
  }

  const handleMongoConfigUpdate = () => {
    setMongoConfig({
      connectionString: 'mongodb://localhost:27017',
      databaseName: 'flashcards',
      collectionName: 'cards'
    })
  }

  return (
    <div>
      <p>Current Provider: {dataProvider}</p>
      <p>MongoDB Valid: {isValidConfiguration('mongodb').toString()}</p>
      <button onClick={handleProviderSwitch}>Switch to MongoDB</button>
      <button onClick={handleMongoConfigUpdate}>Update MongoDB Config</button>
      <button onClick={resetToDefaults}>Reset to Defaults</button>
    </div>
  )
}
```

## API Reference

### SettingsContextType

```typescript
interface SettingsContextType {
  // Current data provider selection
  dataProvider: DataProviderType
  setDataProvider: (provider: DataProviderType) => void
  
  // MongoDB configuration
  mongoConfig: MongoDBConfig
  setMongoConfig: (config: MongoDBConfig) => void
  
  // Full settings object
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  
  // Validation and status
  isValidConfiguration: (provider: DataProviderType) => boolean
  resetToDefaults: () => void
  
  // Storage availability
  isStorageAvailable: boolean
}
```

### Data Provider Types

```typescript
type DataProviderType = 'localhost' | 'mongodb'
```

### MongoDB Configuration

```typescript
interface MongoDBConfig {
  connectionString: string
  databaseName: string
  collectionName: string
}
```

## Validation

The system includes comprehensive validation for:

- **MongoDB Connection Strings**: Must start with `mongodb://` or `mongodb+srv://`
- **Database Names**: Must be valid MongoDB database names (no special characters, max 64 chars)
- **Collection Names**: Must be valid MongoDB collection names (no system prefixes, no $ character)

## Error Handling

- **Storage Errors**: Gracefully handles localStorage unavailability
- **Validation Errors**: Prevents saving invalid configurations
- **Loading Errors**: Falls back to defaults when stored settings are corrupted
- **Provider Errors**: Validates provider configurations before switching

## Testing

The module includes comprehensive tests:

- Unit tests for validation functions
- Unit tests for storage utilities
- Integration tests for the React context
- Error scenario testing

Run tests with:
```bash
npm test -- --testPathPatterns="settings|SettingsContext"
```