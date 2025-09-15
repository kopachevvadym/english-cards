/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { SettingsProvider, useSettings } from '../SettingsContext'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Simple test component
function TestComponent() {
  const { dataProvider, setDataProvider, isValidConfiguration } = useSettings()

  return (
    <div>
      <div data-testid="current-provider">{dataProvider}</div>
      <div data-testid="localhost-valid">{isValidConfiguration('localhost').toString()}</div>
      <button 
        data-testid="switch-provider" 
        onClick={() => setDataProvider('mongodb')}
      >
        Switch
      </button>
    </div>
  )
}

describe('SettingsContext Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should provide settings context and allow provider switching', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    )

    // Should start with localhost
    expect(screen.getByTestId('current-provider')).toHaveTextContent('localhost')
    expect(screen.getByTestId('localhost-valid')).toHaveTextContent('true')

    // Switch provider
    act(() => {
      screen.getByTestId('switch-provider').click()
    })

    // Should switch to mongodb
    expect(screen.getByTestId('current-provider')).toHaveTextContent('mongodb')
  })

  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useSettings must be used within a SettingsProvider')
    
    consoleSpy.mockRestore()
  })
})