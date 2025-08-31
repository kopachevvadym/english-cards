import { AppSettings } from '../providers/types'
import { validateAppSettings } from './settingsValidation'

/**
 * Local storage key for settings persistence
 */
export const SETTINGS_STORAGE_KEY = 'flashcard-app-settings'

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Safely loads settings from localStorage with validation
 */
export function loadSettings(defaultSettings: AppSettings): StorageResult<AppSettings> {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    
    if (!stored) {
      return {
        success: true,
        data: defaultSettings
      }
    }

    const parsed = JSON.parse(stored) as AppSettings
    
    // Validate the loaded settings
    const validationResult = validateAppSettings(parsed)
    
    if (!validationResult.isValid) {
      console.warn('Loaded settings failed validation:', validationResult.errors)
      return {
        success: true,
        data: defaultSettings,
        error: `Invalid settings: ${validationResult.errors.join(', ')}`
      }
    }

    // Merge with defaults to ensure all required fields exist
    const mergedSettings: AppSettings = {
      selectedProvider: parsed.selectedProvider || defaultSettings.selectedProvider,
      providers: {
        localhost: {
          ...defaultSettings.providers.localhost,
          ...parsed.providers?.localhost
        },
        mongodb: {
          ...defaultSettings.providers.mongodb,
          ...parsed.providers?.mongodb,
          config: {
            ...defaultSettings.providers.mongodb.config,
            ...parsed.providers?.mongodb?.config
          }
        }
      }
    }

    return {
      success: true,
      data: mergedSettings
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error)
    return {
      success: false,
      data: defaultSettings,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Safely saves settings to localStorage
 */
export function saveSettings(settings: AppSettings): StorageResult<void> {
  try {
    // Validate settings before saving
    const validationResult = validateAppSettings(settings)
    
    if (!validationResult.isValid) {
      return {
        success: false,
        error: `Cannot save invalid settings: ${validationResult.errors.join(', ')}`
      }
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings, null, 2))
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clears settings from localStorage
 */
export function clearSettings(): StorageResult<void> {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
    return {
      success: true
    }
  } catch (error) {
    console.error('Failed to clear settings from localStorage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Checks if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}