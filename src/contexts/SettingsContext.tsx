'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { MongoDBConfig, ProviderConfig, AppSettings } from '../providers/types'
import { validateProviderConfiguration } from '../utils/settingsValidation'
import { loadSettings, saveSettings, isStorageAvailable } from '../utils/settingsStorage'

/**
 * Available data provider types
 */
export type DataProviderType = 'localhost' | 'mongodb'

/**
 * Settings context type definition
 */
export interface SettingsContextType {
  // Current data provider selection
  dataProvider: DataProviderType
  setDataProvider: (provider: DataProviderType) => void
  
  // MongoDB configuration
  mongoConfig: MongoDBConfig
  setMongoConfig: (config: MongoDBConfig) => void
  
  // UI preferences
  showTranslationFirst: boolean
  setShowTranslationFirst: (show: boolean) => void
  
  // Full settings object
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  
  // Validation and status
  isValidConfiguration: (provider: DataProviderType) => boolean
  resetToDefaults: () => void
  
  // Storage availability
  isStorageAvailable: boolean
}

/**
 * Default MongoDB configuration
 */
const DEFAULT_MONGO_CONFIG: MongoDBConfig = {
  connectionString: '',
  databaseName: 'flashcards',
  collectionName: 'cards'
}

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  selectedProvider: 'localhost',
  providers: {
    localhost: {
      name: 'localhost',
      displayName: 'Local Storage',
      isDefault: true
    },
    mongodb: {
      name: 'mongodb',
      displayName: 'MongoDB',
      isDefault: false,
      config: DEFAULT_MONGO_CONFIG
    }
  },
  showTranslationFirst: false
}

/**
 * Settings context
 */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

/**
 * Settings provider props
 */
interface SettingsProviderProps {
  children: ReactNode
}

/**
 * Settings provider component
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isInitialized, setIsInitialized] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(false)

  // Load settings from localStorage on mount (client-side only)
  useEffect(() => {
    // Check storage availability on client-side only
    const available = isStorageAvailable()
    setStorageAvailable(available)
    
    if (available) {
      const result = loadSettings(DEFAULT_SETTINGS)
      if (result.success && result.data) {
        setSettings(result.data)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && storageAvailable) {
      const result = saveSettings(settings)
      if (!result.success) {
        console.error('Failed to save settings:', result.error)
      }
    }
  }, [settings, isInitialized, storageAvailable])

  const setDataProvider = (provider: DataProviderType) => {
    setSettings(prev => ({
      ...prev,
      selectedProvider: provider
    }))
  }

  const setMongoConfig = (config: MongoDBConfig) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        mongodb: {
          ...prev.providers.mongodb,
          config
        }
      }
    }))
  }

  const setShowTranslationFirst = (show: boolean) => {
    setSettings(prev => ({
      ...prev,
      showTranslationFirst: show
    }))
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      providers: {
        ...prev.providers,
        ...newSettings.providers
      }
    }))
  }

  const isValidConfiguration = (provider: DataProviderType): boolean => {
    const result = validateProviderConfiguration(provider, settings)
    return result.isValid
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  const contextValue: SettingsContextType = {
    dataProvider: settings.selectedProvider as DataProviderType,
    setDataProvider,
    mongoConfig: settings.providers.mongodb.config,
    setMongoConfig,
    showTranslationFirst: settings.showTranslationFirst,
    setShowTranslationFirst,
    settings,
    updateSettings,
    isValidConfiguration,
    resetToDefaults,
    isStorageAvailable: storageAvailable
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook to use settings context
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export default SettingsContext